import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { paymentKey, orderId, amount } = await request.json()

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 })
    }

    // 토스페이먼츠 결제 승인 요청
    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from("test_sk_QbgMGZzorzyKYRdqXMbjVl5E1em4:").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error("토스페이먼츠 승인 실패:", tossData)

      // 주문 실패 처리
      await supabase
        .from("payment_orders")
        .update({
          status: "failed",
          failure_reason: tossData.message || "토스페이먼츠 승인 실패",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      return NextResponse.json({ error: tossData.message || "결제 승인에 실패했습니다." }, { status: 400 })
    }

    // 주문 정보 조회
    const { data: orderData, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (orderError || !orderData) {
      console.error("주문 조회 오류:", orderError)
      return NextResponse.json({ error: "주문 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    // 결제 금액 검증
    if (orderData.amount !== amount) {
      console.error("결제 금액 불일치:", { expected: orderData.amount, received: amount })
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 })
    }

    // 기존 complete_payment 함수 사용
    const { error: transactionError } = await supabase.rpc("complete_payment", {
      p_order_id: orderId,
      p_user_id: orderData.user_id,
      p_coins: orderData.coins,
      p_payment_key: paymentKey,
      p_payment_data: tossData,
    })

    if (transactionError) {
      console.error("결제 처리 트랜잭션 오류:", transactionError)
      return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "결제가 성공적으로 완료되었습니다.",
      coins: orderData.coins,
      orderId,
    })
  } catch (error) {
    console.error("결제 성공 처리 오류:", error)
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
