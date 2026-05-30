"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatInTimeZone } from "date-fns-tz"

import { addDaysYmd } from "@/lib/dates"
import { Button } from "@/components/ui/button"

type TTask = {
  id: string
  title: string
  area: "WORK" | "PERSONAL"
  is_meeting: boolean
  start_at: string | null
  end_at: string | null
  scheduled_for: string | null
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
    .filter(
      (t) =>
        t.start_at &&
        formatInTimeZone(new Date(t.start_at), tz, "yyyy-MM-dd") === day
    )
    .sort((a, b) => (a.start_at! < b.start_at! ? -1 : 1))

  const untimed = tasks.filter((t) => !t.start_at && t.scheduled_for === day)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setDay(addDaysYmd(day, -1))}>
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-sm font-medium">
          {day}
          {day === today && " · сегодня"}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setDay(addDaysYmd(day, 1))}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {timed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет дел со временем на этот день.</p>
      ) : (
        <ul className="space-y-2">
          {timed.map((t) => (
            <li key={t.id} className="flex gap-3 rounded-md border px-3 py-2 text-sm">
              <span className="w-28 shrink-0 tabular-nums text-muted-foreground">
                {formatInTimeZone(new Date(t.start_at!), tz, "HH:mm")}
                {t.end_at && `–${formatInTimeZone(new Date(t.end_at), tz, "HH:mm")}`}
              </span>
              <span className="flex-1 truncate">
                {t.title}
                {t.is_meeting && " · встреча"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {untimed.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Без времени</div>
          <ul className="space-y-2">
            {untimed.map((t) => (
              <li key={t.id} className="rounded-md border px-3 py-2 text-sm">
                {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
