import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    console.log("=== 자체 인증 로그인 시작 ===")

    const body = await req.json()
    const { email, password } = body

    // 필수 필드 확인
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "이메일과 비밀번호를 모두 입력해주세요.",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // 1. 사용자 조회
    console.log("사용자 조회...")
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, password_hash, is_active")
      .eq("email", email)
      .single()

    if (userError || !user) {
      console.log("사용자를 찾을 수 없음:", email)
      return NextResponse.json(
        {
          success: false,
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 },
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: "비활성화된 계정입니다.",
        },
        { status: 401 },
      )
    }

    // 2. 비밀번호 확인
    console.log("비밀번호 확인...")
    const bcrypt = await import("bcryptjs")
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      console.log("비밀번호 불일치:", email)
      return NextResponse.json(
        {
          success: false,
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        },
        { status: 401 },
      )
    }

    // 3. JWT 토큰 생성
    const jwt = await import("jsonwebtoken")
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      {
        expiresIn: "7d",
      },
    )

    // 4. 쿠키 설정
    cookies().set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7일
      sameSite: "lax",
    })

    console.log("로그인 성공:", user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "로그인되었습니다!",
      redirectTo: "/mypage",
    })
  } catch (error) {
    console.error("로그인 전체 오류:", error)
    return NextResponse.json(
      {
        success: false,
        message: "로그인 중 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
