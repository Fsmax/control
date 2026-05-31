import { describe, it, expect, vi, afterEach } from "vitest"
import { fromZonedTime } from "date-fns-tz"

import {
  addDaysYmd,
  addPeriodYmd,
  splitMinutesByDay,
  todayInTz,
  daysAgoInTz,
} from "@/lib/dates"

describe("addDaysYmd", () => {
  it("прибавляет и вычитает дни", () => {
    expect(addDaysYmd("2026-05-31", 1)).toBe("2026-06-01")
    expect(addDaysYmd("2026-05-01", -1)).toBe("2026-04-30")
  })

  it("пересекает границу года", () => {
    expect(addDaysYmd("2026-12-31", 1)).toBe("2027-01-01")
  })

  it("учитывает високосный день", () => {
    expect(addDaysYmd("2024-02-28", 1)).toBe("2024-02-29") // 2024 високосный
    expect(addDaysYmd("2026-02-28", 1)).toBe("2026-03-01") // 2026 — нет
  })
})

describe("addPeriodYmd", () => {
  it("WEEKLY = +7 дней", () => {
    expect(addPeriodYmd("2026-05-01", "WEEKLY")).toBe("2026-05-08")
  })

  it("MONTHLY = +1 месяц (для дат середины месяца точно)", () => {
    expect(addPeriodYmd("2026-01-15", "MONTHLY")).toBe("2026-02-15")
  })

  it("YEARLY = +1 год", () => {
    expect(addPeriodYmd("2026-03-10", "YEARLY")).toBe("2027-03-10")
  })
})

describe("splitMinutesByDay (Asia/Tashkent, UTC+5)", () => {
  const tz = "Asia/Tashkent"

  it("интервал внутри одного дня остаётся в этом дне", () => {
    const start = fromZonedTime("2026-05-31T10:00:00", tz).getTime()
    const end = fromZonedTime("2026-05-31T11:30:00", tz).getTime()
    const m = splitMinutesByDay(start, end, tz)
    expect(m.get("2026-05-31")).toBe(90)
    expect(m.size).toBe(1)
  })

  it("интервал через локальную полночь делится между двумя днями", () => {
    const start = fromZonedTime("2026-05-31T23:30:00", tz).getTime()
    const end = fromZonedTime("2026-06-01T00:30:00", tz).getTime()
    const m = splitMinutesByDay(start, end, tz)
    expect(m.get("2026-05-31")).toBe(30)
    expect(m.get("2026-06-01")).toBe(30)
  })

  it("сумма минут равна длине интервала", () => {
    const start = fromZonedTime("2026-05-31T22:00:00", tz).getTime()
    const end = fromZonedTime("2026-06-01T02:00:00", tz).getTime()
    const total = [...splitMinutesByDay(start, end, tz).values()].reduce((a, b) => a + b, 0)
    expect(total).toBe(240)
  })

  it("нулевой интервал → пустая карта", () => {
    const t = fromZonedTime("2026-05-31T10:00:00", tz).getTime()
    expect(splitMinutesByDay(t, t, tz).size).toBe(0)
  })
})

describe("todayInTz / daysAgoInTz (граница дня по таймзоне)", () => {
  afterEach(() => vi.useRealTimers())

  it("возвращает локальную дату в таймзоне", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-31T10:00:00Z")) // 15:00 в Ташкенте
    expect(todayInTz("Asia/Tashkent")).toBe("2026-05-31")
  })

  it("перекатывается на следующий локальный день, когда по UTC ещё предыдущий", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-31T20:00:00Z")) // 01:00 следующего дня в Ташкенте
    expect(todayInTz("Asia/Tashkent")).toBe("2026-06-01")
  })

  it("daysAgoInTz вычитает целые дни", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-31T10:00:00Z"))
    expect(daysAgoInTz("Asia/Tashkent", 7)).toBe("2026-05-24")
  })
})
