"use server"

import { revalidatePath } from "next/cache"

import { createClient as createSupabase } from "@/utils/supabase/server"
import {
  clientCreateSchema,
  clientUpdateSchema,
  type ClientCreateInput,
  type ClientUpdateInput,
} from "@/lib/validations/client"

type Result = { success: boolean; error?: string; id?: string }

function revalidate(id?: string) {
  revalidatePath("/clients")
  revalidatePath("/")
  if (id) revalidatePath(`/clients/${id}`)
}

export async function createClient(input: ClientCreateInput): Promise<Result> {
  const supabase = await createSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = clientCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { data, error } = await supabase.from("clients").insert(parsed.data).select("id").single()
  if (error) return { success: false, error: error.message }

  revalidate(data?.id)
  return { success: true, id: data?.id }
}

export async function updateClient(input: ClientUpdateInput): Promise<Result> {
  const supabase = await createSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const parsed = clientUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Неверные данные" }
  }

  const { id, ...rest } = parsed.data
  const { error } = await supabase.from("clients").update(rest).eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate(id)
  return { success: true, id }
}

export async function deleteClient(id: string): Promise<Result> {
  const supabase = await createSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Не авторизован" }

  const { error } = await supabase.from("clients").delete().eq("id", id)
  if (error) return { success: false, error: error.message }

  revalidate()
  return { success: true }
}
