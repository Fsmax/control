"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"

import { addDaysYmd } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Priority = "LOW" | "MEDIUM" | "HIGH"

type TTask = {
  id: string
  title: string
  area: "WORK" | "PERSONAL"
  priority: Priority
  is_meeting: boolean
  start_at: string | null
  end_at: string | null
  scheduled_for: string | null
}

const PRIORITY_ACCENT: Record<Priority, string> = {
  HIGH: "before:bg-destructive",
  MEDIUM: "before:bg-warning",
  LOW: "before:bg-border",
}

const WEEKDAYS = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"]
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

function humanDay(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  return `${WEEKDAYS[dt.getUTCDay()]}, ${d} ${MONTHS_SHORT[m - 1]}`
}

function AreaBadges({ task }: { task: TTask }) {
  return (
    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
      {task.is_meeting && (
        <span className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
          <Users className="size-3" /> Встреча
        </span>
      )}
      {task.area === "WORK" ? (
        <span className="rounded bg-accent px-1.5 py-0.5 font-medium text-accent-foreground">Работа</span>
      ) : (
        <span>Личное</span>
      )}
    </div>
  )
}

export function TimelineView({
  tasks,
  today,
  tz,
}: {
  tasks: TTask[]
  today: string
  tz: string
}) {
  const [day, setDay] = useState(today)

  const timed = tasks
    .filter((t) => t.start_at && formatInTimeZone(new Date(t.start_at), tz, "yyyy-MM-dd") === day)
    .sort((a, b) => (a.start_at! < b.start_at! ? -1 : 1))

  const untimed = tasks.filter((t) => !t.start_at && t.scheduled_for === day)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-1">
        <Button variant="ghost" size="sm" onClick={() => setDay(addDaysYmd(day, -1))} aria-label="Назад">
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-sm font-medium first-letter:uppercase">
          {humanDay(day)}
          {day === today && <span className="ml-1.5 text-xs text-primary">· сегодня</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDay(addDaysYmd(day, 1))} aria-label="Вперёд">
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {timed.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Нет дел со временем на этот день.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {timed.map((t) => (
            <li
              key={t.id}
              className={cn(
                "relative flex gap-3 rounded-xl border bg-card py-2.5 pl-4 pr-3 shadow-sm",
                "before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-full",
                PRIORITY_ACCENT[t.priority]
              )}
            >
              <div className="w-16 shrink-0 tabular-nums">
                <div className="text-sm font-semibold">{formatInTimeZone(new Date(t.start_at!), tz, "HH:mm")}</div>
                {t.end_at && (
                  <div className="text-xs text-muted-foreground">
                    {formatInTimeZone(new Date(t.end_at), tz, "HH:mm")}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 border-l pl-3">
                <div className="truncate text-sm font-medium">{t.title}</div>
                <AreaBadges task={t} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {untimed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Без времени</div>
          <ul className="space-y-2">
            {untimed.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "relative rounded-xl border bg-card/60 py-2.5 pl-4 pr-3 shadow-sm",
                  "before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-full",
                  PRIORITY_ACCENT[t.priority]
                )}
              >
                <div className="truncate text-sm font-medium">{t.title}</div>
                <AreaBadges task={t} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
