"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { createTransaction } from "@/server/actions/transactions"
import { Button } from "@/components/ui/button"
import { fieldClass, Field } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Kind = "INCOME" | "EXPENSE" | "TRANSFER"
type AssetOpt = { id: string; name: string; currency: string }
type CategoryOpt = { name: string; kind: string }

const KIND_TABS: { key: Kind; label: string }[] = [
  { key: "EXPENSE", label: "Расход" },
  { key: "INCOME", label: "Доход" },
  { key: "TRANSFER", label: "Перевод" },
]

export function TransactionForm({
  assets,
  categories,
  today,
}: {
  assets: AssetOpt[]
  categories: CategoryOpt[]
  today: string
}) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [kind, setKind] = useState<Kind>("EXPENSE")
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "")
  const [toAssetId, setToAssetId] = useState("")
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today)
  const [note, setNote] = useState("")

  const asset = assets.find((a) => a.id === assetId)
  // Перевод возможен только между активами одной валюты (правило БД).
  const transferTargets = assets.filter((a) => a.id !== assetId && a.currency === asset?.currency)
  const categoryOpts = categories.filter((c) => c.kind === kind).map((c) => c.name)

  function reset() {
    setKind("EXPENSE")
    setAssetId(assets[0]?.id ?? "")
    setToAssetId("")
    setCategory("")
    setAmount("")
    setDate(today)
    setNote("")
    setError(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!assetId || !(amt > 0)) return
    start(async () => {
      const res = await createTransaction({
        kind,
        asset_id: assetId,
        to_asset_id: kind === "TRANSFER" ? toAssetId || null : null,
        category: kind === "TRANSFER" ? null : category.trim() || null,
        amount: amt,
        date,
        note: note.trim() || null,
      })
      if (res.success) {
        reset()
        setOpen(false)
      } else {
        setError(res.error ?? "Ошибка")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" /> Новая транзакция
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая транзакция</DialogTitle>
        </DialogHeader>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Сначала создайте актив (кошелёк) на странице «Активы».
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="inline-flex gap-1 rounded-lg border bg-muted/40 p-1">
              {KIND_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setKind(t.key)}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    kind === t.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <Field label={kind === "INCOME" ? "На актив" : kind === "TRANSFER" ? "С актива" : "С актива"}>
              <select className={fieldClass} value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </Field>

            {kind === "TRANSFER" && (
              <Field label="На актив" hint="только в той же валюте">
                <select
                  className={fieldClass}
                  value={toAssetId}
                  onChange={(e) => setToAssetId(e.target.value)}
                >
                  <option value="">— выберите —</option>
                  {transferTargets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {kind !== "TRANSFER" && (
              <Field label="Категория" hint="необязательно, новая создастся сама">
                <input
                  className={fieldClass}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={kind === "INCOME" ? "Например: Зарплата" : "Например: Продукты"}
                  list="tx-categories"
                />
                <datalist id="tx-categories">
                  {categoryOpts.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Сумма${asset ? `, ${asset.currency}` : ""}`}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={fieldClass}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                />
              </Field>
              <Field label="Дата">
                <input
                  type="date"
                  className={fieldClass}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Заметка">
              <input
                className={fieldClass}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Необязательно"
              />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                type="submit"
                disabled={pending || !(Number(amount) > 0) || (kind === "TRANSFER" && !toAssetId)}
              >
                Добавить
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
