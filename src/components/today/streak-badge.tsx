import { Flame } from "lucide-react"

import { Badge } from "@/components/ui/badge"

export function StreakBadge({
  current,
  dayGoal,
  doneToday,
}: {
  current: number
  dayGoal: number
  doneToday: number
}) {
  const goalMet = doneToday >= dayGoal

  return (
    <div className="flex items-center gap-2">
      <Badge variant={goalMet ? "default" : "secondary"} className="tabular-nums">
        сегодня {doneToday}/{dayGoal}
      </Badge>
      <Badge
        variant="outline"
        title="Серия удачных дней подряд"
        className="gap-1 tabular-nums"
      >
        <Flame className={current > 0 ? "size-3.5 text-warning" : "size-3.5 text-muted-foreground"} />
        {current}
      </Badge>
    </div>
  )
}
