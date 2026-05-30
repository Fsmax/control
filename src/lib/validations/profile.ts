import { z } from "zod"

export const profileUpdateSchema = z.object({
  name: z.string().trim().max(120).nullable().optional(),
  timezone: z.string().trim().min(1, "Укажите таймзону").max(64),
  day_goal: z.number().int().min(1).max(50),
  focus_goal_min: z.number().int().min(0).max(1440),
  base_currency: z.string().trim().min(1).max(8),
})

export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>
