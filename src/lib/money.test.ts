import { describe, it, expect } from "vitest"

import { byCurrency } from "@/lib/money"

describe("byCurrency", () => {
  it("возвращает пустой массив без входных пар", () => {
    expect(byCurrency([])).toEqual([])
  })

  it("суммирует суммы внутри одной валюты", () => {
    expect(
      byCurrency([
        ["UZS", 100],
        ["UZS", 250],
      ])
    ).toEqual([{ currency: "UZS", amount: 350 }])
  })

  it("НЕ складывает разные валюты", () => {
    expect(
      byCurrency([
        ["UZS", 100],
        ["USD", 5],
        ["UZS", 50],
      ])
    ).toEqual([
      { currency: "UZS", amount: 150 },
      { currency: "USD", amount: 5 },
    ])
  })

  it("сохраняет порядок первого появления валюты", () => {
    const r = byCurrency([
      ["USD", 1],
      ["UZS", 1],
      ["EUR", 1],
    ])
    expect(r.map((x) => x.currency)).toEqual(["USD", "UZS", "EUR"])
  })

  it("корректно работает с отрицательными суммами (долги/погашения)", () => {
    expect(
      byCurrency([
        ["UZS", 100],
        ["UZS", -30],
      ])
    ).toEqual([{ currency: "UZS", amount: 70 }])
  })
})
