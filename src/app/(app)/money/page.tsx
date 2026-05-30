import Link from "next/link"
import {
  Wallet,
  Scale,
  ArrowDownLeft,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react"

import { getMoneySummary, type CurrencyAmount } from "@/server/queries/money"
import { cn, formatMoney } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Tone = "neutral" | "positive" | "negative" | "auto"

function Amounts({ items, tone = "neutral" }: { items: CurrencyAmount[]; tone?: Tone }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">—</p>
  }
  return (
    <div className="space-y-0.5">
      {items.map((i) => {
        const sign =
          tone === "auto" ? (i.amount >= 0 ? "positive" : "negative") : tone
        return (
          <div
            key={i.currency}
            className={cn(
              "text-base font-semibold tabular-nums",
              sign === "positive" && "text-success",
              sign === "negative" && "text-destructive"
            )}
          >
            {formatMoney(i.amount, i.currency)}
          </div>
        )
      })}
    </div>
  )
}

function MoneyCard({
  title,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string
  icon: LucideIcon
  iconClass?: string
  children: React.ReactNode
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className={cn("size-4", iconClass)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default async function MoneyPage() {
  const s = await getMoneySummary()

  const navLink =
    "rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Деньги</h1>
        <nav className="flex gap-1">
          <Link href="/money/debts" className={navLink}>
            Долги
          </Link>
          <Link href="/money/assets" className={navLink}>
            Активы
          </Link>
          <Link href="/money/recurring" className={navLink}>
            Регулярные
          </Link>
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MoneyCard title="Капитал (активы)" icon={Wallet}>
          <Amounts items={s.capital} />
        </MoneyCard>
        <MoneyCard title="Чистыми" icon={Scale}>
          <Amounts items={s.net} tone="auto" />
        </MoneyCard>
        <MoneyCard title="Мне должны" icon={ArrowDownLeft} iconClass="text-success">
          <Amounts items={s.owedToMe} tone="positive" />
        </MoneyCard>
        <MoneyCard title="Я должен" icon={ArrowUpRight} iconClass="text-destructive">
          <Amounts items={s.iOwe} tone="negative" />
        </MoneyCard>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ближайшие регулярные
          </CardTitle>
        </CardHeader>
        <CardContent>
          {s.upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {s.upcoming.map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {r.name} · {r.next_date}
                  </span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      r.kind === "INCOME" ? "text-success" : "text-destructive"
                    )}
                  >
                    {r.kind === "INCOME" ? "+" : "−"}
                    {formatMoney(Number(r.amount), r.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
