import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString("ru-RU")} ${currency}`
  }
}

/** Компактная сумма для KPI-карточек: 1,2 млн UZS вместо 1 234 567,00. */
export function formatMoneyShort(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString("ru-RU", { notation: "compact" })} ${currency}`
  }
}

/** Выбрать «главную» сумму из набора валют: базовую, иначе крупнейшую по модулю. */
export function primaryAmount(
  items: { currency: string; amount: number }[],
  base?: string
): { currency: string; amount: number; rest: number } {
  if (items.length === 0) return { currency: base ?? "UZS", amount: 0, rest: 0 }
  const baseItem = base ? items.find((i) => i.currency === base) : undefined
  const main =
    baseItem ?? [...items].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]
  return { currency: main.currency, amount: main.amount, rest: items.length - 1 }
}
