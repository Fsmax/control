export type CurrencyAmount = { currency: string; amount: number }

/** Сворачивает пары [валюта, сумма] в суммы по валютам. Разные валюты НЕ складываются. */
export function byCurrency(pairs: [string, number][]): CurrencyAmount[] {
  const m = new Map<string, number>()
  for (const [cur, amt] of pairs) m.set(cur, (m.get(cur) ?? 0) + amt)
  return [...m.entries()].map(([currency, amount]) => ({ currency, amount }))
}
