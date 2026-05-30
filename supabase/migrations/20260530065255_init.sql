-- =============================================================================
-- FinTask — начальная схема: перечисления, таблицы, индексы, RLS, триггеры.
-- Спецификация: Finance.md, раздел 4.
-- =============================================================================

-- 4.1 Перечисления ------------------------------------------------------------

create type task_status      as enum ('TODO', 'IN_PROGRESS', 'DONE');
create type priority         as enum ('LOW', 'MEDIUM', 'HIGH');
create type project_status   as enum ('ACTIVE', 'ARCHIVED');
create type area             as enum ('WORK', 'PERSONAL');       -- сфера: работа / личное
create type debt_direction   as enum ('I_OWE', 'OWED_TO_ME');   -- я должен / мне должны
create type debt_status      as enum ('OPEN', 'CLOSED');
create type asset_kind       as enum ('CASH', 'BANK', 'DEPOSIT', 'STOCK', 'CRYPTO', 'REAL_ESTATE', 'OTHER');
create type recurring_kind   as enum ('INCOME', 'EXPENSE');
create type recurring_period as enum ('WEEKLY', 'MONTHLY', 'YEARLY');

-- 4.2 Таблицы -----------------------------------------------------------------

-- Профиль (1:1 с auth.users) + личные настройки дисциплины
create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text,
  avatar_url     text,
  timezone       text not null default 'Asia/Tashkent',  -- «граница дня» и серии считаются в этой зоне
  day_goal       int  not null default 3,                -- сколько закрытых дел в день делают день «удачным»
  focus_goal_min int  not null default 120,              -- дневная цель «часов в фокусе», в минутах
  base_currency  text not null default 'UZS',
  created_at     timestamptz not null default now()
);

-- ДИСЦИПЛИНА ------------------------------------------------------------------

create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  color       text,
  area        area not null default 'PERSONAL',           -- работа / личное
  status      project_status not null default 'ACTIVE',
  created_at  timestamptz not null default now()
);

create table tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id      uuid references projects(id) on delete set null,
  area            area        not null default 'PERSONAL',  -- работа / личное (наследуется от проекта, хранится явно)
  title           text not null,
  description     text,
  status          task_status not null default 'TODO',
  priority        priority    not null default 'MEDIUM',
  scheduled_for   date,                          -- на какой день запланировано («Сегодня» = scheduled_for = today)
  due_date        date,                          -- дедлайн (может отличаться от запланированного дня)
  is_meeting      boolean not null default false,
  start_at        timestamptz,                   -- время начала (встреча или таймблок) → таймлайн
  end_at          timestamptz,                   -- время окончания (длительность на таймлайне)
  remind_at       timestamptz,                   -- когда напомнить (null = без напоминания)
  reminded_at     timestamptz,                   -- когда напоминание доставлено (null = ещё нет; защита от повтора)
  payout_amount   numeric(14,2) check (payout_amount is null or payout_amount > 0),  -- выплата за рабочую задачу
  payout_currency text,
  position        numeric not null default 0,    -- порядок в дне/колонке (дробный ранг)
  completed_at    timestamptz,                   -- когда закрыта (источник серий/прогресса/заработка; ведёт триггер)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_at is null or start_at is null or end_at >= start_at)
);
create index tasks_user_sched_idx     on tasks (user_id, scheduled_for);
create index tasks_user_status_idx    on tasks (user_id, status);
create index tasks_user_area_idx      on tasks (user_id, area, scheduled_for);
create index tasks_user_start_idx     on tasks (user_id, start_at);              -- таймлайн
create index tasks_user_completed_idx on tasks (user_id, completed_at desc);
-- ожидающие напоминания (для поллера/расписания) — компактный частичный индекс
create index tasks_pending_reminders_idx on tasks (remind_at)
  where remind_at is not null and reminded_at is null;

-- РАБОТА / ФОКУС --------------------------------------------------------------

create table focus_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id     uuid references tasks(id)    on delete set null,
  project_id  uuid references projects(id) on delete set null,   -- учёт времени по проекту, даже без конкретной задачи
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,                                       -- null = сессия идёт сейчас («в фокусе»)
  note        text,
  created_at  timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create index focus_sessions_user_started_idx on focus_sessions (user_id, started_at desc);
-- не больше одной активной сессии на пользователя (один таймер за раз)
create unique index one_active_focus_per_user on focus_sessions (user_id) where ended_at is null;

-- ДЕНЬГИ: ДОЛГИ ---------------------------------------------------------------

create table debts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  direction    debt_direction not null,                       -- I_OWE / OWED_TO_ME
  counterparty text not null,                                 -- кто (имя)
  amount       numeric(16,2) not null check (amount > 0),     -- тело долга
  currency     text not null default 'UZS',
  due_date     date,
  status       debt_status not null default 'OPEN',           -- ведёт триггер по сумме погашений
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index debts_user_status_idx on debts (user_id, status);

create table debt_payments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  debt_id    uuid not null references debts(id) on delete cascade,
  amount     numeric(16,2) not null check (amount > 0),
  date       date not null default current_date,
  note       text,
  created_at timestamptz not null default now()
);
create index debt_payments_debt_idx on debt_payments (debt_id);

-- ДЕНЬГИ: ИНВЕСТИЦИИ / АКТИВЫ -------------------------------------------------

create table assets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name          text not null,
  kind          asset_kind not null default 'CASH',
  currency      text not null default 'UZS',
  current_value numeric(16,2) not null default 0,             -- обновляется вручную
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table asset_valuations (        -- история оценок для «динамики капитала» (ведёт триггер)
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  asset_id   uuid not null references assets(id) on delete cascade,
  value      numeric(16,2) not null,
  as_of      date not null default current_date,
  created_at timestamptz not null default now()
);
create index asset_valuations_asset_idx on asset_valuations (asset_id, as_of);

-- ДЕНЬГИ: РЕГУЛЯРНЫЕ -----------------------------------------------------------

create table recurring (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null,
  kind       recurring_kind not null,                         -- доход/расход
  amount     numeric(14,2) not null check (amount > 0),
  currency   text not null default 'UZS',
  period     recurring_period not null default 'MONTHLY',
  next_date  date not null,                                   -- ближайшая дата; «отметить» сдвигает её на период
  active     boolean not null default true,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recurring_user_next_idx on recurring (user_id, next_date);

-- НАПОМИНАНИЯ: подписки на Web Push ------------------------------------------

create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint   text not null unique,                 -- одна запись на устройство/браузер
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on push_subscriptions (user_id);

-- 4.3 Row Level Security ------------------------------------------------------
-- Шаблон own_* по auth.uid(). Для profiles условие по id, у остальных по user_id.

alter table profiles enable row level security;
create policy "own_select" on profiles for select using (auth.uid() = id);
create policy "own_insert" on profiles for insert with check (auth.uid() = id);
create policy "own_update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "own_delete" on profiles for delete using (auth.uid() = id);

alter table projects enable row level security;
create policy "own_select" on projects for select using (auth.uid() = user_id);
create policy "own_insert" on projects for insert with check (auth.uid() = user_id);
create policy "own_update" on projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on projects for delete using (auth.uid() = user_id);

alter table tasks enable row level security;
create policy "own_select" on tasks for select using (auth.uid() = user_id);
create policy "own_insert" on tasks for insert with check (auth.uid() = user_id);
create policy "own_update" on tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on tasks for delete using (auth.uid() = user_id);

alter table focus_sessions enable row level security;
create policy "own_select" on focus_sessions for select using (auth.uid() = user_id);
create policy "own_insert" on focus_sessions for insert with check (auth.uid() = user_id);
create policy "own_update" on focus_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on focus_sessions for delete using (auth.uid() = user_id);

alter table debts enable row level security;
create policy "own_select" on debts for select using (auth.uid() = user_id);
create policy "own_insert" on debts for insert with check (auth.uid() = user_id);
create policy "own_update" on debts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on debts for delete using (auth.uid() = user_id);

alter table debt_payments enable row level security;
create policy "own_select" on debt_payments for select using (auth.uid() = user_id);
create policy "own_insert" on debt_payments for insert with check (auth.uid() = user_id);
create policy "own_update" on debt_payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on debt_payments for delete using (auth.uid() = user_id);

alter table assets enable row level security;
create policy "own_select" on assets for select using (auth.uid() = user_id);
create policy "own_insert" on assets for insert with check (auth.uid() = user_id);
create policy "own_update" on assets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on assets for delete using (auth.uid() = user_id);

alter table asset_valuations enable row level security;
create policy "own_select" on asset_valuations for select using (auth.uid() = user_id);
create policy "own_insert" on asset_valuations for insert with check (auth.uid() = user_id);
create policy "own_update" on asset_valuations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on asset_valuations for delete using (auth.uid() = user_id);

alter table recurring enable row level security;
create policy "own_select" on recurring for select using (auth.uid() = user_id);
create policy "own_insert" on recurring for insert with check (auth.uid() = user_id);
create policy "own_update" on recurring for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on recurring for delete using (auth.uid() = user_id);

alter table push_subscriptions enable row level security;
create policy "own_select" on push_subscriptions for select using (auth.uid() = user_id);
create policy "own_insert" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "own_update" on push_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on push_subscriptions for delete using (auth.uid() = user_id);

-- 4.4 Триггеры: updated_at и закрытие задач -----------------------------------

create or replace function set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- задачи: помимо updated_at ведём completed_at (источник серий/прогресса)
create or replace function tasks_touch()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  if new.status = 'DONE' then
    if tg_op = 'INSERT' or old.status is distinct from 'DONE' then
      new.completed_at = coalesce(new.completed_at, now());
    end if;
  else
    new.completed_at = null;            -- сняли отметку — день/прогресс пересчитаются сами
  end if;
  return new;
end; $$;

create trigger trg_tasks_touch       before insert or update on tasks     for each row execute function tasks_touch();
create trigger trg_debts_updated     before update on debts                for each row execute function set_updated_at();
create trigger trg_assets_updated    before update on assets               for each row execute function set_updated_at();
create trigger trg_recurring_updated before update on recurring            for each row execute function set_updated_at();

-- 4.5 Триггер: статус долга по погашениям -------------------------------------

create or replace function refresh_debt_status()
returns trigger language plpgsql set search_path = '' as $$
declare
  d uuid := coalesce(new.debt_id, old.debt_id);
  outstanding numeric;
begin
  select amount - coalesce((select sum(amount) from public.debt_payments where debt_id = d), 0)
    into outstanding from public.debts where id = d;
  update public.debts
    set status = case when outstanding <= 0 then 'CLOSED' else 'OPEN' end
    where id = d;
  return null;
end; $$;

create trigger trg_debt_payment_status
  after insert or update or delete on debt_payments
  for each row execute function refresh_debt_status();

-- 4.6 Триггер: история стоимости активов --------------------------------------

create or replace function log_asset_valuation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.current_value is distinct from old.current_value then
    insert into public.asset_valuations (user_id, asset_id, value)
    values (new.user_id, new.id, new.current_value);
  end if;
  return null;
end; $$;

create trigger trg_asset_valuation
  after insert or update on assets
  for each row execute function log_asset_valuation();

-- 4.7 Автосоздание профиля ----------------------------------------------------

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 4.8 Серии: дневные счётчики -------------------------------------------------
-- Серию считаем в коде из дневных счётчиков (с учётом таймзоны и day_goal).

create or replace function daily_done(uid uuid, tz text, since date, area_filter area default null)
returns table (day date, done bigint)
language sql stable set search_path = '' as $$
  select (completed_at at time zone tz)::date as day, count(*)
  from public.tasks
  where user_id = uid and completed_at is not null
    and (completed_at at time zone tz)::date >= since
    and (area_filter is null or area = area_filter)
  group by 1
  order by 1;
$$;
