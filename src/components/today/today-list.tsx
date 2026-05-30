"use client"

import { useTransition } from "react"
import { CheckCircle2, Circle, Trash2 } from "lucide-react"

import { toggleDone, deleteTask } from "@/server/actions/tasks"
import { cn } from "@/lib/utils"

type TaskItem = {
  id: string
  title: string
  status: "TODO" | "IN_PROGRESS" | "DONE"
  area: "WORK" | "PERSONAL"
  scheduled_for: string | null
}

function TaskRow({ task }: { task: TaskItem }) {
  const [pending, start] = useTransition()
  const done = task.status === "DONE"

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-colors hover:border-foreground/15">
      <button
        type="button"
        onClick={() => start(async () => void (await toggleDone(task.id, !done)))}
        disabled={pending}
        className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        aria-label={done ? "Снять отметку" : "Отметить сделанным"}
      >
        {done ? (
          <CheckCircle2 className="size-5 text-success" />
        ) : (
          <Circle className="size-5 transition-colors hover:text-success" />
        )}
      </button>

      <span className={cn("flex-1 text-sm", done && "text-muted-foreground line-through")}>
        {task.title}
      </span>

      {task.area === "WORK" && (
        <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
          Работа
        </span>
      )}

      <button
        type="button"
        onClick={() => {
          if (confirm("Удалить задачу?"))
            start(async () => void (await deleteTask(task.id)))
        }}
        disabled={pending}
        className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        aria-label="Удалить"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

export function TodayList({
  tasks,
  overdue,
}: {
  tasks: TaskItem[]
  overdue: TaskItem[]
}) {
  return (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            Просрочено
            <span className="rounded-full bg-destructive/10 px-1.5 text-xs tabular-nums">
              {overdue.length}
            </span>
          </h2>
          <ul className="space-y-2">
            {overdue.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">План на день</h2>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Пока пусто. Добавьте 3–5 дел на сегодня.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
