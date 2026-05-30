"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  ListTodo,
  FolderKanban,
  Users,
  Briefcase,
  FileText,
  HandCoins,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { NAV } from "@/components/layout/nav-items"

const EVENT = "fintask:command"

/** Открыть командную палитру из любого места (кнопка поиска, «Создать»). */
export function openCommandPalette() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT))
}

type Cmd = {
  id: string
  label: string
  group: string
  icon: LucideIcon
  href: string
  keywords?: string
}

const CREATE: Cmd[] = [
  { id: "c-task", label: "Новая задача", group: "Создать", icon: ListTodo, href: "/tasks?new=1" },
  { id: "c-client", label: "Новый клиент", group: "Создать", icon: Users, href: "/clients?new=1" },
  { id: "c-deal", label: "Новая сделка", group: "Создать", icon: Briefcase, href: "/deals?new=1" },
  { id: "c-invoice", label: "Новый счёт", group: "Создать", icon: FileText, href: "/invoices?new=1" },
  { id: "c-project", label: "Новый проект", group: "Создать", icon: FolderKanban, href: "/projects?new=1" },
  { id: "c-debt", label: "Новый долг", group: "Создать", icon: HandCoins, href: "/money/debts?new=1" },
  { id: "c-asset", label: "Новый актив", group: "Создать", icon: Wallet, href: "/money/assets?new=1" },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Команды: переход по разделам + быстрое создание.
  const commands = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = NAV.map((n) => ({
      id: `nav-${n.href}`,
      label: n.label,
      group: "Переход",
      icon: n.icon,
      href: n.href,
    }))
    return [...CREATE, ...nav]
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q)
    )
  }, [commands, query])

  const openPalette = useCallback(() => {
    setQuery("")
    setActive(0)
    setOpen(true)
  }, [])

  // Кастомное событие из топбара («Поиск…») открывает палитру.
  useEffect(() => {
    window.addEventListener(EVENT, openPalette)
    return () => window.removeEventListener(EVENT, openPalette)
  }, [openPalette])

  // ⌘K / Ctrl+K — открыть/закрыть.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (open) setOpen(false)
        else openPalette()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, openPalette])

  // Фокус в поле после монтирования попапа (DOM-синхронизация, не setState).
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  function run(cmd: Cmd | undefined) {
    if (!cmd) return
    setOpen(false)
    router.push(cmd.href)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      run(filtered[active])
    }
  }

  // Группировка с сохранением порядка.
  const groups = useMemo(() => {
    const out: { label: string; items: { cmd: Cmd; index: number }[] }[] = []
    filtered.forEach((cmd, index) => {
      let g = out.find((x) => x.label === cmd.group)
      if (!g) {
        g = { label: cmd.group, items: [] }
        out.push(g)
      }
      g.items.push({ cmd, index })
    })
    return out
  }, [filtered])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="top-24 max-w-lg translate-y-0 gap-0 p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Командная палитра</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onInputKey}
            placeholder="Поиск разделов и действий…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">Ничего не найдено</div>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-1">
                <div className="px-2 py-1 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                  {g.label}
                </div>
                {g.items.map(({ cmd, index }) => {
                  const Icon = cmd.icon
                  const isCreate = cmd.group === "Создать"
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => run(cmd)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors",
                        index === active ? "bg-accent text-accent-foreground" : "text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-md",
                          isCreate ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {isCreate ? <Plus className="size-3.5" /> : <Icon className="size-3.5" />}
                      </span>
                      <span className="truncate">{cmd.label}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
