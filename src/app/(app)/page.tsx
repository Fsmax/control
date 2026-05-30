import Link from "next/link"
import {
  Wallet,
  Scale,
  Briefcase,
  Trophy,
  FileText,
  UserCheck,
  Target,
  Timer,
  ArrowRight,
} from "lucide-react"

import { getToday } from "@/server/queries/today"
import { getMoneySummary } from "@/server/queries/money"
import { getFocusData } from "@/server/queries/focus"
import { getProgressData } from "@/server/queries/progress"
import { getCrmSummary, getRecentActivities } from "@/server/queries/crm"
import { formatMoney, formatMoneyShort, primaryAmount } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { ChartCard } from "@/components/analytics/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import { DomainBadge, TASK_STATUS } from "@/components/ui/status-badge"
import { AreaTrend, BarSeries } from "@/components/analytics/charts"

const ACT_LABEL: Record<string, string> = {
  CALL: "Звонок",
  MEETING: "Встреча",
  EMAIL: "Письмо",
  NOTE: "Заметка",
}

export default async function DashboardPage() {
  const [today, money, focus, progress, crm, recent] = await Promise.all([
    getToday(),
    getMoneySummary(),
    getFocusData(),
    getProgressData(),
    getCrmSummary(),
    getRecentActivities(6),
  ])

  const base = focus.baseCurrency
  const capital = primaryAmount(money.capital, base)
  const net = primaryAmount(money.net, base)
  const pipeline = primaryAmount(crm.pipeline, base)
  const won = primaryAmount(crm.wonThisMonth, base)
  const receivable = primaryAmount(crm.receivables, base)

  const capitalSpark = progress.capital.map((p) => p.value)
  const doneSpark = progress.doneByDay.map((p) => p.value)
  const focusSpark = progress.focusByDay.map((p) => p.value)

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд" description="Бизнес, деньги и дисциплина за один взгляд" />

      {/* CRM / бизнес */}
      <div>
        <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Бизнес</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="В воронке"
            value={formatMoneyShort(pipeline.amount, pipeline.currency)}
            hint={pipeline.rest > 0 ? `+${pipeline.rest}` : undefined}
            sub={`${crm.pipelineCount} активных сделок`}
            icon={Briefcase}
            href="/deals"
          />
          <StatCard
            label="Выиграно за месяц"
            value={formatMoneyShort(won.amount, won.currency)}
            hint={won.rest > 0 ? `+${won.rest}` : undefined}
            icon={Trophy}
            accent="success"
            href="/deals"
          />
          <StatCard
            label="Счета к оплате"
            value={formatMoneyShort(receivable.amount, receivable.currency)}
            hint={receivable.rest > 0 ? `+${receivable.rest}` : undefined}
            sub={crm.overdueInvoices > 0 ? `${crm.overdueInvoices} просрочено` : "дебиторка"}
            icon={FileText}
            accent={crm.overdueInvoices > 0 ? "danger" : "default"}
            href="/invoices"
          />
          <StatCard label="Активных клиентов" value={crm.clientsActive} icon={UserCheck} href="/clients" />
        </div>
      </div>

      {/* Деньги и дисциплина */}
      <div>
        <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Деньги и дисциплина</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Капитал"
            value={formatMoneyShort(capital.amount, capital.currency)}
            hint={capital.rest > 0 ? `+${capital.rest}` : undefined}
            sub="активы"
            icon={Wallet}
            spark={capitalSpark}
            href="/money"
          />
          <StatCard
            label="Чистыми"
            value={formatMoneyShort(net.amount, net.currency)}
            hint={net.rest > 0 ? `+${net.rest}` : undefined}
            sub="активы − долги"
            icon={Scale}
            accent={net.amount >= 0 ? "success" : "danger"}
            href="/money"
          />
          <StatCard
            label="Цель дня"
            value={`${today.doneToday}/${today.dayGoal}`}
            sub={`серия ${progress.streak.current} · рекорд ${progress.streak.best}`}
            icon={Target}
            spark={doneSpark}
            sparkTone={today.doneToday >= today.dayGoal ? "success" : "primary"}
            href="/today"
          />
          <StatCard
            label="Фокус сегодня"
            value={`${Math.round(focus.focusMinutesToday)} мин`}
            sub={`цель ${focus.focusGoalMin} мин`}
            icon={Timer}
            spark={focusSpark}
            href="/focus"
          />
        </div>
      </div>

      {/* Графики */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Динамика капитала" description={`база — ${base}`} className="lg:col-span-2">
          {progress.capital.length > 1 ? (
            <AreaTrend data={progress.capital} format={(v) => formatMoneyShort(v, base)} />
          ) : (
            <EmptyState icon={Wallet} title="Пока нет истории" description="Обновляйте стоимость активов — здесь появится кривая капитала." />
          )}
        </ChartCard>

        <ChartCard title="Выполнено за 14 дней">
          <BarSeries data={progress.doneByDay.slice(-14)} />
        </ChartCard>
      </div>

      {/* Нижние панели */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          title="План на день"
          action={
            <Link href="/today" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Открыть <ArrowRight className="size-3" />
            </Link>
          }
        >
          {today.planned.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">На сегодня ничего не запланировано.</p>
          ) : (
            <ul className="divide-y">
              {today.planned.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className={t.status === "DONE" ? "truncate text-muted-foreground line-through" : "truncate"}>
                    {t.title}
                  </span>
                  <DomainBadge map={TASK_STATUS} value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="Ближайшее">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Просроченные задачи</span>
              <Link href="/today" className="font-medium tabular-nums text-destructive">
                {today.overdue.length}
              </Link>
            </div>
            {money.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Регулярных платежей нет.</p>
            ) : (
              <ul className="space-y-1.5">
                {money.upcoming.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-muted-foreground">
                      {r.name} · {r.next_date}
                    </span>
                    <span
                      className={
                        r.kind === "INCOME"
                          ? "font-medium tabular-nums text-success"
                          : "font-medium tabular-nums text-destructive"
                      }
                    >
                      {r.kind === "INCOME" ? "+" : "−"}
                      {formatMoney(Number(r.amount), r.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Последняя активность"
          action={
            <Link href="/clients" className="text-xs text-muted-foreground hover:text-foreground">
              Клиенты
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Активностей пока нет.</p>
          ) : (
            <ul className="space-y-2.5">
              {recent.map((a) => (
                <li key={a.id} className="text-sm">
                  <Link href={`/clients/${a.clientId}`} className="flex items-center justify-between gap-2 hover:text-primary">
                    <span className="truncate font-medium">{a.subject}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{a.occurred_at.slice(0, 10)}</span>
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {ACT_LABEL[a.type] ?? a.type}
                    {a.clientName ? ` · ${a.clientName}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
