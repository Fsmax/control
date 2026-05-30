"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { createDeal, updateDeal } from "@/server/actions/deals"
import { DEAL_STAGE } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fieldClass, Field } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Stage = "LEAD" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST"

type DealLike = {
  id: string
  title: string
  client_id: string | null
  stage: Stage
  amount: number
  currency: string
  expected_close_date: string | null
}

const STAGE_ORDER: Stage[] = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]

export function DealForm({
  clients,
  deal,
  lockedClientId,
  baseCurrency = "UZS",
  trigger,
  defaultOpen = false,
}: {
  clients: { id: string; name: string }[]
  deal?: DealLike
  lockedClientId?: string
  baseCurrency?: string
  trigger?: React.ReactElement
  defaultOpen?: boolean
}) {
  const router = useRouter()
  const editing = !!deal
  const [open, setOpen] = useState(defaultOpen)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(deal?.title ?? "")
  const [clientId, setClientId] = useState(deal?.client_id ?? lockedClientId ?? "")
  const [stage, setStage] = useState<Stage>(deal?.stage ?? "LEAD")
  const [amount, setAmount] = useState(deal ? String(deal.amount) : "")
  const [currency, setCurrency] = useState(deal?.currency ?? baseCurrency)
  const [closeDate, setCloseDate] = useState(deal?.expected_close_date ?? "")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    start(async () => {
      const payload = {
        title,
        client_id: clientId || null,
        stage,
        amount: Number(amount) || 0,
        currency,
        expected_close_date: closeDate || null,
      }
      const res = editing ? await updateDeal({ id: deal!.id, ...payload }) : await createDeal(payload)
      if (res.success) {
        setError(null)
        setOpen(false)
        if (!editing) {
          setTitle("")
          setAmount("")
          router.refresh()
        }
      } else {
        setError(res.error ?? "Ошибка")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="size-4" /> Новая сделка
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Редактировать сделку" : "Новая сделка"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Название">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Монтаж системы вентиляции" autoFocus />
          </Field>
          {!lockedClientId && (
            <Field label="Клиент">
              <select className={fieldClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— без клиента —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Этап">
            <select className={fieldClass} value={stage} onChange={(e) => setStage(e.target.value as Stage)}>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {DEAL_STAGE[s].label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Сумма">
              <input type="number" min="0" step="0.01" className={fieldClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Валюта">
              <input className={fieldClass} value={currency} onChange={(e) => setCurrency(e.target.value)} />
            </Field>
          </div>
          <Field label="Ожидаемое закрытие" hint="(необязательно)">
            <input type="date" className={fieldClass} value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !title.trim()}>
              {editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
