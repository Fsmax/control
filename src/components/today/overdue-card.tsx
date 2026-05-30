"use client"

import { useTransition } from "react"
import { AlertTriangle, CalendarArrowUp } from "lucide-react"

import { scheduleTask } from "@/server/actions/tasks"
import { TaskCard, type TaskCardData } from "@/components/today/task-card"

export function OverdueCard({
  tasks,
  tz,
  today,
}: {
  tasks: TaskCardData[]
  tz: string
  today: string
}) {
  const [pending, start] = useTransition()
  if (tasks.length === 0) return null

  function moveAllToToday() {
    start(async () => {
      await Promise.all(tasks.map((t) => scheduleTask(t.id, today)))
    })
  }

  return (
    <section className="space-y-2.5 rounded-2xl border border-destructive/25 bg-destructive/[0.03] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="size-4" />
          Просрочено
          <span className="rounded-full bg-destructive/10 px-1.5 text-xs tabular-nums">{tasks.length}</span>
        </h2>
        <button
          type="button"
          onClick={moveAllToToday}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-card px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <CalendarArrowUp className="size-3.5" />
          Перенести всё на сегодня
        </button>
      </div>

      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} tz={tz} today={today} overdue />
          </li>
        ))}
      </ul>
    </section>
  )
}
