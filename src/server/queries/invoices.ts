import { createClient } from "@/utils/supabase/server"
import { todayInTz } from "@/lib/dates"
import type { Database } from "@/types/database.types"

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"]

export type InvoiceWithClient = InvoiceRow & { clientName: string | null; overdue: boolean }

export async function listInvoices(): Promise<InvoiceWithClient[]> {
  const supabase = await createClient()
  const { data: profile } = await supabase.from("profiles").select("timezone").maybeSingle()
  const tz = profile?.timezone ?? "Asia/Tashkent"
  const today = todayInTz(tz)

  const [{ data: invoices }, { data: clients }] = await Promise.all([
    supabase.from("invoices").select("*").order("issue_date", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ])
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.name]))

  return (invoices ?? []).map((i) => ({
    ...i,
    clientName: i.client_id ? nameById.get(i.client_id) ?? null : null,
    // Просрочен = выставлен, есть срок, срок прошёл и ещё не оплачен.
    overdue: i.status === "OVERDUE" || (i.status === "SENT" && !!i.due_date && i.due_date < today),
  }))
}
