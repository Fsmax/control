import { createClient } from "@/utils/supabase/server"
import { getSessionUser, getCachedProfile } from "@/server/queries/session"
import { todayInTz, daysAgoInTz } from "@/lib/dates"
import { computeStreak, STREAK_WINDOW_DAYS } from "@/lib/streak"
import type { Database } from "@/types/database.types"

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

export type TodayData = {
  today: string
  tz: string
  dayGoal: number
  planned: TaskRow[]
  overdue: TaskRow[]
  progress: { done: number; total: number }
  doneToday: number
  streak: { current: number; best: number }
}

export async function getToday(): Promise<TodayData> {
  const supabase = await createClient()
  const user = await getSessionUser()
  if (!user) throw new Error("unauthorized")

  const profile = await getCachedProfile()

  const tz = profile?.timezone ?? "Asia/Tashkent"
  const dayGoal = profile?.day_goal ?? 3
  const today = todayInTz(tz)

  const [{ data: planned }, { data: overdue }, { data: counts }] = await Promise.all([
    supabase.from("tasks").select("*").eq("scheduled_for", today).order("position"),
    supabase
      .from("tasks")
      .select("*")
      .lt("scheduled_for", today)
      .neq("status", "DONE")
      .order("scheduled_for"),
    supabase.rpc("daily_done", { uid: user.id, tz, since: daysAgoInTz(tz, STREAK_WINDOW_DAYS) }),
  ])

  const dayCounts = (counts ?? []).map((c) => ({ day: c.day, done: Number(c.done) }))
  const streak = computeStreak(dayCounts, dayGoal, today)
  const plannedList = planned ?? []

  return {
    today,
    tz,
    dayGoal,
    planned: plannedList,
    overdue: overdue ?? [],
    progress: {
      done: plannedList.filter((t) => t.status === "DONE").length,
      total: plannedList.length,
    },
    doneToday: dayCounts.find((c) => c.day === today)?.done ?? 0,
    streak,
  }
}
