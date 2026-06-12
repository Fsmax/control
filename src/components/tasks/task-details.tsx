"use client"

import { useEffect, useState, useTransition } from "react"
import { Download, Loader2, Paperclip, Trash2 } from "lucide-react"

import { updateTask } from "@/server/actions/tasks"
import {
  addChecklistItem,
  attachmentUrl,
  deleteAttachment,
  deleteChecklistItem,
  getTaskExtras,
  toggleChecklistItem,
  uploadAttachment,
  type TaskExtras,
} from "@/server/actions/task-extras"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fieldClass, Field } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Result = { success: boolean; error?: string }

function formatBytes(size: number | null): string {
  if (!size) return ""
  if (size < 1024) return `${size} Б`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} КБ`
  return `${(size / 1024 / 1024).toFixed(1)} МБ`
}

/** Детали задачи: этап, чек-лист и вложения. Данные подгружаются при открытии. */
export function TaskDetails({
  task,
  trigger,
}: {
  task: { id: string; title: string; stage?: string | null }
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [extras, setExtras] = useState<TaskExtras | null>(null)
  const [stage, setStage] = useState(task.stage ?? "")
  const [newItem, setNewItem] = useState("")
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    void getTaskExtras(task.id).then((d) => {
      if (active) setExtras(d)
    })
    return () => {
      active = false
    }
  }, [open, task.id])

  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      const res = await fn()
      if (!res.success) {
        setError(res.error ?? "Ошибка")
        return
      }
      setError(null)
      setExtras(await getTaskExtras(task.id))
    })

  function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItem.trim()) return
    const title = newItem
    setNewItem("")
    run(() => addChecklistItem(task.id, title))
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const fd = new FormData()
    fd.set("task_id", task.id)
    fd.set("file", file)
    run(() => uploadAttachment(fd))
  }

  function download(id: string) {
    start(async () => {
      const res = await attachmentUrl(id)
      if (res.success && res.url) window.open(res.url, "_blank")
      else setError(res.error ?? "Ошибка")
    })
  }

  const checklist = extras?.checklist ?? []
  const checklistDone = checklist.filter((i) => i.done).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="pr-6">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Этап */}
          <Field label="Этап (для группировки в проекте)">
            <div className="flex gap-2">
              <input
                className={fieldClass}
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                placeholder="Например: 1. Системы"
              />
              <Button
                type="button"
                variant="outline"
                disabled={pending || stage === (task.stage ?? "")}
                onClick={() => run(() => updateTask({ id: task.id, stage: stage.trim() || null }))}
              >
                Сохранить
              </Button>
            </div>
          </Field>

          {/* Чек-лист */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Чек-лист
              {checklist.length > 0 && (
                <span className="ml-1 tabular-nums">
                  {checklistDone}/{checklist.length}
                </span>
              )}
            </p>
            {extras === null ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Загрузка…
              </p>
            ) : checklist.length === 0 ? (
              <p className="text-sm text-muted-foreground">Пунктов пока нет.</p>
            ) : (
              <ul className="space-y-1">
                {checklist.map((item) => (
                  <li key={item.id} className="group flex items-center gap-2">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.done}
                        disabled={pending}
                        onChange={(e) => run(() => toggleChecklistItem(item.id, e.target.checked))}
                      />
                      <span className={cn("truncate", item.done && "text-muted-foreground line-through")}>
                        {item.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      title="Удалить пункт"
                      disabled={pending}
                      onClick={() => run(() => deleteChecklistItem(item.id))}
                      className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addItem} className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Новый пункт"
              />
              <Button type="submit" variant="outline" disabled={pending || !newItem.trim()}>
                Добавить
              </Button>
            </form>
          </div>

          {/* Вложения */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Вложения</p>
            {extras !== null && (extras.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Файлов нет.</p>
            ) : (
              <ul className="space-y-1">
                {extras.attachments.map((a) => (
                  <li key={a.id} className="group flex items-center gap-2 text-sm">
                    <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(a.size)}</span>
                    <button
                      type="button"
                      title="Скачать"
                      disabled={pending}
                      onClick={() => download(a.id)}
                      className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Удалить файл"
                      disabled={pending}
                      onClick={() => run(() => deleteAttachment(a.id))}
                      className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ))}
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <Paperclip className="size-4" />
              Прикрепить файл (до 10 МБ)
              <input type="file" className="hidden" onChange={onFileChange} disabled={pending} />
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
