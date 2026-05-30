import { z } from "zod"

const optText = (max: number) => z.string().trim().max(max).nullable().optional()

export const clientCreateSchema = z.object({
  kind: z.enum(["COMPANY", "INDIVIDUAL"]).default("COMPANY"),
  name: z.string().trim().min(1, "Укажите название").max(160),
  status: z.enum(["LEAD", "ACTIVE", "INACTIVE"]).default("LEAD"),
  email: optText(160),
  phone: optText(60),
  address: optText(300),
  site_address: optText(300),
  tax_id: optText(40),
  note: optText(2000),
})

export type ClientCreateInput = z.input<typeof clientCreateSchema>

export const clientUpdateSchema = clientCreateSchema.partial().extend({
  id: z.string().uuid(),
})

export type ClientUpdateInput = z.input<typeof clientUpdateSchema>
