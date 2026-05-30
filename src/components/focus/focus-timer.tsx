"use client"

import { useEffect, useState, useTransition } from "react"
import { Play, Square } from "lucide-react"

import { startFocus, stopFocus } from "@/server/actions/focus"
import { Button } from "@/components/ui/button"

function fmt(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const hh = String(Math.floor(s / 3600)).padStart(2, "0")
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

export function FocusTimer({
  active,
}: {
  active: { id: string; started_at: string; taskTitle: string | null } | null
}) {
  const [now, setNow] = useState(() => Date.now())
  const [pending, start] = useTransition()

  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])

  if (!active) {
    return (
      <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
        <span className="text-sm text-muted-foreground">Фокус не запущен</span>
        <Button
          disabled={pending}
          onClick={() => start(async () => void (await startFocus(null, null)))}
        >
          <Play className="size-4" /> Старт фокуса
        </Button>
      </div>
    )
  }

  const elapsed = now - new Date(active.started_at).getTime()

  return (
    <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
        </span>
        <div>
          <div className="text-3xl font-semibold tabular-nums">{fmt(elapsed)}</div>
          <div className="text-sm text-muted-foreground">{active.taskTitle ?? "Фокус"}</div>
        </div>
      </div>
      <Button
        variant="destructive"
        disabled={pending}
        onClick={() => start(async () => void (await stopFocus()))}
      >
        <Square className="size-4" /> Стоп
      </Button>
    </div>
  )
}
