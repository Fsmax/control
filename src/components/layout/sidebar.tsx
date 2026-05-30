"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, PanelLeftClose, PanelLeftOpen, Zap } from "lucide-react"

import { signOut } from "@/server/actions/auth"
import { cn } from "@/lib/utils"
import { NAV_GROUPS, NAV_SETTINGS, isActive, type NavItem } from "@/components/layout/nav-items"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- Свёрнутость сайдбара: внешнее хранилище (localStorage) через useSyncExternalStore.
// Без setState-в-эффекте и без hydration-mismatch (на сервере — развёрнут).
const KEY = "fintask:sidebar-collapsed"
const listeners = new Set<() => void>()
function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function getCollapsed() {
  return typeof window !== "undefined" && window.localStorage.getItem(KEY) === "1"
}
function toggleCollapsed() {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, getCollapsed() ? "0" : "1")
  listeners.forEach((l) => l())
}
function useCollapsed() {
  return useSyncExternalStore(subscribe, getCollapsed, () => false)
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem
  active: boolean
  collapsed: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center rounded-lg text-[15px] transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />}
      <Icon
        className={cn(
          "size-5 shrink-0",
          active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

export function Sidebar({ email, currentPath }: { email: string; currentPath?: string }) {
  const realPath = usePathname()
  const pathname = currentPath ?? realPath
  const collapsed = useCollapsed()
  const initial = email.charAt(0).toUpperCase() || "?"

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex",
        collapsed ? "w-16" : "w-[17rem]"
      )}
    >
      {/* Бренд + сворачивание */}
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-3", collapsed && "justify-center px-0")}>
        {!collapsed && (
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Zap className="size-4.5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold leading-tight tracking-tight">Control</div>
            </div>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
          title={collapsed ? "Развернуть" : "Свернуть"}
          className={cn(
            "grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            !collapsed && "ml-auto"
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
        </button>
      </div>

      {/* Навигация по группам */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-0.5">
            {!collapsed && (
              <div className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* Низ: настройки + аккаунт */}
      <div className="space-y-1 border-t border-sidebar-border p-2">
        <NavLink
          item={NAV_SETTINGS}
          active={isActive(pathname, NAV_SETTINGS.href)}
          collapsed={collapsed}
        />

        <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "px-1 pt-1")}>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{email}</div>
                  <div className="text-[11px] text-muted-foreground">Аккаунт</div>
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel className="truncate font-normal">{email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem render={<button type="submit" />} variant="destructive" className="w-full">
                  <LogOut className="size-4" />
                  Выйти
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
          {!collapsed && <ThemeToggle />}
        </div>
      </div>
    </aside>
  )
}
