import { type NextRequest, NextResponse } from "next/server"
import { smartMemoryService } from "@/lib/smart-memory-service"

export async function GET(request: NextRequest) {
  try {
    console.log("🔧 [Debug] 메모리 설정 확인 시작")

    // 환경변수 확인
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    }

    console.log("🔧 [Debug] 환경변수 확인:", envCheck)

    // 데이터베이스 연결 테스트
    let dbConnection = false
    let tableExists = false
    const functionsExist = { find_similar_memory: false, search_relevant_memories: false }

    try {
      // 간단한 쿼리로 연결 테스트
      const { data: testData, error: testError } = await smartMemoryService.supabase
        .from("smart_contexts")
        .select("count", { count: "exact", head: true })

      if (!testError) {
        dbConnection = true
        tableExists = true
        console.log("✅ [Debug] 데이터베이스 연결 및 테이블 확인 성공")
      } else {
        console.error("❌ [Debug] 데이터베이스 테스트 실패:", testError)
      }
    } catch (error) {
      console.error("❌ [Debug] 데이터베이스 연결 실패:", error)
    }

    // 함수 존재 확인
    try {
      const { data: functions, error: funcError } = await smartMemoryService.supabase.rpc("find_similar_memory", {
        user_id: "test",
        content_embedding: new Array(1536).fill(0),
        memory_type: "identity",
        similarity_threshold: 0.8,
      })

      if (!funcError) {
        functionsExist.find_similar_memory = true
        console.log("✅ [Debug] find_similar_memory 함수 확인 성공")
      } else {
        console.error("❌ [Debug] find_similar_memory 함수 오류:", funcError)
      }
    } catch (error) {
      console.error("❌ [Debug] find_similar_memory 함수 테스트 실패:", error)
    }

    try {
      const { data: searchResult, error: searchError } = await smartMemoryService.supabase.rpc(
        "search_relevant_memories",
        {
          user_id: "test",
          query_embedding: new Array(1536).fill(0),
          similarity_threshold: 0.7,
          result_limit: 5,
        },
      )

      if (!searchError) {
        functionsExist.search_relevant_memories = true
        console.log("✅ [Debug] search_relevant_memories 함수 확인 성공")
      } else {
        console.error("❌ [Debug] search_relevant_memories 함수 오류:", searchError)
      }
    } catch (error) {
      console.error("❌ [Debug] search_relevant_memories 함수 테스트 실패:", error)
    }

    const result = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        connection: dbConnection,
        tableExists: tableExists,
        functions: functionsExist,
      },
      status:
        dbConnection && tableExists && functionsExist.find_similar_memory && functionsExist.search_relevant_memories
          ? "OK"
          : "ERROR",
    }

    console.log("🔧 [Debug] 최종 결과:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [Debug] 전체 확인 실패:", error)
    return NextResponse.json(
      {
        error: "Debug check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
