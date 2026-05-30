"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { addPayment, deleteDebt } from "@/server/actions/debts"
import { formatMoney } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Debt = {
  id: string
  direction: "OWED_TO_ME" | "I_OWE"
  counterparty: string
  amount: number
  currency: string
  due_date: string | null
  status: "OPEN" | "CLOSED"
  outstanding: number
}

const payField =
  "h-8 w-24 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"

function DebtRow({ debt }: { debt: Debt }) {
  const [pending, start] = useTransition()
  const [pay, setPay] = useState("")
  const closed = debt.status === "CLOSED" || debt.outstanding <= 0.0001

  return (
    <li className="space-y-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{debt.counterparty}</div>
          <div className="text-xs text-muted-foreground tabular-nums">
            Остаток {formatMoney(debt.outstanding, debt.currency)} из{" "}
            {formatMoney(Number(debt.amount), debt.currency)}
            {debt.due_date && ` · срок ${debt.due_date}`}
          </div>
        </div>
        {closed ? (
          <Badge variant="secondary">погашен</Badge>
        ) : (
          <Badge variant="outline">открыт</Badge>
        )}
        <button
          type="button"
          disabled={pending}
          aria-label="Удалить"
          className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
          onClick={() => {
            if (confirm("Удалить долг?"))
              start(async () => void (await deleteDebt(debt.id)))
          }}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {!closed && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            className={payField}
            placeholder="Сумма"
            value={pay}
            onChange={(e) => setPay(e.target.value)}
          />
          <Button
            size="sm"
            variant="ghost"
            disabled={pending || !(Number(pay) > 0)}
            onClick={() =>
              start(async () => {
                const res = await addPayment({ debt_id: debt.id, amount: Number(pay) })
                if (res.success) setPay("")
              })
            }
          >
            Внести платёж
          </Button>
        </div>
      )}
    </li>
  )
}

export function DebtList({ debts }: { debts: Debt[] }) {
  const owedToMe = debts.filter((d) => d.direction === "OWED_TO_ME")
  const iOwe = debts.filter((d) => d.direction === "I_OWE")

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-success">Мне должны</h2>
        {owedToMe.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пусто.</p>
        ) : (
          <ul className="space-y-2">
            {owedToMe.map((d) => (
              <DebtRow key={d.id} debt={d} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-destructive">Я должен</h2>
        {iOwe.length === 0 ? (
          <p className="text-sm text-muted-foreground">Пусто.</p>
        ) : (
          <ul className="space-y-2">
            {iOwe.map((d) => (
              <DebtRow key={d.id} debt={d} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
