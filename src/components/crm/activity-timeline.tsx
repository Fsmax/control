import { Phone, Users, Mail, StickyNote, type LucideIcon } from "lucide-react"

import type { Database } from "@/types/database.types"
import { EmptyState } from "@/components/ui/empty-state"

type ActivityRow = Database["public"]["Tables"]["activities"]["Row"]

const META: Record<string, { label: string; icon: LucideIcon; tone: string }> = {
  CALL: { label: "Звонок", icon: Phone, tone: "bg-primary/10 text-primary" },
  MEETING: { label: "Встреча", icon: Users, tone: "bg-warning/10 text-warning" },
  EMAIL: { label: "Письмо", icon: Mail, tone: "bg-chart-2/15 text-chart-2" },
  NOTE: { label: "Заметка", icon: StickyNote, tone: "bg-muted text-muted-foreground" },
}

function when(iso: string): string {
  return iso.slice(0, 16).replace("T", " ")
}

export function ActivityTimeline({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return <EmptyState icon={StickyNote} title="Нет активностей" description="Запишите звонок, встречу или заметку." />
  }

  return (
    <ul className="space-y-3">
      {activities.map((a) => {
        const m = META[a.type] ?? META.NOTE
        const Icon = m.icon
        return (
          <li key={a.id} className="flex gap-3">
            <div className={`grid size-7 shrink-0 place-items-center rounded-full ${m.tone}`}>
              <Icon className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1 border-b pb-3">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{a.subject}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{when(a.occurred_at)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{m.label}</div>
              {a.body && <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
