import { cn } from "@/lib/utils"

export function StreakHeatmap({
  days,
  dayGoal,
}: {
  days: { day: string; done: number }[]
  dayGoal: number
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => {
        const cls =
          d.done === 0
            ? "bg-muted"
            : d.done >= dayGoal
              ? "bg-success"
              : "bg-success/40"
        return (
          <div
            key={d.day}
            title={`${d.day}: закрыто ${d.done}`}
            className={cn("size-3.5 rounded-[3px]", cls)}
          />
        )
      })}
    </div>
  )
}
