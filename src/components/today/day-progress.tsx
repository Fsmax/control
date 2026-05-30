import { Progress } from "@/components/ui/progress"

export function DayProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">Прогресс дня</span>
        <span className="font-medium tabular-nums">
          {done}/{total}
          {total > 0 && <span className="ml-1 text-muted-foreground">· {pct}%</span>}
        </span>
      </div>
      <Progress value={pct} className="w-full" />
    </div>
  )
}
