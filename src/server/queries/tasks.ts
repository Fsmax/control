import { createClient } from "@/utils/supabase/server"
import { logged } from "@/server/queries/logged"
import type { Database } from "@/types/database.types"

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

// Бэклог: все задачи пользователя (RLS отфильтрует чужие), свежие сверху.
export async function listTasks(): Promise<TaskRow[]> {
  const supabase = await createClient()
  const data = await logged(
    "listTasks",
    supabase.from("tasks").select("*").order("created_at", { ascending: false })
  )
  return data ?? []
}
