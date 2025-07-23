import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    const results = []

    // 1. 환경변수 확인
    const envVars = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ENABLE_SMART_MEMORY: process.env.ENABLE_SMART_MEMORY,
    }

    const missingEnvVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    results.push({
      section: "환경변수",
      status: missingEnvVars.length === 0 ? "success" : "error",
      message:
        missingEnvVars.length === 0
          ? "모든 필수 환경변수가 설정되었습니다."
          : `누락된 환경변수: ${missingEnvVars.join(", ")}`,
      details: envVars,
    })

    // 2. 데이터베이스 연결 확인
    try {
      const supabase = await createClient()

      // 간단한 쿼리로 연결 테스트
      const { data, error } = await supabase.from("smart_contexts").select("count").limit(1)

      results.push({
        section: "데이터베이스 연결",
        status: error ? "error" : "success",
        message: error ? `연결 실패: ${error.message}` : "데이터베이스 연결이 정상입니다.",
        details: error ? { error: error.message } : { connected: true },
      })
    } catch (dbError) {
      results.push({
        section: "데이터베이스 연결",
        status: "error",
        message: `연결 오류: ${dbError instanceof Error ? dbError.message : "알 수 없는 오류"}`,
        details: { error: dbError },
      })
    }

    // 3. 테이블 구조 확인
    try {
      const supabase = await createClient()

      const { data: tableData, error: tableError } = await supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId || "test-user")
        .limit(1)

      results.push({
        section: "테이블 접근",
        status: tableError ? "error" : "success",
        message: tableError
          ? `테이블 접근 실패: ${tableError.message}`
          : "smart_contexts 테이블에 정상적으로 접근할 수 있습니다.",
        details: tableError ? { error: tableError.message } : { accessible: true },
      })
    } catch (tableError) {
      results.push({
        section: "테이블 접근",
        status: "error",
        message: `테이블 오류: ${tableError instanceof Error ? tableError.message : "알 수 없는 오류"}`,
        details: { error: tableError },
      })
    }

    // 4. 데이터베이스 함수 확인
    try {
      const supabase = await createClient()

      // 함수 존재 여부 확인
      const { data: functions, error: funcError } = await supabase.rpc("find_similar_memory", {
        query_text: "test",
        user_id_param: userId || "test-user",
        similarity_threshold: 0.5,
        max_results: 1,
      })

      results.push({
        section: "데이터베이스 함수",
        status: funcError ? "error" : "success",
        message: funcError
          ? `함수 호출 실패: ${funcError.message}`
          : "find_similar_memory 함수가 정상적으로 작동합니다.",
        details: funcError ? { error: funcError.message } : { functions_available: true },
      })
    } catch (funcError) {
      results.push({
        section: "데이터베이스 함수",
        status: "error",
        message: `함수 오류: ${funcError instanceof Error ? funcError.message : "알 수 없는 오류"}`,
        details: { error: funcError },
      })
    }

    // 5. OpenAI API 확인
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        })

        results.push({
          section: "OpenAI API",
          status: response.ok ? "success" : "error",
          message: response.ok ? "OpenAI API 키가 유효합니다." : `API 키 오류: HTTP ${response.status}`,
          details: { status: response.status },
        })
      } catch (apiError) {
        results.push({
          section: "OpenAI API",
          status: "error",
          message: `API 연결 오류: ${apiError instanceof Error ? apiError.message : "알 수 없는 오류"}`,
          details: { error: apiError },
        })
      }
    } else {
      results.push({
        section: "OpenAI API",
        status: "warning",
        message: "OpenAI API 키가 설정되지 않았습니다.",
        details: { api_key_missing: true },
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Debug check error:", error)
    return NextResponse.json(
      {
        error: "Debug check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
