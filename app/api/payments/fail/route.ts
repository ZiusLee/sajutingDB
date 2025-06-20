import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { orderId, failureReason } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: "주문 ID가 필요합니다." }, { status: 400 })
    }

    // 주문 상태를 실패로 업데이트
    const { error } = await supabase
      .from("payment_orders")
      .update({
        status: "failed",
        failure_reason: failureReason || "사용자 취소",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)

    if (error) {
      console.error("결제 실패 처리 오류:", error)
      return NextResponse.json({ error: "결제 실패 처리 중 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("결제 실패 처리 오류:", error)
    return NextResponse.json({ error: "결제 실패 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
