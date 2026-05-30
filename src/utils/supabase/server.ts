import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import type { Database } from "@/types/database.types"

// Клиент для Server Components / Server Actions / Route Handlers.
// Сессия читается из cookie; запись токенов — через setAll (в SC может бросить, тогда обновит proxy).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Вызвано из Server Component — запись cookie тут запрещена.
            // Обновление токенов сделает proxy.ts (updateSession).
          }
        },
      },
    }
  )
}
