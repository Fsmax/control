import { createClient } from "@/utils/supabase/server"
import { logged } from "@/server/queries/logged"
import type { Database } from "@/types/database.types"

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]
type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

export async function listProjects(): Promise<ProjectRow[]> {
  const supabase = await createClient()
  const data = await logged(
    "listProjects",
    supabase.from("projects").select("*").order("created_at", { ascending: false })
  )
  return data ?? []
}

export async function getProject(
  id: string
): Promise<{ project: ProjectRow; tasks: TaskRow[] } | null> {
  const supabase = await createClient()
  const project = await logged(
    "getProject.project",
    supabase.from("projects").select("*").eq("id", id).single()
  )
  if (!project) return null

  const tasks = await logged(
    "getProject.tasks",
    supabase.from("tasks").select("*").eq("project_id", id).order("created_at", { ascending: false })
  )

  return { project, tasks: tasks ?? [] }
}
