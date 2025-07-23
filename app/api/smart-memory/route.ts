import { type NextRequest, NextResponse } from "next/server"
import { smartMemoryService } from "@/lib/smart-memory-service"

export async function POST(request: NextRequest) {
  try {
    console.log("🧠 [API] Smart memory POST request received")

    const body = await request.json()
    console.log("🧠 [API] Request body:", body)

    const { userId, conversationId, userMessage, assistantResponse, action } = body

    // 필수 파라미터 검증
    if (!userId) {
      console.error("🧠 [API] Missing userId")
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    if (!userMessage || !assistantResponse) {
      console.error("🧠 [API] Missing messages")
      return NextResponse.json(
        { success: false, error: "userMessage and assistantResponse are required" },
        { status: 400 },
      )
    }

    if (!conversationId) {
      console.error("🧠 [API] Missing conversationId")
      return NextResponse.json({ success: false, error: "conversationId is required" }, { status: 400 })
    }

    // 디버그 액션인 경우
    if (action === "debug") {
      console.log("🧠 [API] Debug action requested")

      try {
        const result = await smartMemoryService.processConversation(
          userId,
          conversationId,
          userMessage,
          assistantResponse,
        )

        console.log("🧠 [API] Debug result:", result)

        return NextResponse.json({
          success: true,
          debug: true,
          result,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        console.error("🧠 [API] Debug processing failed:", error)
        return NextResponse.json({
          success: false,
          debug: true,
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        })
      }
    }

    // 일반 메모리 처리
    console.log("🧠 [API] Processing conversation...")

    const result = await smartMemoryService.processConversation(userId, conversationId, userMessage, assistantResponse)

    console.log("🧠 [API] Processing result:", result)

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🧠 [API] Smart memory processing failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const query = searchParams.get("query")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    const memories = await smartMemoryService.getRelevantMemories(userId, query)
    const stats = await smartMemoryService.getMemoryStats(userId)

    return NextResponse.json({
      success: true,
      memories,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Smart memory GET failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
