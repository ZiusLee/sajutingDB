import { createServerSupabaseClient } from "@/lib/supabase-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, reason } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "이메일이 필요합니다." }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    console.log(`[계정 삭제 요청] 이메일: ${email}, 사유: ${reason || "없음"}`)

    // 사용자 데이터 확인
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError || !userData.user) {
      return NextResponse.json({ error: "해당 이메일로 등록된 계정을 찾을 수 없습니다." }, { status: 404 })
    }

    const userId = userData.user.id

    const tables = [
      "smart_contexts",
      "messages",
      "chat_rooms",
      "conversation_summaries",
      "conversation_memory_links",
      "memory_feedback",
      "message_feedback",
      "feedback",
      "interpretations",
      "compatibility_analysis",
      "elements",
      "saju_info",
      "birth_info",
      "payment_orders",
      "user_coins",
      "user_total_coins",
      "beta_applications",
      "saju_sessions",
    ]

    for (const table of tables) {
      try {
        await supabase.from(table).delete().eq("user_id", userId)
      } catch (error) {
        console.log(`테이블 ${table} 삭제 중 오류 (무시됨):`, error)
      }
    }

    // auth_user_id로 연결된 테이블들도 처리
    try {
      await supabase.from("saju_sessions").delete().eq("auth_user_id", userId)
    } catch (error) {
      console.log("saju_sessions 삭제 중 오류 (무시됨):", error)
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error("사용자 삭제 오류:", deleteError)
      return NextResponse.json({ error: "계정 삭제 중 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "계정이 성공적으로 삭제되었습니다.",
    })
  } catch (error) {
    console.error("계정 삭제 API 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
