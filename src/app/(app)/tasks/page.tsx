import { listTasks } from "@/server/queries/tasks"
import { listProjects } from "@/server/queries/projects"
import { getProfile } from "@/server/queries/profile"
import { listAssets } from "@/server/queries/money"
import { todayInTz } from "@/lib/dates"
import { PageHeader } from "@/components/ui/page-header"
import { TaskViews } from "@/components/tasks/task-views"

export default async function TasksPage() {
  const [tasks, projects, profile, assets] = await Promise.all([
    listTasks(),
    listProjects(),
    getProfile(),
    listAssets(),
  ])
  const assetOpts = assets.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))
  const tz = profile?.timezone ?? "Asia/Tashkent"
  const baseCurrency = profile?.base_currency ?? "UZS"
  const today = todayInTz(tz)
  const projectOpts = projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="space-y-6">
      <PageHeader title="Задачи" description="Бэклог: список, канбан и таймлайн" />
      <TaskViews
        tasks={tasks}
        projects={projectOpts}
        today={today}
        tz={tz}
        baseCurrency={baseCurrency}
        assets={assetOpts}
      />
    </div>
  )
}
