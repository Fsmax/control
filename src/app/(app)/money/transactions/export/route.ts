import { createClient } from "@/utils/supabase/server"
import { toCsv } from "@/lib/csv"

const KIND_RU: Record<string, string> = {
  INCOME: "Доход",
  EXPENSE: "Расход",
  TRANSFER: "Перевод",
}

// Экспорт всех транзакций в CSV (Excel-friendly: BOM + «;»).
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { data } = await supabase
    .from("transactions")
    .select(
      "date, kind, amount, currency, note, asset:assets!transactions_asset_id_fkey(name), to_asset:assets!transactions_to_asset_id_fkey(name), category:tx_categories(name)"
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })

  const rows = (data ?? []).map((t) => [
    t.date,
    KIND_RU[t.kind] ?? t.kind,
    Number(t.amount),
    t.currency,
    t.asset?.name ?? "",
    t.to_asset?.name ?? "",
    t.category?.name ?? "",
    t.note ?? "",
  ])

  const csv =
    "\uFEFF" +
    toCsv(["Дата", "Тип", "Сумма", "Валюта", "Актив", "Куда (перевод)", "Категория", "Заметка"], rows)

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transactions.csv"',
    },
  })
}
