import { describe, it, expect } from "vitest"

import { computeStreak, type DayCount } from "@/lib/streak"
import { addDaysYmd } from "@/lib/dates"

const TODAY = "2026-05-31"

// Собирает дневные счётчики, заканчивающиеся днём endDay: dones[last] = endDay,
// dones[0] — самый ранний день. Удобно описывать серию «справа налево».
function seq(endDay: string, dones: number[]): DayCount[] {
  const n = dones.length
  return dones.map((done, i) => ({ day: addDaysYmd(endDay, -(n - 1 - i)), done }))
}

describe("computeStreak", () => {
  it("пустой вход → нет серии", () => {
    expect(computeStreak([], 3, TODAY)).toEqual({ current: 0, best: 0 })
  })

  it("считает подряд идущие удачные дни назад от сегодня", () => {
    const counts = seq(TODAY, [3, 3, 3]) // три дня вкл. сегодня, все ≥ цели
    expect(computeStreak(counts, 3, TODAY).current).toBe(3)
  })

  it("сегодня ниже цели НЕ обрывает серию (считаем от вчера)", () => {
    const counts = seq(TODAY, [3, 3, 1]) // позавчера/вчера ок, сегодня недобор
    expect(computeStreak(counts, 3, TODAY).current).toBe(2)
  })

  it("разрыв обрывает текущую серию", () => {
    const counts = seq(TODAY, [3, 0, 3]) // сегодня ок, вчера ноль
    expect(computeStreak(counts, 3, TODAY).current).toBe(1)
  })

  it("порог — именно >= dayGoal", () => {
    expect(computeStreak(seq(TODAY, [5, 5]), 5, TODAY).current).toBe(2) // ровно цель
    expect(computeStreak(seq(TODAY, [4, 4]), 5, TODAY).current).toBe(0) // на 1 ниже
  })

  it("best — самый длинный непрерывный ряд, даже если текущая серия короче", () => {
    const counts = seq(TODAY, [3, 3, 3, 3, 0, 3]) // ряд из 4, разрыв, сегодня 1
    const r = computeStreak(counts, 3, TODAY)
    expect(r.current).toBe(1)
    expect(r.best).toBe(4)
  })

  it("best никогда не меньше current", () => {
    const r = computeStreak(seq(TODAY, [3, 3, 3]), 3, TODAY)
    expect(r.best).toBeGreaterThanOrEqual(r.current)
  })
})
