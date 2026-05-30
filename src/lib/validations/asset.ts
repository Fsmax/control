import { z } from "zod"

export const assetCreateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(120),
  kind: z.enum(["CASH", "BANK", "DEPOSIT", "STOCK", "CRYPTO", "REAL_ESTATE", "OTHER"]),
  currency: z.string().trim().min(1).max(8),
  current_value: z.number().nonnegative("Не может быть отрицательной"),
  note: z.string().trim().max(2000).nullable().optional(),
})

export type AssetCreateInput = z.input<typeof assetCreateSchema>

export const assetValueSchema = z.object({
  id: z.string().uuid(),
  current_value: z.number().nonnegative("Не может быть отрицательной"),
})

export type AssetValueInput = z.input<typeof assetValueSchema>
