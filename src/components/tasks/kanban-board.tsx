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

type KTask = {
  id: string
  title: string
  status: Status
  area: "WORK" | "PERSONAL"
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
        "cursor-grab touch-none rounded-md border bg-card px-3 py-2 text-sm shadow-xs",
        isDragging && "opacity-50"
      )}
    >
      <div className="truncate">{task.title}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        {task.area === "WORK" ? "Работа" : "Личное"}
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
