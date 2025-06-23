import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    console.log("=== 자체 인증 회원가입 시작 ===")

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

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "비밀번호는 최소 6자 이상이어야 합니다.",
        },
        { status: 400 },
      )
    }

    const supabase = createClient()

    // 1. 이메일 중복 확인
    console.log("이메일 중복 확인...")
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (checkError && checkError.code !== "PGRST116") {
      console.error("이메일 확인 오류:", checkError)
      return NextResponse.json(
        {
          success: false,
          message: "이메일 확인 중 오류가 발생했습니다.",
        },
        { status: 500 },
      )
    }

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "이미 사용 중인 이메일입니다.",
        },
        { status: 409 },
      )
    }

    // 2. 비밀번호 해시화
    console.log("비밀번호 해시화...")
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 12)

    // 3. 사용자 생성
    console.log("사용자 생성...")
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          email,
          name,
          password_hash: hashedPassword,
          is_active: true,
          email_verified: false,
        },
      ])
      .select("id, email, name, created_at")
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

    // 4. saju_sessions 테이블에도 연결 (기존 데이터와 호환성을 위해)
    try {
      const { error: sessionError } = await supabase.from("saju_sessions").insert([
        {
          email,
          name,
          auth_user_id: newUser.id, // users 테이블의 ID를 참조
          gender: "unknown",
          relationship_status: "solo",
          is_beta_applicant: false,
          privacy_consent: true,
          is_default: false,
        },
      ])

      if (sessionError) {
        console.warn("saju_sessions 생성 실패 (무시):", sessionError)
      }
    } catch (sessionErr) {
      console.warn("saju_sessions 생성 중 오류 (무시):", sessionErr)
    }

    // 5. JWT 토큰 생성
    const jwt = await import("jsonwebtoken")
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      process.env.JWT_SECRET || "fallback-secret-key-change-in-production",
      {
        expiresIn: "7d",
      },
    )

    // 6. 쿠키 설정
    cookies().set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7일
      sameSite: "lax",
    })

    console.log("회원가입 완료:", newUser.id)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      message: "회원가입이 완료되었습니다!",
      redirectTo: "/mypage",
    })
  } catch (error) {
    console.error("회원가입 전체 오류:", error)
    return NextResponse.json(
      {
        success: false,
        message: "회원가입 중 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
