import { z } from "zod"

export const credentialsSchema = z.object({
  email: z.string().trim().email("Неверный e-mail").max(255),
  password: z.string().min(8, "Пароль не короче 8 символов").max(72),
})

export type CredentialsInput = z.input<typeof credentialsSchema>
