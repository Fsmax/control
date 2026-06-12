"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"

type Result = { success: boolean; error?: string }

const CBU_URL = "https://cbu.uz/ru/arkhiv-kursov-valyut/json/"

function revalidate() {
  revalidatePath("/money")
}

export async function upsertFxRate(currency: string, rate: number): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const cur = currency.trim().toUpperCase()
  if (!/^[A-Z]{3,8}$/.test(cur)) return { success: false, error: "Код валюты: 3–8 латинских букв" }
  if (!Number.isFinite(rate) || rate <= 0) return { success: false, error: "Курс должен быть больше нуля" }

  const { error } = await supabase
    .from("fx_rates")
    .upsert(
      { user_id: user.id, currency: cur, rate, as_of: new Date().toISOString().slice(0, 10) },
      { onConflict: "user_id,currency" }
    )
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteFxRate(currency: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("fx_rates").delete().eq("currency", currency)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

// Подтянуть курсы из ЦБ РУз для всех валют, встречающихся в активах и долгах.
// ЦБ публикует курсы к суму; для другой базовой валюты считается кросс-курс.
export async function refreshFxRates(): Promise<Result & { updated?: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const [{ data: profile }, { data: assets }, { data: debts }] = await Promise.all([
    supabase.from("profiles").select("base_currency").eq("id", user.id).maybeSingle(),
    supabase.from("assets").select("currency"),
    supabase.from("debts").select("currency"),
  ])
  const base = profile?.base_currency ?? "UZS"
  const needed = new Set<string>()
  for (const row of [...(assets ?? []), ...(debts ?? [])]) {
    if (row.currency && row.currency !== base) needed.add(row.currency)
  }
  if (needed.size === 0) return { success: true, updated: 0 }

  let list: { Ccy: string; Rate: string }[]
  try {
    const res = await fetch(CBU_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(String(res.status))
    list = await res.json()
  } catch {
    return { success: false, error: "Сайт ЦБ РУз недоступен — введите курс вручную" }
  }

  const uzsPerUnit = new Map(list.map((r) => [r.Ccy, Number(r.Rate)]))
  const baseUzs = base === "UZS" ? 1 : uzsPerUnit.get(base)
  if (!baseUzs) {
    return { success: false, error: `ЦБ не публикует курс базовой валюты ${base}` }
  }

  const today = new Date().toISOString().slice(0, 10)
  const rows: { user_id: string; currency: string; rate: number; as_of: string }[] = []
  for (const cur of needed) {
    const uzs = cur === "UZS" ? 1 : uzsPerUnit.get(cur)
    if (!uzs) continue
    rows.push({ user_id: user.id, currency: cur, rate: uzs / baseUzs, as_of: today })
  }
  if (rows.length === 0) {
    return { success: false, error: "Для нужных валют курсов в ЦБ не нашлось" }
  }

  const { error } = await supabase
    .from("fx_rates")
    .upsert(rows, { onConflict: "user_id,currency" })
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true, updated: rows.length }
}
