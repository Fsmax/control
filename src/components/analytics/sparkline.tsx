import { cn } from "@/lib/utils"

type SparkTone = "primary" | "success" | "danger" | "muted"

const STROKE: Record<SparkTone, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  danger: "var(--destructive)",
  muted: "var(--muted-foreground)",
}

/** Мини-график тренда (чистый SVG, без зависимостей). Для KPI-карточек. */
export function Sparkline({
  values,
  width = 100,
  height = 28,
  tone = "primary",
  className,
}: {
  values: number[]
  width?: number
  height?: number
  tone?: SparkTone
  className?: string
}) {
  if (values.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden />
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = width / (values.length - 1)
  const pad = 2
  const usable = height - pad * 2
  const pts = values.map((v, i) => {
    const x = i * stepX
    const y = pad + usable - ((v - min) / span) * usable
    return [x, y] as const
  })
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} ${width},${height} 0,${height}`
  const stroke = STROKE[tone]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <polygon points={area} fill={stroke} opacity={0.1} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
