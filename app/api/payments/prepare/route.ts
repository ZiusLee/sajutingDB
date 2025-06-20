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

    const { packageId, amount, coins, orderName } = await request.json()

    // 입력값 검증
    if (!packageId || !amount || !coins || !orderName) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 })
    }

    // 주문 ID 생성 (타임스탬프 + 랜덤 문자열)
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log("결제 준비 시작:", {
      userId: user.id,
      orderId,
      packageId,
      amount,
      coins,
    })

    // 결제 주문 저장
    const { error: insertError } = await supabase.from("payment_orders").insert({
      order_id: orderId,
      user_id: user.id,
      package_id: packageId,
      amount: amount,
      coins: coins,
      status: "pending",
    })

    if (insertError) {
      console.error("주문 저장 오류:", insertError)
      return NextResponse.json({ error: "주문 처리 중 오류가 발생했습니다." }, { status: 500 })
    }

    console.log("주문 저장 완료:", orderId)

    return NextResponse.json({
      orderId,
      amount,
      orderName,
      success: true,
    })
  } catch (error) {
    console.error("결제 준비 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
