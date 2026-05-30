import { z } from "zod"

const optText = (max: number) => z.string().trim().max(max).nullable().optional()

export const contactCreateSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().trim().min(1, "Укажите имя").max(160),
  role: optText(120),
  email: optText(160),
  phone: optText(60),
  note: optText(1000),
})

export type ContactCreateInput = z.input<typeof contactCreateSchema>
