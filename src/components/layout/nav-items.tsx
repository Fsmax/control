import {
  CalendarCheck,
  ListTodo,
  FolderKanban,
  Timer,
  Wallet,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { href: string; label: string; icon: LucideIcon }

export const NAV: NavItem[] = [
  { href: "/", label: "Сегодня", icon: CalendarCheck },
  { href: "/tasks", label: "Задачи", icon: ListTodo },
  { href: "/projects", label: "Проекты", icon: FolderKanban },
  { href: "/focus", label: "Фокус", icon: Timer },
  { href: "/money", label: "Деньги", icon: Wallet },
  { href: "/progress", label: "Прогресс", icon: TrendingUp },
  { href: "/settings", label: "Настройки", icon: Settings },
]

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
