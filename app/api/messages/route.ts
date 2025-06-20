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

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

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
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { sessionId, message, role, roomType, modelUsed, responseTimeMs } = body

    if (!sessionId || !message || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json({ error: "Invalid session ID format" }, { status: 400 })
    }

    // 현재 세션의 마지막 message_order 가져오기
    const { data: lastOrderData, error: lastOrderError } = await supabase
      .from("messages")
      .select("message_order")
      .eq("session_id", sessionId)
      .order("message_order", { ascending: false })
      .limit(1)

    if (lastOrderError) {
      console.error("Error getting last message order:", lastOrderError)
      return NextResponse.json({ error: lastOrderError.message }, { status: 500 })
    }

    const nextOrder = (lastOrderData?.[0]?.message_order ?? -1) + 1

    // 사용자 정보 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 단일 메시지 저장
    const { data, error } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        role: role,
        content: message,
        message_order: nextOrder,
        room_type: roomType,
        model_used: modelUsed || null,
        response_time_ms: responseTimeMs || null,
        user_id: user?.id || null,
      })
      .select("id")

    if (error) {
      console.error("Error saving message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      messageId: data?.[0]?.id,
      messageOrder: nextOrder,
      success: true,
    })
  } catch (error) {
    console.error("Error in messages POST API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
