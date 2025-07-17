import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get messages for the session
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        session_id,
        role,
        content,
        message_order,
        room_type,
        model_used,
        response_time_ms,
        created_at,
        message_feedback (
          id,
          feedback_type,
          created_at
        )
      `)
      .eq("session_id", sessionId)
      .order("message_order", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    // Transform the data to match the expected format
    const transformedMessages =
      messages?.map((msg) => ({
        id: msg.id,
        sessionId: msg.session_id,
        role: msg.role,
        content: msg.content,
        messageOrder: msg.message_order,
        roomType: msg.room_type,
        modelUsed: msg.model_used,
        responseTimeMs: msg.response_time_ms,
        createdAt: msg.created_at,
        feedback: msg.message_feedback || [],
      })) || []

    return NextResponse.json({ messages: transformedMessages })
  } catch (error) {
    console.error("Error in messages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages, roomType } = await request.json()

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Filter out invalid messages and prepare for insertion
    const validMessages = messages.filter(
      (msg) => msg && msg.content && msg.content.trim() !== "" && (msg.role === "user" || msg.role === "assistant"),
    )

    if (validMessages.length === 0) {
      return NextResponse.json({ messageIds: [], savedCount: 0 })
    }

    // Prepare messages for insertion
    const messagesToInsert = validMessages.map((msg, index) => ({
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      message_order: msg.messageOrder || index,
      room_type: roomType || "sajuping",
      model_used: msg.model || "gpt-4",
      response_time_ms: msg.responseTime || null,
      created_at: msg.createdAt || new Date().toISOString(),
    }))

    // Insert messages (let database generate UUIDs)
    const { data, error } = await supabase.from("messages").insert(messagesToInsert).select("id")

    if (error) {
      console.error("Error saving messages:", error)
      return NextResponse.json({ error: "Failed to save messages" }, { status: 500 })
    }

    const messageIds = data?.map((item) => item.id) || []

    return NextResponse.json({
      messageIds,
      savedCount: messagesToInsert.length,
    })
  } catch (error) {
    console.error("Error in messages POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
