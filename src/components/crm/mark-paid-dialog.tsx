"use client"

import { useState, useTransition } from "react"

import { markInvoicePaid } from "@/server/actions/transactions"
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

type AssetOpt = { id: string; name: string; currency: string }

const SKIP = "__skip__"

/** «Оплачен»: меняет статус счёта и (по желанию) зачисляет сумму на актив. */
export function MarkPaidDialog({
  invoice,
  assets,
}: {
  invoice: { id: string; number: string; amount: number; currency: string }
  assets: AssetOpt[]
}) {
  const matching = assets.filter((a) => a.currency === invoice.currency)
  const [open, setOpen] = useState(false)
  const [assetId, setAssetId] = useState(matching[0]?.id ?? SKIP)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const res = await markInvoicePaid(invoice.id, assetId === SKIP ? null : assetId)
      if (res.success) setOpen(false)
      else setError(res.error ?? "Ошибка")
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="xs" variant="outline">
            Оплачен
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Счёт № {invoice.number} оплачен</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Сумма:{" "}
            <span className="font-medium text-foreground">
              {formatMoney(invoice.amount, invoice.currency)}
            </span>
          </p>
          <Field label="Зачислить на актив" hint="баланс актива вырастет на сумму счёта">
            <select className={fieldClass} value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value={SKIP}>Не зачислять (только статус)</option>
              {matching.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </Field>
          {matching.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Активов в валюте {invoice.currency} нет — можно отметить только статус.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Подтвердить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
