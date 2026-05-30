"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { createInvoice, updateInvoice } from "@/server/actions/invoices"
import { INVOICE_STATUS } from "@/components/ui/status-badge"
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

type Status = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"

type InvoiceLike = {
  id: string
  number: string
  client_id: string | null
  deal_id: string | null
  issue_date: string
  due_date: string | null
  amount: number
  currency: string
  status: Status
  note: string | null
}

const STATUS_ORDER: Status[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"]

export function InvoiceForm({
  clients,
  deals,
  invoice,
  lockedClientId,
  baseCurrency = "UZS",
  trigger,
  defaultOpen = false,
}: {
  clients: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  invoice?: InvoiceLike
  lockedClientId?: string
  baseCurrency?: string
  trigger?: React.ReactElement
  defaultOpen?: boolean
}) {
  const router = useRouter()
  const editing = !!invoice
  const [open, setOpen] = useState(defaultOpen)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [number, setNumber] = useState(invoice?.number ?? "")
  const [clientId, setClientId] = useState(invoice?.client_id ?? lockedClientId ?? "")
  const [dealId, setDealId] = useState(invoice?.deal_id ?? "")
  const [issueDate, setIssueDate] = useState(invoice?.issue_date ?? "")
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? "")
  const [amount, setAmount] = useState(invoice ? String(invoice.amount) : "")
  const [currency, setCurrency] = useState(invoice?.currency ?? baseCurrency)
  const [status, setStatus] = useState<Status>(invoice?.status ?? "DRAFT")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!number.trim() || !(amt > 0)) return
    start(async () => {
      const payload = {
        number,
        client_id: clientId || null,
        deal_id: dealId || null,
        issue_date: issueDate || undefined,
        due_date: dueDate || null,
        amount: amt,
        currency,
        status,
      }
      const res = editing ? await updateInvoice({ id: invoice!.id, ...payload }) : await createInvoice(payload)
      if (res.success) {
        setError(null)
        setOpen(false)
        if (!editing) {
          setNumber("")
          setAmount("")
        }
        router.refresh()
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
              <Plus className="size-4" /> Новый счёт
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Редактировать счёт" : "Новый счёт"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Номер">
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="2026-001" autoFocus />
            </Field>
            <Field label="Статус">
              <select className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {INVOICE_STATUS[s].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
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
          <Field label="Сделка" hint="(необязательно)">
            <select className={fieldClass} value={dealId} onChange={(e) => setDealId(e.target.value)}>
              <option value="">— без сделки —</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Выставлен">
              <input type="date" className={fieldClass} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </Field>
            <Field label="Срок оплаты">
              <input type="date" className={fieldClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !number.trim() || !(Number(amount) > 0)}>
              {editing ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
