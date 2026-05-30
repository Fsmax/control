"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import {
  taskCreateSchema,
  taskUpdateSchema,
  type TaskCreateInput,
  type TaskUpdateInput,
} from "@/lib/validations/task"

type Result = { success: boolean; error?: string }

function revalidate() {
  revalidatePath("/")
  revalidatePath("/tasks")
}

export async function createTask(input: TaskCreateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = taskCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { error } = await supabase.from("tasks").insert(parsed.data)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function updateTask(input: TaskUpdateInput): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = taskUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { id, ...patch } = parsed.data
  const { error } = await supabase.from("tasks").update(patch).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function toggleDone(id: string, done: boolean): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase
    .from("tasks")
    .update({ status: done ? "DONE" : "TODO" })
    .eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

// Запланировать задачу на дату (или снять из плана: null).
export async function scheduleTask(id: string, scheduledFor: string | null): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase
    .from("tasks")
    .update({ scheduled_for: scheduledFor })
    .eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function setTaskStatus(
  id: string,
  status: "TODO" | "IN_PROGRESS" | "DONE"
): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("tasks").update({ status }).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteTask(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}
