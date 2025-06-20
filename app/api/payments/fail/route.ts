import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    }

    const { orderId, code, message } = await request.json()

    console.log("결제 실패 처리:", { orderId, code, message, userId: user.id })

    // 주문 상태를 실패로 업데이트
    const { error: updateError } = await supabase
      .from("payment_orders")
      .update({
        status: "failed",
        failure_reason: `${code}: ${message}`,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("user_id", user.id)

    if (updateError) {
      console.error("주문 상태 업데이트 실패:", updateError)
    }

    return NextResponse.json({
      success: true,
      message: "결제 실패 처리가 완료되었습니다.",
    })
  } catch (error) {
    console.error("결제 실패 처리 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
