import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    console.log("=== 회원가입 API 시작 ===")

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const jwtSecret = process.env.JWT_SECRET

    console.log("환경 변수 확인:")
    console.log("- SUPABASE_URL:", supabaseUrl ? "설정됨" : "누락")
    console.log("- SUPABASE_ANON_KEY:", supabaseAnonKey ? "설정됨" : "누락")
    console.log("- SUPABASE_SERVICE_KEY:", supabaseServiceKey ? "설정됨" : "누락")
    console.log("- JWT_SECRET:", jwtSecret ? "설정됨" : "누락")

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("필수 환경 변수가 누락되었습니다")
      return NextResponse.json(
        {
          success: false,
          message: "서버 설정 오류: 환경 변수가 누락되었습니다.",
        },
        { status: 500 },
      )
    }

    // 요청 본문 파싱
    let body
    try {
      body = await req.json()
      console.log("요청 본문 파싱 성공:", { name: body.name, email: body.email })
    } catch (e) {
      console.error("요청 본문 파싱 오류:", e)
      return NextResponse.json(
        {
          success: false,
          message: "잘못된 요청 형식입니다.",
        },
        { status: 400 },
      )
    }

    const { name, email, password } = body

    // 필수 필드 확인
    if (!name || !email || !password) {
      console.error("필수 필드 누락:", { name: !!name, email: !!email, password: !!password })
      return NextResponse.json(
        {
          success: false,
          message: "이름, 이메일, 비밀번호를 모두 입력해주세요.",
        },
        { status: 400 },
      )
    }

    // Supabase 클라이언트 동적 import
    let createClient
    try {
      const supabaseModule = await import("@/utils/supabase/server")
      createClient = supabaseModule.createClient
      console.log("Supabase 클라이언트 import 성공")
    } catch (importError) {
      console.error("Supabase 클라이언트 import 오류:", importError)
      return NextResponse.json(
        {
          success: false,
          message: "서버 설정 오류: Supabase 클라이언트를 로드할 수 없습니다.",
        },
        { status: 500 },
      )
    }

    const supabase = createClient()

    try {
      console.log("Supabase Auth 사용자 생성 시도...")

      // Create the user with Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        console.error("Supabase Auth 오류:", authError)
        return NextResponse.json(
          {
            success: false,
            message: `인증 오류: ${authError.message}`,
          },
          { status: 400 },
        )
      }

      console.log("Supabase Auth 사용자 생성 성공:", authUser.user?.id)

      // saju_sessions 테이블에 사용자 정보 저장
      console.log("사주 세션 생성 시도...")

      const { data: sessionData, error: sessionError } = await supabase
        .from("saju_sessions")
        .insert([
          {
            email,
            name,
            auth_user_id: authUser.user?.id,
            gender: "unknown",
            relationship_status: "solo",
            is_beta_applicant: false,
            privacy_consent: true,
            is_default: false,
          },
        ])
        .select()
        .single()

      if (sessionError) {
        console.error("사주 세션 생성 오류:", sessionError)
        return NextResponse.json(
          {
            success: false,
            message: `데이터베이스 오류: ${sessionError.message}`,
          },
          { status: 500 },
        )
      }

      console.log("사주 세션 생성 성공:", sessionData.id)

      // JWT 토큰 생성
      let token
      try {
        const jwt = await import("jsonwebtoken")
        token = jwt.sign({ userId: sessionData.id, email: sessionData.email }, jwtSecret || "fallback-secret", {
          expiresIn: "7d",
        })
        console.log("JWT 토큰 생성 성공")
      } catch (jwtError) {
        console.error("JWT 토큰 생성 오류:", jwtError)
        // JWT 실패해도 회원가입은 성공으로 처리
      }

      // 쿠키 설정
      if (token) {
        const { cookies } = await import("next/headers")
        cookies().set({
          name: "auth_token",
          value: token,
          httpOnly: true,
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 7일
        })
        console.log("쿠키 설정 완료")
      }

      console.log("회원가입 완료:", sessionData.id)

      return NextResponse.json({
        success: true,
        user: {
          id: sessionData.id,
          email: sessionData.email,
          name: sessionData.name,
        },
        redirectTo: "/mypage",
      })
    } catch (dbError) {
      console.error("데이터베이스 작업 오류:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: "데이터베이스 작업 중 오류가 발생했습니다.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("전체 API 오류:", error)
    return NextResponse.json(
      {
        success: false,
        message: "서버 내부 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
