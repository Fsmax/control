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

import { setDealStage } from "@/server/actions/deals"
import { cn, formatMoneyShort, primaryAmount } from "@/lib/utils"

type Stage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST"

export type BoardDeal = {
  id: string
  title: string
  stage: Stage
  amount: number
  currency: string
  clientName: string | null
}

const COLUMNS: { key: Stage; label: string; accent: string }[] = [
  { key: "LEAD", label: "Лид", accent: "border-t-muted-foreground/40" },
  { key: "QUALIFIED", label: "Квалификация", accent: "border-t-primary/50" },
  { key: "PROPOSAL", label: "КП / Смета", accent: "border-t-primary/70" },
  { key: "NEGOTIATION", label: "Переговоры", accent: "border-t-warning/70" },
  { key: "WON", label: "Выиграна", accent: "border-t-success/70" },
  { key: "LOST", label: "Проиграна", accent: "border-t-destructive/60" },
]

function Card({ deal }: { deal: BoardDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
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
        "cursor-grab touch-none rounded-lg border bg-card p-2.5 text-sm shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50 shadow-md"
      )}
    >
      <div className="truncate font-medium">{deal.title}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-muted-foreground">{deal.clientName ?? "без клиента"}</span>
        {deal.amount > 0 && (
          <span className="shrink-0 text-xs font-medium tabular-nums">
            {formatMoneyShort(deal.amount, deal.currency)}
          </span>
        )}
      </div>
    </div>
  )
}

function Column({ stage, label, accent, deals }: { stage: Stage; label: string; accent: string; deals: BoardDeal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const sum = primaryAmount(
    deals.map((d) => ({ currency: d.currency, amount: d.amount })).reduce<{ currency: string; amount: number }[]>((acc, x) => {
      const f = acc.find((a) => a.currency === x.currency)
      if (f) f.amount += x.amount
      else acc.push({ ...x })
      return acc
    }, [])
  )

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-t-2 bg-muted/30 p-2",
        accent,
        isOver && "ring-2 ring-ring"
      )}
    >
      <div className="px-1">
        <div className="flex items-center justify-between text-sm font-medium">
          <span>{label}</span>
          <span className="text-xs text-muted-foreground">({deals.length})</span>
        </div>
        {deals.length > 0 && (
          <div className="text-xs text-muted-foreground tabular-nums">
            {formatMoneyShort(sum.amount, sum.currency)}
          </div>
        )}
      </div>
      {deals.map((d) => (
        <Card key={d.id} deal={d} />
      ))}
    </div>
  )
}

export function DealBoard({ deals: initial }: { deals: BoardDeal[] }) {
  const [deals, setDeals] = useState(initial)
  const [prevInitial, setPrevInitial] = useState(initial)
  if (initial !== prevInitial) {
    setPrevInitial(initial)
    setDeals(initial)
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id)
    const over = e.over?.id
    if (!over) return
    const newStage = over as Stage
    const deal = deals.find((d) => d.id === id)
    if (!deal || deal.stage === newStage) return
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage: newStage } : d)))
    void setDealStage(id, newStage)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((c) => (
          <Column
            key={c.key}
            stage={c.key}
            label={c.label}
            accent={c.accent}
            deals={deals.filter((d) => d.stage === c.key)}
          />
        ))}
      </div>
    </DndContext>
  )
}
