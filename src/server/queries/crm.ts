import { formatInTimeZone } from "date-fns-tz"

import { createClient } from "@/utils/supabase/server"
import { logged } from "@/server/queries/logged"
import { getCachedProfile } from "@/server/queries/session"
import { todayInTz } from "@/lib/dates"
import { byCurrency, type CurrencyAmount } from "@/lib/money"

export type { CurrencyAmount }

export type CrmSummary = {
  pipeline: CurrencyAmount[] // открытые сделки (не WON/LOST) по валютам
  pipelineCount: number
  wonThisMonth: CurrencyAmount[] // выиграно за текущий месяц
  receivables: CurrencyAmount[] // неоплаченные счета (SENT/OVERDUE)
  overdueInvoices: number
  clientsActive: number
}

const OPEN_STAGES = new Set(["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"])

export async function getCrmSummary(): Promise<CrmSummary> {
  const supabase = await createClient()
  const profile = await getCachedProfile()
  const tz = profile?.timezone ?? "Asia/Tashkent"
  const today = todayInTz(tz)
  const monthStart = `${today.slice(0, 7)}-01`

  const [deals, invoices, clients] = await Promise.all([
    logged("getCrmSummary.deals", supabase.from("deals").select("stage, amount, currency, won_at")),
    logged(
      "getCrmSummary.invoices",
      supabase.from("invoices").select("status, amount, currency, due_date")
    ),
    logged("getCrmSummary.clients", supabase.from("clients").select("status")),
  ])

  const pipelinePairs: [string, number][] = []
  const wonPairs: [string, number][] = []
  let pipelineCount = 0
  for (const d of deals ?? []) {
    if (OPEN_STAGES.has(d.stage)) {
      pipelinePairs.push([d.currency, Number(d.amount)])
      pipelineCount++
    } else if (
      d.stage === "WON" &&
      d.won_at &&
      formatInTimeZone(new Date(d.won_at), tz, "yyyy-MM-dd") >= monthStart
    ) {
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
  const [acts, clients] = await Promise.all([
    logged(
      "getRecentActivities.activities",
      supabase
        .from("activities")
        .select("id, type, subject, occurred_at, client_id")
        .order("occurred_at", { ascending: false })
        .limit(limit)
    ),
    logged("getRecentActivities.clients", supabase.from("clients").select("id, name")),
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
