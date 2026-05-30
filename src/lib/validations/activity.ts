import { z } from "zod"

export const ACTIVITY_TYPES = ["CALL", "MEETING", "EMAIL", "NOTE"] as const
export const activityTypeEnum = z.enum(ACTIVITY_TYPES)

export const activityCreateSchema = z.object({
  client_id: z.string().uuid(),
  deal_id: z.string().uuid().nullable().optional(),
  type: activityTypeEnum.default("NOTE"),
  subject: z.string().trim().min(1, "Укажите тему").max(200),
  body: z.string().trim().max(4000).nullable().optional(),
  // ISO-строка (datetime-local + смещение зоны); пусто → БД ставит now().
  // Колонка NOT NULL default now() → тип Insert без null, поэтому только .optional().
  occurred_at: z.string().trim().min(1).optional(),
})

export type ActivityCreateInput = z.input<typeof activityCreateSchema>
