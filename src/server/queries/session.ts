import { cache } from "react"

import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/types/database.types"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

// Верификация сессии (getUser ходит на сервер Supabase). React cache() дедуплицирует
// вызов в пределах ОДНОГО рендера: дашборд дёргает несколько query-функций, но getUser
// выполнится один раз, а не на каждую.
export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

// Профиль (timezone / day_goal / focus_goal_min / base_currency) — один запрос на рендер,
// даже если его просят сразу несколько query-функций.
export const getCachedProfile = cache(async (): Promise<ProfileRow | null> => {
  const user = await getSessionUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  return data
})
