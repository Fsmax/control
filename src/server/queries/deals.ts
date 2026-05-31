import { createClient } from "@/utils/supabase/server"
import { logged } from "@/server/queries/logged"
import type { Database } from "@/types/database.types"

type DealRow = Database["public"]["Tables"]["deals"]["Row"]

export type DealWithClient = DealRow & { clientName: string | null }

export async function listDeals(): Promise<DealWithClient[]> {
  const supabase = await createClient()
  const [deals, clients] = await Promise.all([
    logged(
      "listDeals.deals",
      supabase.from("deals").select("*").order("position").order("created_at", { ascending: false })
    ),
    logged("listDeals.clients", supabase.from("clients").select("id, name")),
  ])
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.name]))
  return (deals ?? []).map((d) => ({
    ...d,
    clientName: d.client_id ? nameById.get(d.client_id) ?? null : null,
  }))
}

export async function getDeal(id: string): Promise<DealWithClient | null> {
  const supabase = await createClient()
  const deal = await logged("getDeal.deal", supabase.from("deals").select("*").eq("id", id).maybeSingle())
  if (!deal) return null
  let clientName: string | null = null
  if (deal.client_id) {
    const client = await logged(
      "getDeal.client",
      supabase.from("clients").select("name").eq("id", deal.client_id).maybeSingle()
    )
    clientName = client?.name ?? null
  }
  return { ...deal, clientName }
}
