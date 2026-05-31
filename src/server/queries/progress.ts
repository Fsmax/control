import { createClient } from "@/utils/supabase/server"
import { getSessionUser, getCachedProfile } from "@/server/queries/session"
import { todayInTz, daysAgoInTz, addDaysYmd, splitMinutesByDay } from "@/lib/dates"
import { computeStreak, STREAK_WINDOW_DAYS } from "@/lib/streak"

export type Point = { label: string; value: number }

export type ProgressData = {
  streak: { current: number; best: number }
  dayGoal: number
  heatmap: { day: string; done: number }[]
  doneByDay: Point[]
  focusByDay: Point[]
  earnings: { currency: string; amount: number }[]
  capital: Point[]
}

export async function getProgressData(): Promise<ProgressData> {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) throw new Error("unauthorized")

  const profile = await getCachedProfile()

  const tz = profile?.timezone ?? "Asia/Tashkent"
  const dayGoal = profile?.day_goal ?? 3
  const baseCurrency = profile?.base_currency ?? "UZS"
  const today = todayInTz(tz)

  const [{ data: counts }, { data: sessions }, { data: earnTasks }, { data: assets }, { data: valuations }] =
    await Promise.all([
      supabase.rpc("daily_done", { uid: user.id, tz, since: daysAgoInTz(tz, STREAK_WINDOW_DAYS) }),
      supabase
        .from("focus_sessions")
        .select("started_at, ended_at")
        .gte("started_at", daysAgoInTz(tz, 14)),
      supabase
        .from("tasks")
        .select("payout_amount, payout_currency")
        .eq("area", "WORK")
        .eq("status", "DONE")
        .not("payout_amount", "is", null)
        .gte("completed_at", daysAgoInTz(tz, 183)),
      supabase.from("assets").select("id, currency"),
      supabase.from("asset_valuations").select("asset_id, value, as_of"),
    ])

  // серии и хитмап
  const doneMap = new Map((counts ?? []).map((c) => [c.day, Number(c.done)]))
  const streak = computeStreak(
    (counts ?? []).map((c) => ({ day: c.day, done: Number(c.done) })),
    dayGoal,
    today
  )

  const heatmap: { day: string; done: number }[] = []
  for (let i = 83; i >= 0; i--) {
    const d = addDaysYmd(today, -i)
    heatmap.push({ day: d, done: doneMap.get(d) ?? 0 })
  }
  const doneByDay: Point[] = heatmap.slice(-30).map((h) => ({ label: h.day.slice(5), value: h.done }))

  // фокус: минуты по дням (14)
  const now = Date.now()
  const focusMap = new Map<string, number>()
  for (const s of sessions ?? []) {
    const startMs = new Date(s.started_at).getTime()
    const endMs = s.ended_at ? new Date(s.ended_at).getTime() : now
    for (const [day, mins] of splitMinutesByDay(startMs, endMs, tz)) {
      focusMap.set(day, (focusMap.get(day) ?? 0) + mins)
    }
  }
  const focusByDay: Point[] = []
  for (let i = 13; i >= 0; i--) {
    const d = addDaysYmd(today, -i)
    focusByDay.push({ label: d.slice(5), value: Math.round(focusMap.get(d) ?? 0) })
  }

  // заработок по валютам (6 мес)
  const earnMap = new Map<string, number>()
  for (const t of earnTasks ?? []) {
    const cur = t.payout_currency ?? baseCurrency
    earnMap.set(cur, (earnMap.get(cur) ?? 0) + Number(t.payout_amount ?? 0))
  }
  const earnings = [...earnMap.entries()].map(([currency, amount]) => ({ currency, amount }))

  // динамика капитала (только базовая валюта)
  const baseIds = new Set((assets ?? []).filter((a) => a.currency === baseCurrency).map((a) => a.id))
  const vals = (valuations ?? [])
    .filter((v) => baseIds.has(v.asset_id))
    .sort((a, b) => (a.as_of < b.as_of ? -1 : 1))
  const lastVal = new Map<string, number>()
  const dateSnap = new Map<string, number>()
  for (const v of vals) {
    lastVal.set(v.asset_id, Number(v.value))
    let sum = 0
    for (const id of baseIds) sum += lastVal.get(id) ?? 0
    dateSnap.set(v.as_of, sum)
  }
  const capital: Point[] = [...dateSnap.entries()].map(([d, value]) => ({
    label: d.slice(5),
    value,
  }))

  return { streak, dayGoal, heatmap, doneByDay, focusByDay, earnings, capital }
}
