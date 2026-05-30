"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validations/profile"

type Result = { success: boolean; error?: string }

export async function updateProfile(input: ProfileUpdateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = profileUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id)
  if (error) return { success: false, error: error.message }

  revalidatePath("/settings")
  revalidatePath("/")
  return { success: true }
}
