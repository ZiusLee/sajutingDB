import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

async function getUserId() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id || null
  } catch (error) {
    console.error("Error getting user ID:", error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const result = await query(
      `SELECT id, session_id, role, content, message_order, room_type, model_used, response_time_ms, created_at
       FROM messages 
       WHERE session_id = $1 
       ORDER BY message_order ASC`,
      [sessionId],
    )

    return NextResponse.json({ messages: result.rows })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId()
    const body = await req.json()
    const { sessionId, message, role, roomType, modelUsed, responseTimeMs } = body

    if (!sessionId || !message || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 현재 세션의 마지막 message_order 가져오기
    const lastOrderResult = await query(
      `SELECT COALESCE(MAX(message_order), -1) as last_order FROM messages WHERE session_id = $1`,
      [sessionId],
    )

    const nextOrder = (lastOrderResult.rows[0]?.last_order || -1) + 1

    // 단일 메시지 저장
    const result = await query(
      `INSERT INTO messages (session_id, role, content, message_order, room_type, model_used, response_time_ms, user_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING id`,
      [sessionId, role, message, nextOrder, roomType, modelUsed, responseTimeMs, userId],
    )

    return NextResponse.json({
      messageId: result.rows[0].id,
      messageOrder: nextOrder,
      success: true,
    })
  } catch (error) {
    console.error("Error saving message:", error)
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
  }
}
