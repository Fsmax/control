"use client"

import { useTransition } from "react"
import { Play } from "lucide-react"

import { startFocus } from "@/server/actions/focus"
import { Button } from "@/components/ui/button"

type WorkTask = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE" }

export function FocusTodayWork({ tasks }: { tasks: WorkTask[] }) {
  const [pending, start] = useTransition()

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">На сегодня нет рабочих дел.</p>
  }

  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm">
          <span className="flex-1 truncate text-sm">{t.title}</span>
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => start(async () => void (await startFocus(t.id, null)))}
          >
            <Play className="size-4" /> В фокус
          </Button>
        </li>
      ))}
    </ul>
  )
}
