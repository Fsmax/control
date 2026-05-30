import { formatInTimeZone } from "date-fns-tz"

// Сегодняшняя дата (ГГГГ-ММ-ДД) в таймзоне пользователя — «граница дня».
export function todayInTz(tz: string): string {
  return formatInTimeZone(new Date(), tz, "yyyy-MM-dd")
}

// Дата на n дней назад от сегодня (в таймзоне пользователя), ГГГГ-ММ-ДД.
export function daysAgoInTz(tz: string, days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return formatInTimeZone(d, tz, "yyyy-MM-dd")
}

// Арифметика по строке-дате (без таймзоны): сдвиг на n дней.
export function addDaysYmd(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}

// Сдвиг даты на один период (для регулярных доходов/расходов).
export function addPeriodYmd(
  ymd: string,
  period: "WEEKLY" | "MONTHLY" | "YEARLY"
): string {
  const [y, m, d] = ymd.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (period === "WEEKLY") dt.setUTCDate(dt.getUTCDate() + 7)
  else if (period === "MONTHLY") dt.setUTCMonth(dt.getUTCMonth() + 1)
  else dt.setUTCFullYear(dt.getUTCFullYear() + 1)
  return dt.toISOString().slice(0, 10)
}
