import { Flame, Trophy, Wallet, HandCoins } from "lucide-react"

import { getProgressData } from "@/server/queries/progress"
import { formatMoney, formatMoneyShort, primaryAmount } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { ChartCard } from "@/components/analytics/chart-card"
import { EmptyState } from "@/components/ui/empty-state"
import { AreaTrend, BarSeries } from "@/components/analytics/charts"
import { StreakHeatmap } from "@/components/progress/streak-heatmap"

export default async function ProgressPage() {
  const d = await getProgressData()
  const earned = primaryAmount(d.earnings)
  const capitalLast = d.capital.length > 0 ? d.capital[d.capital.length - 1].value : 0
  const capitalCur = d.earnings[0]?.currency ?? "UZS"

  return (
    <div className="space-y-6">
      <PageHeader title="Прогресс" description="Серии, выполнено, фокус, заработок и капитал" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Текущая серия"
          value={`${d.streak.current} дн.`}
          icon={Flame}
          spark={d.doneByDay.map((p) => p.value)}
        />
        <StatCard label="Лучшая серия" value={`${d.streak.best} дн.`} icon={Trophy} />
        <StatCard
          label="Капитал"
          value={formatMoneyShort(capitalLast, capitalCur)}
          icon={Wallet}
          spark={d.capital.map((p) => p.value)}
        />
        <StatCard label="Заработано (6 мес)" value={formatMoneyShort(earned.amount, earned.currency)} icon={HandCoins} />
      </div>

      <ChartCard title="Удачные дни (12 недель)">
        <StreakHeatmap days={d.heatmap} dayGoal={d.dayGoal} />
      </ChartCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Выполнено по дням (30)">
          <BarSeries data={d.doneByDay} />
        </ChartCard>
        <ChartCard title="Фокус, мин/день (14)">
          <BarSeries data={d.focusByDay} />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Динамика капитала" className="xl:col-span-2">
          {d.capital.length > 1 ? (
            <AreaTrend data={d.capital} format={(v) => formatMoneyShort(v, capitalCur)} />
          ) : (
            <EmptyState icon={Wallet} title="Мало данных" description="Обновляйте стоимость активов для графика." />
          )}
        </ChartCard>
        <ChartCard title="Заработано (6 мес)">
          {d.earnings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.earnings.map((e) => (
                <li key={e.currency} className="flex justify-between gap-2 border-b pb-2 last:border-0">
                  <span className="text-muted-foreground">{e.currency}</span>
                  <span className="font-semibold tabular-nums">{formatMoney(e.amount, e.currency)}</span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
