import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    console.log("=== Supabase 연결 테스트 ===")

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("환경 변수:")
    console.log("- URL:", supabaseUrl)
    console.log("- ANON_KEY:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "누락")
    console.log("- SERVICE_KEY:", supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : "누락")

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        message: "환경 변수가 누락되었습니다",
        details: {
          url: !!supabaseUrl,
          anonKey: !!supabaseAnonKey,
          serviceKey: !!supabaseServiceKey,
        },
      })
    }

    const supabase = createClient()

    // 1. 기본 연결 테스트
    console.log("1. 기본 연결 테스트...")
    const { data: connectionTest, error: connectionError } = await supabase
      .from("saju_sessions")
      .select("count")
      .limit(1)

    if (connectionError) {
      console.error("연결 테스트 실패:", connectionError)
      return NextResponse.json({
        success: false,
        message: "Supabase 연결 실패",
        error: connectionError.message,
      })
    }

    console.log("연결 테스트 성공")

    // 2. Auth 상태 확인
    console.log("2. Auth 상태 확인...")
    const { data: authData, error: authError } = await supabase.auth.getUser()
    console.log("Auth 상태:", authData, authError)

    // 3. 테이블 존재 확인
    console.log("3. 테이블 존재 확인...")
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    console.log(
      "테이블 목록:",
      tables?.map((t) => t.table_name),
    )

    return NextResponse.json({
      success: true,
      message: "Supabase 연결 성공",
      details: {
        connectionTest: !!connectionTest,
        authStatus: authData ? "인증됨" : "미인증",
        tables: tables?.map((t) => t.table_name) || [],
      },
    })
  } catch (error) {
    console.error("Supabase 테스트 오류:", error)
    return NextResponse.json({
      success: false,
      message: "테스트 중 오류 발생",
      error: error instanceof Error ? error.message : "알 수 없는 오류",
    })
  }
}
