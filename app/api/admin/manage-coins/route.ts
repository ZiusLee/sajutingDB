import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { isAdmin, getUserIdByEmail } from "@/lib/admin-utils"

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

    // 관리자 권한 확인
    const adminCheck = await isAdmin(user.id)
    if (!adminCheck) {
      return NextResponse.json({ error: "관리자 권한이 없습니다." }, { status: 403 })
    }

    // 요청 데이터 파싱
    const { email, amount } = await request.json()

    if (!email || !amount) {
      return NextResponse.json({ error: "이메일과 코인 수량이 필요합니다." }, { status: 400 })
    }

    // 이메일로 사용자 ID 찾기
    const targetUserId = await getUserIdByEmail(email)
    if (!targetUserId) {
      return NextResponse.json({ error: "해당 이메일의 사용자를 찾을 수 없습니다." }, { status: 404 })
    }

    // 사용��의 현재 코인 정보 조회
    const { data: currentData, error: selectError } = await supabase
      .from("user_coins")
      .select("coins")
      .eq("user_id", targetUserId)
      .single()

    if (selectError) {
      // 데이터가 없는 경우 새로 생성
      if (selectError.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("user_coins")
          .insert({
            user_id: targetUserId,
            coins: amount,
          })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        return NextResponse.json({
          success: true,
          message: `${email} 사용자에게 ${amount}코인이 추가되었습니다.`,
          data: newData,
        })
      }

      throw selectError
    }

    // 코인 업데이트
    const newCoins = currentData.coins + amount

    const { data, error } = await supabase
      .from("user_coins")
      .update({ coins: newCoins })
      .eq("user_id", targetUserId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `${email} 사용자에게 ${amount}코인이 추가되었습니다. 현재 코인: ${newCoins}`,
      data,
    })
  } catch (error) {
    console.error("관리자 코인 관리 오류:", error)
    return NextResponse.json({ error: "코인을 업데이트하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
