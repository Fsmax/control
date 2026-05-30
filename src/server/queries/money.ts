import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/types/database.types"

type DebtRow = Database["public"]["Tables"]["debts"]["Row"]
type AssetRow = Database["public"]["Tables"]["assets"]["Row"]
type RecurringRow = Database["public"]["Tables"]["recurring"]["Row"]

export type DebtWithOutstanding = DebtRow & { outstanding: number }
export type CurrencyAmount = { currency: string; amount: number }

export type MoneySummary = {
  capital: CurrencyAmount[]
  owedToMe: CurrencyAmount[]
  iOwe: CurrencyAmount[]
  net: CurrencyAmount[]
  upcoming: RecurringRow[]
}

function byCurrency(pairs: [string, number][]): CurrencyAmount[] {
  const m = new Map<string, number>()
  for (const [cur, amt] of pairs) m.set(cur, (m.get(cur) ?? 0) + amt)
  return [...m.entries()].map(([currency, amount]) => ({ currency, amount }))
}

export async function listDebts(): Promise<DebtWithOutstanding[]> {
  const supabase = await createClient()
  const [{ data: debts }, { data: payments }] = await Promise.all([
    supabase.from("debts").select("*").order("created_at", { ascending: false }),
    supabase.from("debt_payments").select("debt_id, amount"),
  ])
  const paid = new Map<string, number>()
  for (const p of payments ?? []) {
    paid.set(p.debt_id, (paid.get(p.debt_id) ?? 0) + Number(p.amount))
  }
  return (debts ?? []).map((d) => ({
    ...d,
    outstanding: Number(d.amount) - (paid.get(d.id) ?? 0),
  }))
}

export async function listAssets(): Promise<AssetRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function listRecurring(): Promise<RecurringRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("recurring")
    .select("*")
    .order("next_date", { ascending: true })
  return data ?? []
}

export async function getMoneySummary(): Promise<MoneySummary> {
  const [assets, debts, recurring] = await Promise.all([
    listAssets(),
    listDebts(),
    listRecurring(),
  ])

  const open = debts.filter((d) => d.outstanding > 0.0001)
  const capital = byCurrency(assets.map((a) => [a.currency, Number(a.current_value)]))
  const owedToMe = byCurrency(
    open.filter((d) => d.direction === "OWED_TO_ME").map((d) => [d.currency, d.outstanding])
  )
  const iOwe = byCurrency(
    open.filter((d) => d.direction === "I_OWE").map((d) => [d.currency, d.outstanding])
  )

  const netMap = new Map<string, number>()
  for (const c of capital) netMap.set(c.currency, (netMap.get(c.currency) ?? 0) + c.amount)
  for (const c of owedToMe) netMap.set(c.currency, (netMap.get(c.currency) ?? 0) + c.amount)
  for (const c of iOwe) netMap.set(c.currency, (netMap.get(c.currency) ?? 0) - c.amount)
  const net = [...netMap.entries()].map(([currency, amount]) => ({ currency, amount }))

  const upcoming = recurring.filter((r) => r.active).slice(0, 5)

  return { capital, owedToMe, iOwe, net, upcoming }
}
