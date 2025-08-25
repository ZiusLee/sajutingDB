import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"
import { createSajuSession, getSajuSessionByEmail } from "@/lib/user-service"
import { migrateUserData } from "@/lib/migration-utils"
import { transferAnonymousDataToUser } from "@/lib/user-data-transfer"
import { createClient } from "@/utils/supabase/server"

const supabase = createClient()

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

    try {
      // 이메일 중복 확인
      const existingSession = await getSajuSessionByEmail(email)
      if (existingSession) {
        return NextResponse.json(
          {
            success: false,
            message: "이미 사용 중인 이메일입니다.",
          },
          { status: 409 },
        )
      }

      // Create the user with Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        return NextResponse.json(
          {
            success: false,
            message: "Supabase Auth 사용자 생성 중 오류가 발생했습니다.",
          },
          { status: 500 },
        )
      }

      // Create the session in our custom table with the auth_user_id
      const session = await createSajuSession({
        email,
        password,
        name,
        auth_user_id: authUser.user?.id, // Link to Supabase Auth user
      })

      console.log(`[v0] Attempting to create user_coins for user ${session.id}`)

      try {
        // Use upsert to handle conflicts gracefully
        const { data: coinsData, error: coinsError } = await supabase
          .from("user_coins")
          .upsert(
            {
              user_id: session.id,
              subscription_coins: 3,
              bonus_coins: 0,
              subscription_plan: "free",
              last_daily_charge: new Date().toISOString().split("T")[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
              ignoreDuplicates: false,
            },
          )
          .select()
          .single()

        if (coinsError) {
          // Fallback: try simple insert if upsert fails
          const { error: insertError } = await supabase.from("user_coins").insert({
            user_id: session.id,
            subscription_coins: 3,
            bonus_coins: 0,
            subscription_plan: "free",
            last_daily_charge: new Date().toISOString().split("T")[0],
          })

          if (insertError) {
            console.error("Failed to create user_coins:", insertError)
          }
        }
      } catch (error) {
        console.error("Exception creating user_coins:", error)
      }

      // JWT 토큰 생성
      const token = sign({ userId: session.id, email: session.email }, JWT_SECRET, { expiresIn: "7d" })

      // Transfer anonymous data to authenticated user
      try {
        await transferAnonymousDataToUser(authUser.user?.id || "", session.id)
      } catch (transferError) {
        console.error("Error transferring anonymous data:", transferError)
        // Continue with registration even if transfer fails
      }

      // 로컬 데이터 마이그레이션 (비동기로 처리)
      let migrationResult = false
      try {
        migrationResult = await migrateUserData(session.id)
      } catch (migrationError) {
        console.error("데이터 마이그레이션 오류:", migrationError)
        // 마이그레이션 실패해도 회원가입은 계속 진행
      }

      // 쿠키에 토큰 저장
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
          id: session.id,
          email: session.email,
          name: session.name,
        },
        migration: migrationResult,
        redirectTo: "/chat-list", // 하이픈 사용 (파일 시스템 기반 라우팅에 맞춤)
      })
    } catch (dbError) {
      console.error("데이터베이스 오류:", dbError)
      return NextResponse.json(
        {
          success: false,
          message: "사용자 생성 중 오류가 발생했습니다.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("회원가입 오류:", error)
    // 항상 JSON 형식으로 오류 응답 반환
    return NextResponse.json(
      {
        success: false,
        message: "회원가입 중 오류가 발생했습니다.",
      },
      { status: 500 },
    )
  }
}
