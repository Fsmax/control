import Link from "next/link"

import { Badge } from "@/components/ui/badge"

type Project = {
  id: string
  name: string
  area: "WORK" | "PERSONAL"
  status: "ACTIVE" | "ARCHIVED"
  description: string | null
}

export function ProjectCard({ project }: { project: Project }) {
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
    </Link>
  )
}
