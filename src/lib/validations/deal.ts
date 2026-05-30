import { z } from "zod"

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД")
const optText = (max: number) => z.string().trim().max(max).nullable().optional()

export const DEAL_STAGES = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const
export const dealStageEnum = z.enum(DEAL_STAGES)

export const dealCreateSchema = z.object({
  title: z.string().trim().min(1, "Укажите название").max(200),
  client_id: z.string().uuid().nullable().optional(),
  stage: dealStageEnum.default("LEAD"),
  amount: z.number().nonnegative("Сумма не может быть отрицательной").default(0),
  currency: z.string().trim().min(1).max(8).default("UZS"),
  expected_close_date: ymd.nullable().optional(),
  lost_reason: optText(500),
  note: optText(2000),
})

export type DealCreateInput = z.input<typeof dealCreateSchema>

export const dealUpdateSchema = dealCreateSchema.partial().extend({
  id: z.string().uuid(),
})

export type DealUpdateInput = z.input<typeof dealUpdateSchema>
