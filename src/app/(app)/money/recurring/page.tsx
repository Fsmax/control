import { listRecurring } from "@/server/queries/money"
import { getProfile } from "@/server/queries/profile"
import { RecurringForm } from "@/components/money/recurring-form"
import { RecurringList } from "@/components/money/recurring-list"

export default async function RecurringPage() {
  const [items, profile] = await Promise.all([listRecurring(), getProfile()])
  const baseCurrency = profile?.base_currency ?? "UZS"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Регулярные</h1>
        <RecurringForm baseCurrency={baseCurrency} />
      </div>
      <RecurringList items={items} />
    </div>
  )
}
