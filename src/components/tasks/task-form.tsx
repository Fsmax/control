"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { fromZonedTime } from "date-fns-tz"

import { createTask } from "@/server/actions/tasks"
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

type ProjectOpt = { id: string; name: string }

// "ГГГГ-ММ-ДДTчч:мм" из datetime-local → ISO в таймзоне пользователя (или null).
function toIso(local: string, tz: string): string | null {
  if (!local) return null
  return fromZonedTime(local, tz).toISOString()
}

export function TaskForm({
  projects,
  tz,
  baseCurrency,
  defaultProjectId,
  stages,
}: {
  projects: ProjectOpt[]
  tz: string
  baseCurrency: string
  defaultProjectId?: string
  stages?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [area, setArea] = useState<"WORK" | "PERSONAL">("PERSONAL")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM")
  const [projectId, setProjectId] = useState(defaultProjectId ?? "")
  const [stage, setStage] = useState("")
  const [scheduledFor, setScheduledFor] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [remindAt, setRemindAt] = useState("")
  const [isMeeting, setIsMeeting] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutCurrency, setPayoutCurrency] = useState(baseCurrency)

  function reset() {
    setTitle("")
    setDescription("")
    setArea("PERSONAL")
    setPriority("MEDIUM")
    setProjectId(defaultProjectId ?? "")
    setStage("")
    setScheduledFor("")
    setDueDate("")
    setStartAt("")
    setEndAt("")
    setRemindAt("")
    setIsMeeting(false)
    setPayoutAmount("")
    setPayoutCurrency(baseCurrency)
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    start(async () => {
      const res = await createTask({
        title,
        description: description.trim() || null,
        area,
        priority,
        project_id: projectId || null,
        stage: stage.trim() || null,
        scheduled_for: scheduledFor || null,
        due_date: dueDate || null,
        start_at: toIso(startAt, tz),
        end_at: toIso(endAt, tz),
        remind_at: toIso(remindAt, tz),
        is_meeting: isMeeting,
        payout_amount:
          payoutAmount.trim() && Number(payoutAmount) > 0 ? Number(payoutAmount) : null,
        payout_currency: payoutCurrency.trim() || null,
      })
      if (res.success) {
        reset()
        setOpen(false)
      } else {
        setError(res.error ?? "Ошибка")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Новая задача
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая задача</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название"
            autoFocus
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (необязательно)"
            rows={2}
            className={`${field} h-auto py-2`}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              Сфера
              <select
                className={field}
                value={area}
                onChange={(e) => setArea(e.target.value as "WORK" | "PERSONAL")}
              >
                <option value="PERSONAL">Личное</option>
                <option value="WORK">Работа</option>
              </select>
            </label>
            <label className="block space-y-1 text-xs text-muted-foreground">
              Приоритет
              <select
                className={field}
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")
                }
              >
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-xs text-muted-foreground">
            Проект
            <select
              className={field}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">— без проекта —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {projectId && (
            <label className="block space-y-1 text-xs text-muted-foreground">
              Этап (для группировки в проекте)
              <input
                className={field}
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="Например: 1. Системы"
                list="task-form-stages"
              />
              {stages && stages.length > 0 && (
                <datalist id="task-form-stages">
                  {stages.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              )}
            </label>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              На день
              <input
                type="date"
                className={field}
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-xs text-muted-foreground">
              Дедлайн
              <input
                type="date"
                className={field}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              Начало (время)
              <input
                type="datetime-local"
                className={field}
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-xs text-muted-foreground">
              Окончание
              <input
                type="datetime-local"
                className={field}
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs text-muted-foreground">
            Напомнить
            <input
              type="datetime-local"
              className={field}
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isMeeting}
              onChange={(e) => setIsMeeting(e.target.checked)}
            />
            Встреча
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              Выплата (за работу)
              <input
                type="number"
                min="0"
                step="0.01"
                className={field}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0"
              />
            </label>
            <label className="block space-y-1 text-xs text-muted-foreground">
              Валюта
              <input
                className={field}
                value={payoutCurrency}
                onChange={(e) => setPayoutCurrency(e.target.value)}
              />
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !title.trim()}>
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
