"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import {
  invoiceCreateSchema,
  invoiceUpdateSchema,
  invoiceStatusEnum,
  type InvoiceCreateInput,
  type InvoiceUpdateInput,
} from "@/lib/validations/invoice"

type Result = { success: boolean; error?: string; id?: string }

function revalidate() {
  revalidatePath("/invoices")
  revalidatePath("/money")
  revalidatePath("/")
}

export async function createInvoice(input: InvoiceCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = invoiceCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { data, error } = await supabase.from("invoices").insert(parsed.data).select("id").single()
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true, id: data?.id }
}

export async function updateInvoice(input: InvoiceUpdateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = invoiceUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { id, ...rest } = parsed.data
  const { error } = await supabase.from("invoices").update(rest).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true, id }
}

// Сменить статус (включая «Отметить оплаченным»); paid_at ведёт триггер invoice_touch.
export async function setInvoiceStatus(id: string, status: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = invoiceStatusEnum.safeParse(status)
  if (!parsed.success) return { success: false, error: "Неверный статус" }

  const { error } = await supabase.from("invoices").update({ status: parsed.data }).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteInvoice(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("invoices").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}
