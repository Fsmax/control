import { Users, UserCheck, Briefcase, FileText } from "lucide-react"

import { listClients } from "@/server/queries/clients"
import { getCrmSummary } from "@/server/queries/crm"
import { getProfile } from "@/server/queries/profile"
import { formatMoneyShort, primaryAmount } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { ClientsTable } from "@/components/crm/clients-table"
import { ClientForm } from "@/components/crm/client-form"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const [clients, crm, profile, sp] = await Promise.all([
    listClients(),
    getCrmSummary(),
    getProfile(),
    searchParams,
  ])
  const base = profile?.base_currency ?? "UZS"
  const pipeline = primaryAmount(crm.pipeline, base)
  const receivables = primaryAmount(crm.receivables, base)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Клиенты"
        description="Заказчики, контакты и история взаимодействий"
        actions={<ClientForm defaultOpen={sp.new === "1"} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Всего клиентов" value={clients.length} icon={Users} />
        <StatCard label="Активных" value={crm.clientsActive} icon={UserCheck} accent="success" />
        <StatCard
          label="В воронке"
          value={formatMoneyShort(pipeline.amount, pipeline.currency)}
          sub={`${crm.pipelineCount} сделок`}
          icon={Briefcase}
        />
        <StatCard
          label="Счета к оплате"
          value={formatMoneyShort(receivables.amount, receivables.currency)}
          sub={crm.overdueInvoices > 0 ? `${crm.overdueInvoices} просрочено` : "дебиторка"}
          icon={FileText}
          accent={crm.overdueInvoices > 0 ? "danger" : "default"}
        />
      </div>

      <ClientsTable clients={clients} />
    </div>
  )
}
