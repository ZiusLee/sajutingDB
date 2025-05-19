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

    // 사용자의 부적 정보 조회
    const { data, error } = await supabase.from("user_talismans").select("talisman_ids").eq("user_id", user.id).single()

    if (error) {
      // 데이터가 없는 경우 새로 생성
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("user_talismans")
          .insert({ user_id: user.id, talisman_ids: [] })
          .select()
          .single()

        if (insertError) {
          throw insertError
        }

        return NextResponse.json({ talisman_ids: [] })
      }

      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("부적 정보 조회 오류:", error)
    return NextResponse.json({ error: "부적 정보를 조회하는 중 오류가 발생했습니다." }, { status: 500 })
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

    const { talisman_id } = await request.json()

    if (!talisman_id) {
      return NextResponse.json({ error: "부적 ID가 필요합니다." }, { status: 400 })
    }

    // 현재 부적 정보 조회
    const { data: currentData, error: selectError } = await supabase
      .from("user_talismans")
      .select("talisman_ids")
      .eq("user_id", user.id)
      .single()

    if (selectError) {
      // 데이터가 없는 경우 새로 생성
      if (selectError.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("user_talismans")
          .insert({
            user_id: user.id,
            talisman_ids: [talisman_id],
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

    // 이미 가지고 있는 부적인지 확인
    const talismans = currentData.talisman_ids || []
    if (talismans.includes(talisman_id)) {
      return NextResponse.json({ error: "이미 보유한 부적입니다." }, { status: 400 })
    }

    // 부적 추가
    const updatedTalismans = [...talismans, talisman_id]

    const { data, error } = await supabase
      .from("user_talismans")
      .update({ talisman_ids: updatedTalismans })
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("부적 추가 오류:", error)
    return NextResponse.json({ error: "부적을 추가하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
