import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

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
      .select("*")
      .eq("session_id", sessionId)
      .order("message_order", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in GET /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST 핸들러에서 메시지 저장 로직을 수정합니다.
export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages, roomType, sajuData } = await request.json()

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate that sessionId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 })
    }

    console.log(`[SERVER] Received ${messages.length} messages for session ${sessionId}`)
    console.log(`[SERVER] Room type: ${roomType}`)

    // 메시지 역할별 로그 추가
    const userMessages = messages.filter((m) => m.role === "user").length
    const assistantMessages = messages.filter((m) => m.role === "assistant").length
    console.log(`[SERVER] Message breakdown - User: ${userMessages}, Assistant: ${assistantMessages}`)

    const supabase = createRouteHandlerClient({ cookies })

    // 기존 메시지 조회 (내용과 순서 기반 중복 체크용)
    const { data: existingMessages, error: countError } = await supabase
      .from("messages")
      .select("id, message_order, role, content")
      .eq("session_id", sessionId)
      .order("message_order", { ascending: true })

    if (countError) {
      console.error("Error checking existing messages:", countError)
      return NextResponse.json({ error: "Failed to check existing messages" }, { status: 500 })
    }

    const existingCount = existingMessages?.length || 0
    const maxMessageOrder =
      existingMessages?.length > 0 ? Math.max(...existingMessages.map((m) => m.message_order)) : -1

    console.log(`[SERVER] Found ${existingCount} existing messages, max message_order: ${maxMessageOrder}`)
    console.log(
      `[SERVER] Existing messages:`,
      existingMessages?.map((m) => `${m.message_order}: ${m.role} - ${m.content.substring(0, 30)}...`),
    )

    // 새로운 메시지 필터링 (내용 기반 중복 체크)
    const newMessages = messages.filter((message, index) => {
      // 기존 메시지와 내용이 같은지 확인
      const isDuplicate = existingMessages?.some(
        (existing) => existing.content === message.content && existing.role === message.role,
      )

      const isNew = !isDuplicate
      console.log(
        `[SERVER] Message ${index} (${message.role}): isNew=${isNew}, content="${message.content.substring(0, 50)}..."`,
      )

      return isNew
    })

    if (newMessages.length === 0) {
      console.log(`[SERVER] No new messages to save (all are duplicates)`)
      return NextResponse.json({ success: true, messageIds: [], savedCount: 0 })
    }

    console.log(`[SERVER] Found ${newMessages.length} new messages to save`)

    // 새 메시지에 message_order 할당 (DB의 최대값 + 1부터 시작)
    const messagesToInsert = newMessages.map((message, index) => {
      const newMessageOrder = maxMessageOrder + 1 + index

      console.log(
        `[SERVER] Preparing to insert message: order=${newMessageOrder}, role=${message.role}, content=${message.content.substring(0, 30)}...`,
      )

      return {
        session_id: sessionId,
        role: message.role,
        content: message.content,
        message_order: newMessageOrder,
        room_type: roomType,
        model_used: message.model_used || null,
        response_time_ms: message.response_time_ms || null,
      }
    })

    const { data, error } = await supabase.from("messages").insert(messagesToInsert).select("id, role, message_order")

    if (error) {
      console.error("Error saving messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(
      `[SERVER] Successfully saved ${data?.length || 0} messages:`,
      data?.map((m) => `${m.role} (order: ${m.message_order}, id: ${m.id})`),
    )

    return NextResponse.json({
      success: true,
      messageIds: data?.map((d) => d.id) || [],
      savedCount: data?.length || 0,
    })
  } catch (error) {
    console.error("Error in messages API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
