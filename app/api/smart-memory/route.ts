import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // 사용자의 메모리 조회
    const { data: memories, error } = await supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching memories:", error)
      return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 })
    }

    return NextResponse.json({ memories: memories || [] })
  } catch (error) {
    console.error("GET /api/smart-memory error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, memories } = body

    if (!userId || !memories || !Array.isArray(memories)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const supabase = await createClient()

    // 메모리 저장
    const memoriesToInsert = memories.map((memory) => ({
      user_id: userId,
      content: memory.content,
      type: memory.type || "general",
      importance_score: memory.importance_score || 0.5,
      metadata: memory.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase.from("smart_contexts").insert(memoriesToInsert).select()

    if (error) {
      console.error("Error saving memories:", error)
      return NextResponse.json({ error: "Failed to save memories" }, { status: 500 })
    }

    console.log(`Successfully saved ${data?.length || 0} memories for user ${userId}`)

    return NextResponse.json({
      success: true,
      saved: data?.length || 0,
      memories: data,
    })
  } catch (error) {
    console.error("POST /api/smart-memory error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { memoryId, content, type } = body

    if (!memoryId || !content) {
      return NextResponse.json({ error: "Memory ID and content are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("smart_contexts")
      .update({
        content,
        type: type || "general",
        updated_at: new Date().toISOString(),
      })
      .eq("id", memoryId)
      .select()

    if (error) {
      console.error("Error updating memory:", error)
      return NextResponse.json({ error: "Failed to update memory" }, { status: 500 })
    }

    return NextResponse.json({ success: true, memory: data?.[0] })
  } catch (error) {
    console.error("PUT /api/smart-memory error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { memoryId } = body

    if (!memoryId) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("smart_contexts").delete().eq("id", memoryId)

    if (error) {
      console.error("Error deleting memory:", error)
      return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/smart-memory error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
