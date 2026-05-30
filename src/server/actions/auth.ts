"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"
import { credentialsSchema } from "@/lib/validations/auth"

type AuthResult = { error?: string; message?: string }

// Вход по e-mail и паролю. Сессия пишется в cookie серверным клиентом.
export async function signInWithPassword(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: "Неверный e-mail или пароль" }

  redirect("/")
}

// Регистрация по e-mail и паролю. Если подтверждение почты отключено — сразу есть сессия.
export async function signUpWithPassword(
  _prev: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp(parsed.data)
  if (error) return { error: error.message }

  // Подтверждение почты включено: пользователь создан, но сессии ещё нет.
  if (!data.session) {
    return { message: "Аккаунт создан. Проверьте почту и подтвердите e-mail." }
  }

  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
