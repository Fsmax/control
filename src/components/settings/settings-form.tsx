"use client"

import { useState, useTransition } from "react"

import { updateProfile } from "@/server/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const field =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

type Profile = {
  name: string | null
  timezone: string
  day_goal: number
  focus_goal_min: number
  base_currency: string
}

export function SettingsForm({ profile }: { profile: Profile }) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [name, setName] = useState(profile.name ?? "")
  const [timezone, setTimezone] = useState(profile.timezone)
  const [dayGoal, setDayGoal] = useState(String(profile.day_goal))
  const [focusGoal, setFocusGoal] = useState(String(profile.focus_goal_min))
  const [baseCurrency, setBaseCurrency] = useState(profile.base_currency)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const res = await updateProfile({
        name: name.trim() || null,
        timezone: timezone.trim(),
        day_goal: Number(dayGoal),
        focus_goal_min: Number(focusGoal),
        base_currency: baseCurrency.trim(),
      })
      setMsg(res.success ? "Сохранено" : res.error ?? "Ошибка")
    })
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <label className="block space-y-1 text-xs text-muted-foreground">
        Имя
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block space-y-1 text-xs text-muted-foreground">
        Таймзона (для границы дня и серий)
        <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-xs text-muted-foreground">
          Цель дня (дел)
          <input
            type="number"
            min="1"
            className={field}
            value={dayGoal}
            onChange={(e) => setDayGoal(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-xs text-muted-foreground">
          Цель фокуса (мин)
          <input
            type="number"
            min="0"
            className={field}
            value={focusGoal}
            onChange={(e) => setFocusGoal(e.target.value)}
          />
        </label>
      </div>
      <label className="block space-y-1 text-xs text-muted-foreground">
        Базовая валюта
        <Input value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value)} />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          Сохранить
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </form>
  )
}
