import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Project = {
  id: string
  name: string
  area: "WORK" | "PERSONAL"
  status: "ACTIVE" | "ARCHIVED"
  description: string | null
  tasksTotal: number
  tasksDone: number
}

export function ProjectCard({ project }: { project: Project }) {
  const { tasksTotal, tasksDone } = project
  const pct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : null

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-foreground/15 hover:bg-accent/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">{project.name}</span>
        <Badge variant="secondary">
          {project.area === "WORK" ? "Работа" : "Личное"}
        </Badge>
      </div>
      {project.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      )}
      {pct !== null && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {tasksDone} из {tasksTotal} задач
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-success" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  )
}
