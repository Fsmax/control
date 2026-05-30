import { z } from "zod"

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД")

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Введите название").max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  area: z.enum(["WORK", "PERSONAL"]).default("PERSONAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  scheduled_for: ymd.nullable().optional(),
  due_date: ymd.nullable().optional(),
  is_meeting: z.boolean().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  remind_at: z.string().nullable().optional(),
  payout_amount: z.number().positive().nullable().optional(),
  payout_currency: z.string().trim().max(8).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
})

export type TaskCreateInput = z.input<typeof taskCreateSchema>

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
})

export type TaskUpdateInput = z.input<typeof taskUpdateSchema>
