"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import { addPeriodYmd } from "@/lib/dates"
import {
  recurringCreateSchema,
  type RecurringCreateInput,
} from "@/lib/validations/recurring"

type Result = { success: boolean; error?: string }

function revalidate() {
  revalidatePath("/money")
  revalidatePath("/money/recurring")
}

export async function createRecurring(input: RecurringCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = recurringCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { error } = await supabase.from("recurring").insert(parsed.data)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

// «Отметить за период» — сдвигает next_date на один период вперёд.
export async function markRecurringPaid(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { data: row } = await supabase
    .from("recurring")
    .select("next_date, period")
    .eq("id", id)
    .single()
  if (!row) return { success: false, error: "Не найдено" }

  const { error } = await supabase
    .from("recurring")
    .update({ next_date: addPeriodYmd(row.next_date, row.period) })
    .eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteRecurring(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("recurring").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}
