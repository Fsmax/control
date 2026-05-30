import { getToday } from "@/server/queries/today"
import { DayProgress } from "@/components/today/day-progress"
import { StreakBadge } from "@/components/today/streak-badge"
import { AddTask } from "@/components/today/add-task"
import { TodayList } from "@/components/today/today-list"

const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"]
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"]

function humanDate(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return `${WEEKDAYS[dt.getUTCDay()]}, ${d} ${MONTHS[m - 1]}`
}

export default async function TodayPage() {
  const data = await getToday()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Сегодня</h1>
          <p className="text-sm capitalize text-muted-foreground">
            {humanDate(data.today)}
          </p>
        </div>
        <StreakBadge
          current={data.streak.current}
          dayGoal={data.dayGoal}
          doneToday={data.doneToday}
        />
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <DayProgress done={data.progress.done} total={data.progress.total} />
      </div>

      <AddTask today={data.today} />
      <TodayList tasks={data.planned} overdue={data.overdue} />
    </div>
  )
}
