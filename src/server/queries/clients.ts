import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/types/database.types"

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]
type ContactRow = Database["public"]["Tables"]["contacts"]["Row"]
type DealRow = Database["public"]["Tables"]["deals"]["Row"]
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"]
type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"]

export type CurrencyAmount = { currency: string; amount: number }

// Открытые этапы воронки (не выиграно/не проиграно).
const OPEN_STAGES: string[] = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"]

function byCurrency(pairs: [string, number][]): CurrencyAmount[] {
  const m = new Map<string, number>()
  for (const [cur, amt] of pairs) m.set(cur, (m.get(cur) ?? 0) + amt)
  return [...m.entries()].map(([currency, amount]) => ({ currency, amount }))
}

export type ClientWithStats = ClientRow & {
  dealsOpen: number
  openAmount: CurrencyAmount[]
  lastActivityAt: string | null
}

export async function listClients(): Promise<ClientWithStats[]> {
  const supabase = await createClient()
  const [{ data: clients }, { data: deals }, { data: acts }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("deals").select("client_id, stage, amount, currency"),
    supabase.from("activities").select("client_id, occurred_at"),
  ])

  const openCount = new Map<string, number>()
  const openPairs = new Map<string, [string, number][]>()
  for (const d of deals ?? []) {
    if (!d.client_id || !OPEN_STAGES.includes(d.stage)) continue
    openCount.set(d.client_id, (openCount.get(d.client_id) ?? 0) + 1)
    const arr = openPairs.get(d.client_id) ?? []
    arr.push([d.currency, Number(d.amount)])
    openPairs.set(d.client_id, arr)
  }

  const lastAct = new Map<string, string>()
  for (const a of acts ?? []) {
    const prev = lastAct.get(a.client_id)
    if (!prev || a.occurred_at > prev) lastAct.set(a.client_id, a.occurred_at)
  }

  return (clients ?? []).map((c) => ({
    ...c,
    dealsOpen: openCount.get(c.id) ?? 0,
    openAmount: byCurrency(openPairs.get(c.id) ?? []),
    lastActivityAt: lastAct.get(c.id) ?? null,
  }))
}

export type ClientDetail = {
  client: ClientRow
  contacts: ContactRow[]
  deals: DealRow[]
  activities: ActivityRow[]
  invoices: InvoiceRow[]
  projects: { id: string; name: string; area: Database["public"]["Enums"]["area"]; status: Database["public"]["Enums"]["project_status"] }[]
}

export async function getClient(id: string): Promise<ClientDetail | null> {
  const supabase = await createClient()
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle()
  if (!client) return null

  const [{ data: contacts }, { data: deals }, { data: activities }, { data: invoices }, { data: projects }] =
    await Promise.all([
      supabase.from("contacts").select("*").eq("client_id", id).order("created_at"),
      supabase.from("deals").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      supabase.from("activities").select("*").eq("client_id", id).order("occurred_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("client_id", id).order("issue_date", { ascending: false }),
      supabase.from("projects").select("id, name, area, status").eq("client_id", id),
    ])

  return {
    client,
    contacts: contacts ?? [],
    deals: deals ?? [],
    activities: activities ?? [],
    invoices: invoices ?? [],
    projects: projects ?? [],
  }
}
