import { z } from "zod"

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД")

export const recurringCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  kind: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.string().trim().min(1).max(8),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
  next_date: ymd,
  note: z.string().trim().max(2000).nullable().optional(),
})

export type RecurringCreateInput = z.input<typeof recurringCreateSchema>
