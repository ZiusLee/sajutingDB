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
    console.log(
      `[SERVER] Existing messages:`,
      existingMessages?.map((m) => `${m.message_order}: ${m.role}`),
    )

    // 저장할 메시지 필터링 로직 개선
    // roomType에 따라 다른 필터링 적용
    let messagesToSave: any[] = []

    if (roomType === "sajuping") {
      // 사주핑: message_order 2 이상만 저장 (초기 메시지 2개 제외)
      messagesToSave = messages.filter((message, index) => {
        const messageOrder = index
        const shouldSave = messageOrder >= 2
        console.log(`[SERVER] Sajuping - Message ${messageOrder} (${message.role}): shouldSave=${shouldSave}`)
        return shouldSave
      })
    } else if (roomType === "tarot") {
      // 타로핑: message_order 1 이상만 저장 (초기 메시지 1개 제외)
      messagesToSave = messages.filter((message, index) => {
        const messageOrder = index
        const shouldSave = messageOrder >= 1
        console.log(`[SERVER] Tarot - Message ${messageOrder} (${message.role}): shouldSave=${shouldSave}`)
        return shouldSave
      })
    } else {
      // 기타: message_order 1 이상만 저장 (초기 메시지 1개 제외)
      messagesToSave = messages.filter((message, index) => {
        const messageOrder = index
        const shouldSave = messageOrder >= 1
        console.log(`[SERVER] ${roomType} - Message ${messageOrder} (${message.role}): shouldSave=${shouldSave}`)
        return shouldSave
      })
    }

    if (messagesToSave.length === 0) {
      console.log(`[SERVER] No messages to save (all are initial messages)`)
      return NextResponse.json({ success: true, messageIds: [], savedCount: 0 })
    }

    // 새로운 메시지만 저장 (이미 저장된 것은 제외)
    const newMessages = messagesToSave.filter((message) => {
      const messageOrder = messages.indexOf(message)
      const isNew = messageOrder > highestOrder
      console.log(`[SERVER] Message ${messageOrder} (${message.role}): isNew=${isNew}`)
      return isNew
    })

    if (newMessages.length === 0) {
      console.log(`[SERVER] No new messages to save (all already exist)`)
      return NextResponse.json({ success: true, messageIds: [], savedCount: 0 })
    }

    console.log(
      `[SERVER] Messages to save breakdown:`,
      messagesToSave.map((m, i) => `${messages.indexOf(m)}: ${m.role}`),
    )
    console.log(
      `[SERVER] New messages breakdown:`,
      newMessages.map((m) => `${messages.indexOf(m)}: ${m.role}`),
    )

    console.log(
      `[SERVER] Saving ${newMessages.length} new messages:`,
      newMessages.map((m) => `${m.role} (${messages.indexOf(m)})`),
    )

    // Save messages to database
    const messagesToInsert = newMessages.map((message) => {
      const originalIndex = messages.indexOf(message)
      // 메시지 역할 로깅
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
    console.error("Error in messages API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
