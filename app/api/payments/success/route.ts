import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { paymentKey, orderId, amount } = await request.json()

    console.log("=== 결제 성공 처리 시작 ===")
    console.log("요청 파라미터:", { paymentKey, orderId, amount })

    if (!paymentKey || !orderId || !amount) {
      console.error("필수 파라미터 누락:", { paymentKey, orderId, amount })
      return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 })
    }

    // 토스페이먼츠 결제 승인 요청
    console.log("토스페이먼츠 승인 요청 시작")
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
    console.log("토스페이먼츠 응답:", {
      status: tossResponse.status,
      ok: tossResponse.ok,
      data: tossData,
    })

    if (!tossResponse.ok) {
      console.error("토스페이먼츠 승인 실패:", tossData)

      // 주문 실패 처리
      const { error: updateError } = await supabase
        .from("payment_orders")
        .update({
          status: "failed",
          failure_reason: tossData.message || "토스페이먼츠 승인 실패",
          updated_at: new Date().toISOString(),
        })
        .eq("order_id", orderId)

      if (updateError) {
        console.error("주문 실패 상태 업데이트 오류:", updateError)
      }

      return NextResponse.json({ error: tossData.message || "결제 승인에 실패했습니다." }, { status: 400 })
    }

    // 주문 정보 조회
    console.log("주문 정보 조회 시작:", orderId)
    const { data: orderData, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (orderError) {
      console.error("주문 조회 오류:", orderError)
      return NextResponse.json({ error: "주문 정보를 찾을 수 없습니다.", details: orderError }, { status: 404 })
    }

    if (!orderData) {
      console.error("주문 데이터가 없음")
      return NextResponse.json({ error: "주문 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    console.log("조회된 주문 정보:", orderData)

    // 결제 금액 검증
    if (orderData.amount !== amount) {
      console.error("결제 금액 불일치:", { expected: orderData.amount, received: amount })
      return NextResponse.json({ error: "결제 금액이 일치하지 않습니다." }, { status: 400 })
    }

    // complete_payment 함수 호출
    console.log("complete_payment 함수 호출 시작:", {
      orderId,
      userId: orderData.user_id,
      coins: orderData.coins,
      paymentKey,
    })

    const { data: rpcData, error: transactionError } = await supabase.rpc("complete_payment", {
      p_order_id: orderId,
      p_user_id: orderData.user_id,
      p_coins: orderData.coins,
      p_payment_key: paymentKey,
      p_payment_data: tossData,
    })

    if (transactionError) {
      console.error("complete_payment 함수 오류:", transactionError)
      console.error("오류 세부사항:", {
        message: transactionError.message,
        details: transactionError.details,
        hint: transactionError.hint,
        code: transactionError.code,
      })
      return NextResponse.json(
        {
          error: "결제 처리 중 오류가 발생했습니다.",
          details: transactionError.message,
        },
        { status: 500 },
      )
    }

    console.log("complete_payment 함수 결과:", rpcData)

    // 처리 완료 후 주문 상태 확인
    const { data: updatedOrder, error: checkError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (checkError) {
      console.error("업데이트된 주문 조회 오류:", checkError)
    } else {
      console.log("업데이트된 주문 상태:", updatedOrder)
    }

    // 사용자 코인 상태 확인
    const { data: userCoins, error: coinsError } = await supabase
      .from("user_coins")
      .select("*")
      .eq("user_id", orderData.user_id)
      .single()

    if (coinsError) {
      console.error("사용자 코인 조회 오류:", coinsError)
    } else {
      console.log("사용자 코인 상태:", userCoins)
    }

    console.log("=== 결제 처리 완료 ===")

    return NextResponse.json({
      success: true,
      message: "결제가 성공적으로 완료되었습니다.",
      coins: orderData.coins,
      orderId,
      order: updatedOrder,
      userCoins: userCoins,
      rpcResult: rpcData,
    })
  } catch (error) {
    console.error("=== 결제 성공 처리 최상위 오류 ===")
    console.error("오류 타입:", typeof error)
    console.error("오류 메시지:", error instanceof Error ? error.message : String(error))
    console.error("오류 스택:", error instanceof Error ? error.stack : "스택 없음")

    return NextResponse.json(
      {
        error: "결제 처리 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
