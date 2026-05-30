"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import {
  debtCreateSchema,
  debtPaymentSchema,
  type DebtCreateInput,
  type DebtPaymentInput,
} from "@/lib/validations/debt"

type Result = { success: boolean; error?: string }

function revalidate() {
  revalidatePath("/money")
  revalidatePath("/money/debts")
}

export async function createDebt(input: DebtCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = debtCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { error } = await supabase.from("debts").insert(parsed.data)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function addPayment(input: DebtPaymentInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = debtPaymentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  // статус долга (OPEN/CLOSED) пересчитает триггер refresh_debt_status
  const { error } = await supabase.from("debt_payments").insert(parsed.data)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteDebt(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("debts").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}
