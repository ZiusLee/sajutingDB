import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const COIN_PACKAGES = [
  {
    id: "starter",
    name: "스타터 패키지",
    coins: 30,
    price: 3000,
  },
  {
    id: "basic",
    name: "베이직 패키지",
    coins: 60,
    price: 5000,
  },
  {
    id: "standard",
    name: "스탠다드 패키지",
    coins: 130,
    price: 10000,
  },
  {
    id: "premium",
    name: "프리미엄 패키지",
    coins: 300,
    price: 20000,
  },
  {
    id: "mega",
    name: "메가 패키지",
    coins: 650,
    price: 40000,
  },
]

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 사용자 인증 확인
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error("인증 오류:", sessionError)
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const { packageId } = await request.json()
    console.log("결제 준비 요청:", { packageId, userId: session.user.id })

    // 패키지 정보 확인
    const selectedPackage = COIN_PACKAGES.find((pkg) => pkg.id === packageId)
    if (!selectedPackage) {
      console.error("잘못된 패키지 ID:", packageId)
      return NextResponse.json({ error: "유효하지 않은 패키지입니다." }, { status: 400 })
    }

    // 주문 ID 생성
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 사용자 정보
    const user = session.user
    const customerName = user.user_metadata?.name || user.email?.split("@")[0] || "사용자"
    const customerEmail = user.email || ""

    console.log("주문 정보:", {
      orderId,
      userId: user.id,
      packageId,
      coins: selectedPackage.coins,
      amount: selectedPackage.price,
    })

    // 주문 정보를 데이터베이스에 저장
    const { data: insertData, error: insertError } = await supabase
      .from("payment_orders")
      .insert({
        order_id: orderId,
        user_id: user.id,
        package_id: packageId,
        coins: selectedPackage.coins,
        amount: selectedPackage.price,
        status: "pending",
      })
      .select()

    if (insertError) {
      console.error("주문 저장 오류:", insertError)
      return NextResponse.json({ error: "주문 처리 중 오류가 발생했습니다." }, { status: 500 })
    }

    console.log("주문 저장 성공:", insertData)

    return NextResponse.json({
      orderId,
      amount: selectedPackage.price,
      orderName: selectedPackage.name,
      customerName,
      customerEmail,
    })
  } catch (error) {
    console.error("결제 준비 오류:", error)
    return NextResponse.json({ error: "결제 준비 중 오류가 발생했습니다." }, { status: 500 })
  }
}
