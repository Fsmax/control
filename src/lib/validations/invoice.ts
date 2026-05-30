import { z } from "zod"

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД")
const optText = (max: number) => z.string().trim().max(max).nullable().optional()

export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const
export const invoiceStatusEnum = z.enum(INVOICE_STATUSES)

export const invoiceCreateSchema = z.object({
  number: z.string().trim().min(1, "Укажите номер").max(60),
  client_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  issue_date: ymd.optional(),
  due_date: ymd.nullable().optional(),
  amount: z.number().positive("Сумма должна быть больше 0"),
  currency: z.string().trim().min(1).max(8).default("UZS"),
  status: invoiceStatusEnum.default("DRAFT"),
  note: optText(2000),
})

export type InvoiceCreateInput = z.input<typeof invoiceCreateSchema>

export const invoiceUpdateSchema = invoiceCreateSchema.partial().extend({
  id: z.string().uuid(),
})

export type InvoiceUpdateInput = z.input<typeof invoiceUpdateSchema>
