"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export type ChartPoint = { label: string; value: number }
export type DonutSlice = { label: string; value: number; color?: string }

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

type TipEntry = { name?: string; value?: number | string; color?: string }

// Тултип на токенах темы (recharts по умолчанию рисует белый блок — плохо в тёмной теме).
function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean
  payload?: TipEntry[]
  label?: string
  format?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      {label && <div className="mb-1 font-medium">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 tabular-nums">
          {p.color && <span className="size-2 rounded-full" style={{ background: p.color }} />}
          {p.name && <span className="text-muted-foreground">{p.name}</span>}
          <span className="ml-auto font-medium">
            {typeof p.value === "number" && format ? format(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const AXIS = { fontSize: 11 } as const

export function AreaTrend({
  data,
  height = 240,
  format,
}: {
  data: ChartPoint[]
  height?: number
  format?: (v: number) => string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="ft-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={format ? (v) => format(Number(v)) : undefined}
        />
        <Tooltip content={<ChartTooltip format={format} />} cursor={{ stroke: "var(--border)" }} />
        <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="url(#ft-area)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BarSeries({
  data,
  height = 240,
  format,
}: {
  data: ChartPoint[]
  height?: number
  format?: (v: number) => string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <Tooltip content={<ChartTooltip format={format} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Donut({
  data,
  height = 240,
  format,
}: {
  data: DonutSlice[]
  height?: number
  format?: (v: number) => string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((s, i) => (
            <Cell key={i} fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip format={format} />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
