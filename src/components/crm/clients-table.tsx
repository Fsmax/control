"use client"

import { Users } from "lucide-react"

import type { ClientWithStats } from "@/server/queries/clients"
import { formatMoneyShort, primaryAmount } from "@/lib/utils"
import { DataTable, type Column } from "@/components/ui/data-table"
import { DomainBadge, CLIENT_STATUS, CLIENT_KIND } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"

export function ClientsTable({ clients }: { clients: ClientWithStats[] }) {
  const columns: Column<ClientWithStats>[] = [
    {
      key: "name",
      header: "Клиент",
      sortValue: (c) => c.name.toLowerCase(),
      cell: (c) => (
        <div className="flex flex-col">
          <span className="font-medium">{c.name}</span>
          <span className="text-xs text-muted-foreground">{CLIENT_KIND[c.kind]?.label ?? c.kind}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Статус",
      sortValue: (c) => c.status,
      cell: (c) => <DomainBadge map={CLIENT_STATUS} value={c.status} />,
    },
    {
      key: "dealsOpen",
      header: "Сделок",
      align: "right",
      sortValue: (c) => c.dealsOpen,
      cell: (c) => <span className="tabular-nums">{c.dealsOpen}</span>,
    },
    {
      key: "openAmount",
      header: "Открыто",
      align: "right",
      sortValue: (c) => (c.openAmount[0]?.amount ?? 0),
      cell: (c) => {
        if (c.openAmount.length === 0) return <span className="text-muted-foreground">—</span>
        const a = primaryAmount(c.openAmount)
        return <span className="font-medium tabular-nums">{formatMoneyShort(a.amount, a.currency)}</span>
      },
    },
    {
      key: "phone",
      header: "Телефон",
      cell: (c) => <span className="text-muted-foreground">{c.phone ?? "—"}</span>,
    },
    {
      key: "lastActivityAt",
      header: "Активность",
      sortValue: (c) => c.lastActivityAt ?? "",
      cell: (c) => (
        <span className="text-muted-foreground tabular-nums">
          {c.lastActivityAt ? c.lastActivityAt.slice(0, 10) : "—"}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={clients}
      getRowKey={(c) => c.id}
      rowHref={(c) => `/clients/${c.id}`}
      initialSort={{ key: "name", dir: "asc" }}
      empty={
        <EmptyState
          icon={Users}
          title="Пока нет клиентов"
          description="Добавьте первого заказчика, чтобы вести сделки, активности и счета."
        />
      }
    />
  )
}
