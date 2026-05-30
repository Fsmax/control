import { NotificationPrompt } from "@/components/layout/notification-prompt"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"

export function Header({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
      <span className="font-semibold tracking-tight md:hidden">FinTask</span>
      <div className="ml-auto flex items-center gap-2">
        <NotificationPrompt />
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  )
}
