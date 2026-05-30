"use client"

import { useState } from "react"
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"

import { setTaskStatus } from "@/server/actions/tasks"
import { cn } from "@/lib/utils"

const COLUMNS = [
  { key: "TODO", label: "К выполнению" },
  { key: "IN_PROGRESS", label: "В работе" },
  { key: "DONE", label: "Готово" },
] as const

type Status = (typeof COLUMNS)[number]["key"]

type Priority = "LOW" | "MEDIUM" | "HIGH"

type KTask = {
  id: string
  title: string
  status: Status
  area: "WORK" | "PERSONAL"
  priority: Priority
  is_meeting?: boolean
}

const PRIORITY_ACCENT: Record<Priority, string> = {
  HIGH: "before:bg-destructive",
  MEDIUM: "before:bg-warning",
  LOW: "before:bg-border",
}

function Card({ task }: { task: KTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "relative cursor-grab touch-none rounded-lg border bg-card py-2 pl-3 pr-2.5 text-sm shadow-sm transition-shadow hover:shadow-md",
        "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full",
        PRIORITY_ACCENT[task.priority],
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <div className="truncate font-medium">{task.title}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {task.is_meeting && (
          <span className="rounded bg-accent px-1 py-0.5 text-[10px] font-medium text-accent-foreground">
            Встреча
          </span>
        )}
        {task.area === "WORK" ? (
          <span className="rounded bg-accent px-1 py-0.5 font-medium text-accent-foreground">Работа</span>
        ) : (
          <span>Личное</span>
        )}
      </div>
    </div>
  )
}

function Column({
  status,
  label,
  tasks,
}: {
  status: Status
  label: string
  tasks: KTask[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-40 flex-col gap-2 rounded-lg border bg-muted/30 p-2",
        isOver && "ring-2 ring-ring"
      )}
    >
      <div className="px-1 text-sm font-medium text-muted-foreground">
        {label} <span className="text-xs">({tasks.length})</span>
      </div>
      {tasks.map((t) => (
        <Card key={t.id} task={t} />
      ))}
    </div>
  )
}

export function KanbanBoard({ tasks: initial }: { tasks: KTask[] }) {
  const [tasks, setTasks] = useState(initial)
  // Сброс локального (оптимистичного) состояния при обновлении пропа с сервера —
  // правка state во время рендера, а не в эффекте (React docs: You Might Not Need an Effect).
  const [prevInitial, setPrevInitial] = useState(initial)
  if (initial !== prevInitial) {
    setPrevInitial(initial)
    setTasks(initial)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id)
    const over = e.over?.id
    if (!over) return
    const newStatus = over as Status
    const task = tasks.find((t) => t.id === id)
    if (!task || task.status === newStatus) return
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    )
    void setTaskStatus(id, newStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={onDragEnd}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {COLUMNS.map((c) => (
          <Column
            key={c.key}
            status={c.key}
            label={c.label}
            tasks={tasks.filter((t) => t.status === c.key)}
          />
        ))}
      </div>
    </DndContext>
  )
}
