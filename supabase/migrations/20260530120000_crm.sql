-- =============================================================================
-- FinTask — CRM-слой: клиенты, контакты, сделки (воронка), активности, счета.
-- Паттерны как в init: user_id default auth.uid(), RLS own_*, триггеры с
-- set search_path='' и схема-квалификацией. Изменения только добавляющие.
-- =============================================================================

-- Перечисления ----------------------------------------------------------------

create type client_kind    as enum ('COMPANY', 'INDIVIDUAL');                              -- организация / физлицо
create type client_status  as enum ('LEAD', 'ACTIVE', 'INACTIVE');                         -- лид / активный / неактивный
create type deal_stage     as enum ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
create type invoice_status as enum ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
create type activity_type  as enum ('CALL', 'MEETING', 'EMAIL', 'NOTE');                   -- звонок / встреча / письмо / заметка

-- Таблицы ---------------------------------------------------------------------

-- Клиенты (заказчики/контрагенты)
create table clients (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind         client_kind   not null default 'COMPANY',
  name         text not null,
  status       client_status not null default 'LEAD',
  email        text,
  phone        text,
  address      text,
  site_address text,                       -- объект / адрес монтажа (под ОВиК)
  tax_id       text,                       -- ИНН / реквизит
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index clients_user_status_idx on clients (user_id, status);

-- Контактные лица клиента
create table contacts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id  uuid not null references clients(id) on delete cascade,
  name       text not null,
  role       text,                         -- должность
  email      text,
  phone      text,
  note       text,
  created_at timestamptz not null default now()
);
create index contacts_client_idx on contacts (client_id);

-- Сделки (воронка)
create table deals (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id           uuid references clients(id) on delete set null,
  title               text not null,
  stage               deal_stage not null default 'LEAD',
  amount              numeric(16,2) not null default 0 check (amount >= 0),
  currency            text not null default 'UZS',
  expected_close_date date,
  won_at              timestamptz,         -- ведёт триггер deal_touch при stage=WON
  lost_at             timestamptz,         -- ведёт триггер при stage=LOST
  lost_reason         text,
  position            numeric not null default 0,    -- порядок в колонке воронки (дробный ранг)
  note                text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index deals_user_stage_idx  on deals (user_id, stage);
create index deals_user_client_idx on deals (user_id, client_id);

-- Активности (история взаимодействий)
create table activities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  deal_id     uuid references deals(id) on delete set null,
  type        activity_type not null default 'NOTE',
  subject     text not null,
  body        text,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
create index activities_user_time_idx   on activities (user_id, occurred_at desc);
create index activities_client_time_idx on activities (client_id, occurred_at desc);

-- Счета
create table invoices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id  uuid references clients(id) on delete set null,
  deal_id    uuid references deals(id) on delete set null,
  number     text not null,
  issue_date date not null default current_date,
  due_date   date,
  amount     numeric(16,2) not null check (amount > 0),
  currency   text not null default 'UZS',
  status     invoice_status not null default 'DRAFT',
  paid_at    timestamptz,                  -- ведёт триггер invoice_touch при status=PAID
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invoices_user_status_idx on invoices (user_id, status);
create index invoices_user_due_idx    on invoices (user_id, due_date);

-- Привязка проектов к CRM
alter table projects add column client_id uuid references clients(id) on delete set null;
alter table projects add column deal_id   uuid references deals(id)   on delete set null;
create index projects_user_client_idx on projects (user_id, client_id);

-- Row Level Security: шаблон own_* (как в init) -------------------------------

alter table clients enable row level security;
create policy "own_select" on clients for select using (auth.uid() = user_id);
create policy "own_insert" on clients for insert with check (auth.uid() = user_id);
create policy "own_update" on clients for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on clients for delete using (auth.uid() = user_id);

alter table contacts enable row level security;
create policy "own_select" on contacts for select using (auth.uid() = user_id);
create policy "own_insert" on contacts for insert with check (auth.uid() = user_id);
create policy "own_update" on contacts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on contacts for delete using (auth.uid() = user_id);

alter table deals enable row level security;
create policy "own_select" on deals for select using (auth.uid() = user_id);
create policy "own_insert" on deals for insert with check (auth.uid() = user_id);
create policy "own_update" on deals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on deals for delete using (auth.uid() = user_id);

alter table activities enable row level security;
create policy "own_select" on activities for select using (auth.uid() = user_id);
create policy "own_insert" on activities for insert with check (auth.uid() = user_id);
create policy "own_update" on activities for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on activities for delete using (auth.uid() = user_id);

alter table invoices enable row level security;
create policy "own_select" on invoices for select using (auth.uid() = user_id);
create policy "own_insert" on invoices for insert with check (auth.uid() = user_id);
create policy "own_update" on invoices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on invoices for delete using (auth.uid() = user_id);

-- Триггеры --------------------------------------------------------------------
-- set_updated_at уже создана в init. Для clients используем её напрямую.
create trigger trg_clients_updated before update on clients for each row execute function set_updated_at();

-- Сделки: updated_at + отметки won_at/lost_at по этапу.
create or replace function deal_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.stage = 'WON' then
    if tg_op = 'INSERT' or old.stage is distinct from 'WON' then
      new.won_at = coalesce(new.won_at, now());
    end if;
    new.lost_at = null;
  elsif new.stage = 'LOST' then
    if tg_op = 'INSERT' or old.stage is distinct from 'LOST' then
      new.lost_at = coalesce(new.lost_at, now());
    end if;
    new.won_at = null;
  else
    new.won_at = null;
    new.lost_at = null;
  end if;
  return new;
end; $$;

create trigger trg_deals_touch before insert or update on deals for each row execute function deal_touch();

-- Счета: updated_at + отметка paid_at по статусу.
create or replace function invoice_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.status = 'PAID' then
    if tg_op = 'INSERT' or old.status is distinct from 'PAID' then
      new.paid_at = coalesce(new.paid_at, now());
    end if;
  else
    new.paid_at = null;
  end if;
  return new;
end; $$;

create trigger trg_invoices_touch before insert or update on invoices for each row execute function invoice_touch();
