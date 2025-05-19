import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// 관리자 이메일 목록
const ADMIN_EMAILS = ["yoonslee@utexas.edu"]

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // 요청 데이터 파싱
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "사용자 ID가 필요합니다." }, { status: 400 })
    }

    // 현재 로그인한 사용자 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    // 요청한 userId와 현재 로그인한 사용자의 ID가 일치하는지 확인
    if (user.id !== userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
    }

    // 관리자 이메일 목록에 포함되어 있는지 확인
    const isAdmin = ADMIN_EMAILS.includes(user.email || "")

    return NextResponse.json({ isAdmin })
  } catch (error) {
    console.error("관리자 권한 확인 오류:", error)
    return NextResponse.json({ error: "관리자 권한을 확인하는 중 오류가 발생했습니다." }, { status: 500 })
  }
}
