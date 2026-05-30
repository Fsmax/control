import { formatInTimeZone } from "date-fns-tz"

import { createClient } from "@/utils/supabase/server"
import { todayInTz, daysAgoInTz } from "@/lib/dates"

type ActiveSession = { id: string; started_at: string; taskTitle: string | null }
type WorkTask = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE" }

export type FocusData = {
  tz: string
  focusGoalMin: number
  baseCurrency: string
  today: string
  active: ActiveSession | null
  todayWork: WorkTask[]
  focusMinutesToday: number
  focusMinutesWeek: number
  byProject: { name: string; minutes: number }[]
  earnings: { currency: string; amount: number }[]
}

export async function getFocusData(): Promise<FocusData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("unauthorized")

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, focus_goal_min, base_currency")
    .eq("id", user.id)
    .single()

  const tz = profile?.timezone ?? "Asia/Tashkent"
  const focusGoalMin = profile?.focus_goal_min ?? 120
  const baseCurrency = profile?.base_currency ?? "UZS"
  const today = todayInTz(tz)
  const monthStart = `${today.slice(0, 7)}-01`

  const [{ data: activeRow }, { data: sessions }, { data: todayWork }, { data: earnTasks }, { data: projects }] =
    await Promise.all([
      supabase
        .from("focus_sessions")
        .select("id, started_at, tasks(title)")
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("focus_sessions")
        .select("started_at, ended_at, project_id")
        .gte("started_at", daysAgoInTz(tz, 7)),
      supabase
        .from("tasks")
        .select("id, title, status")
        .eq("area", "WORK")
        .eq("scheduled_for", today)
        .order("position"),
      supabase
        .from("tasks")
        .select("payout_amount, payout_currency")
        .eq("area", "WORK")
        .eq("status", "DONE")
        .not("payout_amount", "is", null)
        .gte("completed_at", monthStart),
      supabase.from("projects").select("id, name"),
    ])

  const active: ActiveSession | null = activeRow
    ? {
        id: activeRow.id,
        started_at: activeRow.started_at,
        taskTitle: activeRow.tasks?.title ?? null,
      }
    : null

  const now = Date.now()
  let focusMinutesToday = 0
  let focusMinutesWeek = 0
  const projMinutes = new Map<string, number>()
  for (const s of sessions ?? []) {
    const startMs = new Date(s.started_at).getTime()
    const endMs = s.ended_at ? new Date(s.ended_at).getTime() : now
    const mins = Math.max(0, (endMs - startMs) / 60000)
    focusMinutesWeek += mins
    if (formatInTimeZone(new Date(s.started_at), tz, "yyyy-MM-dd") === today) {
      focusMinutesToday += mins
    }
    const key = s.project_id ?? "__none"
    projMinutes.set(key, (projMinutes.get(key) ?? 0) + mins)
  }

  const pname = new Map((projects ?? []).map((p) => [p.id, p.name]))
  const byProject = [...projMinutes.entries()]
    .map(([key, minutes]) => ({
      name: key === "__none" ? "Без проекта" : pname.get(key) ?? "Проект",
      minutes,
    }))
    .sort((a, b) => b.minutes - a.minutes)

  const earnMap = new Map<string, number>()
  for (const t of earnTasks ?? []) {
    const cur = t.payout_currency ?? baseCurrency
    earnMap.set(cur, (earnMap.get(cur) ?? 0) + Number(t.payout_amount ?? 0))
  }
  const earnings = [...earnMap.entries()].map(([currency, amount]) => ({ currency, amount }))

  return {
    tz,
    focusGoalMin,
    baseCurrency,
    today,
    active,
    todayWork: todayWork ?? [],
    focusMinutesToday,
    focusMinutesWeek,
    byProject,
    earnings,
  }
}
