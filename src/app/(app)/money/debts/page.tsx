import { listDebts } from "@/server/queries/money"
import { getProfile } from "@/server/queries/profile"
import { DebtForm } from "@/components/money/debt-form"
import { DebtList } from "@/components/money/debt-list"

export default async function DebtsPage() {
  const [debts, profile] = await Promise.all([listDebts(), getProfile()])
  const baseCurrency = profile?.base_currency ?? "UZS"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Долги</h1>
        <DebtForm baseCurrency={baseCurrency} />
      </div>
      <DebtList debts={debts} />
    </div>
  )
}
