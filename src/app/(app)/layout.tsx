import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Topbar } from "@/components/layout/topbar"

// Граница авторизации: getUser() верифицирует токен на сервере Supabase.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <div className="flex min-h-svh">
      <Sidebar email={user.email ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar email={user.email ?? ""} />
        <MobileNav />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1600px] p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
