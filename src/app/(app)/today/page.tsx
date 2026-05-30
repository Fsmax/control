import { getToday } from "@/server/queries/today"
import { PageHeader } from "@/components/ui/page-header"
import { DayHero } from "@/components/today/day-hero"
import { TaskCard } from "@/components/today/task-card"
import { OverdueCard } from "@/components/today/overdue-card"
import { AddTask } from "@/components/today/add-task"

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
    <div className="space-y-6">
      <PageHeader title="Сегодня" description="Выберите 3–5 дел и закройте их за день" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AddTask today={data.today} />

          <OverdueCard tasks={data.overdue} tz={data.tz} today={data.today} />

          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">План на день</h2>
            {data.planned.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card/50 px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">Пока пусто. Добавьте 3–5 дел на сегодня.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {data.planned.map((t) => (
                  <li key={t.id}>
                    <TaskCard task={t} tz={data.tz} today={data.today} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <DayHero
            date={humanDate(data.today)}
            doneToday={data.doneToday}
            dayGoal={data.dayGoal}
            planned={data.planned.length}
            plannedDone={data.progress.done}
            streak={data.streak.current}
          />
        </div>
      </div>
    </div>
  )
}
