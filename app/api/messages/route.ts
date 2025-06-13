// API 라우트에서 createClient 호출 방식 수정
import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // createClient 대신 createServerSupabaseClient 사용
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 메시지 형식 변환
    const messages =
      data?.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })) || []

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error in messages GET API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, messages, roomType, sajuData } = await request.json()

    if (!sessionId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // createClient 대신 createServerSupabaseClient 사용
    const supabase = createServerSupabaseClient()

    // 마지막 메시지만 저장 (성능 개선)
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) {
      return NextResponse.json({ success: true, message: "No new messages to save" })
    }

    // 중복 저장 방지를 위해 ID로 확인
    if (lastMessage.id) {
      const { data: existingMessage } = await supabase.from("messages").select("id").eq("id", lastMessage.id).single()

      if (existingMessage) {
        return NextResponse.json({ success: true, message: "Message already exists" })
      }
    }

    // 새 메시지 저장
    const { error } = await supabase.from("messages").insert({
      id: lastMessage.id || `msg_${Date.now()}`,
      session_id: sessionId,
      role: lastMessage.role,
      content: lastMessage.content,
      room_type: roomType,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error saving message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in messages POST API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
