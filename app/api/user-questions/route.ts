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

    const { searchParams } = new URL(request.url)
    const roomType = searchParams.get("roomType")

    // messages 테이블에서 직접 조회 (room_type 필드가 있다고 가정)
    let query = supabase
      .from("messages")
      .select("id, content, room_type, created_at")
      .eq("user_id", user.id)
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

    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("user_id", user.id)

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
