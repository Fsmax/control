"use server"

import { createClient } from "@/utils/supabase/server"

type Result = { success: boolean; error?: string }
type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } }

export async function savePushSubscription(sub: PushSub): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("push_subscriptions").upsert(
    { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    { onConflict: "endpoint" }
  )
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deletePushSubscription(endpoint: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
