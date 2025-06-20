import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const COIN_PACKAGES = [
  { id: "starter", name: "스타터 패키지" },
  { id: "basic", name: "베이직 패키지" },
  { id: "standard", name: "스탠다드 패키지" },
  { id: "premium", name: "프리미엄 패키지" },
  { id: "mega", name: "메가 패키지" },
]

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 사용자 인증 확인
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    // 결제 내역 조회
    const { data: paymentHistory, error } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("결제 내역 조회 오류:", error)
      return NextResponse.json({ error: "결제 내역을 불러올 수 없습니다." }, { status: 500 })
    }

    // package_id를 package_name으로 변환
    const historyWithNames = paymentHistory.map((payment) => ({
      ...payment,
      package_name: COIN_PACKAGES.find((pkg) => pkg.id === payment.package_id)?.name || "알 수 없는 패키지",
    }))

    return NextResponse.json({ history: historyWithNames })
  } catch (error) {
    console.error("결제 내역 조회 오류:", error)
    return NextResponse.json({ error: "결제 내역을 불러올 수 없습니다." }, { status: 500 })
  }
}
