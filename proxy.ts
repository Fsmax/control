import { type NextRequest } from "next/server"

import { updateSession } from "@/utils/supabase/middleware"

// Next 16: бывш. middleware.ts. Только обновляет токены — НЕ граница авторизации.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Всё, кроме статики и картинок.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
