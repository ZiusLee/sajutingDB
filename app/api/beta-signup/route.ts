import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const { userData } = await request.json()

    // Create a server-side Supabase client with admin privileges
    const supabase = createServerSupabaseClient()

    // Generate a user ID if not provided
    const userId = userData.userId || uuidv4()

    // Insert or update user data
    const { error: userError } = await supabase.from("users").upsert({
      id: userId,
      name: userData.name || "Anonymous User",
      email: userData.email,
      gender: userData.gender || "unknown",
      relationship_status: userData.relationshipStatus || "unknown",
      is_beta_applicant: true,
    })

    if (userError) {
      console.error("Error inserting/updating user data:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Insert beta application
    const { data: betaData, error: betaError } = await supabase
      .from("beta_applications")
      .insert({
        user_id: userId,
        selected_services: userData.selectedServices || ["사주 분석"],
        status: "pending",
      })
      .select()

    if (betaError) {
      console.error("Error inserting beta application:", betaError)
      return NextResponse.json({ error: betaError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId, betaId: betaData?.[0]?.id })
  } catch (error) {
    console.error("Error in beta-signup API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
