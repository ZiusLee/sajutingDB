import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { smartMemoryServiceV2 } from "@/lib/smart-memory-service-v2"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const userId = searchParams.get("userId") || user.id
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 20
    const types = searchParams.get("types")?.split(",")
    const stats = searchParams.get("stats") === "true"

    if (stats) {
      // 메모리 통계 조회
      const { data, error } = await smartMemoryServiceV2.supabase.rpc("get_memory_stats", {
        p_user_id: user.id,
      })

      if (error) {
        console.error("통계 조회 오류:", error)
        return NextResponse.json({ error: "Failed to get memory stats" }, { status: 500 })
      }

      return NextResponse.json({ data: data[0] || {} })
    } else if (search) {
      // V2 검색 사용
      const memories = await smartMemoryServiceV2.searchMemories(userId, search, {
        limit,
        types,
      })
      return NextResponse.json({ data: memories })
    } else {
      // 전체 메모리 조회
      const { data, error } = await smartMemoryServiceV2.supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("메모리 조회 오류:", error)
        return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 })
      }

      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST method for creating/processing memories
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, conversationId, userMessage, assistantResponse, memory } = body

    if (memory) {
      // 단일 메모리 저장
      const result = await smartMemoryServiceV2.saveMemories(userId || user.id, [memory], conversationId || "manual")
      return NextResponse.json({ data: result })
    } else if (userMessage && assistantResponse) {
      // 대화 처리
      const result = await smartMemoryServiceV2.processConversation(
        userId || user.id,
        conversationId || "unknown",
        userMessage,
        assistantResponse,
      )
      return NextResponse.json({ data: result })
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
  } catch (error) {
    console.error("Memory processing failed:", error)
    return NextResponse.json({ error: "Failed to process memory" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, content, type, keywords, importance_score, is_pinned } = await request.json()

    // 내용이 변경되면 새로운 임베딩 생성
    const updateData: any = {
      content,
      type,
      keywords,
      importance_score,
      is_pinned,
      updated_at: new Date().toISOString(),
    }

    // 내용이 변경된 경우 임베딩 재생성
    if (content) {
      try {
        const embedding = await smartMemoryServiceV2.generateEmbedding(content)
        updateData.relevance_embedding = embedding
      } catch (error) {
        console.error("임베딩 생성 실패:", error)
        // 임베딩 실패해도 업데이트는 진행
      }
    }

    const { data, error } = await smartMemoryServiceV2.supabase
      .from("smart_contexts")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("메모리 업데이트 오류:", error)
      return NextResponse.json({ error: "Failed to update memory" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId") || user.id
    const deleteAll = searchParams.get("deleteAll") === "true"

    if (deleteAll) {
      const { error } = await smartMemoryServiceV2.supabase.from("smart_contexts").delete().eq("user_id", userId)

      if (error) {
        console.error("전체 메모리 삭제 오류:", error)
        return NextResponse.json({ error: "Failed to delete all memories" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 })
    }

    const { error } = await smartMemoryServiceV2.supabase
      .from("smart_contexts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (error) {
      console.error("메모리 삭제 오류:", error)
      return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// NEW: PATCH method for memory feedback
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, helpful } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 })
    }

    // Get current quality_score
    const { data: currentMemory, error: fetchError } = await smartMemoryServiceV2.supabase
      .from("smart_contexts")
      .select("quality_score")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !currentMemory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    const currentScore = currentMemory.quality_score || 0.5
    // Positive feedback has less impact than negative to prevent easy gaming of the system
    const adjustment = helpful ? 0.1 : -0.15
    const newScore = Math.max(0.1, Math.min(1.0, currentScore + adjustment))

    const { data, error } = await smartMemoryServiceV2.supabase
      .from("smart_contexts")
      .update({
        quality_score: newScore,
        is_low_quality: newScore < 0.5,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("메모리 피드백 업데이트 오류:", error)
      return NextResponse.json({ error: "Failed to update memory feedback" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
