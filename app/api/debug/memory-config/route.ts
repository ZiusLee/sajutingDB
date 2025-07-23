import { NextResponse } from "next/server"
import { smartMemoryService } from "@/lib/smart-memory-service"

export async function GET() {
  try {
    // 환경변수 확인
    const config = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      openaiKey: !!process.env.OPENAI_API_KEY,
      enableSmartMemory: process.env.ENABLE_SMART_MEMORY !== "false",
      nodeEnv: process.env.NODE_ENV,
    }

    // 데이터베이스 연결 테스트
    let dbTest = { connected: false, error: null }
    try {
      const { data, error } = await smartMemoryService.supabase
        .from("smart_contexts")
        .select("count", { count: "exact", head: true })
        .limit(1)

      if (error) {
        dbTest = { connected: false, error: error.message }
      } else {
        dbTest = { connected: true, error: null }
      }
    } catch (err) {
      dbTest = {
        connected: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }
    }

    // 테이블 존재 확인
    let tablesTest = { exists: false, error: null }
    try {
      const { data, error } = await smartMemoryService.supabase.rpc("find_similar_memory", {
        user_id: "test",
        content_embedding: new Array(1536).fill(0),
        memory_type: "test",
        similarity_threshold: 0.5,
      })

      if (error && error.message.includes("function")) {
        tablesTest = { exists: false, error: "Functions not created" }
      } else {
        tablesTest = { exists: true, error: null }
      }
    } catch (err) {
      tablesTest = {
        exists: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }
    }

    return NextResponse.json({
      config,
      dbTest,
      tablesTest,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
