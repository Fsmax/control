"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import { txCreateSchema, type TxCreateInput } from "@/lib/validations/transaction"

type Result = { success: boolean; error?: string }
type Supabase = Awaited<ReturnType<typeof createClient>>

function revalidate() {
  revalidatePath("/money")
  revalidatePath("/money/transactions")
  revalidatePath("/money/assets")
  revalidatePath("/progress")
}

// Категория по имени: существующая или новая (upsert по user_id+name+kind делает unique).
async function resolveCategory(
  supabase: Supabase,
  name: string | null,
  kind: "INCOME" | "EXPENSE"
): Promise<string | null> {
  if (!name) return null
  const { data: existing } = await supabase
    .from("tx_categories")
    .select("id")
    .eq("name", name)
    .eq("kind", kind)
    .maybeSingle()
  if (existing) return existing.id

  const { data: created } = await supabase
    .from("tx_categories")
    .insert({ name, kind })
    .select("id")
    .single()
  return created?.id ?? null
}

export async function createTransaction(input: TxCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = txCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }
  const tx = parsed.data

  // Валюта всегда берётся из актива — рассинхрон невозможен (и триггер проверит ещё раз).
  const { data: asset } = await supabase
    .from("assets")
    .select("currency")
    .eq("id", tx.asset_id)
    .maybeSingle()
  if (!asset) return { success: false, error: "Актив не найден" }

  const category_id =
    tx.kind === "TRANSFER"
      ? null
      : await resolveCategory(supabase, tx.category?.trim() || null, tx.kind)

  const { error } = await supabase.from("transactions").insert({
    kind: tx.kind,
    asset_id: tx.asset_id,
    to_asset_id: tx.kind === "TRANSFER" ? tx.to_asset_id : null,
    category_id,
    amount: tx.amount,
    currency: asset.currency,
    date: tx.date,
    note: tx.note?.trim() || null,
  })
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("transactions").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

// «Оплачен» + опциональное зачисление на актив. Уникальный индекс по invoice_id
// гарантирует, что счёт зачислится не больше одного раза.
export async function markInvoicePaid(
  invoiceId: string,
  assetId: string | null
): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, number, amount, currency")
    .eq("id", invoiceId)
    .maybeSingle()
  if (!invoice) return { success: false, error: "Счёт не найден" }

  const { error } = await supabase
    .from("invoices")
    .update({ status: "PAID" })
    .eq("id", invoiceId)
  if (error) return { success: false, error: error.message }

  if (assetId) {
    const category_id = await resolveCategory(supabase, "Счета", "INCOME")
    const { error: txError } = await supabase.from("transactions").insert({
      kind: "INCOME",
      asset_id: assetId,
      category_id,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      invoice_id: invoice.id,
      note: `Оплата счёта № ${invoice.number}`,
    })
    // 23505 — счёт уже зачислялся раньше; статус обновлён, дубль не создаём.
    if (txError && txError.code !== "23505") {
      return { success: false, error: txError.message }
    }
  }

  revalidate()
  revalidatePath("/invoices")
  return { success: true }
}

// Зачислить выплату по закрытой рабочей задаче в актив (не больше одного раза).
export async function postTaskPayout(taskId: string, assetId: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, status, payout_amount, payout_currency")
    .eq("id", taskId)
    .maybeSingle()
  if (!task) return { success: false, error: "Задача не найдена" }
  if (task.status !== "DONE") return { success: false, error: "Задача ещё не закрыта" }
  if (!task.payout_amount || Number(task.payout_amount) <= 0) {
    return { success: false, error: "У задачи нет выплаты" }
  }

  const { data: asset } = await supabase
    .from("assets")
    .select("currency")
    .eq("id", assetId)
    .maybeSingle()
  if (!asset) return { success: false, error: "Актив не найден" }
  if (task.payout_currency && asset.currency !== task.payout_currency) {
    return {
      success: false,
      error: `Валюта актива (${asset.currency}) не совпадает с валютой выплаты (${task.payout_currency})`,
    }
  }

  const category_id = await resolveCategory(supabase, "Выплаты по задачам", "INCOME")
  const { error } = await supabase.from("transactions").insert({
    kind: "INCOME",
    asset_id: assetId,
    category_id,
    amount: Number(task.payout_amount),
    currency: asset.currency,
    task_id: task.id,
    note: task.title,
  })
  if (error) {
    if (error.code === "23505") return { success: false, error: "Выплата уже зачислена" }
    return { success: false, error: error.message }
  }

  revalidate()
  revalidatePath("/")
  revalidatePath("/tasks")
  revalidatePath("/projects")
  revalidatePath("/focus")
  return { success: true }
}
