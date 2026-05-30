import Link from "next/link"
import { notFound } from "next/navigation"
import { Phone, Mail, MapPin, Hash, Building2, FolderKanban } from "lucide-react"

import { getClient } from "@/server/queries/clients"
import { getProfile } from "@/server/queries/profile"
import { formatMoney } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { ChartCard } from "@/components/analytics/chart-card"
import { Button } from "@/components/ui/button"
import { DomainBadge, CLIENT_STATUS, CLIENT_KIND, DEAL_STAGE, INVOICE_STATUS } from "@/components/ui/status-badge"
import { ClientForm } from "@/components/crm/client-form"
import { ContactForm } from "@/components/crm/contact-form"
import { DealForm } from "@/components/crm/deal-form"
import { InvoiceForm } from "@/components/crm/invoice-form"
import { ActivityForm } from "@/components/crm/activity-form"
import { ActivityTimeline } from "@/components/crm/activity-timeline"

function Req({ icon: Icon, value }: { icon: typeof Phone; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{value}</span>
    </div>
  )
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [data, profile] = await Promise.all([getClient(id), getProfile()])
  if (!data) notFound()

  const { client, contacts, deals, activities, invoices, projects } = data
  const base = profile?.base_currency ?? "UZS"
  const dealOpts = deals.map((d) => ({ id: d.id, title: d.title }))

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: "Клиенты", href: "/clients" }, { label: client.name }]}
        title={client.name}
        description={CLIENT_KIND[client.kind]?.label}
        actions={
          <>
            <DomainBadge map={CLIENT_STATUS} value={client.status} />
            <ClientForm
              client={client}
              trigger={
                <Button size="sm" variant="outline">
                  Редактировать
                </Button>
              }
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Левая колонка: активности, сделки, счета */}
        <div className="space-y-4 lg:col-span-2">
          <ChartCard title="Активности" action={<ActivityForm clientId={client.id} deals={dealOpts} />}>
            <ActivityTimeline activities={activities} />
          </ChartCard>

          <ChartCard
            title="Сделки"
            action={<DealForm clients={[]} lockedClientId={client.id} baseCurrency={base} trigger={<Button size="sm" variant="outline">Сделка</Button>} />}
          >
            {deals.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Сделок нет.</p>
            ) : (
              <ul className="divide-y">
                {deals.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate font-medium">{d.title}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      {d.amount > 0 && <span className="tabular-nums">{formatMoney(Number(d.amount), d.currency)}</span>}
                      <DomainBadge map={DEAL_STAGE} value={d.stage} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>

          <ChartCard
            title="Счета"
            action={
              <InvoiceForm
                clients={[{ id: client.id, name: client.name }]}
                deals={dealOpts}
                lockedClientId={client.id}
                baseCurrency={base}
                trigger={<Button size="sm" variant="outline">Счёт</Button>}
              />
            }
          >
            {invoices.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Счетов нет.</p>
            ) : (
              <ul className="divide-y">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="truncate font-medium">№ {i.number}</span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums">{formatMoney(Number(i.amount), i.currency)}</span>
                      <DomainBadge map={INVOICE_STATUS} value={i.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>

        {/* Правая колонка: реквизиты, контакты, проекты */}
        <div className="space-y-4">
          <ChartCard title="Реквизиты">
            <div className="space-y-2">
              <Req icon={Phone} value={client.phone} />
              <Req icon={Mail} value={client.email} />
              <Req icon={MapPin} value={client.site_address} />
              <Req icon={Building2} value={client.address} />
              <Req icon={Hash} value={client.tax_id} />
              {!client.phone && !client.email && !client.site_address && !client.address && !client.tax_id && (
                <p className="text-sm text-muted-foreground">Реквизиты не заполнены.</p>
              )}
              {client.note && <p className="border-t pt-2 text-sm text-muted-foreground">{client.note}</p>}
            </div>
          </ChartCard>

          <ChartCard title="Контакты" action={<ContactForm clientId={client.id} />}>
            {contacts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Контактов нет.</p>
            ) : (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li key={c.id} className="text-sm">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[c.role, c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>

          {projects.length > 0 && (
            <ChartCard title="Проекты">
              <ul className="space-y-1.5">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.id}`}
                      className="flex items-center gap-2 text-sm transition-colors hover:text-primary"
                    >
                      <FolderKanban className="size-4 text-muted-foreground" />
                      <span className="truncate">{p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </ChartCard>
          )}
        </div>
      </div>
    </div>
  )
}
