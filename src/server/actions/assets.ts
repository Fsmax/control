"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import {
  assetCreateSchema,
  assetValueSchema,
  type AssetCreateInput,
  type AssetValueInput,
} from "@/lib/validations/asset"

type Result = { success: boolean; error?: string }

function revalidate() {
  revalidatePath("/money")
  revalidatePath("/money/assets")
  revalidatePath("/progress")
}

export async function createAsset(input: AssetCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = assetCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  // вставка пишет первую точку истории через триггер log_asset_valuation
  const { error } = await supabase.from("assets").insert(parsed.data)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function updateAssetValue(input: AssetValueInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = assetValueSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  // обновление стоимости пишет точку истории через триггер
  const { error } = await supabase
    .from("assets")
    .update({ current_value: parsed.data.current_value })
    .eq("id", parsed.data.id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteAsset(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("assets").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}
