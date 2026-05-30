import { listTasks } from "@/server/queries/tasks"
import { listProjects } from "@/server/queries/projects"
import { getProfile } from "@/server/queries/profile"
import { todayInTz } from "@/lib/dates"
import { TaskViews } from "@/components/tasks/task-views"

export default async function TasksPage() {
  const [tasks, projects, profile] = await Promise.all([
    listTasks(),
    listProjects(),
    getProfile(),
  ])
  const tz = profile?.timezone ?? "Asia/Tashkent"
  const baseCurrency = profile?.base_currency ?? "UZS"
  const today = todayInTz(tz)
  const projectOpts = projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Задачи</h1>
      <TaskViews
        tasks={tasks}
        projects={projectOpts}
        today={today}
        tz={tz}
        baseCurrency={baseCurrency}
      />
    </div>
  )
}
