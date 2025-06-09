import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const authUserId = searchParams.get("authUserId")

    let query = adminSupabase.from("saju_sessions").select("*").order("created_at", { ascending: false }).limit(1)

    // Filter by user ID if provided
    if (userId) {
      query = query.eq("id", userId)
    } else if (authUserId) {
      query = query.eq("auth_user_id", authUserId)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error("Error fetching saju sessions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("Error in saju-sessions GET API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, gender, saju, roomType, sessionKey } = await request.json()

    // Create new session only if needed
    const sessionData = {
      id: crypto.randomUUID(),
      user_name: name,
      gender: gender,
      birth_year: saju?.year,
      birth_month: saju?.month,
      birth_day: saju?.day,
      birth_hour: saju?.hour,
      day_stem: saju?.dayStem,
      day_branch: saju?.dayBranch,
      session_key: sessionKey,
      room_type: roomType,
      auth_user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await adminSupabase.from("saju_sessions").insert(sessionData).select("id").single()

    if (error) {
      console.error("Error creating saju session:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessionId: data.id })
  } catch (error) {
    console.error("Error in saju-sessions POST API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
