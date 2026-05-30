import Link from "next/link"
import { Wallet, Scale, ArrowDownLeft, ArrowUpRight } from "lucide-react"

import { getMoneySummary } from "@/server/queries/money"
import { listDebts, listAssets, listRecurring } from "@/server/queries/money"
import { listInvoices } from "@/server/queries/invoices"
import { getProgressData } from "@/server/queries/progress"
import { getProfile } from "@/server/queries/profile"
import { formatMoney, formatMoneyShort, primaryAmount } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { ChartCard } from "@/components/analytics/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge, DomainBadge, INVOICE_STATUS } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { AreaTrend } from "@/components/analytics/charts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const ASSET_KIND: Record<string, string> = {
  CASH: "Наличные",
  BANK: "Карта / банк",
  DEPOSIT: "Вклад",
  STOCK: "Акции",
  CRYPTO: "Крипта",
  REAL_ESTATE: "Недвижимость",
  OTHER: "Прочее",
}

const PERIOD: Record<string, string> = {
  WEEKLY: "еженедельно",
  MONTHLY: "ежемесячно",
  YEARLY: "ежегодно",
}

export default async function MoneyPage() {
  const [s, debts, assets, recurring, invoices, progress, profile] = await Promise.all([
    getMoneySummary(),
    listDebts(),
    listAssets(),
    listRecurring(),
    listInvoices(),
    getProgressData(),
    getProfile(),
  ])
  const base = profile?.base_currency ?? "UZS"
  const unpaidInvoices = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE")

  const capital = primaryAmount(s.capital, base)
  const net = primaryAmount(s.net, base)
  const owed = primaryAmount(s.owedToMe, base)
  const iOwe = primaryAmount(s.iOwe, base)
  const openDebts = debts.filter((d) => d.outstanding > 0.0001)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Деньги"
        description="Капитал, долги и регулярные платежи под контролем"
        actions={
          <>
            <Button size="sm" variant="outline" render={<Link href="/money/debts" />}>
              Долги
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/money/assets" />}>
              Активы
            </Button>
            <Button size="sm" variant="outline" render={<Link href="/money/recurring" />}>
              Регулярные
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Капитал" value={formatMoneyShort(capital.amount, capital.currency)} sub="активы" icon={Wallet} />
        <StatCard
          label="Чистыми"
          value={formatMoneyShort(net.amount, net.currency)}
          sub="активы + дебиторка − долги"
          icon={Scale}
          accent={net.amount >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Мне должны"
          value={formatMoneyShort(owed.amount, owed.currency)}
          sub="дебиторка"
          icon={ArrowDownLeft}
          accent={owed.amount > 0 ? "success" : "default"}
        />
        <StatCard
          label="Я должен"
          value={formatMoneyShort(iOwe.amount, iOwe.currency)}
          sub="кредиторка"
          icon={ArrowUpRight}
          accent={iOwe.amount > 0 ? "danger" : "default"}
        />
      </div>

      <ChartCard title="Динамика капитала" description={`база — ${base}`}>
        {progress.capital.length > 1 ? (
          <AreaTrend data={progress.capital} format={(v) => formatMoneyShort(v, base)} />
        ) : (
          <EmptyState
            icon={Wallet}
            title="Пока нет истории"
            description="Обновляйте стоимость активов — здесь появится кривая капитала."
          />
        )}
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Долги */}
        <ChartCard
          title="Долги"
          action={
            <Link href="/money/debts" className="text-xs text-muted-foreground hover:text-foreground">
              Управление
            </Link>
          }
        >
          {openDebts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Открытых долгов нет.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs uppercase">Контрагент</TableHead>
                  <TableHead className="text-xs uppercase">Тип</TableHead>
                  <TableHead className="text-right text-xs uppercase">Остаток</TableHead>
                  <TableHead className="text-xs uppercase">Срок</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openDebts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.counterparty}</TableCell>
                    <TableCell>
                      {d.direction === "OWED_TO_ME" ? (
                        <StatusBadge tone="success">Мне должны</StatusBadge>
                      ) : (
                        <StatusBadge tone="danger">Я должен</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        d.direction === "OWED_TO_ME"
                          ? "text-right font-medium tabular-nums text-success"
                          : "text-right font-medium tabular-nums text-destructive"
                      }
                    >
                      {formatMoney(d.outstanding, d.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.due_date ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>

        {/* Активы */}
        <ChartCard
          title="Активы"
          action={
            <Link href="/money/assets" className="text-xs text-muted-foreground hover:text-foreground">
              Управление
            </Link>
          }
        >
          {assets.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Активов пока нет.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-xs uppercase">Название</TableHead>
                  <TableHead className="text-xs uppercase">Тип</TableHead>
                  <TableHead className="text-right text-xs uppercase">Стоимость</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-muted-foreground">{ASSET_KIND[a.kind] ?? a.kind}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(Number(a.current_value), a.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>
      </div>

      {/* Счета к оплате (дебиторка по CRM) */}
      <ChartCard
        title="Счета к оплате"
        action={
          <Link href="/invoices" className="text-xs text-muted-foreground hover:text-foreground">
            Все счета
          </Link>
        }
      >
        {unpaidInvoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Неоплаченных счетов нет.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs uppercase">Номер</TableHead>
                <TableHead className="text-xs uppercase">Клиент</TableHead>
                <TableHead className="text-xs uppercase">Статус</TableHead>
                <TableHead className="text-xs uppercase">Срок</TableHead>
                <TableHead className="text-right text-xs uppercase">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unpaidInvoices.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">№ {i.number}</TableCell>
                  <TableCell className="text-muted-foreground">{i.clientName ?? "—"}</TableCell>
                  <TableCell>
                    {i.overdue && i.status === "SENT" ? (
                      <StatusBadge tone="danger">Просрочен</StatusBadge>
                    ) : (
                      <DomainBadge map={INVOICE_STATUS} value={i.status} />
                    )}
                  </TableCell>
                  <TableCell className={i.overdue ? "tabular-nums text-destructive" : "tabular-nums text-muted-foreground"}>
                    {i.due_date ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(Number(i.amount), i.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ChartCard>

      {/* Регулярные */}
      <ChartCard
        title="Регулярные платежи"
        action={
          <Link href="/money/recurring" className="text-xs text-muted-foreground hover:text-foreground">
            Управление
          </Link>
        }
      >
        {recurring.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Регулярных платежей нет.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-xs uppercase">Название</TableHead>
                <TableHead className="text-xs uppercase">Тип</TableHead>
                <TableHead className="text-xs uppercase">Период</TableHead>
                <TableHead className="text-xs uppercase">След. дата</TableHead>
                <TableHead className="text-right text-xs uppercase">Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurring.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    {r.kind === "INCOME" ? (
                      <StatusBadge tone="success">Доход</StatusBadge>
                    ) : (
                      <StatusBadge tone="danger">Расход</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{PERIOD[r.period] ?? r.period}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{r.next_date}</TableCell>
                  <TableCell
                    className={
                      r.kind === "INCOME"
                        ? "text-right font-medium tabular-nums text-success"
                        : "text-right font-medium tabular-nums text-destructive"
                    }
                  >
                    {r.kind === "INCOME" ? "+" : "−"}
                    {formatMoney(Number(r.amount), r.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ChartCard>
    </div>
  )
}
