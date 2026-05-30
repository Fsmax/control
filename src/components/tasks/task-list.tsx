"use client"

import { useState, useTransition } from "react"
import { CalendarPlus, CheckCircle2, Circle, Trash2 } from "lucide-react"

import { toggleDone, deleteTask, scheduleTask } from "@/server/actions/tasks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Task = {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  area: "WORK" | "PERSONAL"
  priority: "LOW" | "MEDIUM" | "HIGH"
  project_id: string | null
  scheduled_for: string | null
  due_date: string | null
}
type ProjectOpt = { id: string; name: string }
type Filter = "ALL" | "WORK" | "PERSONAL"

function TaskRow({
  task,
  projectName,
  today,
}: {
  task: Task
  projectName?: string
  today: string
}) {
  const [pending, start] = useTransition()
  const done = task.status === "DONE"
  const scheduledToday = task.scheduled_for === today

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-colors hover:border-foreground/15">
      <button
        type="button"
        disabled={pending}
        aria-label={done ? "Снять отметку" : "Отметить сделанным"}
        className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        onClick={() => start(async () => void (await toggleDone(task.id, !done)))}
      >
        {done ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : (
          <Circle className="size-5 transition-colors hover:text-success" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm", done && "text-muted-foreground line-through")}>
          {task.title}
        </div>
        <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <span>{task.area === "WORK" ? "Работа" : "Личное"}</span>
          {projectName && <span>· {projectName}</span>}
          {task.scheduled_for && <span>· план {task.scheduled_for}</span>}
          {task.due_date && <span>· дедлайн {task.due_date}</span>}
        </div>
      </div>

      {!scheduledToday && !done && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => start(async () => void (await scheduleTask(task.id, today)))}
        >
          <CalendarPlus className="size-4" /> На сегодня
        </Button>
      )}

      <button
        type="button"
        disabled={pending}
        aria-label="Удалить"
        className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        onClick={() => {
          if (confirm("Удалить задачу?"))
            start(async () => void (await deleteTask(task.id)))
        }}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

export function TaskList({
  tasks,
  projects,
  today,
}: {
  tasks: Task[]
  projects: ProjectOpt[]
  today: string
}) {
  const [filter, setFilter] = useState<Filter>("ALL")
  const names = new Map(projects.map((p) => [p.id, p.name]))
  const shown = tasks.filter((t) => filter === "ALL" || t.area === filter)

  const labels: Record<Filter, string> = {
    ALL: "Все",
    WORK: "Работа",
    PERSONAL: "Личное",
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["ALL", "WORK", "PERSONAL"] as Filter[]).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            onClick={() => setFilter(f)}
          >
            {labels[f]}
          </Button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">Задач нет.</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              projectName={t.project_id ? names.get(t.project_id) : undefined}
              today={today}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
