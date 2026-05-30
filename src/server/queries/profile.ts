import { createClient } from "@/utils/supabase/server"
import type { Database } from "@/types/database.types"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("unauthorized")

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return data
}
