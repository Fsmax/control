"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { logActivity } from "@/server/actions/activities"
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

type ActType = "CALL" | "MEETING" | "EMAIL" | "NOTE"

export function ActivityForm({
  clientId,
  deals,
  trigger,
}: {
  clientId: string
  deals: { id: string; title: string }[]
  trigger?: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<ActType>("CALL")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [dealId, setDealId] = useState("")
  const [when, setWhen] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return
    start(async () => {
      const res = await logActivity({
        client_id: clientId,
        deal_id: dealId || null,
        type,
        subject,
        body: body || null,
        occurred_at: when ? new Date(when).toISOString() : undefined,
      })
      if (res.success) {
        setSubject("")
        setBody("")
        setWhen("")
        setType("CALL")
        setDealId("")
        setError(null)
        setOpen(false)
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
            <Button size="sm">
              <Plus className="size-4" /> Активность
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Записать активность</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Тип">
              <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value as ActType)}>
                <option value="CALL">Звонок</option>
                <option value="MEETING">Встреча</option>
                <option value="EMAIL">Письмо</option>
                <option value="NOTE">Заметка</option>
              </select>
            </Field>
            <Field label="Когда" hint="(необязательно)">
              <input type="datetime-local" className={fieldClass} value={when} onChange={(e) => setWhen(e.target.value)} />
            </Field>
          </div>
          <Field label="Тема">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Согласовали смету" autoFocus />
          </Field>
          {deals.length > 0 && (
            <Field label="Сделка" hint="(необязательно)">
              <select className={fieldClass} value={dealId} onChange={(e) => setDealId(e.target.value)}>
                <option value="">— не привязывать —</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Детали">
            <textarea className={`${fieldClass} h-auto py-2`} rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !subject.trim()}>
              Записать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
