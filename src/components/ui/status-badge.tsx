import { cn } from "@/lib/utils"

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger"

const TONE: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/25 bg-destructive/10 text-destructive",
}

/** Цветная статус-пилюля. Цвет несёт смысл (готово/просрочено/в работе). */
export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 w-fit shrink-0 items-center gap-1 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

type Meta = { label: string; tone: Tone }

// --- Доменные карты статусов (используются по всему приложению) ----------------

export const DEAL_STAGE: Record<string, Meta> = {
  LEAD: { label: "Лид", tone: "neutral" },
  QUALIFIED: { label: "Квалификация", tone: "primary" },
  PROPOSAL: { label: "КП / Смета", tone: "primary" },
  NEGOTIATION: { label: "Переговоры", tone: "warning" },
  WON: { label: "Выиграна", tone: "success" },
  LOST: { label: "Проиграна", tone: "danger" },
}

export const INVOICE_STATUS: Record<string, Meta> = {
  DRAFT: { label: "Черновик", tone: "neutral" },
  SENT: { label: "Выставлен", tone: "primary" },
  PAID: { label: "Оплачен", tone: "success" },
  OVERDUE: { label: "Просрочен", tone: "danger" },
  CANCELLED: { label: "Отменён", tone: "neutral" },
}

export const CLIENT_STATUS: Record<string, Meta> = {
  LEAD: { label: "Лид", tone: "warning" },
  ACTIVE: { label: "Активный", tone: "success" },
  INACTIVE: { label: "Неактивный", tone: "neutral" },
}

export const CLIENT_KIND: Record<string, Meta> = {
  COMPANY: { label: "Организация", tone: "neutral" },
  INDIVIDUAL: { label: "Физлицо", tone: "neutral" },
}

export const PRIORITY: Record<string, Meta> = {
  LOW: { label: "Низкий", tone: "neutral" },
  MEDIUM: { label: "Средний", tone: "warning" },
  HIGH: { label: "Высокий", tone: "danger" },
}

export const TASK_STATUS: Record<string, Meta> = {
  TODO: { label: "К выполнению", tone: "neutral" },
  IN_PROGRESS: { label: "В работе", tone: "primary" },
  DONE: { label: "Готово", tone: "success" },
}

/** Удобный помощник: <DomainBadge map={DEAL_STAGE} value={stage} /> */
export function DomainBadge({
  map,
  value,
  className,
}: {
  map: Record<string, Meta>
  value: string
  className?: string
}) {
  const meta = map[value] ?? { label: value, tone: "neutral" as Tone }
  return (
    <StatusBadge tone={meta.tone} className={className}>
      {meta.label}
    </StatusBadge>
  )
}
