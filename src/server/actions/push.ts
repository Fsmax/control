"use server"

import { z } from "zod"

import { createClient } from "@/utils/supabase/server"

type Result = { success: boolean; error?: string }
type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } }

const pushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
})

export async function savePushSubscription(sub: PushSub): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = pushSchema.safeParse(sub)
  if (!parsed.success) return { success: false, error: "Неверная подписка" }

  const { error } = await supabase.from("push_subscriptions").upsert(
    { endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
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

  if (!z.string().url().safeParse(endpoint).success) {
    return { success: false, error: "Неверный endpoint" }
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
  if (error) return { success: false, error: error.message }
  return { success: true }
}
