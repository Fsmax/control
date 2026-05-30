import { getProgressData } from "@/server/queries/progress"
import { formatMoney } from "@/lib/utils"
import { SimpleBarChart, SimpleLineChart } from "@/components/progress/charts"
import { StreakHeatmap } from "@/components/progress/streak-heatmap"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

export default async function ProgressPage() {
  const d = await getProgressData()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Прогресс</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Текущая серия" value={`${d.streak.current} дн.`} />
        <Stat label="Лучшая серия" value={`${d.streak.best} дн.`} />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Удачные дни (12 недель)</CardTitle>
        </CardHeader>
        <CardContent>
          <StreakHeatmap days={d.heatmap} dayGoal={d.dayGoal} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Выполнено по дням (30)</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={d.doneByDay} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Фокус, мин/день (14)</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart data={d.focusByDay} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Заработано (6 мес)</CardTitle>
          </CardHeader>
          <CardContent>
            {d.earnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {d.earnings.map((e) => (
                  <li key={e.currency} className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{e.currency}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(e.amount, e.currency)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Капитал (базовая валюта)</CardTitle>
          </CardHeader>
          <CardContent>
            {d.capital.length === 0 ? (
              <p className="text-sm text-muted-foreground">Мало данных.</p>
            ) : (
              <SimpleLineChart data={d.capital} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
