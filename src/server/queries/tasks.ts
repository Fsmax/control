import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/types/database.types"

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"]

// Бэклог: все задачи пользователя (RLS отфильтрует чужие), свежие сверху.
export async function listTasks(): Promise<TaskRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false })
  return data ?? []
}
