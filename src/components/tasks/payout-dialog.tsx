"use client"

import { useState, useTransition } from "react"

import { postTaskPayout } from "@/server/actions/transactions"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { fieldClass, Field } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export type AssetOpt = { id: string; name: string; currency: string }

/** Зачислить выплату по закрытой задаче в выбранный актив (один раз). */
export function PayoutDialog({
  task,
  assets,
  trigger,
}: {
  task: { id: string; title: string; payout_amount: number; payout_currency: string | null }
  assets: AssetOpt[]
  trigger: React.ReactElement
}) {
  const matching = assets.filter(
    (a) => !task.payout_currency || a.currency === task.payout_currency
  )
  const [open, setOpen] = useState(false)
  const [assetId, setAssetId] = useState(matching[0]?.id ?? "")
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!assetId) return
    start(async () => {
      const res = await postTaskPayout(task.id, assetId)
      if (res.success) setOpen(false)
      else setError(res.error ?? "Ошибка")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Зачислить выплату</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {task.title} —{" "}
            <span className="font-medium text-foreground">
              {formatMoney(task.payout_amount, task.payout_currency ?? "UZS")}
            </span>
          </p>
          {matching.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет актива в валюте {task.payout_currency} — создайте его на странице «Активы».
            </p>
          ) : (
            <Field label="На какой актив">
              <select
                className={fieldClass}
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
              >
                {matching.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </Field>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || !assetId}>
              Зачислить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
