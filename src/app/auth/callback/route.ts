import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"

// Обмен OAuth-кода на сессию. Supabase редиректит сюда после провайдера.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // Только относительные пути — защита от open-redirect (не допускаем // и абсолютные URL).
  const nextParam = searchParams.get("next") ?? "/"
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
