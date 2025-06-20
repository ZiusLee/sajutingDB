import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")

    console.log("[MEMORY API] GET request - userId:", userId, "sessionId:", sessionId)

    if (!userId && !sessionId) {
      console.log("[MEMORY API] Missing userId and sessionId")
      return NextResponse.json({ error: "User ID or Session ID is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase.from("memory_bank").select("*").order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    } else if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    const { data: memories, error } = await query

    if (error) {
      console.error("[MEMORY API] Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[MEMORY API] Found ${memories?.length || 0} memories`)

    return NextResponse.json({
      memories: memories || [],
      count: memories?.length || 0,
    })
  } catch (error) {
    console.error("[MEMORY API] Unexpected error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
