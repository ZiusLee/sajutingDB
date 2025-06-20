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

    const { orderId, paymentKey, amount } = await request.json()

    console.log("결제 성공 처리 시작:", { orderId, paymentKey, amount, userId: user.id })

    // 토스페이먼츠 결제 승인
    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.TOSS_PAYMENTS_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json()
      console.error("토스페이먼츠 승인 실패:", errorData)

      // 주문 상태를 실패로 업데이트
      await supabase
        .from("payment_orders")
        .update({
          status: "failed",
          failure_reason: errorData.message || "결제 승인 실패",
        })
        .eq("order_id", orderId)

      return NextResponse.json({ error: "결제 승인에 실패했습니다." }, { status: 400 })
    }

    const paymentData = await tossResponse.json()
    console.log("토스페이먼츠 승인 성공:", paymentData)

    // 주문 정보 조회
    const { data: orderData, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .single()

    if (orderError || !orderData) {
      console.error("주문 조회 실패:", orderError)
      return NextResponse.json({ error: "주문 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // 이미 완료된 주문인지 확인
    if (orderData.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "이미 처리된 주문입니다.",
        coins: orderData.coins,
      })
    }

    console.log("결제 완료 처리 함수 호출:", {
      orderId,
      userId: user.id,
      coins: orderData.coins,
    })

    // complete_payment 함수 호출
    const { error: completeError } = await supabase.rpc("complete_payment", {
      p_order_id: orderId,
      p_user_id: user.id,
      p_coins: orderData.coins,
      p_payment_key: paymentKey,
      p_payment_data: paymentData,
    })

    if (completeError) {
      console.error("결제 완료 처리 실패:", completeError)
      return NextResponse.json({ error: "결제 완료 처리 중 오류가 발생했습니다." }, { status: 500 })
    }

    console.log("결제 완료 처리 성공")

    return NextResponse.json({
      success: true,
      message: "결제가 성공적으로 완료되었습니다.",
      coins: orderData.coins,
      paymentData,
    })
  } catch (error) {
    console.error("결제 성공 처리 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
