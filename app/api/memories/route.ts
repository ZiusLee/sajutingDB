import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")
    const memoryType = searchParams.get("type")

    console.log("[MEMORY API] GET request - userId:", userId, "sessionId:", sessionId, "type:", memoryType)

    if (!userId && !sessionId) {
      console.log("[MEMORY API] Missing userId and sessionId")
      return NextResponse.json([])
    }

    const supabase = createRouteHandlerClient({ cookies })

    let query = supabase
      .from("memory_bank")
      .select("id, user_id, session_id, memory_type, content, summary, relevance_score, tags, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    } else if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    if (memoryType) {
      query = query.eq("memory_type", memoryType)
    }

    const { data: memories, error } = await query

    if (error) {
      console.error("[MEMORY API] Database error:", error)
      return NextResponse.json([])
    }

    console.log(`[MEMORY API] Found ${memories?.length || 0} memories`)

    // 데이터 형식을 프론트엔드에서 기대하는 형식으로 변환
    const formattedMemories = (memories || []).map((memory) => ({
      id: memory.id,
      user_id: memory.user_id,
      session_id: memory.session_id,
      type: memory.memory_type, // memory_type을 type으로 변환
      content: memory.content,
      summary: memory.summary,
      relevance_score: memory.relevance_score,
      tags: memory.tags,
      timestamp: memory.created_at, // created_at을 timestamp로 변환
      created_at: memory.created_at,
      updated_at: memory.updated_at,
    }))

    return NextResponse.json(formattedMemories)
  } catch (error) {
    console.error("[MEMORY API] Unexpected error:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { userId, sessionId, type, content, summary, tags } = body

    if (!type || !content) {
      return NextResponse.json({ error: "Type and content are required" }, { status: 400 })
    }

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "User ID or Session ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("memory_bank")
      .insert({
        user_id: userId || null,
        session_id: sessionId || null,
        memory_type: type, // type을 memory_type으로 저장
        content: content,
        summary: summary || null,
        tags: tags || [],
        relevance_score: 1.0,
      })
      .select()

    if (error) {
      console.error("[MEMORY API] Insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    console.error("[MEMORY API] Unexpected error:", error)
    return NextResponse.json({ error: "Failed to create memory" }, { status: 500 })
  }
}
