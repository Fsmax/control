"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import { activityCreateSchema, type ActivityCreateInput } from "@/lib/validations/activity"

type Result = { success: boolean; error?: string }

export async function logActivity(input: ActivityCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = activityCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { error } = await supabase.from("activities").insert(parsed.data)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/clients/${parsed.data.client_id}`)
  revalidatePath("/")
  return { success: true }
}

export async function deleteActivity(id: string, clientId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("activities").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidatePath(`/clients/${clientId}`)
  return { success: true }
}
