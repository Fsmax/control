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

const today: NavItem = { href: "/", label: "Сегодня", icon: CalendarCheck }
const tasks: NavItem = { href: "/tasks", label: "Задачи", icon: ListTodo }
const projects: NavItem = { href: "/projects", label: "Проекты", icon: FolderKanban }
const focus: NavItem = { href: "/focus", label: "Фокус", icon: Timer }
const money: NavItem = { href: "/money", label: "Деньги", icon: Wallet }
const progress: NavItem = { href: "/progress", label: "Прогресс", icon: TrendingUp }

export const NAV_SETTINGS: NavItem = { href: "/settings", label: "Настройки", icon: Settings }

// Сгруппированная навигация для сайдбара (CRM-стиль с секциями).
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Обзор", items: [today] },
  { label: "Работа", items: [tasks, projects, focus] },
  { label: "Финансы", items: [money] },
  { label: "Аналитика", items: [progress] },
]

// Плоский список (для мобильной навигации).
export const NAV: NavItem[] = [today, tasks, projects, focus, money, progress, NAV_SETTINGS]

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
