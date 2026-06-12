import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react"

import { listInvoices } from "@/server/queries/invoices"
import { listClients } from "@/server/queries/clients"
import { listDeals } from "@/server/queries/deals"
import { getCrmSummary } from "@/server/queries/crm"
import { getProfile } from "@/server/queries/profile"
import { listAssets } from "@/server/queries/money"
import { formatMoneyShort, primaryAmount } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { InvoicesTable } from "@/components/crm/invoices-table"
import { InvoiceForm } from "@/components/crm/invoice-form"

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const [invoices, clients, deals, crm, profile, assets, sp] = await Promise.all([
    listInvoices(),
    listClients(),
    listDeals(),
    getCrmSummary(),
    getProfile(),
    listAssets(),
    searchParams,
  ])
  const assetOpts = assets.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))
  const base = profile?.base_currency ?? "UZS"
  const clientOpts = clients.map((c) => ({ id: c.id, name: c.name }))
  const dealOpts = deals.map((d) => ({ id: d.id, title: d.title }))
  const receivables = primaryAmount(crm.receivables, base)
  const paid = invoices.filter((i) => i.status === "PAID").length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Счета"
        description="Выставление счетов, статусы оплаты и дебиторка"
        actions={<InvoiceForm clients={clientOpts} deals={dealOpts} baseCurrency={base} defaultOpen={sp.new === "1"} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="К оплате"
          value={formatMoneyShort(receivables.amount, receivables.currency)}
          hint={receivables.rest > 0 ? `+${receivables.rest}` : undefined}
          sub="выставлено, не оплачено"
          icon={FileText}
        />
        <StatCard
          label="Просрочено"
          value={crm.overdueInvoices}
          sub="счетов с истёкшим сроком"
          icon={AlertTriangle}
          accent={crm.overdueInvoices > 0 ? "danger" : "default"}
        />
        <StatCard label="Оплачено" value={paid} sub="закрытых счетов" icon={CheckCircle2} accent="success" />
      </div>

      <InvoicesTable
        invoices={invoices}
        clients={clientOpts}
        deals={dealOpts}
        assets={assetOpts}
        baseCurrency={base}
      />
    </div>
  )
}
