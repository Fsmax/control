import { listAssets } from "@/server/queries/money"
import { getProfile } from "@/server/queries/profile"
import { formatMoney } from "@/lib/utils"
import { AssetForm } from "@/components/money/asset-form"
import { AssetList } from "@/components/money/asset-list"

export default async function AssetsPage() {
  const [assets, profile] = await Promise.all([listAssets(), getProfile()])
  const baseCurrency = profile?.base_currency ?? "UZS"

  const cap = new Map<string, number>()
  for (const a of assets) {
    cap.set(a.currency, (cap.get(a.currency) ?? 0) + Number(a.current_value))
  }
  const capital = [...cap.entries()]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Инвестиции и активы</h1>
        <AssetForm baseCurrency={baseCurrency} />
      </div>

      <div className="rounded-lg border p-4">
        <div className="text-xs text-muted-foreground">Капитал</div>
        {capital.length === 0 ? (
          <div className="text-sm text-muted-foreground">—</div>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {capital.map(([c, a]) => (
              <div key={c} className="text-lg font-semibold">
                {formatMoney(a, c)}
              </div>
            ))}
          </div>
        )}
      </div>

      <AssetList assets={assets} />
    </div>
  )
}
