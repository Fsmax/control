"use client"

import Link from "next/link"
import {
  Plus,
  ListTodo,
  Users,
  Briefcase,
  FileText,
  FolderKanban,
  HandCoins,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Item = { label: string; href: string; icon: LucideIcon }

const PRIMARY: Item[] = [
  { label: "Клиент", href: "/clients?new=1", icon: Users },
  { label: "Сделка", href: "/deals?new=1", icon: Briefcase },
  { label: "Счёт", href: "/invoices?new=1", icon: FileText },
]

const SECONDARY: Item[] = [
  { label: "Задача", href: "/tasks?new=1", icon: ListTodo },
  { label: "Проект", href: "/projects?new=1", icon: FolderKanban },
  { label: "Долг", href: "/money/debts?new=1", icon: HandCoins },
  { label: "Актив", href: "/money/assets?new=1", icon: Wallet },
]

export function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        <span className="hidden sm:inline">Создать</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>CRM</DropdownMenuLabel>
        {PRIMARY.map((i) => (
          <DropdownMenuItem key={i.href} render={<Link href={i.href} />}>
            <i.icon className="size-4" />
            {i.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Работа и деньги</DropdownMenuLabel>
        {SECONDARY.map((i) => (
          <DropdownMenuItem key={i.href} render={<Link href={i.href} />}>
            <i.icon className="size-4" />
            {i.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
