import { createClient } from "@/utils/supabase/server"
import { todayInTz } from "@/lib/dates"

export type CurrencyAmount = { currency: string; amount: number }

export type CrmSummary = {
  pipeline: CurrencyAmount[] // открытые сделки (не WON/LOST) по валютам
  pipelineCount: number
  wonThisMonth: CurrencyAmount[] // выиграно за текущий месяц
  receivables: CurrencyAmount[] // неоплаченные счета (SENT/OVERDUE)
  overdueInvoices: number
  clientsActive: number
}

const OPEN_STAGES = new Set(["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"])

function byCurrency(pairs: [string, number][]): CurrencyAmount[] {
  const m = new Map<string, number>()
  for (const [cur, amt] of pairs) m.set(cur, (m.get(cur) ?? 0) + amt)
  return [...m.entries()].map(([currency, amount]) => ({ currency, amount }))
}

export async function getCrmSummary(): Promise<CrmSummary> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from("profiles").select("timezone").maybeSingle()
  const tz = profile?.timezone ?? "Asia/Tashkent"
  const today = todayInTz(tz)
  const monthStart = `${today.slice(0, 7)}-01`

  const [{ data: deals }, { data: invoices }, { data: clients }] = await Promise.all([
    supabase.from("deals").select("stage, amount, currency, won_at"),
    supabase.from("invoices").select("status, amount, currency, due_date"),
    supabase.from("clients").select("status"),
  ])

  const pipelinePairs: [string, number][] = []
  const wonPairs: [string, number][] = []
  let pipelineCount = 0
  for (const d of deals ?? []) {
    if (OPEN_STAGES.has(d.stage)) {
      pipelinePairs.push([d.currency, Number(d.amount)])
      pipelineCount++
    } else if (d.stage === "WON" && d.won_at && d.won_at.slice(0, 10) >= monthStart) {
      wonPairs.push([d.currency, Number(d.amount)])
    }
  }

  const recvPairs: [string, number][] = []
  let overdueInvoices = 0
  for (const i of invoices ?? []) {
    const isOverdue = i.status === "OVERDUE" || (i.status === "SENT" && !!i.due_date && i.due_date < today)
    if (i.status === "SENT" || i.status === "OVERDUE") {
      recvPairs.push([i.currency, Number(i.amount)])
    }
    if (isOverdue) overdueInvoices++
  }

  const clientsActive = (clients ?? []).filter((c) => c.status === "ACTIVE").length

  return {
    pipeline: byCurrency(pipelinePairs),
    pipelineCount,
    wonThisMonth: byCurrency(wonPairs),
    receivables: byCurrency(recvPairs),
    overdueInvoices,
    clientsActive,
  }
}

export type RecentActivity = {
  id: string
  type: string
  subject: string
  occurred_at: string
  clientId: string
  clientName: string | null
}

export async function getRecentActivities(limit = 6): Promise<RecentActivity[]> {
  const supabase = await createClient()
  const [{ data: acts }, { data: clients }] = await Promise.all([
    supabase
      .from("activities")
      .select("id, type, subject, occurred_at, client_id")
      .order("occurred_at", { ascending: false })
      .limit(limit),
    supabase.from("clients").select("id, name"),
  ])
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.name]))
  return (acts ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    subject: a.subject,
    occurred_at: a.occurred_at,
    clientId: a.client_id,
    clientName: nameById.get(a.client_id) ?? null,
  }))
}
