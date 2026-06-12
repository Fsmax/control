import { createClient } from "@/utils/supabase/server"
import { logged } from "@/server/queries/logged"
import type { Database } from "@/types/database.types"

type TxRow = Database["public"]["Tables"]["transactions"]["Row"]
type CategoryRow = Database["public"]["Tables"]["tx_categories"]["Row"]

export type TxWithRefs = TxRow & {
  assetName: string | null
  toAssetName: string | null
  categoryName: string | null
}

export async function listTransactions(limit = 300): Promise<TxWithRefs[]> {
  const supabase = await createClient()
  const data = await logged(
    "listTransactions",
    supabase
      .from("transactions")
      .select(
        "*, asset:assets!transactions_asset_id_fkey(name), to_asset:assets!transactions_to_asset_id_fkey(name), category:tx_categories(name)"
      )
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)
  )
  return (data ?? []).map(({ asset, to_asset, category, ...t }) => ({
    ...t,
    assetName: asset?.name ?? null,
    toAssetName: to_asset?.name ?? null,
    categoryName: category?.name ?? null,
  }))
}

export async function listTxCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient()
  const data = await logged(
    "listTxCategories",
    supabase.from("tx_categories").select("*").order("name", { ascending: true })
  )
  return data ?? []
}
