import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // 현재 로그인한 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("user_coins")
      .select(
        "subscription_coins, bonus_coins, subscription_plan, subscription_status, subscription_start_date, subscription_end_date, last_check_in",
      )
      .eq("user_id", user.id)
      .single()

    if (error) {
      // 데이터가 없는 경우 새로 생성
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("user_coins")
          .insert({
            user_id: user.id,
            subscription_coins: 3, // Set default 3 coins for free tier users instead of 0
            bonus_coins: 0,
            subscription_plan: "free", // Set default subscription plan to free
            subscription_status: "active", // Set default subscription status to active for free tier
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        return NextResponse.json({
          subscription_coins: 3, // Return 3 coins instead of 0
          bonus_coins: 0,
          total_coins: 3, // Total should be 3 instead of 0
          subscription_plan: "free", // Return free plan
          subscription_status: "active", // Return active status for free tier
          last_check_in: null,
        })
      }

      throw error
    }

    const totalCoins = (data.subscription_coins || 0) + (data.bonus_coins || 0)

    return NextResponse.json({
      ...data,
      total_coins: totalCoins,
      coins: totalCoins, // For backward compatibility
    })
  } catch (error) {
    console.error("코인 정보 조회 오류:", error)
    return NextResponse.json({ error: "코인 정보를 조회하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // 현재 로그인한 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    const { action, amount = 1, coin_type = "bonus", coinType } = await request.json()
    const finalCoinType = coin_type || coinType || "bonus" // Support both parameter names

    const { data: currentData, error: selectError } = await supabase
      .from("user_coins")
      .select("subscription_coins, bonus_coins")
      .eq("user_id", user.id)
      .single()

    if (selectError) {
      // 데이터가 없는 경우 새로 생성
      if (selectError.code === "PGRST116") {
        const initialData = {
          user_id: user.id,
          subscription_coins: finalCoinType === "subscription" && action === "add" ? amount : 3, // Default to 3 for free tier
          bonus_coins: finalCoinType === "bonus" && action === "add" ? amount : 0,
          subscription_plan: "free", // Set default subscription plan
          subscription_status: "active", // Set default subscription status to active for free tier
          last_check_in: action === "check_in" ? new Date().toISOString().split("T")[0] : null,
        }

        const { data: newData, error: insertError } = await supabase
          .from("user_coins")
          .insert(initialData)
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        const totalCoins = (newData.subscription_coins || 0) + (newData.bonus_coins || 0)
        return NextResponse.json({
          ...newData,
          total_coins: totalCoins,
          coins: totalCoins,
        })
      }

      throw selectError
    }

    const updateData: any = {}
    let newSubscriptionCoins = currentData.subscription_coins || 0
    let newBonusCoins = currentData.bonus_coins || 0

    if (action === "add") {
      if (finalCoinType === "subscription") {
        newSubscriptionCoins += amount
      } else {
        newBonusCoins += amount
      }
      updateData.subscription_coins = newSubscriptionCoins
      updateData.bonus_coins = newBonusCoins
    } else if (action === "use") {
      const totalCoins = newSubscriptionCoins + newBonusCoins
      if (totalCoins < amount) {
        return NextResponse.json({ error: "핑이 부족합니다." }, { status: 400 })
      }

      let remainingAmount = amount
      if (newSubscriptionCoins >= remainingAmount) {
        newSubscriptionCoins -= remainingAmount
        remainingAmount = 0
      } else {
        remainingAmount -= newSubscriptionCoins
        newSubscriptionCoins = 0
        newBonusCoins -= remainingAmount
      }

      updateData.subscription_coins = newSubscriptionCoins
      updateData.bonus_coins = newBonusCoins
    } else if (action === "check_in") {
      newBonusCoins += amount
      updateData.bonus_coins = newBonusCoins
      updateData.last_check_in = new Date().toISOString().split("T")[0]
    }

    const { data, error } = await supabase
      .from("user_coins")
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    const totalCoins = (data.subscription_coins || 0) + (data.bonus_coins || 0)
    return NextResponse.json({
      ...data,
      total_coins: totalCoins,
      coins: totalCoins, // For backward compatibility
    })
  } catch (error) {
    console.error("코인 업데이트 오류:", error)
    return NextResponse.json({ error: "코인을 업데이트하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
