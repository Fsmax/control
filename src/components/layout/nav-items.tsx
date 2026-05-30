import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Briefcase,
  FileText,
  ListTodo,
  FolderKanban,
  Timer,
  Wallet,
  LineChart,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { href: string; label: string; icon: LucideIcon }

const dashboard: NavItem = { href: "/", label: "Дашборд", icon: LayoutDashboard }
const today: NavItem = { href: "/today", label: "Сегодня", icon: CalendarCheck }

const clients: NavItem = { href: "/clients", label: "Клиенты", icon: Users }
const deals: NavItem = { href: "/deals", label: "Сделки", icon: Briefcase }
const invoices: NavItem = { href: "/invoices", label: "Счета", icon: FileText }

const tasks: NavItem = { href: "/tasks", label: "Задачи", icon: ListTodo }
const projects: NavItem = { href: "/projects", label: "Проекты", icon: FolderKanban }
const focus: NavItem = { href: "/focus", label: "Фокус", icon: Timer }

const money: NavItem = { href: "/money", label: "Деньги", icon: Wallet }
const progress: NavItem = { href: "/progress", label: "Прогресс", icon: LineChart }

export const NAV_SETTINGS: NavItem = { href: "/settings", label: "Настройки", icon: Settings }

// Сгруппированная навигация для сайдбара (CRM-стиль с секциями).
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Обзор", items: [dashboard, today] },
  { label: "CRM", items: [clients, deals, invoices] },
  { label: "Работа", items: [tasks, projects, focus] },
  { label: "Финансы", items: [money] },
  { label: "Аналитика", items: [progress] },
]

// Плоский список (для мобильной навигации и командной палитры).
export const NAV: NavItem[] = [
  dashboard,
  today,
  clients,
  deals,
  invoices,
  tasks,
  projects,
  focus,
  money,
  progress,
  NAV_SETTINGS,
]

export function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}
