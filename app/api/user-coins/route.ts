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

    // 사용자의 코인 정보 조회
    const { data, error } = await supabase
      .from("user_coins")
      .select("coins, last_check_in")
      .eq("user_id", user.id)
      .single()

    if (error) {
      // 데이터가 없는 경우 새로 생성
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("user_coins")
          .insert({ user_id: user.id, coins: 0 })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        return NextResponse.json({ coins: 0, last_check_in: null })
      }

      throw error
    }

    return NextResponse.json(data)
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

    const { action, amount = 1 } = await request.json()

    // 현재 코인 정보 조회
    const { data: currentData, error: selectError } = await supabase
      .from("user_coins")
      .select("coins")
      .eq("user_id", user.id)
      .single()

    if (selectError) {
      // 데이터가 없는 경우 새로 생성
      if (selectError.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("user_coins")
          .insert({
            user_id: user.id,
            coins: action === "add" ? amount : 0,
            last_check_in: action === "check_in" ? new Date().toISOString().split("T")[0] : null,
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        return NextResponse.json(newData)
      }

      throw selectError
    }

    // 코인 업데이트
    let newCoins = currentData.coins
    const updateData: any = {}

    if (action === "add") {
      newCoins += amount
      updateData.coins = newCoins
    } else if (action === "use") {
      if (currentData.coins < amount) {
        return NextResponse.json({ error: "코인이 부족합니다." }, { status: 400 })
      }
      newCoins -= amount
      updateData.coins = newCoins
    } else if (action === "check_in") {
      newCoins += amount
      updateData.coins = newCoins
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

    return NextResponse.json(data)
  } catch (error) {
    console.error("코인 업데이트 오류:", error)
    return NextResponse.json({ error: "코인을 업데이트하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
