import type { Database } from "@/types/database.types"
import { getCachedProfile } from "@/server/queries/session"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

// Тонкая обёртка над кэш-версией: дедуплицируется с другими query-функциями в рендере.
export async function getProfile(): Promise<ProfileRow | null> {
  return getCachedProfile()
}
