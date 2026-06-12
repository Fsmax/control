import { z } from "zod"

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата в формате ГГГГ-ММ-ДД")

export const txCreateSchema = z
  .object({
    kind: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
    asset_id: z.string().uuid("Выберите актив"),
    to_asset_id: z.string().uuid().nullable().optional(),
    category: z.string().trim().max(80).nullable().optional(),
    amount: z.number().positive("Сумма должна быть больше нуля"),
    date: ymd,
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine((v) => v.kind !== "TRANSFER" || !!v.to_asset_id, {
    message: "Выберите актив-получатель",
    path: ["to_asset_id"],
  })
  .refine((v) => v.kind !== "TRANSFER" || v.to_asset_id !== v.asset_id, {
    message: "Источник и получатель должны различаться",
    path: ["to_asset_id"],
  })

export type TxCreateInput = z.input<typeof txCreateSchema>
