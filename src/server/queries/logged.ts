import type { PostgrestError } from "@supabase/supabase-js"

// Тонкая обёртка над запросом Supabase. Раньше ошибки «глотались» деструктуризацией
// `const { data } = await supabase...` — при сбое БД экран показывал пустой список,
// а не проблему. Теперь ошибка пишется в лог сервера (видна в Vercel Functions logs),
// а контракт сохранён: при сбое возвращается null, вызывающий код деградирует к `?? []`.
// T выводится напрямую из `data` (оно уже `Row[] | null` / `Row | null` в ответе
// Supabase). Не пишем `data: T | null` — двойной `| null` ломает вывод на maybeSingle().
export async function logged<T>(
  label: string,
  query: PromiseLike<{ data: T; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await query
  if (error) {
    console.error(`[query] ${label}: ${error.message}`)
  }
  return data
}
