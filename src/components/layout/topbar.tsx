"use client"

import { Search } from "lucide-react"

import { CommandPalette, openCommandPalette } from "@/components/layout/command-palette"
import { NotificationPrompt } from "@/components/layout/notification-prompt"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"

/**
 * Верхняя командная панель: глобальный поиск/⌘K, «Создать», напоминания.
 * Тема и аккаунт на десктопе живут в сайдбаре; в топбаре — только на мобильных.
 * Заголовок страницы несёт PageHeader внутри самой страницы.
 */
export function Topbar({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
      <span className="font-semibold tracking-tight md:hidden">Control</span>

      <button
        type="button"
        onClick={openCommandPalette}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Поиск разделов и действий…</span>
        <kbd className="hidden items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <NotificationPrompt />
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <UserMenu email={email} />
        </div>
      </div>

      <CommandPalette />
    </header>
  )
}
