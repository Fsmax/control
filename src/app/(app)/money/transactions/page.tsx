import Link from "next/link"
import { ArrowDownLeft, ArrowUpRight, Download } from "lucide-react"

import { listTransactions, listTxCategories } from "@/server/queries/transactions"
import { listAssets } from "@/server/queries/money"
import { getProfile } from "@/server/queries/profile"
import { todayInTz } from "@/lib/dates"
import { byCurrency } from "@/lib/money"
import { formatMoneyShort, primaryAmount } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { Button } from "@/components/ui/button"
import { TransactionForm } from "@/components/money/transaction-form"
import { TransactionList } from "@/components/money/transaction-list"

export default async function TransactionsPage() {
  const [transactions, assets, categories, profile] = await Promise.all([
    listTransactions(),
    listAssets(),
    listTxCategories(),
    getProfile(),
  ])
  const tz = profile?.timezone ?? "Asia/Tashkent"
  const base = profile?.base_currency ?? "UZS"
  const today = todayInTz(tz)
  const month = today.slice(0, 7)

  const monthTx = transactions.filter((t) => t.date.startsWith(month))
  const income = primaryAmount(
    byCurrency(monthTx.filter((t) => t.kind === "INCOME").map((t) => [t.currency, Number(t.amount)])),
    base
  )
  const expense = primaryAmount(
    byCurrency(monthTx.filter((t) => t.kind === "EXPENSE").map((t) => [t.currency, Number(t.amount)])),
    base
  )

  const assetOpts = assets.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))
  const categoryOpts = categories.map((c) => ({ name: c.name, kind: c.kind }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Транзакции"
        description="Доходы, расходы и переводы — балансы активов обновляются сами"
        actions={
          <>
            <Button size="sm" variant="outline" render={<Link href="/money" />}>
              Сводка
            </Button>
            <Button size="sm" variant="outline" render={<a href="/money/transactions/export" />}>
              <Download className="size-3.5" /> CSV
            </Button>
            <TransactionForm assets={assetOpts} categories={categoryOpts} today={today} />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Доходы за месяц"
          value={formatMoneyShort(income.amount, income.currency)}
          hint={income.rest > 0 ? `+${income.rest}` : undefined}
          sub={month}
          icon={ArrowDownLeft}
          accent={income.amount > 0 ? "success" : "default"}
        />
        <StatCard
          label="Расходы за месяц"
          value={formatMoneyShort(expense.amount, expense.currency)}
          hint={expense.rest > 0 ? `+${expense.rest}` : undefined}
          sub={month}
          icon={ArrowUpRight}
          accent={expense.amount > 0 ? "danger" : "default"}
        />
      </div>

      <TransactionList transactions={transactions} />
    </div>
  )
}
