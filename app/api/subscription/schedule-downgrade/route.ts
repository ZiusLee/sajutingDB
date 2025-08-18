import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { newPlan, planName } = await request.json()

    if (!newPlan || !planName) {
      return NextResponse.json({ error: "newPlan과 planName이 필요합니다." }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    const { data: currentSubscription, error: fetchError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("subscription_type", "is", null)
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

    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 7) // 7일 후

    const { error: insertError } = await supabase.from("subscription_charges").insert({
      user_id: user.id,
      subscription_order_id: currentSubscription.id,
      charge_date: scheduledDate.toISOString().split("T")[0],
      status: "scheduled",
      change_type: "downgrade",
      current_plan: currentSubscription.subscription_type || currentSubscription.package_id,
      scheduled_plan_change: newPlan,
      coins_added: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scheduled_date: scheduledDate.toISOString(),
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
