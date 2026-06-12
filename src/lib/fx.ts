import type { CurrencyAmount } from "@/lib/money"

/** Курсы: валюта → сколько базовой валюты за 1 единицу. */
export type FxRateMap = Record<string, number>

/**
 * Пересчёт сумм по валютам в базовую. Валюты без курса не складываются —
 * возвращаются в missing, чтобы UI показал «нет курса».
 */
export function convertToBase(
  items: CurrencyAmount[],
  base: string,
  rates: FxRateMap
): { total: number; missing: string[] } {
  let total = 0
  const missing = new Set<string>()
  for (const { currency, amount } of items) {
    if (currency === base) {
      total += amount
      continue
    }
    const rate = rates[currency]
    if (rate && rate > 0) total += amount * rate
    else missing.add(currency)
  }
  return { total, missing: [...missing] }
}
