import { type NextRequest, NextResponse } from "next/server"
import { smartMemoryService } from "@/lib/smart-memory-service"

export async function GET() {
  try {
    console.log("🔧 [Debug] 환경 설정 확인 시작")

    // 환경변수 확인
    const environment = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    }

    console.log("🔧 [Debug] 환경변수 상태:", environment)

    // 데이터베이스 연결 테스트
    const database = {
      connection: false,
      tableExists: false,
      functions: {
        find_similar_memory: false,
        search_relevant_memories: false,
      },
    }

    try {
      // 기본 연결 테스트
      const { data: connectionTest, error: connectionError } = await smartMemoryService.supabase
        .from("smart_contexts")
        .select("count", { count: "exact", head: true })

      if (!connectionError) {
        database.connection = true
        database.tableExists = true
        console.log("✅ [Debug] 데이터베이스 연결 및 테이블 확인 성공")
      } else {
        console.error("❌ [Debug] 데이터베이스 연결 오류:", connectionError)
      }

      // 함수 존재 확인 (실제 호출하지 않고 메타데이터만 확인)
      try {
        const { data: functions, error: funcError } = await smartMemoryService.supabase.rpc("find_similar_memory", {
          user_id: "test-check",
          content_embedding: new Array(1536).fill(0),
          memory_type: "identity",
          similarity_threshold: 0.8,
        })

        // 함수가 존재하면 오류가 발생하지 않거나 특정 오류만 발생
        if (!funcError || funcError.message.includes("invalid input syntax")) {
          database.functions.find_similar_memory = true
          console.log("✅ [Debug] find_similar_memory 함수 존재 확인")
        }
      } catch (error) {
        console.log("❌ [Debug] find_similar_memory 함수 오류:", error)
      }

      try {
        const { data: functions2, error: funcError2 } = await smartMemoryService.supabase.rpc(
          "search_relevant_memories",
          {
            user_id: "test-check",
            query_embedding: new Array(1536).fill(0),
            similarity_threshold: 0.7,
            result_limit: 5,
          },
        )

        if (!funcError2 || funcError2.message.includes("invalid input syntax")) {
          database.functions.search_relevant_memories = true
          console.log("✅ [Debug] search_relevant_memories 함수 존재 확인")
        }
      } catch (error) {
        console.log("❌ [Debug] search_relevant_memories 함수 오류:", error)
      }
    } catch (error) {
      console.error("❌ [Debug] 데이터베이스 테스트 실패:", error)
    }

    const allEnvironmentOK = Object.values(environment).every(Boolean)
    const allDatabaseOK =
      database.connection && database.tableExists && Object.values(database.functions).every(Boolean)

    const status = allEnvironmentOK && allDatabaseOK ? "OK" : "ERROR"

    console.log("🔧 [Debug] 최종 상태:", { status, environment, database })

    return NextResponse.json({
      status,
      environment,
      database,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [Debug] 설정 확인 실패:", error)
    return NextResponse.json(
      {
        status: "ERROR",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("🔧 [Debug] 사용자별 디버그 시작:", userId)

    // 사용자의 메모리 통계
    const { data: userMemories, error: memoryError } = await smartMemoryService.supabase
      .from("smart_contexts")
      .select("type, importance_score, created_at")
      .eq("user_id", userId)

    const results = [
      {
        section: "환경변수",
        status:
          process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.OPENAI_API_KEY
            ? "success"
            : "error",
        message: "필수 환경변수 확인",
        details: {
          supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          openai_key: !!process.env.OPENAI_API_KEY,
        },
      },
      {
        section: "사용자 메모리",
        status: memoryError ? "error" : "success",
        message: memoryError
          ? `메모리 조회 실패: ${memoryError.message}`
          : `총 ${userMemories?.length || 0}개의 메모리 발견`,
        details: {
          count: userMemories?.length || 0,
          types: userMemories?.reduce((acc: any, m: any) => {
            acc[m.type] = (acc[m.type] || 0) + 1
            return acc
          }, {}),
        },
      },
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("❌ [Debug] POST 요청 실패:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
