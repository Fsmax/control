"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"

import { createAsset } from "@/server/actions/assets"
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
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"

type Kind = "CASH" | "BANK" | "DEPOSIT" | "STOCK" | "CRYPTO" | "REAL_ESTATE" | "OTHER"

const KINDS: { value: Kind; label: string }[] = [
  { value: "CASH", label: "Наличные" },
  { value: "BANK", label: "Карта / банк" },
  { value: "DEPOSIT", label: "Вклад" },
  { value: "STOCK", label: "Акции" },
  { value: "CRYPTO", label: "Крипта" },
  { value: "REAL_ESTATE", label: "Недвижимость" },
  { value: "OTHER", label: "Прочее" },
]

export function AssetForm({ baseCurrency }: { baseCurrency: string }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [kind, setKind] = useState<Kind>("CASH")
  const [currency, setCurrency] = useState(baseCurrency)
  const [value, setValue] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    start(async () => {
      const res = await createAsset({
        name,
        kind,
        currency,
        current_value: Number(value) || 0,
      })
      if (res.success) {
        setName("")
        setKind("CASH")
        setCurrency(baseCurrency)
        setValue("")
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
        <Plus className="size-4" /> Новый актив
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый актив</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (напр. «Карта Humo»)"
            autoFocus
          />
          <label className="block space-y-1 text-xs text-muted-foreground">
            Тип
            <select
              className={field}
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-xs text-muted-foreground">
              Стоимость
              <input
                type="number"
                min="0"
                step="0.01"
                className={field}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-xs text-muted-foreground">
              Валюта
              <input
                className={field}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </label>
          </div>
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
