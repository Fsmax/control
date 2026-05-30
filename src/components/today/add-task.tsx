"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { createTask } from "@/server/actions/tasks"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AddTask({ today }: { today: string }) {
  const [title, setTitle] = useState("")
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    start(async () => {
      const res = await createTask({ title: t, scheduled_for: today })
      if (res.success) setTitle("")
    })
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Что сделать сегодня?"
        aria-label="Новое дело на сегодня"
      />
      <Button type="submit" disabled={pending || !title.trim()}>
        <Plus className="size-4" />
        Добавить
      </Button>
    </form>
  )
}
