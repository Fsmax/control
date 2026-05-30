"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskList } from "@/components/tasks/task-list"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { TimelineView } from "@/components/tasks/timeline-view"

type View = "list" | "kanban" | "timeline"

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
  const [view, setView] = useState<View>("list")

  const tabs: { key: View; label: string }[] = [
    { key: "list", label: "Список" },
    { key: "kanban", label: "Канбан" },
    { key: "timeline", label: "Таймлайн" },
  ]

  return (
    <div className="space-y-4">
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

      {view === "list" && <TaskList tasks={tasks} projects={projects} today={today} />}
      {view === "kanban" && <KanbanBoard tasks={tasks} />}
      {view === "timeline" && <TimelineView tasks={tasks} today={today} tz={tz} />}
    </div>
  )
}
