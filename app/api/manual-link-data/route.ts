import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { anonymousUserId, authUserId } = await request.json()

    if (!anonymousUserId || !authUserId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`Manual linking: Anonymous user ${anonymousUserId} to auth user ${authUserId}`)

    // Create a server-side Supabase client with admin privileges
    const supabase = createServerSupabaseClient()

    // First, check if the anonymous user exists
    const { data: anonymousUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("id", anonymousUserId)
      .single()

    if (checkError) {
      console.error("Error checking anonymous user:", checkError)
      return NextResponse.json({ error: "Anonymous user not found" }, { status: 404 })
    }

    console.log("Found anonymous user:", anonymousUser)

    // Update the auth_user_id in the users table
    const { error: updateError } = await supabase
      .from("users")
      .update({ auth_user_id: authUserId })
      .eq("id", anonymousUserId)

    if (updateError) {
      console.error("Error updating auth_user_id:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log(`Successfully linked anonymous user ${anonymousUserId} to auth user ${authUserId}`)

    // Also check if there are any other users with this auth_user_id
    const { data: linkedUsers, error: linkedError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (!linkedError && linkedUsers) {
      console.log(`Found ${linkedUsers.length} users linked to auth user ${authUserId}:`, linkedUsers)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in manual-link-data API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
