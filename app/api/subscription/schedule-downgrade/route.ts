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

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "활성 구독이 없습니다." }, { status: 400 })
      }
      console.error("구독 조회 오류:", fetchError)
      return NextResponse.json({ error: "구독 정보 조회 중 오류가 발생했습니다." }, { status: 500 })
    }

    if (!currentSubscription) {
      return NextResponse.json({ error: "활성 구독이 없습니다." }, { status: 400 })
    }

    const currentPlan = currentSubscription.subscription_type || currentSubscription.package_id
    if (currentPlan === newPlan) {
      return NextResponse.json({ error: "현재 플랜과 동일한 플랜입니다." }, { status: 400 })
    }

    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 7) // 7일 후

    const { data: userCoins, error: coinsError } = await supabase
      .from("user_coins")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (coinsError && coinsError.code !== "PGRST116") {
      console.error("사용자 코인 정보 조회 오류:", {
        error: coinsError,
        message: coinsError.message,
        details: coinsError.details,
        hint: coinsError.hint,
        code: coinsError.code,
      })
      return NextResponse.json({ error: "사용자 정보 조회 중 오류가 발생했습니다." }, { status: 500 })
    }

    // Update user_coins table with scheduled plan change
    const updateData = {
      scheduled_plan_change: newPlan,
      scheduled_date: scheduledDate.toISOString(),
      updated_at: new Date().toISOString(),
    }

    let updateError
    if (userCoins) {
      // Update existing record
      const { error } = await supabase.from("user_coins").update(updateData).eq("user_id", user.id)
      updateError = error
    } else {
      // Create new record if doesn't exist
      const { error } = await supabase.from("user_coins").insert({
        user_id: user.id,
        subscription_coins: 3, // Set to 3 for free tier instead of 0
        bonus_coins: 0,
        subscription_plan: "free", // Set default plan to free
        ...updateData,
        created_at: new Date().toISOString(),
      })
      updateError = error
    }

    if (updateError) {
      console.error("다운그레이드 예약 저장 오류:", {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      return NextResponse.json(
        {
          error: `다운그레이드 예약 저장 중 오류가 발생했습니다: ${updateError.message || "알 수 없는 오류"}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `현재 주차가 끝나면 ${planName}으로 전환됩니다.`,
      newPlan,
      planName,
    })
  } catch (error) {
    console.error("다운그레이드 예약 API 오류:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: `서버 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      },
      { status: 500 },
    )
  }
}
