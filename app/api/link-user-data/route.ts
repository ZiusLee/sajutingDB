import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { anonymousUserId, authUserId } = await request.json()

    if (!anonymousUserId || !authUserId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Create a server-side Supabase client with admin privileges
    const supabase = createServerSupabaseClient()

    // Update the auth_user_id in the users table
    const { error } = await supabase.from("users").update({ auth_user_id: authUserId }).eq("id", anonymousUserId)

    if (error) {
      console.error("Error updating auth_user_id:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Successfully linked anonymous user ${anonymousUserId} to auth user ${authUserId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in link-user-data API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
