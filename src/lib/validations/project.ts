import { z } from "zod"

export const projectCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  area: z.enum(["WORK", "PERSONAL"]).default("PERSONAL"),
  description: z.string().trim().max(2000).nullable().optional(),
  color: z.string().trim().max(32).nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
})

export type ProjectCreateInput = z.input<typeof projectCreateSchema>

export const projectUpdateSchema = projectCreateSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
})

export type ProjectUpdateInput = z.input<typeof projectUpdateSchema>
