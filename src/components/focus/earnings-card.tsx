export function EarningsCard({ items }: { items: { currency: string; amount: number }[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">За месяц пока ничего.</p>
  }

  return (
    <ul className="space-y-1 text-sm">
      {items.map((e) => (
        <li key={e.currency} className="flex justify-between gap-2">
          <span>{e.currency}</span>
          <span className="tabular-nums font-medium">
            {e.amount.toLocaleString("ru-RU")}
          </span>
        </li>
      ))}
    </ul>
  )
}
