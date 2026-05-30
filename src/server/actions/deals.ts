"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import {
  dealCreateSchema,
  dealUpdateSchema,
  dealStageEnum,
  type DealCreateInput,
  type DealUpdateInput,
} from "@/lib/validations/deal"

type Result = { success: boolean; error?: string; id?: string }

function revalidate(id?: string) {
  revalidatePath("/deals")
  revalidatePath("/clients")
  revalidatePath("/")
  if (id) revalidatePath(`/deals/${id}`)
}

export async function createDeal(input: DealCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = dealCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { data, error } = await supabase.from("deals").insert(parsed.data).select("id").single()
  if (error) return { success: false, error: error.message }

  revalidate(data?.id)
  return { success: true, id: data?.id }
}

export async function updateDeal(input: DealUpdateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = dealUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { id, ...rest } = parsed.data
  const { error } = await supabase.from("deals").update(rest).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate(id)
  return { success: true, id }
}

// Перетаскивание по этапам воронки: меняем только stage (won_at/lost_at ведёт триггер).
export async function setDealStage(id: string, stage: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = dealStageEnum.safeParse(stage)
  if (!parsed.success) return { success: false, error: "Неверный этап" }

  const { error } = await supabase.from("deals").update({ stage: parsed.data }).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteDeal(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("deals").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}
