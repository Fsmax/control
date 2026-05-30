"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { createDebt } from "@/server/actions/debts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const field =
  "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

export function DebtForm({ baseCurrency }: { baseCurrency: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<"OWED_TO_ME" | "I_OWE">("OWED_TO_ME")
  const [counterparty, setCounterparty] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(baseCurrency)
  const [dueDate, setDueDate] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!counterparty.trim() || !(amt > 0)) return
    start(async () => {
      const res = await createDebt({
        direction,
        counterparty,
        amount: amt,
        currency,
        due_date: dueDate || null,
      })
      if (res.success) {
        setCounterparty("")
        setAmount("")
        setCurrency(baseCurrency)
        setDueDate("")
        setDirection("OWED_TO_ME")
        setError(null)
        setOpen(false)
      } else {
        setError(res.error ?? "Ошибка")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Новый долг
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый долг</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1 text-xs text-muted-foreground">
            Тип
            <select
              className={field}
              value={direction}
              onChange={(e) => setDirection(e.target.value as "OWED_TO_ME" | "I_OWE")}
            >
              <option value="OWED_TO_ME">Мне должны</option>
              <option value="I_OWE">Я должен</option>
            </select>
          </label>
          <Input
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="Кто (имя)"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              Сумма
              <input
                type="number"
                min="0"
                step="0.01"
                className={field}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-xs text-muted-foreground">
              Валюта
              <input
                className={field}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-muted-foreground">
            Срок (необязательно)
            <input
              type="date"
              className={field}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !counterparty.trim() || !(Number(amount) > 0)}>
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
