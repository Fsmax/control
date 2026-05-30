import { notFound } from "next/navigation"

import { getProject } from "@/server/queries/projects"
import { getProfile } from "@/server/queries/profile"
import { todayInTz } from "@/lib/dates"
import { Badge } from "@/components/ui/badge"
import { TaskForm } from "@/components/tasks/task-form"
import { TaskList } from "@/components/tasks/task-list"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [data, profile] = await Promise.all([getProject(id), getProfile()])
  if (!data) notFound()

  const tz = profile?.timezone ?? "Asia/Tashkent"
  const baseCurrency = profile?.base_currency ?? "UZS"
  const today = todayInTz(tz)
  const projectOpts = [{ id: data.project.id, name: data.project.name }]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
        />
      </div>

      {data.project.description && (
        <p className="text-sm text-muted-foreground">{data.project.description}</p>
      )}

      <TaskList tasks={data.tasks} projects={projectOpts} today={today} />
    </div>
  )
}
