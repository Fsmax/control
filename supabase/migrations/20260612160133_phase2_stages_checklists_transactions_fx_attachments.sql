-- =============================================================================
-- FinTask — Фаза 2: этапы задач, чек-листы, транзакции (лента денег),
-- курсы валют, вложения. Паттерны как в init: user_id default auth.uid(),
-- RLS own_*, триггеры с set search_path='' и схема-квалификацией.
-- Изменения только добавляющие.
-- =============================================================================

-- Перечисления ----------------------------------------------------------------

create type tx_kind as enum ('INCOME', 'EXPENSE', 'TRANSFER');   -- доход / расход / перевод между активами

-- ЭТАПЫ: группировка задач внутри проекта --------------------------------------
-- Свободное имя этапа («1. Системы», «2. Разводка»…); порядок этапов на странице
-- проекта = min(position) его задач, отдельной таблицы не требуется.

alter table tasks add column stage text;

-- ЧЕК-ЛИСТЫ внутри задачи -------------------------------------------------------

create table task_checklist_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id    uuid not null references tasks(id) on delete cascade,
  title      text not null,
  done       boolean not null default false,
  position   numeric not null default 0,
  created_at timestamptz not null default now()
);
create index task_checklist_task_idx on task_checklist_items (task_id, position);

-- ДЕНЬГИ: КАТЕГОРИИ И ТРАНЗАКЦИИ ------------------------------------------------
-- Кошельки = существующие assets; триггер ведёт current_value, история
-- капитала пишется существующим триггером log_asset_valuation.

create table tx_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  kind       tx_kind not null check (kind in ('INCOME', 'EXPENSE')),
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

create table transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind        tx_kind not null,
  asset_id    uuid not null references assets(id) on delete cascade,      -- INCOME: куда; EXPENSE/TRANSFER: откуда
  to_asset_id uuid references assets(id) on delete cascade,               -- только для TRANSFER: куда
  category_id uuid references tx_categories(id) on delete set null,
  amount      numeric(16,2) not null check (amount > 0),
  currency    text not null,                                              -- должна совпадать с валютой актива (проверяет триггер)
  date        date not null default current_date,
  note        text,
  invoice_id  uuid references invoices(id) on delete set null,            -- зачисление оплаченного счёта
  task_id     uuid references tasks(id) on delete set null,               -- зачисление выплаты по задаче
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (kind <> 'TRANSFER' or to_asset_id is not null),
  check (kind = 'TRANSFER' or to_asset_id is null),
  check (to_asset_id is null or to_asset_id <> asset_id)
);
create index transactions_user_date_idx  on transactions (user_id, date desc);
create index transactions_asset_idx     on transactions (asset_id);
-- счёт/задача зачисляются не более одного раза (идемпотентность)
create unique index transactions_invoice_once on transactions (invoice_id) where invoice_id is not null;
create unique index transactions_task_once    on transactions (task_id)    where task_id is not null;

create trigger trg_transactions_updated before update on transactions
  for each row execute function set_updated_at();

-- Триггер баланса: транзакция двигает current_value активов.
-- На UPDATE/DELETE сначала откатывается старое значение, затем применяется новое.
create or replace function tx_apply_balance()
returns trigger language plpgsql set search_path = '' as $$
declare
  a_cur text;
  t_cur text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    if old.kind = 'INCOME' then
      update public.assets set current_value = current_value - old.amount where id = old.asset_id;
    elsif old.kind = 'EXPENSE' then
      update public.assets set current_value = current_value + old.amount where id = old.asset_id;
    else
      update public.assets set current_value = current_value + old.amount where id = old.asset_id;
      update public.assets set current_value = current_value - old.amount where id = old.to_asset_id;
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    select currency into a_cur from public.assets where id = new.asset_id;
    if a_cur is distinct from new.currency then
      raise exception 'Валюта транзакции (%) не совпадает с валютой актива (%)', new.currency, a_cur;
    end if;
    if new.kind = 'TRANSFER' then
      select currency into t_cur from public.assets where id = new.to_asset_id;
      if t_cur is distinct from new.currency then
        raise exception 'Перевод между активами в разных валютах (% → %) не поддерживается', new.currency, t_cur;
      end if;
    end if;

    if new.kind = 'INCOME' then
      update public.assets set current_value = current_value + new.amount where id = new.asset_id;
    elsif new.kind = 'EXPENSE' then
      update public.assets set current_value = current_value - new.amount where id = new.asset_id;
    else
      update public.assets set current_value = current_value - new.amount where id = new.asset_id;
      update public.assets set current_value = current_value + new.amount where id = new.to_asset_id;
    end if;
  end if;

  return coalesce(new, old);
end; $$;

create trigger trg_tx_balance
  after insert or update or delete on transactions
  for each row execute function tx_apply_balance();

-- КУРСЫ ВАЛЮТ: ручные/из ЦБ, для пересчёта капитала в базовую валюту ------------

create table fx_rates (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  currency   text not null,                                  -- например 'USD'
  rate       numeric(18,6) not null check (rate > 0),        -- сколько базовой валюты за 1 единицу
  as_of      date not null default current_date,
  updated_at timestamptz not null default now(),
  primary key (user_id, currency)
);

create trigger trg_fx_rates_updated before update on fx_rates
  for each row execute function set_updated_at();

-- ВЛОЖЕНИЯ к задачам (файлы в приватном бакете, доступ через сервер) ------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create table attachments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id    uuid not null references tasks(id) on delete cascade,
  path       text not null,                                  -- путь в бакете attachments
  name       text not null,
  size       bigint,
  mime       text,
  created_at timestamptz not null default now()
);
create index attachments_task_idx on attachments (task_id);

-- Row Level Security: шаблон own_* (как в init) -------------------------------

alter table task_checklist_items enable row level security;
create policy "own_select" on task_checklist_items for select using (auth.uid() = user_id);
create policy "own_insert" on task_checklist_items for insert with check (auth.uid() = user_id);
create policy "own_update" on task_checklist_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on task_checklist_items for delete using (auth.uid() = user_id);

alter table tx_categories enable row level security;
create policy "own_select" on tx_categories for select using (auth.uid() = user_id);
create policy "own_insert" on tx_categories for insert with check (auth.uid() = user_id);
create policy "own_update" on tx_categories for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on tx_categories for delete using (auth.uid() = user_id);

alter table transactions enable row level security;
create policy "own_select" on transactions for select using (auth.uid() = user_id);
create policy "own_insert" on transactions for insert with check (auth.uid() = user_id);
create policy "own_update" on transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on transactions for delete using (auth.uid() = user_id);

alter table fx_rates enable row level security;
create policy "own_select" on fx_rates for select using (auth.uid() = user_id);
create policy "own_insert" on fx_rates for insert with check (auth.uid() = user_id);
create policy "own_update" on fx_rates for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on fx_rates for delete using (auth.uid() = user_id);

alter table attachments enable row level security;
create policy "own_select" on attachments for select using (auth.uid() = user_id);
create policy "own_insert" on attachments for insert with check (auth.uid() = user_id);
create policy "own_update" on attachments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on attachments for delete using (auth.uid() = user_id);
