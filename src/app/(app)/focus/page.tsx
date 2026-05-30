import { getFocusData } from "@/server/queries/focus"
import { FocusTimer } from "@/components/focus/focus-timer"
import { FocusTodayWork } from "@/components/focus/focus-today-work"
import { ProjectTimeTable } from "@/components/focus/project-time-table"
import { EarningsCard } from "@/components/focus/earnings-card"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

export default async function FocusPage() {
  const d = await getFocusData()
  const hoursWeek = Math.round((d.focusMinutesWeek / 60) * 10) / 10

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Работа и фокус</h1>

      <FocusTimer active={d.active} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat
          label="Фокус сегодня"
          value={`${Math.round(d.focusMinutesToday)} мин`}
          sub={`цель ${d.focusGoalMin} мин`}
        />
        <Stat label="Фокус за неделю" value={`${hoursWeek.toLocaleString("ru-RU")} ч`} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Рабочие дела сегодня</h2>
        <FocusTodayWork tasks={d.todayWork} />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Время по проектам (7 дней)</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectTimeTable rows={d.byProject} />
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Заработано за месяц</CardTitle>
          </CardHeader>
          <CardContent>
            <EarningsCard items={d.earnings} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
