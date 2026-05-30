"use client"

import { useTransition } from "react"
import { formatInTimeZone } from "date-fns-tz"
import { CalendarClock, CheckCircle2, Circle, Clock, Play, Trash2, Users } from "lucide-react"

import { toggleDone, deleteTask, scheduleTask } from "@/server/actions/tasks"
import { startFocus } from "@/server/actions/focus"
import { addDaysYmd } from "@/lib/dates"
import { cn } from "@/lib/utils"

export type TaskCardData = {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  area: "WORK" | "PERSONAL"
  priority: "LOW" | "MEDIUM" | "HIGH"
  start_at: string | null
  end_at: string | null
  due_date: string | null
  is_meeting?: boolean
}

const PRIORITY: Record<
  TaskCardData["priority"],
  { label: string; dot: string; accent: string }
> = {
  HIGH: { label: "Высокий", dot: "bg-destructive", accent: "before:bg-destructive" },
  MEDIUM: { label: "Средний", dot: "bg-warning", accent: "before:bg-warning" },
  LOW: { label: "Низкий", dot: "bg-muted-foreground/40", accent: "before:bg-border" },
}

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]

function shortDate(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

function IconButton({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

export function TaskCard({
  task,
  tz,
  today,
  overdue = false,
}: {
  task: TaskCardData
  tz: string
  today: string
  overdue?: boolean
}) {
  const [pending, start] = useTransition()
  const done = task.status === "DONE"
  const p = PRIORITY[task.priority]

  const time = task.start_at ? formatInTimeZone(new Date(task.start_at), tz, "HH:mm") : null
  const timeEnd = task.end_at ? formatInTimeZone(new Date(task.end_at), tz, "HH:mm") : null

  // Перенос: просроченную — на сегодня, обычную — на завтра.
  const moveTo = overdue ? today : addDaysYmd(today, 1)
  const moveLabel = overdue ? "Перенести на сегодня" : "Перенести на завтра"

  const run = (fn: () => Promise<unknown>) => start(async () => void (await fn()))

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-xl border bg-card py-3 pl-4 pr-2.5 shadow-sm transition-all",
        "hover:border-foreground/15 hover:shadow-md",
        "before:absolute before:inset-y-2.5 before:left-0 before:w-1 before:rounded-full",
        p.accent,
        done && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={() => run(() => toggleDone(task.id, !done))}
        disabled={pending}
        className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-success disabled:opacity-50"
        aria-label={done ? "Снять отметку" : "Отметить сделанным"}
      >
        {done ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : (
          <Circle className="size-5 hover:text-success" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {task.is_meeting && (
            <span className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
              <Users className="size-3" /> Встреча
            </span>
          )}
          <span className={cn("truncate text-sm font-medium", done && "text-muted-foreground line-through")}>
            {task.title}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", p.dot)} />
            {p.label}
          </span>
          {time && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {time}
              {timeEnd && `–${timeEnd}`}
            </span>
          )}
          {task.area === "WORK" && (
            <span className="rounded bg-accent px-1.5 py-0.5 font-medium text-accent-foreground">Работа</span>
          )}
          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue && "font-medium text-destructive"
              )}
            >
              <CalendarClock className="size-3" />
              до {shortDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <IconButton title="В фокус" disabled={pending} onClick={() => run(() => startFocus(task.id, null))}>
          <Play className="size-3.5" />
        </IconButton>
        <IconButton title={moveLabel} disabled={pending} onClick={() => run(() => scheduleTask(task.id, moveTo))}>
          <CalendarClock className="size-3.5" />
        </IconButton>
        <IconButton title="Удалить" danger disabled={pending} onClick={() => run(() => deleteTask(task.id))}>
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>
    </div>
  )
}
