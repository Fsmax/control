"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { updateAssetValue, deleteAsset } from "@/server/actions/assets"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Asset = {
  id: string
  name: string
  kind: "CASH" | "BANK" | "DEPOSIT" | "STOCK" | "CRYPTO" | "REAL_ESTATE" | "OTHER"
  currency: string
  current_value: number
}

const KIND_LABEL: Record<Asset["kind"], string> = {
  CASH: "Наличные",
  BANK: "Карта / банк",
  DEPOSIT: "Вклад",
  STOCK: "Акции",
  CRYPTO: "Крипта",
  REAL_ESTATE: "Недвижимость",
  OTHER: "Прочее",
}

const valField =
  "h-8 w-32 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"

function AssetRow({ asset }: { asset: Asset }) {
  const [pending, start] = useTransition()
  const [value, setValue] = useState(String(asset.current_value))
  const changed = Number(value) !== Number(asset.current_value)

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{asset.name}</div>
        <div className="text-xs text-muted-foreground tabular-nums">
          {KIND_LABEL[asset.kind]} · {formatMoney(Number(asset.current_value), asset.currency)}
        </div>
      </div>
      <input
        type="number"
        min="0"
        step="0.01"
        className={valField}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        size="sm"
        variant="ghost"
        disabled={pending || !changed}
        onClick={() =>
          start(async () => {
            await updateAssetValue({ id: asset.id, current_value: Number(value) || 0 })
          })
        }
      >
        Сохранить
      </Button>
      <button
        type="button"
        disabled={pending}
        aria-label="Удалить"
        className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
        onClick={() => {
          if (confirm("Удалить актив?"))
            start(async () => void (await deleteAsset(asset.id)))
        }}
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}

export function AssetList({ assets }: { assets: Asset[] }) {
  if (assets.length === 0) {
    return <p className="text-sm text-muted-foreground">Активов нет. Добавьте первый.</p>
  }
  return (
    <ul className="space-y-2">
      {assets.map((a) => (
        <AssetRow key={a.id} asset={a} />
      ))}
    </ul>
  )
}
