"use client"

import { useState } from "react"
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Play,
  Trash2,
  Users,
} from "lucide-react"

import { toggleDone, deleteTask, scheduleTask } from "@/server/actions/tasks"
import { startFocus } from "@/server/actions/focus"
import { addDaysYmd } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { TaskCardData } from "@/components/today/task-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type Task = TaskCardData & { project_id: string | null }
type ProjectOpt = { id: string; name: string }
type AreaFilter = "ALL" | "WORK" | "PERSONAL"
type StatusFilter = "ACTIVE" | "ALL" | "DONE"

const PRIORITY: Record<Task["priority"], { label: string; dot: string; border: string }> = {
  HIGH: { label: "Высокий", dot: "bg-destructive", border: "border-l-destructive" },
  MEDIUM: { label: "Средний", dot: "bg-warning", border: "border-l-warning" },
  LOW: { label: "Низкий", dot: "bg-muted-foreground/40", border: "border-l-transparent" },
}
const PRIORITY_RANK: Record<Task["priority"], number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"]
function shortDate(ymd: string): string {
  const [, m, d] = ymd.split("-").map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { key: T; label: string }[]
}) {
  return (
    <div className="inline-flex gap-1 rounded-lg border bg-muted/40 p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
            value === o.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function IconButton({
  title,
  onClick,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent",
        danger ? "hover:bg-destructive/10 hover:text-destructive" : "hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Row({
  task,
  projectName,
  today,
}: {
  task: Task
  projectName?: string
  today: string
}) {
  const done = task.status === "DONE"
  const p = PRIORITY[task.priority]
  const scheduledToday = task.scheduled_for === today
  const moveTo = scheduledToday ? addDaysYmd(today, 1) : today
  const moveLabel = scheduledToday ? "Перенести на завтра" : "Запланировать на сегодня"
  const MoveIcon = scheduledToday ? CalendarClock : CalendarPlus

  const schedOverdue = !!task.scheduled_for && task.scheduled_for < today && !done
  const dueOverdue = !!task.due_date && task.due_date < today && !done

  return (
    <TableRow className={cn("group", done && "opacity-60")}>
      <TableCell className={cn("border-l-2 pl-3", p.border)}>
        <button
          type="button"
          onClick={() => void toggleDone(task.id, !done)}
          className="block text-muted-foreground transition-colors hover:text-success"
          aria-label={done ? "Снять отметку" : "Отметить сделанным"}
        >
          {done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5" />}
        </button>
      </TableCell>

      <TableCell className="max-w-[28rem]">
        <div className="flex items-center gap-1.5">
          {task.is_meeting && (
            <span className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
              <Users className="size-3" /> Встреча
            </span>
          )}
          <span className={cn("truncate font-medium", done && "text-muted-foreground line-through")}>
            {task.title}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span className={cn("size-2 rounded-full", p.dot)} />
          {p.label}
        </span>
      </TableCell>

      <TableCell>
        {task.area === "WORK" ? (
          <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
            Работа
          </span>
        ) : (
          <span className="text-muted-foreground">Личное</span>
        )}
      </TableCell>

      <TableCell className="max-w-[12rem] truncate text-muted-foreground">
        {projectName ?? "—"}
      </TableCell>

      <TableCell className="tabular-nums">
        {!task.scheduled_for ? (
          <span className="text-muted-foreground">—</span>
        ) : scheduledToday ? (
          <span className="font-medium text-primary">сегодня</span>
        ) : (
          <span className={cn(schedOverdue && "font-medium text-destructive")}>
            {shortDate(task.scheduled_for)}
          </span>
        )}
      </TableCell>

      <TableCell className="tabular-nums">
        {!task.due_date ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className={cn(dueOverdue && "font-medium text-destructive")}>
            {shortDate(task.due_date)}
          </span>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
          <IconButton title="В фокус" onClick={() => void startFocus(task.id, null)}>
            <Play className="size-3.5" />
          </IconButton>
          <IconButton title={moveLabel} onClick={() => void scheduleTask(task.id, moveTo)}>
            <MoveIcon className="size-3.5" />
          </IconButton>
          <IconButton title="Удалить" danger onClick={() => void deleteTask(task.id)}>
            <Trash2 className="size-3.5" />
          </IconButton>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function TaskTable({
  tasks,
  projects,
  today,
}: {
  tasks: Task[]
  projects: ProjectOpt[]
  today: string
}) {
  const [area, setArea] = useState<AreaFilter>("ALL")
  const [status, setStatus] = useState<StatusFilter>("ACTIVE")
  const names = new Map(projects.map((p) => [p.id, p.name]))

  const shown = tasks
    .filter((t) => area === "ALL" || t.area === area)
    .filter((t) =>
      status === "ALL" ? true : status === "DONE" ? t.status === "DONE" : t.status !== "DONE"
    )
    .sort((a, b) => {
      const ad = a.status === "DONE" ? 1 : 0
      const bd = b.status === "DONE" ? 1 : 0
      if (ad !== bd) return ad - bd
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={area}
          onChange={setArea}
          options={[
            { key: "ALL", label: "Все" },
            { key: "WORK", label: "Работа" },
            { key: "PERSONAL", label: "Личное" },
          ]}
        />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { key: "ACTIVE", label: "Активные" },
            { key: "ALL", label: "Все" },
            { key: "DONE", label: "Сделано" },
          ]}
        />
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{shown.length} задач</span>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead>Задача</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead>Сфера</TableHead>
              <TableHead>Проект</TableHead>
              <TableHead>План</TableHead>
              <TableHead>Дедлайн</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Задач нет.
                </TableCell>
              </TableRow>
            ) : (
              shown.map((t) => (
                <Row
                  key={t.id}
                  task={t}
                  projectName={t.project_id ? names.get(t.project_id) : undefined}
                  today={today}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
