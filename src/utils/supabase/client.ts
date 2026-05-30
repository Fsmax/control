import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/types/database.types"

// Клиент для Client Components (браузер). Публичный ключ безопасно уходит в бандл.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
