import { z } from "zod"

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД")

export const debtCreateSchema = z.object({
  direction: z.enum(["I_OWE", "OWED_TO_ME"]),
  counterparty: z.string().trim().min(1, "Укажите контрагента").max(120),
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.string().trim().min(1).max(8),
  due_date: ymd.nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
})

export type DebtCreateInput = z.input<typeof debtCreateSchema>

export const debtPaymentSchema = z.object({
  debt_id: z.string().uuid(),
  amount: z.number().positive("Сумма должна быть больше 0"),
  date: ymd.optional(),
  note: z.string().trim().max(500).nullable().optional(),
})

export type DebtPaymentInput = z.input<typeof debtPaymentSchema>
