import { Flame } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  date: string // уже отформатированная человекочитаемая дата
  doneToday: number
  dayGoal: number
  planned: number
  plannedDone: number
  streak: number
}

function pluralDela(n: number): string {
  const a = n % 100
  const b = n % 10
  if (a > 10 && a < 20) return "дел"
  if (b === 1) return "дело"
  if (b > 1 && b < 5) return "дела"
  return "дел"
}

function pluralDney(n: number): string {
  const a = n % 100
  const b = n % 10
  if (a > 10 && a < 20) return "дней"
  if (b === 1) return "день"
  if (b > 1 && b < 5) return "дня"
  return "дней"
}

// Кольцо прогресса к цели дня (чистый SVG, без зависимостей).
function Ring({ pct, met, size = 92, stroke = 9 }: { pct: number; met: boolean; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, pct))
  const dash = (clamped / 100) * c

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={met ? "var(--success)" : "var(--primary)"}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        className="transition-[stroke-dasharray] duration-500"
      />
    </svg>
  )
}

export function DayHero({ date, doneToday, dayGoal, planned, plannedDone, streak }: Props) {
  const goalMet = doneToday >= dayGoal
  const goalPct = dayGoal > 0 ? (doneToday / dayGoal) * 100 : 0
  const planPct = planned > 0 ? Math.round((plannedDone / planned) * 100) : 0
  const remaining = Math.max(0, dayGoal - doneToday)

  return (
    <div className="space-y-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-4">
        <div className="relative grid shrink-0 place-items-center">
          <Ring pct={goalPct} met={goalMet} />
          <div className="absolute inset-0 grid place-content-center text-center">
            <div className="text-xl font-semibold leading-none tabular-nums">
              {doneToday}
              <span className="text-muted-foreground">/{dayGoal}</span>
            </div>
            <div className="mt-1 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
              цель дня
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs text-muted-foreground first-letter:uppercase">{date}</p>
          {goalMet ? (
            <p className="text-sm font-semibold text-success">Цель дня выполнена</p>
          ) : (
            <p className="text-sm font-semibold">
              Ещё <span className="tabular-nums">{remaining}</span> {pluralDela(remaining)}
            </p>
          )}
          <span
            title="Серия удачных дней подряд"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums",
              streak > 0 ? "border-warning/30 bg-warning/10 text-warning" : "border-border text-muted-foreground"
            )}
          >
            <Flame className="size-3.5" />
            {streak > 0 ? `${streak} ${pluralDney(streak)} подряд` : "серии нет"}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>План на день</span>
          <span className="font-medium tabular-nums text-foreground">
            {plannedDone}/{planned}
            {planned > 0 && <span className="ml-1 text-muted-foreground">· {planPct}%</span>}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${planPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
