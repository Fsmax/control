"use client"

import { useTransition } from "react"
import { FileText } from "lucide-react"

import type { InvoiceWithClient } from "@/server/queries/invoices"
import { setInvoiceStatus } from "@/server/actions/invoices"
import { formatMoney } from "@/lib/utils"
import { DataTable, type Column } from "@/components/ui/data-table"
import { StatusBadge, DomainBadge, INVOICE_STATUS } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { InvoiceForm } from "@/components/crm/invoice-form"

type Opt = { id: string; name: string }
type DealOpt = { id: string; title: string }

function InvoiceActions({
  invoice,
  clients,
  deals,
  baseCurrency,
}: {
  invoice: InvoiceWithClient
  clients: Opt[]
  deals: DealOpt[]
  baseCurrency: string
}) {
  const [pending, start] = useTransition()
  const canPay = invoice.status !== "PAID" && invoice.status !== "CANCELLED"

  return (
    <div className="flex items-center justify-end gap-1">
      {canPay && (
        <Button
          size="xs"
          variant="outline"
          disabled={pending}
          onClick={() => start(async () => void (await setInvoiceStatus(invoice.id, "PAID")))}
        >
          Оплачен
        </Button>
      )}
      <InvoiceForm
        clients={clients}
        deals={deals}
        baseCurrency={baseCurrency}
        invoice={{
          id: invoice.id,
          number: invoice.number,
          client_id: invoice.client_id,
          deal_id: invoice.deal_id,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          amount: Number(invoice.amount),
          currency: invoice.currency,
          status: invoice.status,
          note: invoice.note,
        }}
        trigger={
          <Button size="xs" variant="ghost">
            Изм.
          </Button>
        }
      />
    </div>
  )
}

export function InvoicesTable({
  invoices,
  clients,
  deals,
  baseCurrency,
}: {
  invoices: InvoiceWithClient[]
  clients: Opt[]
  deals: DealOpt[]
  baseCurrency: string
}) {
  const columns: Column<InvoiceWithClient>[] = [
    {
      key: "number",
      header: "Номер",
      sortValue: (i) => i.number,
      cell: (i) => <span className="font-medium">{i.number}</span>,
    },
    {
      key: "client",
      header: "Клиент",
      sortValue: (i) => i.clientName ?? "",
      cell: (i) => <span className="text-muted-foreground">{i.clientName ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Статус",
      sortValue: (i) => i.status,
      cell: (i) =>
        i.overdue && i.status === "SENT" ? (
          <StatusBadge tone="danger">Просрочен</StatusBadge>
        ) : (
          <DomainBadge map={INVOICE_STATUS} value={i.status} />
        ),
    },
    {
      key: "issue_date",
      header: "Выставлен",
      sortValue: (i) => i.issue_date,
      cell: (i) => <span className="text-muted-foreground tabular-nums">{i.issue_date}</span>,
    },
    {
      key: "due_date",
      header: "Срок",
      sortValue: (i) => i.due_date ?? "",
      cell: (i) => (
        <span className={i.overdue ? "tabular-nums text-destructive" : "tabular-nums text-muted-foreground"}>
          {i.due_date ?? "—"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Сумма",
      align: "right",
      sortValue: (i) => Number(i.amount),
      cell: (i) => <span className="font-medium tabular-nums">{formatMoney(Number(i.amount), i.currency)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (i) => <InvoiceActions invoice={i} clients={clients} deals={deals} baseCurrency={baseCurrency} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={invoices}
      getRowKey={(i) => i.id}
      initialSort={{ key: "issue_date", dir: "desc" }}
      empty={
        <EmptyState
          icon={FileText}
          title="Счетов пока нет"
          description="Выставите первый счёт клиенту — статусы и оплаты будут видны здесь."
        />
      }
    />
  )
}
