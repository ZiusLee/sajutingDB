import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// POST - Link memory entry to saju session
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { memoryId, sessionId, relevanceScore = 0.5, linkType = "related", contextNotes } = body

    // Verify memory belongs to user
    const { data: memory, error: memoryError } = await supabaseClient
      .from("memory_entries")
      .select("id")
      .eq("id", memoryId)
      .eq("user_id", user.id)
      .single()

    if (memoryError || !memory) {
      return NextResponse.json({ error: "Memory not found or access denied" }, { status: 404 })
    }

    // Create or update link
    const { data: link, error: linkError } = await supabaseClient
      .from("memory_saju_links")
      .upsert({
        memory_id: memoryId,
        saju_session_id: sessionId,
        relevance_score: relevanceScore,
        link_type: linkType,
        context_notes: contextNotes,
        ai_confidence: 0.7,
      })
      .select()
      .single()

    if (linkError) {
      console.error("Error creating memory-saju link:", linkError)
      return NextResponse.json({ error: "Failed to create link" }, { status: 500 })
    }

    return NextResponse.json({ link })
  } catch (error) {
    console.error("Error in link-session POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
