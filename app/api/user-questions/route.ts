import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다" }, { status: 401 })
    }

    // 1단계: 현재 사용자의 세션 ID들을 가져오기
    const { data: sessions, error: sessionError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("user_id", user.id)

    if (sessionError) {
      console.error("세션 조회 오류:", sessionError)
      return NextResponse.json({ success: false, error: "세션을 불러올 수 없습니다" }, { status: 500 })
    }

    const sessionIds = sessions?.map((session) => session.id) || []

    if (sessionIds.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 2단계: 해당 세션들의 메시지를 가져오기
    const { searchParams } = new URL(request.url)
    const roomType = searchParams.get("roomType")

    let query = supabase
      .from("messages")
      .select("id, content, room_type, created_at")
      .in("session_id", sessionIds)
      .eq("role", "user")
      .order("created_at", { ascending: false })

    if (roomType && roomType !== "all") {
      query = query.eq("room_type", roomType)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error("질문 조회 오류:", error)
      return NextResponse.json({ success: false, error: "질문을 불러올 수 없습니다" }, { status: 500 })
    }

    const questions =
      data?.map((item: any) => ({
        id: item.id,
        question: item.content,
        room_type: item.room_type || "personalized",
        created_at: item.created_at,
      })) || []

    return NextResponse.json({ success: true, data: questions })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get("id")

    if (!messageId) {
      return NextResponse.json({ success: false, error: "메시지 ID가 필요합니다" }, { status: 400 })
    }

    // 먼저 해당 메시지가 현재 사용자의 것인지 확인
    const { data: messageData, error: checkError } = await supabase
      .from("messages")
      .select(`
        id,
        saju_sessions!inner(user_id)
      `)
      .eq("id", messageId)
      .eq("saju_sessions.user_id", user.id)
      .single()

    if (checkError || !messageData) {
      return NextResponse.json({ success: false, error: "삭제 권한이 없습니다" }, { status: 403 })
    }

    const { error } = await supabase.from("messages").delete().eq("id", messageId)

    if (error) {
      console.error("질문 삭제 오류:", error)
      return NextResponse.json({ success: false, error: "질문을 삭제할 수 없습니다" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
