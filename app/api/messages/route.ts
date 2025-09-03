import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const chatRoomId = searchParams.get("chatRoomId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    let query = supabase
      .from("messages")
      .select(`
        id,
        session_id,
        chat_room_id,
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

    // If chatRoomId is provided, filter by it
    if (chatRoomId) {
      query = query.eq("chat_room_id", chatRoomId)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ messages: [] }, { status: 200 })
    }

    // Transform the data to match the expected format
    const transformedMessages = messages.map((msg) => ({
      id: msg.id,
      sessionId: msg.session_id,
      chatRoomId: msg.chat_room_id,
      role: msg.role,
      content: msg.content,
      messageOrder: msg.message_order,
      roomType: msg.room_type,
      modelUsed: msg.model_used,
      responseTimeMs: msg.response_time_ms,
      createdAt: msg.created_at,
      feedback: [], // 빈 배열로 설정
    }))

    return NextResponse.json({ messages: transformedMessages })
  } catch (error) {
    console.error("Error in GET /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages, roomType, chatRoomId } = await request.json()

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Session ID and messages array are required" }, { status: 400 })
    }

    if (messages.length === 0) {
      return NextResponse.json({ savedCount: 0, messageIds: [] })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: sessionExists, error: sessionError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("id", sessionId)
      .single()

    if (sessionError || !sessionExists) {
      console.error(`Session ${sessionId} not found in saju_sessions table:`, sessionError)
      return NextResponse.json(
        {
          error: "Session not found. Please refresh the page to create a new session.",
        },
        { status: 404 },
      )
    }

    // Get the last message order for proper sequencing
    let lastMessageOrder = 0
    if (chatRoomId) {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("message_order")
        .eq("chat_room_id", chatRoomId)
        .order("message_order", { ascending: false })
        .limit(1)

      lastMessageOrder = lastMessage?.[0]?.message_order || 0
    } else {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("message_order")
        .eq("session_id", sessionId)
        .order("message_order", { ascending: false })
        .limit(1)

      lastMessageOrder = lastMessage?.[0]?.message_order || 0
    }

    // Prepare messages for insertion
    const messagesToInsert = messages.map((msg, index) => ({
      session_id: sessionId,
      chat_room_id: chatRoomId || null,
      role: msg.role,
      content: msg.content,
      message_order: msg.messageOrder || lastMessageOrder + index + 1,
      room_type: roomType || "sajuping",
      model_used: msg.modelUsed || null,
      response_time_ms: msg.responseTimeMs || null,
      created_at: msg.createdAt || new Date().toISOString(),
    }))

    const { data: insertedMessages, error } = await supabase.from("messages").insert(messagesToInsert).select("id")

    if (error) {
      console.error("Error saving messages:", error)
      return NextResponse.json({ error: "Failed to save messages" }, { status: 500 })
    }

    const messageIds = insertedMessages?.map((msg) => msg.id) || []

    console.log(
      `Successfully saved ${messagesToInsert.length} messages for session ${sessionId}${chatRoomId ? ` in chat room ${chatRoomId}` : ""}`,
    )

    return NextResponse.json({
      savedCount: messagesToInsert.length,
      messageIds,
    })
  } catch (error) {
    console.error("Error in POST /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const chatRoomId = searchParams.get("chatRoomId")
    const messageId = searchParams.get("messageId")

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    let query = supabase.from("messages").delete()

    if (messageId) {
      // Delete specific message
      query = query.eq("id", messageId)
    } else if (chatRoomId) {
      // Delete all messages in a chat room
      query = query.eq("chat_room_id", chatRoomId)
    } else if (sessionId) {
      // Delete all messages in a session
      query = query.eq("session_id", sessionId)
    } else {
      return NextResponse.json({ error: "At least one identifier is required" }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting messages:", error)
      return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
