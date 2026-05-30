export function ProjectTimeTable({ rows }: { rows: { name: string; minutes: number }[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">За неделю нет сессий фокуса.</p>
  }

  return (
    <ul className="space-y-1 text-sm">
      {rows.map((r, i) => (
        <li key={i} className="flex justify-between gap-2">
          <span className="truncate">{r.name}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {(Math.round((r.minutes / 60) * 10) / 10).toLocaleString("ru-RU")} ч
          </span>
        </li>
      ))}
    </ul>
  )
}
