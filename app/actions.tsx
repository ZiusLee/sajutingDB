"use server"

import { createClient } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function getSajuProfiles() {
  const supabase = createClient({ cookies })
  try {
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session?.user?.id) {
      console.error("No session found")
      return []
    }

    const { data, error } = await supabase
      .from("saju_profiles")
      .select("*")
      .eq("user_id", session.session.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching saju profiles:", error)
      return []
    }

    return data
  } catch (error) {
    console.error("Error in getSajuProfiles:", error)
    return []
  }
}
