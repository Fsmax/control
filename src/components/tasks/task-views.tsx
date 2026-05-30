"use client"

import { useState } from "react"
import { ListChecks, ListTodo, AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskTable } from "@/components/tasks/task-table"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { TimelineView } from "@/components/tasks/timeline-view"

type View = "table" | "kanban" | "timeline"

type Task = {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  area: "WORK" | "PERSONAL"
  priority: "LOW" | "MEDIUM" | "HIGH"
  project_id: string | null
  scheduled_for: string | null
  due_date: string | null
  is_meeting: boolean
  start_at: string | null
  end_at: string | null
}
type ProjectOpt = { id: string; name: string }

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: number
  tone?: "danger" | "success"
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          tone === "danger"
            ? "bg-destructive/10 text-destructive"
            : tone === "success"
              ? "bg-success/10 text-success"
              : "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            "text-xl font-semibold tabular-nums leading-none",
            tone === "danger" && value > 0 && "text-destructive"
          )}
        >
          {value}
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

export function TaskViews({
  tasks,
  projects,
  today,
  tz,
  baseCurrency,
}: {
  tasks: Task[]
  projects: ProjectOpt[]
  today: string
  tz: string
  baseCurrency: string
}) {
  const [view, setView] = useState<View>("table")

  const total = tasks.length
  const active = tasks.filter((t) => t.status !== "DONE").length
  const overdue = tasks.filter(
    (t) =>
      t.status !== "DONE" &&
      ((t.due_date && t.due_date < today) || (t.scheduled_for && t.scheduled_for < today))
  ).length
  const done = tasks.filter((t) => t.status === "DONE").length

  const tabs: { key: View; label: string }[] = [
    { key: "table", label: "Таблица" },
    { key: "kanban", label: "Канбан" },
    { key: "timeline", label: "Таймлайн" },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={ListChecks} label="Всего задач" value={total} />
        <Kpi icon={ListTodo} label="Активные" value={active} />
        <Kpi icon={AlertTriangle} label="Просрочено" value={overdue} tone="danger" />
        <Kpi icon={CheckCircle2} label="Выполнено" value={done} tone="success" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {tabs.map((t) => (
            <Button
              key={t.key}
              size="sm"
              variant={view === t.key ? "default" : "ghost"}
              onClick={() => setView(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
        <TaskForm projects={projects} tz={tz} baseCurrency={baseCurrency} />
      </div>

      {view === "table" && <TaskTable tasks={tasks} projects={projects} today={today} />}
      {view === "kanban" && <KanbanBoard tasks={tasks} />}
      {view === "timeline" && <TimelineView tasks={tasks} today={today} tz={tz} />}
    </div>
  )
}
