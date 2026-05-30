import { Timer, CalendarRange, HandCoins } from "lucide-react"

import { getFocusData } from "@/server/queries/focus"
import { primaryAmount, formatMoneyShort } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/analytics/stat-card"
import { ChartCard } from "@/components/analytics/chart-card"
import { FocusTimer } from "@/components/focus/focus-timer"
import { FocusTodayWork } from "@/components/focus/focus-today-work"
import { ProjectTimeTable } from "@/components/focus/project-time-table"
import { EarningsCard } from "@/components/focus/earnings-card"

export default async function FocusPage() {
  const d = await getFocusData()
  const hoursWeek = Math.round((d.focusMinutesWeek / 60) * 10) / 10
  const earned = primaryAmount(d.earnings, d.baseCurrency)
  const focusPct = d.focusGoalMin > 0 ? (d.focusMinutesToday / d.focusGoalMin) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Работа и фокус" description="Таймер, часы в фокусе, время по проектам и заработок" />

      <FocusTimer active={d.active} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Фокус сегодня"
          value={`${Math.round(d.focusMinutesToday)} мин`}
          sub={`цель ${d.focusGoalMin} мин · ${Math.round(focusPct)}%`}
          icon={Timer}
        />
        <StatCard
          label="Фокус за неделю"
          value={`${hoursWeek.toLocaleString("ru-RU")} ч`}
          sub="последние 7 дней"
          icon={CalendarRange}
        />
        <StatCard
          label="Заработано за месяц"
          value={formatMoneyShort(earned.amount, earned.currency)}
          hint={earned.rest > 0 ? `+${earned.rest}` : undefined}
          sub="по закрытым задачам"
          icon={HandCoins}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Рабочие дела сегодня</h2>
        <FocusTodayWork tasks={d.todayWork} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Время по проектам (7 дней)">
          <ProjectTimeTable rows={d.byProject} />
        </ChartCard>
        <ChartCard title="Заработано за месяц">
          <EarningsCard items={d.earnings} />
        </ChartCard>
      </div>
    </div>
  )
}
