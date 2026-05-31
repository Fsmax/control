"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

// Граница ошибок для защищённых страниц: вместо «мёртвой» страницы — понятное
// сообщение и кнопка повтора. error.message в проде урезается, но digest даёт
// привязку к серверному логу Vercel.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <AlertTriangle className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Не удалось загрузить страницу</h2>
        <p className="text-sm text-muted-foreground">
          Что-то пошло не так при загрузке данных. Попробуйте обновить.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70">код: {error.digest}</p>
        )}
      </div>
      <Button onClick={reset}>Обновить</Button>
    </div>
  )
}
