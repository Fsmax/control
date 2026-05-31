import { describe, it, expect } from "vitest"

import { primaryAmount, formatMoney } from "@/lib/utils"

describe("primaryAmount", () => {
  it("пустой вход → ноль в базовой валюте", () => {
    expect(primaryAmount([], "USD")).toEqual({ currency: "USD", amount: 0, rest: 0 })
  })

  it("пустой вход без базы → UZS по умолчанию", () => {
    expect(primaryAmount([])).toEqual({ currency: "UZS", amount: 0, rest: 0 })
  })

  it("предпочитает базовую валюту, даже если она не крупнейшая", () => {
    const r = primaryAmount(
      [
        { currency: "USD", amount: 1000 },
        { currency: "UZS", amount: 50 },
      ],
      "UZS"
    )
    expect(r.currency).toBe("UZS")
    expect(r.amount).toBe(50)
    expect(r.rest).toBe(1) // одна валюта скрыта
  })

  it("без базы выбирает крупнейшую по модулю (учитывая знак)", () => {
    const r = primaryAmount(
      [
        { currency: "UZS", amount: 50 },
        { currency: "USD", amount: -1000 },
      ],
      "EUR" // базы нет среди элементов
    )
    expect(r.currency).toBe("USD")
    expect(r.amount).toBe(-1000)
  })

  it("rest считает число скрытых валют", () => {
    const r = primaryAmount([
      { currency: "A", amount: 3 },
      { currency: "B", amount: 2 },
      { currency: "C", amount: 1 },
    ])
    expect(r.rest).toBe(2)
  })
})

describe("formatMoney", () => {
  it("содержит цифры суммы", () => {
    expect(formatMoney(1500, "UZS")).toMatch(/1.?500/)
  })

  it("не падает на некорректном коде валюты (ветка fallback)", () => {
    // код из одной буквы заставляет Intl бросить → срабатывает запасная ветка
    expect(formatMoney(100, "U")).toContain("U")
  })
})
