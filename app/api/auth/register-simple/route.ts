import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    console.log("=== 간단 회원가입 시작 ===")

    const body = await req.json()
    const { name, email, password } = body

    // 필수 필드 확인
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "이름, 이메일, 비밀번호를 모두 입력해주세요.",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // 1. 이메일 중복 확인
    console.log("이메일 중복 확인...")
    const { data: existingUser, error: checkError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "이미 사용 중인 이메일입니다.",
        },
        { status: 409 },
      )
    }

    // 2. 비밀번호 해시화 (간단한 방법)
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. 사용자 직접 생성 (Supabase Auth 우회)
    console.log("사용자 생성...")
    const { data: newUser, error: createError } = await supabase
      .from("saju_sessions")
      .insert([
        {
          email,
          name,
          password_hash: hashedPassword, // 해시된 비밀번호 저장
          gender: "unknown",
          relationship_status: "solo",
          is_beta_applicant: false,
          privacy_consent: true,
          is_default: false,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error("사용자 생성 오류:", createError)
      return NextResponse.json(
        {
          success: false,
          message: `사용자 생성 실패: ${createError.message}`,
        },
        { status: 500 },
      )
    }

    console.log("사용자 생성 성공:", newUser.id)

    // 4. JWT 토큰 생성
    const jwt = await import("jsonwebtoken")
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "7d",
    })

    // 5. 쿠키 설정
    cookies().set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7일
    })

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      redirectTo: "/mypage",
    })
  } catch (error) {
    console.error("회원가입 오류:", error)
    return NextResponse.json(
      {
        success: false,
        message: "회원가입 중 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
