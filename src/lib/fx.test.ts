import { describe, expect, it } from "vitest"

import { convertToBase } from "@/lib/fx"

describe("convertToBase", () => {
  it("суммирует базовую валюту без курса", () => {
    const r = convertToBase([{ currency: "UZS", amount: 1000 }], "UZS", {})
    expect(r.total).toBe(1000)
    expect(r.missing).toEqual([])
  })

  it("пересчитывает по курсу и складывает с базовой", () => {
    const r = convertToBase(
      [
        { currency: "UZS", amount: 1_000_000 },
        { currency: "USD", amount: 100 },
      ],
      "UZS",
      { USD: 12_500 }
    )
    expect(r.total).toBe(1_000_000 + 100 * 12_500)
    expect(r.missing).toEqual([])
  })

  it("собирает валюты без курса в missing, не теряя остальное", () => {
    const r = convertToBase(
      [
        { currency: "USD", amount: 100 },
        { currency: "EUR", amount: 50 },
        { currency: "EUR", amount: 10 },
      ],
      "UZS",
      { USD: 12_500 }
    )
    expect(r.total).toBe(1_250_000)
    expect(r.missing).toEqual(["EUR"])
  })

  it("отрицательные суммы (долги) уменьшают итог", () => {
    const r = convertToBase([{ currency: "USD", amount: -10 }], "UZS", { USD: 10_000 })
    expect(r.total).toBe(-100_000)
  })
})
