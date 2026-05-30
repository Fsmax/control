# FinTask — личный движок «Дисциплина + Контроль»

> Спецификация проекта для Claude Code. Описывает, **что** строить и **в каком порядке**. Следуй плану из раздела 8, по одному этапу за раз, проверяя сборку после каждого. Стек: **Next.js 16 + Supabase** (Postgres, Auth, RLS), деплой на **Vercel**.

---

## 1. Обзор проекта

**FinTask** — веб-приложение для личного использования. Его задача — **прогресс и контроль**: каждый день ставить дела и закрывать их, и держать под контролем деньги (долги и инвестиции). Заменяет закрытый проект QuestWallet — это его трезвая, лёгкая версия без геймификации.

Четыре опоры:

1. **Дисциплина (ядро).** Экран «**Сегодня**»: утром выбрал 3–5 дел → в течение дня закрыл. Виден прогресс дня и **серия** удачных дней. Задачи, проекты и встречи — структура за этим экраном.
2. **Работа и фокус.** Каждая задача и проект относятся к сфере **Работа** или **Личное** — «Сегодня» можно смотреть фокус-видом «только работа». **Фокус-сессии** с таймером («в фокусе сейчас») копят «часы в фокусе» и дают **учёт времени по проектам**. Рабочая задача может нести **выплату**: выполнил → засчиталось в «заработано».
3. **Деньги как контроль, а не учёт.** **Долги** (кто мне должен / кому я должен, с погашениями), **инвестиции/активы** (позиции с ручным обновлением стоимости → общий капитал и динамика), **регулярные** доходы/расходы (что предстоит). Без обязательного логирования каждой траты.
4. **Прогресс.** Серии, выполнено за период, часы в фокусе, заработано, динамика капитала — обратная связь, которая и даёт ощущение контроля.

Приложение живёт в интернете (Vercel), вход — через Supabase Auth, доступ ограничен (публичная регистрация отключена). Изоляция данных обеспечивается **Row Level Security**, а не кодом приложения.

**Принципы:**
- **Минимум трения.** Открыл → за 30 секунд отметил день / обновил цифру → закрыл. Это главный критерий каждого экрана.
- Нативный стек Supabase: supabase-js + RLS + Supabase Auth.
- Server Components и Server Actions как основной способ работы с данными.
- Безопасность по умолчанию: проверка `getUser()` на сервере + RLS на уровне БД.
- Аккуратный, спокойный UI без визуального шума.

> **Почему supabase-js, а не Prisma.** Prisma подключается к БД под привилегированной ролью и обходит RLS, поэтому при изоляции данных через RLS их связка усложняет конфигурацию. supabase-js работает от имени текущего пользователя, и политики применяются автоматически. Если по какой-то причине нужен именно Prisma — это отдельный вариант (см. примечание в разделе 12).

---

## 2. Технологический стек

| Слой | Технология | Назначение |
|------|------------|------------|
| Фреймворк | **Next.js 16** (App Router) | SSR, маршрутизация, Server Actions |
| Язык | **TypeScript** (strict) | Типобезопасность |
| Стили | **Tailwind CSS** | Утилитарные стили |
| UI-компоненты | **shadcn/ui** | Кнопки, формы, диалоги, таблицы |
| БД + бэкенд | **Supabase** (Postgres) | База, авторизация, RLS |
| Клиент БД/Auth | **@supabase/supabase-js** + **@supabase/ssr** | Запросы и сессии в App Router |
| Авторизация | **Supabase Auth** (OAuth) | Вход, сессии через cookie |
| Изоляция данных | **Row Level Security** (`auth.uid()`) | Каждый видит только свои строки |
| Валидация | **Zod** | Схемы ввода (клиент + Server Actions) |
| Формы | **react-hook-form** + `@hookform/resolvers/zod` | Управление формами |
| Графики | **Recharts** | Прогресс, динамика капитала |
| Даты/таймзона | **date-fns** + **date-fns-tz** | «Граница дня» и серии в таймзоне пользователя |
| Иконки | **lucide-react** | Иконки интерфейса |
| Drag & drop | **@dnd-kit/core** + `@dnd-kit/sortable` | Канбан задач |
| Уведомления | **Web Push** (service worker + `web-push` + VAPID) | Напоминания и при закрытом приложении |
| Планировщик | **pg_cron** + **pg_net** + Supabase **Edge Function** | Рассылка напоминаний по `remind_at` |
| Хостинг | **Vercel** | Деплой из GitHub, preview-окружения |

---

## 3. Структура проекта

```
src/
  app/
    auth/
      callback/route.ts        # обмен OAuth-кода на сессию (exchangeCodeForSession)
    (auth)/
      login/page.tsx           # вход (кнопка OAuth)
    (app)/
      layout.tsx               # getUser() -> redirect('/login') при отсутствии сессии
      page.tsx                 # «СЕГОДНЯ» (главная) — план дня, прогресс, серия, встречи
      tasks/
        page.tsx               # бэклог задач (список/доска)
      projects/
        page.tsx               # список проектов
        [id]/page.tsx          # проект + его задачи
      focus/
        page.tsx               # РАБОТА/ФОКУС — таймер, рабочие дела дня, часы в фокусе, заработок, время по проектам
      money/
        page.tsx               # сводка денег: капитал, долги, регулярные
        debts/page.tsx         # долги + погашения
        assets/page.tsx        # инвестиции/активы + обновление стоимости
        recurring/page.tsx     # регулярные доходы/расходы
      progress/
        page.tsx               # серии, выполнено за период, динамика капитала
      settings/
        page.tsx               # профиль, цель дня, таймзона, базовая валюта
    layout.tsx
    globals.css
  components/
    ui/                        # компоненты shadcn/ui
    layout/                    # Sidebar, Header, UserMenu, NotificationPrompt
    today/                     # TodayList, DayProgress, StreakBadge, MeetingItem, AreaToggle
    tasks/                     # TaskForm, TaskList, KanbanBoard, KanbanColumn, TaskCard, TimelineView, ProjectCard ...
    focus/                     # FocusTimer, ActiveSession, FocusTodayWork, ProjectTimeTable, EarningsCard
    money/                     # DebtForm, DebtCard, PaymentDialog, AssetForm, RecurringForm ...
    progress/                  # StreakHeatmap, DoneChart, FocusChart, EarningsChart, CapitalChart ...
  lib/
    utils.ts                   # cn(), formatMoney(), formatDate()
    streak.ts                  # расчёт серии из дневных счётчиков vs profiles.day_goal
    reminders.ts               # подписка на push (PushManager) + регистрация service worker
    validations/               # Zod-схемы (task.ts, focus.ts, debt.ts, asset.ts, recurring.ts)
  server/
    actions/                   # Server Actions (tasks.ts, projects.ts, focus.ts, push.ts, debts.ts, assets.ts, recurring.ts)
    queries/                   # чтение (today.ts, focus.ts, progress.ts, money.ts)
  utils/supabase/
    client.ts                  # createBrowserClient (для Client Components)
    server.ts                  # createServerClient (cookies; для Server Components/Actions)
    middleware.ts              # updateSession() — обновление токенов
  types/
    database.types.ts          # СГЕНЕРИРОВАННЫЕ типы Supabase
public/
  sw.js                        # service worker: приём push, показ уведомления
proxy.ts                       # (бывш. middleware.ts) вызывает updateSession — НЕ граница авторизации
supabase/
  config.toml
  functions/
    send-reminders/index.ts    # Edge Function: рассылка due-напоминаний (web-push)
  migrations/                  # SQL-миграции (схема, RLS, триггеры)
  seed.sql                     # тестовые данные
```

---

## 4. База данных (SQL-миграция)

> Схема создаётся миграцией Supabase CLI (`supabase/migrations/*.sql`). После применения генерируются TS-типы. Все денежные поля — `numeric`, валюта хранится рядом со значением; разные валюты **не складываются** в одно число (сводки — в разрезе валют). Конвертация по курсу — вне MVP (раздел 12).

### 4.1 Перечисления

```sql
create type task_status      as enum ('TODO', 'IN_PROGRESS', 'DONE');
create type priority         as enum ('LOW', 'MEDIUM', 'HIGH');
create type project_status   as enum ('ACTIVE', 'ARCHIVED');
create type area             as enum ('WORK', 'PERSONAL');       -- сфера: работа / личное

create type debt_direction   as enum ('I_OWE', 'OWED_TO_ME');   -- я должен / мне должны
create type debt_status      as enum ('OPEN', 'CLOSED');

create type asset_kind       as enum ('CASH', 'BANK', 'DEPOSIT', 'STOCK', 'CRYPTO', 'REAL_ESTATE', 'OTHER');

create type recurring_kind   as enum ('INCOME', 'EXPENSE');
create type recurring_period as enum ('WEEKLY', 'MONTHLY', 'YEARLY');
```

### 4.2 Таблицы

```sql
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

-- ДИСЦИПЛИНА -----------------------------------------------------------------

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

-- РАБОТА / ФОКУС -------------------------------------------------------------

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

-- ДЕНЬГИ: ДОЛГИ --------------------------------------------------------------

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

-- ДЕНЬГИ: ИНВЕСТИЦИИ / АКТИВЫ ------------------------------------------------

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

-- ДЕНЬГИ: РЕГУЛЯРНЫЕ ----------------------------------------------------------

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

-- НАПОМИНАНИЯ: подписки на Web Push -----------------------------------------

create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint   text not null unique,                 -- одна запись на устройство/браузер
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on push_subscriptions (user_id);
```

> «Сколько у меня всего денег» закрывается **активами** (наличные/карта/вклад — это записи `assets` вида `CASH`/`BANK`, которые ты обновляешь руками). Поэтому лента транзакций в ядре не нужна; капитал = сумма активов в разрезе валют, чистыми = активы + «мне должны» − «я должен».

### 4.3 Row Level Security

RLS включается на **каждой** таблице. У всех таблиц (включая `debt_payments`, `asset_valuations`) есть `user_id` с `default auth.uid()`, поэтому шаблон политик одинаковый — повторить для `projects`, `tasks`, `focus_sessions`, `debts`, `debt_payments`, `assets`, `asset_valuations`, `recurring`, `push_subscriptions`:

```sql
alter table tasks enable row level security;

create policy "own_select" on tasks for select using (auth.uid() = user_id);
create policy "own_insert" on tasks for insert with check (auth.uid() = user_id);
create policy "own_update" on tasks for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_delete" on tasks for delete using (auth.uid() = user_id);
```

Для `profiles` условие — `auth.uid() = id`. Колонка `user_id` имеет `default auth.uid()`, поэтому в коде её можно не передавать.

### 4.4 Триггеры: `updated_at` и закрытие задач

```sql
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- задачи: помимо updated_at ведём completed_at (источник серий/прогресса)
create or replace function tasks_touch()
returns trigger language plpgsql as $$
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
```

### 4.5 Триггер: статус долга по погашениям

Статус долга поддерживает БД, а не приложение:

```sql
create or replace function refresh_debt_status()
returns trigger language plpgsql as $$
declare
  d uuid := coalesce(new.debt_id, old.debt_id);
  outstanding numeric;
begin
  select amount - coalesce((select sum(amount) from debt_payments where debt_id = d), 0)
    into outstanding from debts where id = d;
  update debts
    set status = case when outstanding <= 0 then 'CLOSED' else 'OPEN' end
    where id = d;
  return null;
end; $$;

create trigger trg_debt_payment_status
  after insert or update or delete on debt_payments
  for each row execute function refresh_debt_status();
```

`outstanding` (остаток) приложение считает на лету: `amount − sum(payments)`.

### 4.6 Триггер: история стоимости активов

При изменении стоимости актива автоматически пишется точка в историю (для графика капитала):

```sql
create or replace function log_asset_valuation()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.current_value is distinct from old.current_value then
    insert into asset_valuations (user_id, asset_id, value)
    values (new.user_id, new.id, new.current_value);
  end if;
  return null;
end; $$;

create trigger trg_asset_valuation
  after insert or update on assets
  for each row execute function log_asset_valuation();
```

### 4.7 Автосоздание профиля

```sql
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
```

> Функция — `security definer` (триггер на таблице из схемы `auth`), с `set search_path = ''` против подмены пути. Осознанное и ограниченное исключение из правила «не использовать привилегии в обход RLS».

### 4.8 Серии: дневные счётчики

Серию считаем **в коде** из дневных счётчиков (надёжнее хрупкого SQL и учитывает таймзону пользователя). БД отдаёт число закрытых задач по дням:

```sql
-- число закрытых задач по дням в таймзоне пользователя (RLS уже ограничит чужие строки)
create or replace function daily_done(uid uuid, tz text, since date, area_filter area default null)
returns table (day date, done bigint)
language sql stable as $$
  select (completed_at at time zone tz)::date as day, count(*)
  from tasks
  where user_id = uid and completed_at is not null
    and (completed_at at time zone tz)::date >= since
    and (area_filter is null or area = area_filter)
  group by 1
  order by 1;
$$;
```

`lib/streak.ts`: идём от сегодня назад, **серия** = число подряд идущих дней с `done >= profiles.day_goal`. Сегодня серию не обрывает, пока день не закончился (если цель ещё не достигнута — серия равна вчерашней до конца дня). Передав `area_filter => 'WORK'`, та же функция даёт отдельную **рабочую серию**.

### 4.9 Напоминания: рассылка (Web Push)

Напоминания доставляются и при закрытом приложении, через Supabase:

- **Подписки** в `push_subscriptions` (одна строка на устройство). Клиент регистрирует service worker (`public/sw.js`), запрашивает разрешение, подписывается через `PushManager` с публичным VAPID-ключом и шлёт подписку в Server Action (upsert по `endpoint`; на ответ `410 Gone` при отправке строка удаляется).
- **Edge Function `send-reminders`** (Deno + `web-push`): выбирает задачи с `remind_at <= now()` и `reminded_at is null` (и не `DONE`), шлёт push на все подписки владельца, проставляет `reminded_at = now()`. Приватный VAPID-ключ и `service_role` — в секретах функции.
- **Расписание:** расширения `pg_cron` + `pg_net`; job раз в минуту дёргает функцию:

```sql
-- однократно: включить в дашборде Supabase (Database → Extensions) pg_cron и pg_net
select cron.schedule('send-reminders', '* * * * *', $$
  select net.http_post(
    url     := 'https://<project-ref>.functions.supabase.co/send-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer <service-role-key>')
  );
$$);
```

> Это единственное штатное использование `service_role` (в обход RLS) — серверная рассылка. В обычной логике приложения секретный ключ не нужен.

---

## 5. Функциональные модули

### 5.1 Авторизация

- **Supabase Auth** с OAuth-провайдером (GitHub) — без хранения паролей.
- Вход: `supabase.auth.signInWithOAuth({ provider: 'github' })`; маршрут `/auth/callback` обменивает код на сессию.
- **Ограничение доступа (личное приложение):** в дашборде Supabase отключить публичную регистрацию (Authentication → Sign Ups), свой аккаунт создать через приглашение.
- Защита группы `(app)`: layout вызывает `getUser()` и редиректит на `/login`, если сессии нет.
- В шапке — меню пользователя с `signOut()`.

### 5.2 Дисциплина — ядро

- **Экран «Сегодня» (главная):**
  - План дня — задачи с `scheduled_for = сегодня` (+ просроченные дедлайны как подсказка «перенести на сегодня»).
  - Быстрая отметка «сделано» одним кликом; **прогресс дня** `сделано/запланировано` и индикатор достижения `day_goal`.
  - **Серия** (`StreakBadge`) — сколько дней подряд цель выполнена.
  - Переключатель **сферы** (Все / Работа / Личное); если идёт фокус-сессия — плашка «в фокусе» с таймером и кнопкой «стоп».
  - **Сегодня по времени** — задачи и встречи с `start_at` на сегодня, по времени (встречи помечены).
  - Быстрое добавление дела на сегодня (одно поле «что сделать»).
- **Задачи (`/tasks`):** три вида через переключатель —
  - **Список** с фильтрами (сфера, проект, приоритет, статус, «без даты»). Действие «запланировать на сегодня/дату» = проставить `scheduled_for`.
  - **Канбан** `TODO/IN_PROGRESS/DONE` с drag & drop (`@dnd-kit`) — меняет `status` и `position`.
  - **Таймлайн** (день/неделя) — задачи и встречи с временем (`start_at`/`end_at`) на оси времени; без времени — в боковом списке «не запланировано».
- **Время и напоминания:** у задачи опционально время (`start_at`/`end_at`) и напоминание (`remind_at`). Напоминания доставляются **Web Push** и при закрытом приложении: service worker + подписка устройства, рассылку по расписанию делает Edge Function (`pg_cron`). Доставленные помечаются `reminded_at`, чтобы не повторяться (см. 4.9). Разрешение на уведомления запрашивается мягко (баннер в шапке).
- **Проекты (`/projects`, `/projects/[id]`):** список проектов и страница проекта с его задачами. Задача может быть без проекта.
- **Создание/редактирование** задач и проектов — через диалог. Удаление — с подтверждением.

### 5.3 Работа и фокус

- **Сфера:** у каждой задачи и проекта поле `area` — **Работа** или **Личное**. Везде (Сегодня, бэклог, прогресс) можно фильтровать по сфере; задача наследует сферу проекта при выборе, но хранится явно.
- **Фокус-сессии (`/focus`):** «в фокусе сейчас» — запуск таймера на конкретной задаче (или проекте). Одновременно активна максимум одна сессия (гарантирует частичный уникальный индекс). Стоп закрывает сессию; длительность = `ended_at − started_at`. Интервал можно занести и вручную (обе границы).
- **Часы в фокусе:** сумма длительностей по дням (в таймзоне) → дневная цель `focus_goal_min` и метрика в прогрессе.
- **Учёт времени по проектам:** те же сессии в разрезе проектов — сколько часов на какой проект (для оценки загрузки/биллинга).
- **Заработок:** рабочая задача может нести `payout_amount`/`payout_currency`. «Заработано» за период = сумма выплат по **закрытым** рабочим задачам (по валютам). Снял отметку — выплата уходит из суммы сама (метрика вычисляется, в активы автоматически не пишется — осознанно, чтобы не было двойного учёта; перенос в актив — вручную, Фаза 2).
- **Экран «Работа/Фокус» (`/focus`):** активный таймер, рабочие дела на сегодня, часы в фокусе (день/неделя), заработано за период, время по проектам.

### 5.4 Деньги — контроль

- **Долги (`/money/debts`):** записи «я должен» / «мне должны» — контрагент, сумма, валюта, срок. **Погашения** (частичные) добавляются отдельно; остаток считается на лету, статус `CLOSED` проставляет триггер при полном погашении. Списки сгруппированы по направлению, видны ближайшие сроки.
- **Инвестиции/активы (`/money/assets`):** позиции (наличные, карта, вклад, акции, крипта, недвижимость, прочее) с **ручным обновлением** текущей стоимости. Каждое обновление пишет точку в историю (триггер). Виден общий капитал в разрезе валют.
- **Регулярные (`/money/recurring`):** повторяющиеся доходы/расходы (аренда, подписки, зарплата) — что и когда предстоит. «Отметить за период» сдвигает `next_date`. Это **прогноз/напоминание**, в ленту транзакций ничего не пишется.
- **Сводка денег (`/money`):** капитал по валютам; «мне должны» / «я должен» с итогами; ближайшие регулярные; чистыми = активы + дебиторка − кредиторка (по каждой валюте отдельно).

### 5.5 Прогресс

- **Серии:** текущая и максимальная; календарь-хитмап удачных дней (`StreakHeatmap`); отдельно — **рабочая серия** (сфера = Работа).
- **Выполнено:** закрытые задачи за неделю/месяц (`DoneChart`), разбивка по проектам и сферам.
- **Фокус:** часы в фокусе по дням vs цель `focus_goal_min` (`FocusChart`); время по проектам.
- **Заработано:** выплаты по закрытым рабочим задачам за период по валютам (`EarningsChart`).
- **Динамика капитала:** линейный график суммарной стоимости активов по точкам `asset_valuations` (`CapitalChart`), выбор периода.

### 5.6 Настройки (`/settings`)

- Имя, таймзона (для границы дня), **цель дня** (`day_goal`), **цель фокуса** (`focus_goal_min`), базовая валюта.
- Меню пользователя, выход.

---

## 6. Страницы и маршруты

| Маршрут | Доступ | Содержимое |
|---------|--------|-----------|
| `/login` | публичный | Вход через OAuth |
| `/auth/callback` | служебный | Обмен кода на сессию |
| `/` | защищён | **Сегодня**: план дня, прогресс, серия, встречи |
| `/tasks` | защищён | Бэклог задач (список/доска) |
| `/projects` | защищён | Проекты |
| `/projects/[id]` | защищён | Проект и его задачи |
| `/focus` | защищён | Работа/Фокус: таймер, дела дня, часы в фокусе, заработок, время по проектам |
| `/money` | защищён | Сводка: капитал, долги, регулярные |
| `/money/debts` | защищён | Долги + погашения |
| `/money/assets` | защищён | Инвестиции/активы |
| `/money/recurring` | защищён | Регулярные доходы/расходы |
| `/progress` | защищён | Серии, выполнено, динамика капитала |
| `/settings` | защищён | Профиль и настройки дисциплины |

---

## 7. UI / Дизайн

- **Сетка:** боковое меню слева (сворачивается на мобильных), контент справа. Порядок пунктов: **Сегодня · Задачи · Проекты · Фокус · Деньги · Прогресс · Настройки**.
- **«Сегодня» — самый быстрый экран:** план + отметка в один клик, без лишних переходов.
- **Палитра:** нейтральный фон, один акцент. Сделано — зелёный, просрочено — красный, приоритеты — отдельные метки. «Мне должны» — зелёный, «я должен» — красный. Сфера Работа/Личное — отдельные метки.
- **Компоненты только из shadcn/ui:** `Button`, `Card`, `Dialog`, `Input`, `Select`, `Table`, `Tabs`, `Badge`, `Calendar`, `Popover`, `DropdownMenu`, `Avatar`, `Progress`.
- **Деньги** форматируются через `formatMoney(amount, currency)`; разные валюты не суммируются.
- **Тёмная тема** через `next-themes` (опционально). Отзывчивость от 360px.

---

## 8. План разработки (выполнять по этапам)

> После каждого этапа: `npm run build` без ошибок. Ядро (дисциплина) — раньше денег: сначала проверяем, что ежедневный цикл реально используется.

**Этап 0 — Каркас**
1. `create-next-app` (TypeScript, Tailwind, App Router, src/, alias `@/`) → Next.js 16.
2. Зависимости (раздел 2), включая `@supabase/supabase-js`, `@supabase/ssr`, `date-fns-tz`.
3. Инициализировать shadcn/ui, базовые компоненты.
4. `npx supabase init`, создать проект в дашборде Supabase, `supabase link`.

**Этап 1 — БД и RLS**
1. Миграция: перечисления, таблицы, индексы (4.1, 4.2).
2. Включить RLS и добавить политики на все таблицы (4.3).
3. Триггеры (4.4–4.8): `updated_at`/закрытие задач, статус долга, история активов, автопрофиль, `daily_done`.
4. `supabase db push`, затем сгенерировать `types/database.types.ts`.
5. `seed.sql`: тестовые проекты, задачи, долги, активы. **Важно:** в seed `user_id` указывается явно — при `db reset` seed выполняется суперпользователем, `auth.uid()` = NULL, дефолт `user_id` не сработает (NOT NULL violation). См. раздел 10.

**Этап 2 — Авторизация**
1. `utils/supabase/{client,server,middleware}.ts` и `proxy.ts` по гайду `@supabase/ssr`.
2. Страница `/login` (кнопка OAuth) и маршрут `/auth/callback`.
3. Защита группы `(app)` через `getUser()` в layout; меню пользователя с `signOut`.
4. Отключить публичную регистрацию в Supabase, создать свой аккаунт через приглашение.

**Этап 3 — Дисциплина (ядро)**
1. Zod-схемы и Server Actions для проектов и задач (CRUD, статус, `scheduled_for`, время `start_at`/`end_at`, позиция, **сфера `area`**).
2. Страницы `/projects` и `/projects/[id]`; `/tasks` в трёх видах — **Список / Канбан (`@dnd-kit`) / Таймлайн**, фильтр по сфере.
3. Экран «**Сегодня**» (`/`): план дня, отметка «сделано», прогресс дня, сегодня по времени, переключатель сферы.
4. **Напоминания (Web Push, работают и при закрытом приложении):**
   - Service worker (`public/sw.js`), запрос разрешения и подписка (`PushManager`), сохранение в `push_subscriptions` (Server Action `push.ts`, upsert; на `410 Gone` — удалять).
   - VAPID-ключи (`web-push`): приватный — в секретах, публичный — на клиенте.
   - Edge Function `send-reminders` (берёт незакрытые `remind_at <= now()`, шлёт push, ставит `reminded_at`) + `pg_cron` раз в минуту (см. 4.9). Деплой: `supabase functions deploy send-reminders`.
5. `lib/streak.ts` + `daily_done`: серия и `StreakBadge`. **Здесь остановиться и реально попользоваться неделю** перед работой и деньгами.

**Этап 4 — Работа и фокус**
1. `focus_sessions`: Server Actions старт/стоп/ручной интервал; частичный уникальный индекс на активную сессию.
2. Экран `/focus`: активный таймер, рабочие дела дня, часы в фокусе (день/неделя).
3. Учёт времени по проектам (агрегаты сессий).
4. Выплаты: `payout_amount`/`payout_currency` у задач + метрика «заработано» по закрытым рабочим задачам.

**Этап 5 — Деньги (контроль)**
1. Долги: Server Actions + страница `/money/debts` (долг + погашения, остаток, статус-триггер).
2. Активы/инвестиции: `/money/assets`, обновление стоимости (история — триггер).
3. Регулярные: `/money/recurring` (+ «отметить за период»).
4. Сводка `/money`: капитал по валютам, дебиторка/кредиторка, чистыми.

**Этап 6 — Прогресс**
1. `server/queries/{progress,focus}.ts`: серии, выполнено, часы в фокусе, время по проектам, заработано, точки капитала.
2. `/progress`: хитмап серий, графики выполненного/фокуса/заработка, динамика капитала.

**Этап 7 — Деплой** (раздел 11).

**Этап 8 — Полировка**
1. Состояния загрузки и пустые состояния.
2. Подтверждения удаления, обработка ошибок форм.
3. Адаптив, тёмная тема (если есть время).

---

## 9. Соглашения по коду и безопасность

- **Server Components по умолчанию.** `'use client'` — только для интерактива (формы, отметки, графики).
- **Мутации — через Server Actions** в `src/server/actions/`. Каждая: (1) создаёт серверный supabase-клиент, (2) проверяет `getUser()`, (3) валидирует ввод через Zod, (4) пишет в БД (RLS и `default auth.uid()` отвечают за изоляцию), (5) `revalidatePath()`.
- **Не передавай `user_id` из тела запроса** — он проставляется дефолтом БД и проверяется RLS.
- **Проверка сессии на сервере — только через `supabase.auth.getUser()`** (токен верифицируется на сервере Supabase). `proxy.ts` лишь обновляет токены и НЕ является границей авторизации (middleware-проверки обходимы — CVE-2025-29927). Реальная защита: `getUser()` в Server Components/Actions + RLS.
- **Ключи:** используй новые `publishable`/`secret` (legacy anon/service_role работают до конца 2026). Секретный ключ — только для серверных операций в обход RLS; в обычной логике он не нужен.
- Деньги — `numeric`; приводи к числу только на границе с UI. Разные валюты не складывай.
- Никаких `any`. `strict: true`. Импортируй сгенерированный тип `Database` в клиентах: `createServerClient<Database>(...)`.
- Server Action возвращает `{ success: boolean; error?: string }`.

---

## 10. Команды

```bash
# Установка
npm install

# Supabase CLI
npx supabase init
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration new init       # создать файл миграции
npx supabase db push                  # применить миграции к проекту
npx supabase gen types typescript --linked > src/types/database.types.ts

# Напоминания (Web Push)
npx web-push generate-vapid-keys      # сгенерировать VAPID-пару (один раз)
npx supabase functions deploy send-reminders
npx supabase secrets set VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com

# Локальная БД в Docker (опционально)
npx supabase start
npx supabase db reset                 # применить миграции + seed локально

# Разработка
npm run dev                           # http://localhost:3000
npm run build
npm run lint
```

> **seed и RLS.** `supabase db reset` выполняет `seed.sql` от суперпользователя — RLS не действует, а `auth.uid()` = NULL. Поэтому в seed `user_id` задаётся явно. Локально можно завести тестового пользователя и взять его id:
>
> ```sql
> insert into auth.users (id, email)
> values ('00000000-0000-0000-0000-000000000001', 'dev@example.com')
> on conflict (id) do nothing;
>
> insert into projects (user_id, name)
> values ('00000000-0000-0000-0000-000000000001', 'Личное');
> ```
>
> На слинкованном проекте используйте свой реальный `user_id` из `auth.users`.

`.env.local` (локально) и переменные на Vercel:
```
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."   # или legacy anon key
NEXT_PUBLIC_VAPID_PUBLIC_KEY="B..."                         # публичный VAPID-ключ для подписки на push
# Приватный VAPID-ключ и service_role — в секретах Edge Function (supabase secrets set), НЕ здесь:
# SUPABASE_SECRET_KEY="sb_secret_..."
```

Команда сборки на Vercel — обычная: `next build` (миграции применяются через Supabase CLI отдельно, не на этапе билда Vercel).

---

## 11. Деплой на Vercel

1. **Залить код в GitHub**, импортировать в Vercel (*New Project → Import*).
2. **Подключить Supabase:** в проекте Vercel установить интеграцию **Supabase** из Marketplace — она пропишет переменные окружения (`NEXT_PUBLIC_SUPABASE_URL`, ключ).
3. **OAuth-провайдер:** в дашборде Supabase → *Authentication → Providers → GitHub* указать Client ID/Secret. В *Authentication → URL Configuration* задать Site URL = домен на Vercel и добавить redirect-URL `https://<app>.vercel.app/auth/callback`.
4. **Отключить публичную регистрацию** (Authentication → Sign Ups), создать свой аккаунт приглашением.
5. **Применить миграции** к проекту: `supabase db push` (локально, проект слинкован). Отдельно от деплоя Vercel.
6. **Напоминания:** `supabase functions deploy send-reminders`; задать секреты (`supabase secrets set VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:...`); включить `pg_cron`/`pg_net` и создать cron-job (4.9). Публичный VAPID-ключ — в переменные Vercel (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`).
7. **Превью-окружения:** при желании отдельный Supabase-проект для preview, чтобы не смешивать с прод-данными.

---

## 12. Вне рамок MVP (не делать сейчас)

- **Фаза 2 — детальный учёт трат.** Лента транзакций по категориям/счетам с пересчётом баланса триггером (классический финтрекер). Сознательно отложено: высокое трение ручного ввода. Если понадобится — добавляется отдельными таблицами `wallets`/`categories`/`transactions` (+ триггер баланса), не ломая ядро. Скажи — подготовлю миграцию.
- Авто-перенос «заработанного» с рабочих задач в актив/капитал (сейчас это только метрика; перенос — вручную).
- Мультивалютная конвертация по курсам (общий капитал одной валютой). Сейчас — в разрезе валют.
- Импорт банковских выписок, экспорт в CSV/PDF.
- Авто-постинг регулярных доходов/расходов в ленту.
- Несколько OAuth-провайдеров и вход по email/паролю.
- Supabase Storage (вложения) и Realtime (живое обновление). Мобильное приложение.

> **Альтернатива с Prisma.** Если нужен Prisma вместо supabase-js: Supabase как Postgres + Auth, Prisma через пулер (порт 6543) с `directUrl` для миграций, изоляция данных переносится в код (`where user_id = ...`), т.к. Prisma обходит RLS. Рабочий, но более ручной вариант.

> Архитектура (Supabase Auth + RLS + supabase-js) спроектирована так, чтобы добавить пункты выше без переписывания ядра.
