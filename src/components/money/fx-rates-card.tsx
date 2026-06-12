"use client"

import { useState, useTransition } from "react"
import { RefreshCw, Trash2 } from "lucide-react"

import { refreshFxRates, upsertFxRate, deleteFxRate } from "@/server/actions/fx"
import { Button } from "@/components/ui/button"
import { fieldClass } from "@/components/ui/field"

type Rate = { currency: string; rate: number; as_of: string }

/** Курсы к базовой валюте: ручной ввод + обновление из ЦБ РУз. */
export function FxRatesCard({ rates, base }: { rates: Rate[]; base: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [currency, setCurrency] = useState("")
  const [rate, setRate] = useState("")

  const run = (fn: () => Promise<{ success: boolean; error?: string }>) =>
    start(async () => {
      setInfo(null)
      const res = await fn()
      setError(res.success ? null : (res.error ?? "Ошибка"))
    })

  function refresh() {
    start(async () => {
      setError(null)
      const res = await refreshFxRates()
      if (res.success) setInfo(`Обновлено курсов: ${res.updated ?? 0}`)
      else setError(res.error ?? "Ошибка")
    })
  }

  function add(e: React.FormEvent) {
    e.preventDefault()
    const r = Number(rate)
    if (!currency.trim() || !(r > 0)) return
    setCurrency("")
    setRate("")
    run(() => upsertFxRate(currency, r))
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">Курсы валют</h3>
          <p className="text-xs text-muted-foreground">сколько {base} за 1 единицу</p>
        </div>
        <Button size="sm" variant="outline" disabled={pending} onClick={refresh}>
          <RefreshCw className="size-3.5" /> Из ЦБ РУз
        </Button>
      </div>

      {rates.length > 0 && (
        <ul className="mt-3 space-y-1">
          {rates.map((r) => (
            <li key={r.currency} className="group flex items-center gap-2 text-sm">
              <span className="w-12 font-medium">{r.currency}</span>
              <span className="flex-1 tabular-nums">
                {r.rate.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{r.as_of}</span>
              <button
                type="button"
                title="Удалить курс"
                disabled={pending}
                onClick={() => run(() => deleteFxRate(r.currency))}
                className="grid size-6 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          className={`${fieldClass} h-8 w-20 uppercase`}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          placeholder="USD"
          maxLength={8}
        />
        <input
          type="number"
          min="0"
          step="any"
          className={`${fieldClass} h-8 flex-1`}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          placeholder={`Курс в ${base}`}
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending || !currency.trim() || !(Number(rate) > 0)}>
          Сохранить
        </Button>
      </form>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {info && <p className="mt-2 text-sm text-success">{info}</p>}
    </div>
  )
}
