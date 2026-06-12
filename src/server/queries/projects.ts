import { createClient } from "@/utils/supabase/server"
import { logged } from "@/server/queries/logged"
import type { Database } from "@/types/database.types"

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

export type ProjectWithProgress = ProjectRow & {
  tasksTotal: number
  tasksDone: number
}

export type TaskWithChecklist = TaskRow & {
  checklistTotal: number
  checklistDone: number
}

export async function listProjects(): Promise<ProjectWithProgress[]> {
  const supabase = await createClient()
  const [projects, tasks] = await Promise.all([
    logged(
      "listProjects",
      supabase.from("projects").select("*").order("created_at", { ascending: false })
    ),
    logged("listProjects.tasks", supabase.from("tasks").select("project_id, status")),
  ])

  const total = new Map<string, number>()
  const done = new Map<string, number>()
  for (const t of tasks ?? []) {
    if (!t.project_id) continue
    total.set(t.project_id, (total.get(t.project_id) ?? 0) + 1)
    if (t.status === "DONE") done.set(t.project_id, (done.get(t.project_id) ?? 0) + 1)
  }

  return (projects ?? []).map((p) => ({
    ...p,
    tasksTotal: total.get(p.id) ?? 0,
    tasksDone: done.get(p.id) ?? 0,
  }))
}

export async function getProject(
  id: string
): Promise<{ project: ProjectRow; tasks: TaskWithChecklist[] } | null> {
  const supabase = await createClient()
  const project = await logged(
    "getProject.project",
    supabase.from("projects").select("*").eq("id", id).single()
  )
  if (!project) return null

  // Порядок выполнения = position (как в канбане); чек-листы — для бейджа «n/m».
  const tasks = await logged(
    "getProject.tasks",
    supabase
      .from("tasks")
      .select("*, task_checklist_items(done)")
      .eq("project_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true })
  )

  return {
    project,
    tasks: (tasks ?? []).map(({ task_checklist_items, ...t }) => ({
      ...t,
      checklistTotal: task_checklist_items.length,
      checklistDone: task_checklist_items.filter((i) => i.done).length,
    })),
  }
}
