import { createClient as supabaseCreateClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export function createClient() {
  return supabaseCreateClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
