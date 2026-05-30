"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { createClient } from "@/utils/supabase/server"

type Result = { success: boolean; error?: string }

// Останавливает активную сессию (если есть) и стартует новую — максимум одна активная.
export async function startFocus(
  taskId: string | null,
  projectId: string | null
): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  if (taskId && !z.string().uuid().safeParse(taskId).success) {
    return { success: false, error: "Неверный id задачи" }
  }
  if (projectId && !z.string().uuid().safeParse(projectId).success) {
    return { success: false, error: "Неверный id проекта" }
  }

  // закрыть текущую активную
  await supabase
    .from("focus_sessions")
    .update({ ended_at: new Date().toISOString() })
    .is("ended_at", null)

  // проект берём из задачи, если он не задан явно
  let pid = projectId
  if (taskId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("project_id")
      .eq("id", taskId)
      .single()
    pid = task?.project_id ?? null
  }

  const { error } = await supabase
    .from("focus_sessions")
    .insert({ task_id: taskId, project_id: pid })
  if (error) return { success: false, error: error.message }

  revalidatePath("/focus")
  return { success: true }
}

export async function stopFocus(): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase
    .from("focus_sessions")
    .update({ ended_at: new Date().toISOString() })
    .is("ended_at", null)
  if (error) return { success: false, error: error.message }

  revalidatePath("/focus")
  return { success: true }
}
