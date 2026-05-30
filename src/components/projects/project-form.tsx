"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { createProject } from "@/server/actions/projects"
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

export function ProjectForm({
  clients = [],
  defaultOpen = false,
}: {
  clients?: { id: string; name: string }[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [area, setArea] = useState<"WORK" | "PERSONAL">("PERSONAL")
  const [clientId, setClientId] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    start(async () => {
      const res = await createProject({ name, area, client_id: clientId || null })
      if (res.success) {
        setName("")
        setArea("PERSONAL")
        setClientId("")
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
        <Plus className="size-4" /> Новый проект
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый проект</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название проекта"
            autoFocus
          />
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
          {clients.length > 0 && (
            <label className="block space-y-1 text-xs text-muted-foreground">
              Клиент <span className="opacity-70">(необязательно)</span>
              <select className={field} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">— без клиента —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
