"use client"

import { ArrowLeftRight, Trash2 } from "lucide-react"

import type { TxWithRefs } from "@/server/queries/transactions"
import { deleteTransaction } from "@/server/actions/transactions"
import { formatMoney } from "@/lib/utils"
import { DataTable, type Column } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"

export function TransactionList({ transactions }: { transactions: TxWithRefs[] }) {
  const columns: Column<TxWithRefs>[] = [
    {
      key: "date",
      header: "Дата",
      sortValue: (t) => t.date,
      cell: (t) => <span className="text-muted-foreground tabular-nums">{t.date}</span>,
    },
    {
      key: "kind",
      header: "Тип",
      sortValue: (t) => t.kind,
      cell: (t) =>
        t.kind === "INCOME" ? (
          <StatusBadge tone="success">Доход</StatusBadge>
        ) : t.kind === "EXPENSE" ? (
          <StatusBadge tone="danger">Расход</StatusBadge>
        ) : (
          <StatusBadge tone="neutral">Перевод</StatusBadge>
        ),
    },
    {
      key: "category",
      header: "Категория",
      sortValue: (t) => t.categoryName ?? "",
      cell: (t) => <span className="text-muted-foreground">{t.categoryName ?? "—"}</span>,
    },
    {
      key: "asset",
      header: "Актив",
      cell: (t) =>
        t.kind === "TRANSFER" ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            {t.assetName ?? "—"} <ArrowLeftRight className="size-3" /> {t.toAssetName ?? "—"}
          </span>
        ) : (
          <span className="text-muted-foreground">{t.assetName ?? "—"}</span>
        ),
    },
    {
      key: "note",
      header: "Заметка",
      cell: (t) => (
        <span className="block max-w-[16rem] truncate text-muted-foreground">{t.note ?? "—"}</span>
      ),
    },
    {
      key: "amount",
      header: "Сумма",
      align: "right",
      sortValue: (t) => Number(t.amount),
      cell: (t) => (
        <span
          className={
            t.kind === "INCOME"
              ? "font-medium tabular-nums text-success"
              : t.kind === "EXPENSE"
                ? "font-medium tabular-nums text-destructive"
                : "font-medium tabular-nums"
          }
        >
          {t.kind === "INCOME" ? "+" : t.kind === "EXPENSE" ? "−" : ""}
          {formatMoney(Number(t.amount), t.currency)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (t) => (
        <button
          type="button"
          title="Удалить (баланс актива откатится)"
          onClick={() => void deleteTransaction(t.id)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={transactions}
      getRowKey={(t) => t.id}
      empty={
        <EmptyState
          icon={ArrowLeftRight}
          title="Транзакций пока нет"
          description="Добавьте доход, расход или перевод — балансы активов обновятся сами."
        />
      }
    />
  )
}
