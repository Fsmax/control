import Link from "next/link"
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Sparkline } from "@/components/analytics/sparkline"

/**
 * KPI-карточка для дашборда: метка, крупное число, опциональная дельта/тренд,
 * подпись, иконка и спарклайн. Главная рабочая единица аналитического пульта.
 */
export function StatCard({
  label,
  value,
  hint,
  sub,
  delta,
  icon: Icon,
  spark,
  sparkTone = "primary",
  href,
  accent,
  className,
}: {
  label: string
  value: React.ReactNode
  /** Мелкая приписка справа от значения (напр. «+1» — есть суммы в других валютах). */
  hint?: string
  sub?: string
  /** Дельта в процентах: >0 зелёная со стрелкой вверх, <0 красная вниз. */
  delta?: number
  icon?: LucideIcon
  spark?: number[]
  sparkTone?: "primary" | "success" | "danger" | "muted"
  href?: string
  /** Цвет крупного значения (для денежных метрик: положительно/отрицательно). */
  accent?: "default" | "success" | "danger"
  className?: string
}) {
  const positive = (delta ?? 0) >= 0
  const body = (
    <div
      className={cn(
        "flex h-full flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors",
        href && "hover:bg-accent/40",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      </div>

      <div
        className={cn(
          "text-2xl font-semibold tracking-tight tabular-nums",
          accent === "success" && "text-success",
          accent === "danger" && "text-destructive"
        )}
      >
        {value}
        {hint && (
          <span
            className="ml-1 align-middle text-xs font-medium text-muted-foreground"
            title="Есть суммы в других валютах"
          >
            {hint}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
                positive ? "text-success" : "text-destructive"
              )}
            >
              {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(delta).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%
            </span>
          )}
          {sub && <span className="truncate text-xs text-muted-foreground">{sub}</span>}
        </div>
        {spark && spark.length > 1 && <Sparkline values={spark} tone={sparkTone} className="shrink-0" />}
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  )
}
