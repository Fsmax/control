"use client"

import { useState, useSyncExternalStore } from "react"
import { Bell } from "lucide-react"

import { subscribeToPush } from "@/lib/push"
import { Button } from "@/components/ui/button"

// Разрешение на уведомления — браузерное состояние; читаем через useSyncExternalStore
// (без setState-в-эффекте и без hydration-mismatch: на сервере снимок = false).
const subscribe = () => () => {}
const canPromptSnapshot = () =>
  typeof Notification !== "undefined" && Notification.permission === "default"

export function NotificationPrompt() {
  const canPrompt = useSyncExternalStore(subscribe, canPromptSnapshot, () => false)
  const [dismissed, setDismissed] = useState(false)
  const [pending, setPending] = useState(false)

  if (!canPrompt || dismissed) return null

  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      title="Включить напоминания"
      onClick={async () => {
        setPending(true)
        const res = await subscribeToPush()
        setPending(false)
        if (res.ok) setDismissed(true)
        else if (res.error) alert(res.error)
      }}
    >
      <Bell className="size-4" /> Напоминания
    </Button>
  )
}
