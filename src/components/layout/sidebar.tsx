"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Target } from "lucide-react"

import { cn } from "@/lib/utils"
import { NAV, isActive } from "@/components/layout/nav-items"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-3 md:flex">
      <div className="flex items-center gap-2.5 px-2 py-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Target className="size-4.5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">FinTask</span>
      </div>
      <nav className="mt-3 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              {active && (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
              )}
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
