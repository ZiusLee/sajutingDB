import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { COIN_PACKAGES } from "@/lib/toss-payments"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { packageId } = await request.json()

    // 패키지 정보 찾기
    const selectedPackage = COIN_PACKAGES.find((pkg) => pkg.id === packageId)
    if (!selectedPackage) {
      return NextResponse.json({ error: "유효하지 않은 패키지입니다." }, { status: 400 })
    }

    // 주문 ID 생성
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 결제 정보 반환 (클라이언트 키는 별도 API에서 제공)
    return NextResponse.json({
      orderId,
      amount: selectedPackage.price,
      orderName: selectedPackage.name,
      customerName: "사주핑 사용자",
      customerEmail: "user@sajuping.com",
    })
  } catch (error) {
    console.error("Payment preparation error:", error)
    return NextResponse.json({ error: "결제 준비 중 오류가 발생했습니다." }, { status: 500 })
  }
}
