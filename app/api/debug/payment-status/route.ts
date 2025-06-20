import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json({ error: "주문 ID가 필요합니다." }, { status: 400 })
    }

    // 주문 정보 조회
    const { data: orderData, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (orderError) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다.", details: orderError }, { status: 404 })
    }

    // 사용자 코인 정보 조회
    const { data: coinData, error: coinError } = await supabase
      .from("user_coins")
      .select("*")
      .eq("user_id", orderData.user_id)
      .single()

    return NextResponse.json({
      order: orderData,
      userCoins: coinData,
      coinError,
    })
  } catch (error) {
    console.error("디버그 API 오류:", error)
    return NextResponse.json({ error: "디버그 처리 중 오류가 발생했습니다." }, { status: 500 })
  }
}
