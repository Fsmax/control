import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/types/database.types"

// Обновляет токены сессии на каждом запросе. НЕ является границей авторизации
// (middleware/proxy-проверки обходимы — CVE-2025-29927). Реальная защита — getUser()
// в Server Components/Actions + RLS.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ВАЖНО: getUser() сразу после создания клиента — иначе токен не обновится.
  // Никакой логики между createServerClient и getUser.
  await supabase.auth.getUser()

  return supabaseResponse
}
