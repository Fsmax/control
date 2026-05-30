"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Column<T> = {
  key: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Включает сортировку по колонке. */
  sortValue?: (row: T) => string | number
  align?: "left" | "right" | "center"
  className?: string
  headClassName?: string
}

type SortState = { key: string; dir: "asc" | "desc" } | null

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const

/**
 * Плотная таблица данных: единый стиль шапки, сортировка по клику, hover,
 * опциональная навигация по строке. Основа всех списков (клиенты, сделки, счета…).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  rowHref,
  initialSort,
  empty,
  className,
}: {
  columns: Column<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  rowHref?: (row: T) => string
  initialSort?: { key: string; dir: "asc" | "desc" }
  empty?: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  const [sort, setSort] = useState<SortState>(initialSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const dir = sort.dir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }, [rows, sort, columns])

  function toggleSort(key: string) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" }
      if (s.dir === "asc") return { key, dir: "desc" }
      return null
    })
  }

  if (rows.length === 0 && empty) {
    return <>{empty}</>
  }

  return (
    <div className={cn("overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10", className)}>
      <Table>
        <TableHeader>
          <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
            {columns.map((col) => {
              const active = sort?.key === col.key
              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-9 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                    col.align && alignClass[col.align],
                    col.headClassName
                  )}
                >
                  {col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                        col.align === "right" && "flex-row-reverse",
                        active && "text-foreground"
                      )}
                    >
                      {col.header}
                      {!active && <ChevronsUpDown className="size-3 opacity-50" />}
                      {active && sort?.dir === "asc" && <ChevronUp className="size-3" />}
                      {active && sort?.dir === "desc" && <ChevronDown className="size-3" />}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row) => {
            const href = rowHref?.(row)
            return (
              <TableRow
                key={getRowKey(row)}
                className={cn(href && "cursor-pointer")}
                onClick={href ? () => router.push(href) : undefined}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn("py-2.5", col.align && alignClass[col.align], col.className)}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
