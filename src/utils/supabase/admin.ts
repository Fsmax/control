import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/types/database.types"

// Админ-клиент (service_role) — ТОЛЬКО для серверной рассылки напоминаний в обход RLS.
// Никогда не импортировать в клиентский код: ключ читается из секретного env (без NEXT_PUBLIC_).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY или NEXT_PUBLIC_SUPABASE_URL не заданы")
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
