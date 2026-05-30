"use client"

import { useActionState, useState } from "react"
import { Zap } from "lucide-react"

import { signInWithPassword, signUpWithPassword } from "@/server/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Mode = "signin" | "signup"
type AuthState = { error?: string; message?: string }

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin")
  const action = mode === "signin" ? signInWithPassword : signUpWithPassword
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {}
  )

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Zap className="size-6" />
          </div>
          <CardTitle className="text-xl">Control</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Дисциплина и контроль. Войдите, чтобы продолжить."
              : "Создайте аккаунт, чтобы начать."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form action={formAction} className="flex flex-col gap-3">
            <Input
              type="email"
              name="email"
              placeholder="E-mail"
              autoComplete="email"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Пароль"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={8}
              required
            />
            <Button type="submit" disabled={pending} className="w-full">
              {pending
                ? "Подождите…"
                : mode === "signin"
                  ? "Войти"
                  : "Зарегистрироваться"}
            </Button>
          </form>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.message && <p className="text-sm text-success">{state.message}</p>}

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "Нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
