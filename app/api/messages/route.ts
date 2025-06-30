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
        created_at
      `)
      .eq("session_id", sessionId)
      .order("message_order", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error("Error in GET /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, messages, roomType, sajuData } = body

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Get existing message count for proper ordering
    const { data: existingMessages, error: countError } = await supabase
      .from("messages")
      .select("message_order")
      .eq("session_id", sessionId)
      .order("message_order", { ascending: false })
      .limit(1)

    if (countError) {
      console.error("Error getting message count:", countError)
      return NextResponse.json({ error: "Failed to get message count" }, { status: 500 })
    }

    const lastOrder = existingMessages && existingMessages.length > 0 ? existingMessages[0].message_order : 0

    // Prepare messages for insertion
    const messagesToInsert = messages.map((message, index) => ({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      message_order: lastOrder + index + 1,
      room_type: roomType || "general",
      model_used: message.model_used || null,
      response_time_ms: message.response_time_ms || null,
      created_at: new Date().toISOString(),
    }))

    // Insert messages
    const { data: insertedMessages, error: insertError } = await supabase
      .from("messages")
      .insert(messagesToInsert)
      .select("id")

    if (insertError) {
      console.error("Error inserting messages:", insertError)
      return NextResponse.json({ error: "Failed to save messages" }, { status: 500 })
    }

    const messageIds = insertedMessages?.map((msg) => msg.id) || []

    return NextResponse.json({
      success: true,
      messageIds,
      count: messageIds.length,
    })
  } catch (error) {
    console.error("Error in POST /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
