import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import { transferAnonymousDataToUser } from "@/lib/user-data-transfer"
import { updateAuthUserId } from "@/lib/db-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// JWT 시크릿 키
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(req: NextRequest) {
  try {
    // 요청 본문 파싱
    let body
    try {
      body = await req.json()
    } catch (e) {
      return NextResponse.json(
        {
          success: false,
          message: "잘못된 요청 형식입니다.",
        },
        { status: 400 },
      )
    }

    const { email, password, localUserId } = body

    // 필수 필드 확인
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일과 비밀번호를 입력해주세요.",
        },
        { status: 400 },
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClientComponentClient()

    // Supabase 인증 시도
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Supabase Auth 오류:", authError)
      return NextResponse.json(
        {
          success: false,
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 },
      )
    }

    // 사용자 정보
    const user = authData.user

    // 로컬 저장소에서 유저 ID가 제공되었다면 auth_user_id 업데이트
    if (localUserId && user) {
      try {
        const updated = await updateAuthUserId(localUserId, user.id)
        if (updated) {
          console.log(`User ${localUserId} linked with auth user ${user.id}`)
        } else {
          console.warn(`Failed to link user ${localUserId} with auth user ${user.id}`)
        }
      } catch (updateError) {
        console.error("Error updating auth_user_id:", updateError)
        // 업데이트 실패해도 로그인은 계속 진행
      }
    }

    // JWT 토큰 생성 (기존 로직과 호환성 유지)
    const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" })

    // 쿠키에 토큰 저장
    cookies().set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7일
    })

    // Transfer anonymous data to authenticated user
    if (localUserId) {
      try {
        await transferAnonymousDataToUser(user.id, localUserId)
      } catch (transferError) {
        console.error("Error transferring anonymous data:", transferError)
        // Continue with login even if transfer fails
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
      },
      migration: localUserId ? true : false,
      redirectTo: "/chat-list", // 하이픈 사용 (파일 시스템 기반 라우팅에 맞춤)
    })
  } catch (error) {
    console.error("로그인 오류:", error)
    // 항상 JSON 형식으로 오류 응답 반환
    return NextResponse.json(
      {
        success: false,
        message: "로그인 중 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
