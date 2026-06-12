import { notFound } from "next/navigation"

import { getProject } from "@/server/queries/projects"
import { getProfile } from "@/server/queries/profile"
import { listAssets } from "@/server/queries/money"
import { todayInTz } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskTable } from "@/components/tasks/task-table"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [data, profile, assets] = await Promise.all([
    getProject(id),
    getProfile(),
    listAssets(),
  ])
  if (!data) notFound()

  const tz = profile?.timezone ?? "Asia/Tashkent"
  const baseCurrency = profile?.base_currency ?? "UZS"
  const today = todayInTz(tz)
  const projectOpts = [{ id: data.project.id, name: data.project.name }]
  const assetOpts = assets.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))

  const total = data.tasks.length
  const done = data.tasks.filter((t) => t.status === "DONE").length
  const pct = total > 0 ? Math.round((done / total) * 100) : null
  const stages = [...new Set(data.tasks.map((t) => t.stage).filter((s): s is string => !!s))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{data.project.name}</h1>
          <Badge variant="secondary">
            {data.project.area === "WORK" ? "Работа" : "Личное"}
          </Badge>
        </div>
        <TaskForm
          projects={projectOpts}
          defaultProjectId={data.project.id}
          tz={tz}
          baseCurrency={baseCurrency}
          stages={stages}
        />
      </div>

      {data.project.description && (
        <p className="text-sm text-muted-foreground">{data.project.description}</p>
      )}

      {pct !== null && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Прогресс проекта</span>
            <span className="tabular-nums text-muted-foreground">
              {done} из {total} задач · {pct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-success" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <TaskTable
        tasks={data.tasks}
        projects={projectOpts}
        today={today}
        assets={assetOpts}
        groupByStage
      />
    </div>
  )
}
