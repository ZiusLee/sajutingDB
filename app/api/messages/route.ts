import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
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

    const supabase = createServerSupabaseClient()

    // 기존 메시지 조회
    const { data: existingMessages, error: fetchError } = await supabase
      .from("messages")
      .select("id, content")
      .eq("session_id", sessionId)
      .order("message_order", { ascending: true })

    if (fetchError) {
      console.error("Error fetching existing messages:", fetchError)
      return NextResponse.json({ error: "Failed to fetch existing messages" }, { status: 500 })
    }

    const existingMessageContents = new Set(existingMessages?.map((msg) => msg.content) || [])
    const newMessages = messages.filter((msg) => !existingMessageContents.has(msg.content))

    if (newMessages.length === 0) {
      return NextResponse.json({
        message: "No new messages to save",
        savedCount: 0,
        messageIds: [],
      })
    }

    // 새 메시지들을 DB에 저장
    const messagesToInsert = newMessages.map((message, index) => ({
      session_id: sessionId,
      role: message.role,
      content: message.content,
      message_order: (existingMessages?.length || 0) + index,
      room_type: roomType || "sajuping",
      model_used: "gpt-4",
      response_time_ms: 0,
    }))

    const { data: insertedMessages, error: insertError } = await supabase
      .from("messages")
      .insert(messagesToInsert)
      .select("id")

    if (insertError) {
      console.error("Error inserting messages:", insertError)
      return NextResponse.json({ error: "Failed to save messages" }, { status: 500 })
    }

    // 간단한 요약 로그만 출력
    console.log(`메시지 저장 완료: ${newMessages.length}개 신규`)

    return NextResponse.json({
      message: "Messages saved successfully",
      savedCount: newMessages.length,
      messageIds: insertedMessages?.map((msg) => msg.id) || [],
    })
  } catch (error) {
    console.error("Error in POST /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
