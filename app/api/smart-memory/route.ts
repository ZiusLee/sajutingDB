import { type NextRequest, NextResponse } from "next/server"
import { smartMemoryService } from "@/lib/smart-memory-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 사용자의 모든 메모리 조회
    const { data: memories, error } = await smartMemoryService.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .order("last_referenced", { ascending: false })

    if (error) {
      console.error("Error fetching memories:", error)
      return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 })
    }

    // 통계 계산
    const stats = {
      total: memories?.length || 0,
      byType:
        memories?.reduce((acc: Record<string, number>, memory: any) => {
          acc[memory.type] = (acc[memory.type] || 0) + 1
          return acc
        }, {}) || {},
    }

    return NextResponse.json({
      memories: memories || [],
      stats,
    })
  } catch (error) {
    console.error("Smart memory API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, conversationId, userMessage, assistantResponse, memories } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // 직접 메모리 저장 (테스트용)
    if (memories && Array.isArray(memories)) {
      const savedMemories = await smartMemoryService.saveMemories(userId, memories, conversationId || "direct-save")
      return NextResponse.json({
        success: true,
        savedMemories,
        message: `${savedMemories.length}개의 메모리가 저장되었습니다.`,
      })
    }

    // 대화 기반 메모리 처리
    if (userMessage && assistantResponse) {
      const result = await smartMemoryService.processConversation(
        userId,
        conversationId || `conversation-${Date.now()}`,
        userMessage,
        assistantResponse,
      )

      return NextResponse.json({
        success: true,
        result,
        message: result.savedMemories
          ? `${result.savedMemories.length}개의 메모리가 저장되었습니다.`
          : "저장할 메모리가 없습니다.",
      })
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
  } catch (error) {
    console.error("Smart memory save error:", error)
    return NextResponse.json(
      {
        error: "Failed to process memory",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
