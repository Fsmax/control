"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

type Result = { success: boolean; error?: string }

const BUCKET = "attachments"
const MAX_FILE_BYTES = 10 * 1024 * 1024

function revalidate() {
  revalidatePath("/")
  revalidatePath("/tasks")
  revalidatePath("/projects")
  revalidatePath("/projects/[id]", "page")
}

export type ChecklistItem = { id: string; title: string; done: boolean; position: number }
export type AttachmentMeta = { id: string; name: string; size: number | null; created_at: string }
export type TaskExtras = { checklist: ChecklistItem[]; attachments: AttachmentMeta[] }

// Данные для диалога деталей задачи (чек-лист + вложения); чужое отсечёт RLS.
export async function getTaskExtras(taskId: string): Promise<TaskExtras | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [checklist, attachments] = await Promise.all([
    supabase
      .from("task_checklist_items")
      .select("id, title, done, position")
      .eq("task_id", taskId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("attachments")
      .select("id, name, size, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true }),
  ])

  return { checklist: checklist.data ?? [], attachments: attachments.data ?? [] }
}

export async function addChecklistItem(taskId: string, title: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const trimmed = title.trim()
  if (!trimmed || trimmed.length > 200) return { success: false, error: "Введите пункт (до 200 символов)" }

  const { count } = await supabase
    .from("task_checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId)

  const { error } = await supabase
    .from("task_checklist_items")
    .insert({ task_id: taskId, title: trimmed, position: (count ?? 0) + 1 })
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function toggleChecklistItem(id: string, done: boolean): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("task_checklist_items").update({ done }).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

export async function deleteChecklistItem(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("task_checklist_items").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}

// Файл уходит в приватный бакет через service_role (политик на storage нет —
// доступ только через эти actions); метаданные — через RLS-клиент.
export async function uploadAttachment(formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const taskId = String(formData.get("task_id") ?? "")
  const file = formData.get("file")
  if (!taskId || !(file instanceof File) || file.size === 0) {
    return { success: false, error: "Файл не выбран" }
  }
  if (file.size > MAX_FILE_BYTES) return { success: false, error: "Файл больше 10 МБ" }

  // Владение задачей: RLS вернёт пустоту для чужой.
  const { data: task } = await supabase.from("tasks").select("id").eq("id", taskId).maybeSingle()
  if (!task) return { success: false, error: "Задача не найдена" }

  const safeName = file.name.replace(/[^\p{L}\p{N}.\-_]+/gu, "_").slice(-120)
  const path = `${user.id}/${taskId}/${crypto.randomUUID()}-${safeName}`

  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (uploadError) return { success: false, error: uploadError.message }

  const { error } = await supabase.from("attachments").insert({
    task_id: taskId,
    path,
    name: file.name,
    size: file.size,
    mime: file.type || null,
  })
  if (error) {
    await admin.storage.from(BUCKET).remove([path])
    return { success: false, error: error.message }
  }

  revalidate()
  return { success: true }
}

export async function attachmentUrl(id: string): Promise<Result & { url?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { data: row } = await supabase
    .from("attachments")
    .select("path, name")
    .eq("id", id)
    .maybeSingle()
  if (!row) return { success: false, error: "Вложение не найдено" }

  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(row.path, 600, { download: row.name })
  if (error || !data) return { success: false, error: error?.message ?? "Не удалось создать ссылку" }

  return { success: true, url: data.signedUrl }
}

export async function deleteAttachment(id: string): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { data: row } = await supabase
    .from("attachments")
    .select("path")
    .eq("id", id)
    .maybeSingle()
  if (!row) return { success: false, error: "Вложение не найдено" }

  const { error } = await supabase.from("attachments").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  const admin = createAdminClient()
  await admin.storage.from(BUCKET).remove([row.path])

  revalidate()
  return { success: true }
}
