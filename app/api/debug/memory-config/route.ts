import { NextResponse } from "next/server"
import { smartMemoryService } from "@/lib/smart-memory-service"

export async function GET() {
  try {
    console.log("🔍 [Debug] Starting memory config check...")

    // 환경변수 확인
    const config = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      openaiKey: !!process.env.OPENAI_API_KEY,
      enableSmartMemory: process.env.ENABLE_SMART_MEMORY !== "false",
      nodeEnv: process.env.NODE_ENV,
      urls: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
      },
    }

    console.log("🔍 [Debug] Config check:", config)

    // 데이터베이스 연결 테스트
    let dbTest = { connected: false, error: null, details: null }
    try {
      console.log("🔍 [Debug] Testing database connection...")
      const { data, error, count } = await smartMemoryService.supabase
        .from("smart_contexts")
        .select("*", { count: "exact", head: true })
        .limit(1)

      if (error) {
        console.error("🔍 [Debug] DB connection error:", error)
        dbTest = { connected: false, error: error.message, details: error }
      } else {
        console.log("🔍 [Debug] DB connection success, count:", count)
        dbTest = { connected: true, error: null, details: { count } }
      }
    } catch (err) {
      console.error("🔍 [Debug] DB connection exception:", err)
      dbTest = {
        connected: false,
        error: err instanceof Error ? err.message : "Unknown error",
        details: err,
      }
    }

    // 테이블 구조 확인
    let tableTest = { exists: false, error: null, details: null }
    try {
      console.log("🔍 [Debug] Testing table structure...")
      const { data, error } = await smartMemoryService.supabase
        .from("smart_contexts")
        .select("id, user_id, type, content, importance_score, relevance_embedding")
        .limit(1)

      if (error) {
        console.error("🔍 [Debug] Table structure error:", error)
        tableTest = { exists: false, error: error.message, details: error }
      } else {
        console.log("🔍 [Debug] Table structure OK")
        tableTest = { exists: true, error: null, details: { sampleCount: data?.length || 0 } }
      }
    } catch (err) {
      console.error("🔍 [Debug] Table structure exception:", err)
      tableTest = {
        exists: false,
        error: err instanceof Error ? err.message : "Unknown error",
        details: err,
      }
    }

    // 함수 존재 확인
    let functionsTest = { exists: false, error: null, details: null }
    try {
      console.log("🔍 [Debug] Testing functions...")

      // 올바른 UUID 형식으로 테스트
      const testUserId = "00000000-0000-0000-0000-000000000000" // 유효한 UUID 형식
      const testEmbedding = new Array(1536).fill(0.1)

      const { data, error } = await smartMemoryService.supabase.rpc("find_similar_memory", {
        user_id: testUserId,
        content_embedding: testEmbedding,
        memory_type: "test",
        similarity_threshold: 0.5,
      })

      if (error) {
        console.error("🔍 [Debug] Functions error:", error)
        functionsTest = { exists: false, error: error.message, details: error }
      } else {
        console.log("🔍 [Debug] Functions OK")
        functionsTest = { exists: true, error: null, details: { resultCount: data?.length || 0 } }
      }
    } catch (err) {
      console.error("🔍 [Debug] Functions exception:", err)
      functionsTest = {
        exists: false,
        error: err instanceof Error ? err.message : "Unknown error",
        details: err,
      }
    }

    // OpenAI API 테스트
    let openaiTest = { working: false, error: null, details: null }
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("🔍 [Debug] Testing OpenAI API...")
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        })

        if (response.ok) {
          console.log("🔍 [Debug] OpenAI API OK")
          openaiTest = { working: true, error: null, details: { status: response.status } }
        } else {
          console.error("🔍 [Debug] OpenAI API error:", response.status)
          openaiTest = { working: false, error: `HTTP ${response.status}`, details: { status: response.status } }
        }
      } catch (err) {
        console.error("🔍 [Debug] OpenAI API exception:", err)
        openaiTest = {
          working: false,
          error: err instanceof Error ? err.message : "Unknown error",
          details: err,
        }
      }
    }

    const result = {
      config,
      dbTest,
      tableTest,
      functionsTest,
      openaiTest,
      timestamp: new Date().toISOString(),
    }

    console.log("🔍 [Debug] Final result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("🔍 [Debug] Overall error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
