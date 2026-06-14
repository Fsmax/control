-- =============================================================================
-- Perf + security гигиена (Supabase advisors):
--  1) auth_rls_initplan: оборачиваем auth.uid() в (select auth.uid()), чтобы он
--     вычислялся один раз на запрос, а не на каждую строку. Семантика идентична —
--     значение то же, меняется только план. Покрывает все own_* политики в public.
--  2) Снимаем прямой EXECUTE с trigger-функции handle_new_user (через PostgREST
--     вызывать её не нужно; сам триггер на auth.users продолжит работать).
-- Идемпотентно: уже обёрнутые политики пропускаются.
-- =============================================================================

do $$
declare
  r record;
  stmt text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      -- regex + !~* (без регистра): deparse обёртки даёт верхний 'SELECT', а LIKE
      -- регистрозависим — иначе guard не сработал бы и повтор двойне-обернул бы.
      and (coalesce(qual, '') ~ 'auth\.uid' or coalesce(with_check, '') ~ 'auth\.uid')
      and coalesce(qual, '')       !~* 'select\s+auth\.uid'
      and coalesce(with_check, '') !~* 'select\s+auth\.uid'
  loop
    stmt := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if r.qual is not null then
      stmt := stmt || format(' using (%s)', replace(r.qual, 'auth.uid()', '(select auth.uid())'));
    end if;
    if r.with_check is not null then
      stmt := stmt || format(' with check (%s)', replace(r.with_check, 'auth.uid()', '(select auth.uid())'));
    end if;
    execute stmt;
  end loop;
end $$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
