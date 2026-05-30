import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

/**
 * Заголовок страницы в стиле рабочего пульта: крошки сверху, крупный титул,
 * описание и слот действий справа. Используется на всех экранах вместо
 * одиночного <h1>, чтобы держать единую плотную иерархию.
 */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  className,
}: {
  title: string
  description?: string
  crumbs?: Crumb[]
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        {crumbs && crumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3 opacity-60" />}
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
