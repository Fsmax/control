import { addDaysYmd } from "@/lib/dates"

// Окно истории для расчёта серии. Серия длиннее окна обрежется на его границе,
// поэтому окно общее для всех экранов (Сегодня и Прогресс), чтобы цифры совпадали.
// 400 дней (>1 года): daily_done отдаёт агрегаты по дням, строк мало.
export const STREAK_WINDOW_DAYS = 400

export type DayCount = { day: string; done: number }

// Серию считаем из дневных счётчиков закрытых задач (результат RPC daily_done).
// День «удачный», если закрыто >= dayGoal задач.
export function computeStreak(
  counts: DayCount[],
  dayGoal: number,
  todayStr: string
): { current: number; best: number } {
  const map = new Map(counts.map((c) => [c.day, Number(c.done)]))
  const met = (ymd: string) => (map.get(ymd) ?? 0) >= dayGoal

  // Текущая серия: от сегодня назад. Сегодня не обрывает серию, пока не закончилось —
  // если цель ещё не достигнута, считаем от вчера.
  let cursor = met(todayStr) ? todayStr : addDaysYmd(todayStr, -1)
  let current = 0
  while (met(cursor)) {
    current++
    cursor = addDaysYmd(cursor, -1)
  }

  // Лучшая серия: самый длинный непрерывный ряд удачных дней.
  const metDays = [...map.keys()].filter(met).sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const day of metDays) {
    run = prev && addDaysYmd(prev, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    prev = day
  }

  return { current, best: Math.max(best, current) }
}
