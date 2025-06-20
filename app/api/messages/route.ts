import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const supabase = createRouteHandlerClient({ cookies })

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 })
    }

    // 해당 세션의 모든 메시지 조회 (message_order 순으로 정렬)
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 메시지 형태를 useAIChat에서 사용할 수 있는 형태로 변환
    const formattedMessages =
      messages?.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        messageOrder: msg.message_order,
        roomType: msg.room_type,
        modelUsed: msg.model_used,
        responseTimeMs: msg.response_time_ms,
        createdAt: msg.created_at,
      })) || []

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length,
    })
  } catch (error) {
    console.error("Error in messages GET API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages, roomType, sajuData } = await request.json()

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // UUID 형식 검증
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

    // 기존 메시지 수 확인하여 중복 방지
    const { data: existingMessages, error: countError } = await supabase
      .from("messages")
      .select("id, message_order, role")
      .eq("session_id", sessionId)
      .order("message_order", { ascending: true })

    if (countError) {
      console.error("Error checking existing messages:", countError)
    }

    const existingCount = existingMessages?.length || 0
    const highestOrder = existingMessages?.length > 0 ? Math.max(...existingMessages.map((m) => m.message_order)) : -1

    console.log(`[SERVER] Found ${existingCount} existing messages, highest order: ${highestOrder}`)

    // 저장할 메시지 필터링 - 더 간단하고 실용적인 방식
    // 기존 DB에 있는 최고 order보다 큰 메시지만 저장
    const messagesToSave = messages.filter((message, index) => {
      const messageOrder = index
      const shouldSave = messageOrder > highestOrder
      console.log(
        `[SERVER] Message ${messageOrder} (${message.role}): shouldSave=${shouldSave} (highestOrder: ${highestOrder})`,
      )
      return shouldSave
    })

    if (messagesToSave.length === 0) {
      console.log(`[SERVER] No new messages to save (highest order: ${highestOrder})`)
      return NextResponse.json({ success: true, messageIds: [], savedCount: 0 })
    }

    console.log(
      `[SERVER] Saving ${messagesToSave.length} new messages:`,
      messagesToSave.map((m) => `${messages.indexOf(m)}: ${m.role}`),
    )

    // Save messages to database
    const messagesToInsert = messagesToSave.map((message) => {
      const originalIndex = messages.indexOf(message)

      console.log(
        `[SERVER] Preparing to insert message: order=${originalIndex}, role=${message.role}, content=${message.content.substring(0, 30)}...`,
      )

      return {
        session_id: sessionId,
        role: message.role,
        content: message.content,
        message_order: originalIndex, // 원래 인덱스 사용
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
    console.error("Error in messages POST API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
