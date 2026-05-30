"use client"

import { useTransition } from "react"
import { Check, Trash2 } from "lucide-react"

import { markRecurringPaid, deleteRecurring } from "@/server/actions/recurring"
import { cn, formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Recurring = {
  id: string
  name: string
  kind: "INCOME" | "EXPENSE"
  amount: number
  currency: string
  period: "WEEKLY" | "MONTHLY" | "YEARLY"
  next_date: string
}

const PERIOD_LABEL: Record<Recurring["period"], string> = {
  WEEKLY: "еженедельно",
  MONTHLY: "ежемесячно",
  YEARLY: "ежегодно",
}

function RecurringRow({ item }: { item: Recurring }) {
  const [pending, start] = useTransition()
  const income = item.kind === "INCOME"

  return (
    <li className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.name}</div>
        <div className="text-xs text-muted-foreground">
          {PERIOD_LABEL[item.period]} · {item.next_date}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          income ? "text-success" : "text-destructive"
        )}
      >
        {income ? "+" : "−"}
        {formatMoney(Number(item.amount), item.currency)}
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        title="Отметить за период (сдвинуть дату)"
        onClick={() => start(async () => void (await markRecurringPaid(item.id)))}
      >
        <Check className="size-4" /> Отметить
      </Button>
      <button
        type="button"
        disabled={pending}
        aria-label="Удалить"
        className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        onClick={() => {
          if (confirm("Удалить платёж?"))
            start(async () => void (await deleteRecurring(item.id)))
        }}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

export function RecurringList({ items }: { items: Recurring[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Регулярных платежей нет.</p>
  }
  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <RecurringRow key={r.id} item={r} />
      ))}
    </ul>
  )
}
