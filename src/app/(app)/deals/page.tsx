import { Briefcase, Trophy, Layers } from "lucide-react"

import { listDeals } from "@/server/queries/deals"
import { listClients } from "@/server/queries/clients"
import { getCrmSummary } from "@/server/queries/crm"
import { getProfile } from "@/server/queries/profile"
import { formatMoneyShort, primaryAmount } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { DealForm } from "@/components/crm/deal-form"
import { DealBoard, type BoardDeal } from "@/components/crm/deal-board"

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const [deals, clients, crm, profile, sp] = await Promise.all([
    listDeals(),
    listClients(),
    getCrmSummary(),
    getProfile(),
    searchParams,
  ])
  const base = profile?.base_currency ?? "UZS"
  const clientOpts = clients.map((c) => ({ id: c.id, name: c.name }))
  const pipeline = primaryAmount(crm.pipeline, base)
  const won = primaryAmount(crm.wonThisMonth, base)

  const board: BoardDeal[] = deals.map((d) => ({
    id: d.id,
    title: d.title,
    stage: d.stage,
    amount: Number(d.amount),
    currency: d.currency,
    clientName: d.clientName,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Сделки"
        description="Воронка продаж — перетаскивайте карточки между этапами"
        actions={<DealForm clients={clientOpts} baseCurrency={base} defaultOpen={sp.new === "1"} />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="В воронке"
          value={formatMoneyShort(pipeline.amount, pipeline.currency)}
          hint={pipeline.rest > 0 ? `+${pipeline.rest}` : undefined}
          sub={`${crm.pipelineCount} активных сделок`}
          icon={Briefcase}
        />
        <StatCard
          label="Выиграно за месяц"
          value={formatMoneyShort(won.amount, won.currency)}
          hint={won.rest > 0 ? `+${won.rest}` : undefined}
          icon={Trophy}
          accent="success"
        />
        <StatCard label="Всего сделок" value={deals.length} icon={Layers} />
      </div>

      {deals.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Сделок пока нет. Создайте первую — она появится в колонке «Лид».
          </p>
        </div>
      ) : (
        <DealBoard deals={board} />
      )}
    </div>
  )
}
