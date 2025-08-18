import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { newPlan, planName } = await request.json()

    if (!newPlan || !planName) {
      return NextResponse.json({ error: "newPlan과 planName이 필요합니다." }, { status: 400 })
    }

    // 사용자 인증 확인 (실제 구현에서는 JWT 토큰 검증 필요)
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    }

    // 임시로 하드코딩된 사용자 ID (실제로는 JWT에서 추출)
    const userId = "temp-user-id"

    // 현재 활성 구독 조회
    const { data: currentSubscription, error: fetchError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("subscription_plan", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("구독 조회 오류:", fetchError)
      return NextResponse.json({ error: "구독 정보 조회 중 오류가 발생했습니다." }, { status: 500 })
    }

    if (!currentSubscription) {
      return NextResponse.json({ error: "활성 구독이 없습니다." }, { status: 400 })
    }

    // 다운그레이드 예약 정보 저장
    const { error: insertError } = await supabase.from("subscription_downgrades").insert({
      user_id: userId,
      current_plan: currentSubscription.subscription_plan,
      new_plan: newPlan,
      new_plan_name: planName,
      scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
      status: "scheduled",
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("다운그레이드 예약 저장 오류:", insertError)
      return NextResponse.json({ error: "다운그레이드 예약 저장 중 오류가 발생했습니다." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `현재 주차가 끝나면 ${planName}으로 전환됩니다.`,
      newPlan,
      planName,
    })
  } catch (error) {
    console.error("다운그레이드 예약 API 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
