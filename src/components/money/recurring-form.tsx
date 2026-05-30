"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { createRecurring } from "@/server/actions/recurring"
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

export function RecurringForm({ baseCurrency }: { baseCurrency: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("EXPENSE")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(baseCurrency)
  const [period, setPeriod] = useState<"WEEKLY" | "MONTHLY" | "YEARLY">("MONTHLY")
  const [nextDate, setNextDate] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!name.trim() || !(amt > 0) || !nextDate) return
    start(async () => {
      const res = await createRecurring({
        name,
        kind,
        amount: amt,
        currency,
        period,
        next_date: nextDate,
      })
      if (res.success) {
        setName("")
        setKind("EXPENSE")
        setAmount("")
        setCurrency(baseCurrency)
        setPeriod("MONTHLY")
        setNextDate("")
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
        <Plus className="size-4" /> Новый платёж
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Регулярный доход/расход</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (напр. «Аренда»)"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              Тип
              <select
                className={field}
                value={kind}
                onChange={(e) => setKind(e.target.value as "INCOME" | "EXPENSE")}
              >
                <option value="EXPENSE">Расход</option>
                <option value="INCOME">Доход</option>
              </select>
            </label>
            <label className="block space-y-1 text-xs text-muted-foreground">
              Период
              <select
                className={field}
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value as "WEEKLY" | "MONTHLY" | "YEARLY")
                }
              >
                <option value="WEEKLY">Еженедельно</option>
                <option value="MONTHLY">Ежемесячно</option>
                <option value="YEARLY">Ежегодно</option>
              </select>
            </label>
          </div>
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
            Ближайшая дата
            <input
              type="date"
              className={field}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="submit"
              disabled={pending || !name.trim() || !(Number(amount) > 0) || !nextDate}
            >
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
