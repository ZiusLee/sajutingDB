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
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20
    const types = searchParams.get("types")?.split(",")
    const stats = searchParams.get("stats") === "true"
    const minQuality = searchParams.get("minQuality") ? parseFloat(searchParams.get("minQuality")!) : undefined

    if (stats) {
      // 🔥 개선된 메모리 통계 조회 (품질 정보 포함)
      const { data, error } = await smartMemoryServiceV2.supabase.rpc("get_enhanced_memory_stats", {
        user_id: user.id,
      })

      if (error) {
        console.error("통계 조회 오류:", error)
        return NextResponse.json({ error: "Failed to get memory stats" }, { status: 500 })
      }

      return NextResponse.json({ data: data[0] || {} })
    } else if (search) {
      // 🔥 품질 점수를 고려한 검색
      const memories = await smartMemoryServiceV2.searchMemories(userId, search, {
        limit,
        types,
        minQuality,
      })
      return NextResponse.json({ data: memories })
    } else {
      // 🔥 품질 점수 기준으로 정렬된 전체 메모리 조회
      const { data, error } = await smartMemoryServiceV2.supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId)
        .order("quality_score", { ascending: false })
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
      const result = await smartMemoryServiceV2.saveMemories(
        userId || user.id,
        [memory],
        conversationId || "manual"
      )
      return NextResponse.json({ data: result })
    } else if (userMessage && assistantResponse) {
      // 대화 처리
      const result = await smartMemoryServiceV2.processConversation(
        userId || user.id,
        conversationId || "unknown",
        userMessage,
        assistantResponse
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

    const { id, content, type, keywords, importance_score, is_pinned, quality_score } = await request.json()

    // 내용이 변경되면 새로운 임베딩 생성
    let updateData: any = {
      content,
      type,
      keywords,
      importance_score,
      is_pinned,
      updated_at: new Date().toISOString(),
    }

    // 🔥 품질 점수 업데이트 지원
    if (quality_score !== undefined) {
      updateData.quality_score = quality_score
      updateData.is_low_quality = quality_score < 0.4
    }

    // 내용이 변경된 경우 임베딩 재생성
    if (content) {
      try {
        const embedding = await smartMemoryServiceV2.generateEmbedding(content)
        updateData.relevance_embedding = embedding
        
        // 🔥 품질 점수 재계산
        const qualityAssessment = await smartMemoryServiceV2['calculateQualityScore']({ content })
        updateData.quality_score = qualityAssessment.score
        updateData.is_low_quality = qualityAssessment.score < 0.4
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
    const deleteLowQuality = searchParams.get("deleteLowQuality") === "true"

    if (deleteAll) {
      const { error } = await smartMemoryServiceV2.supabase
        .from("smart_contexts")
        .delete()
        .eq("user_id", userId)

      if (error) {
        console.error("전체 메모리 삭제 오류:", error)
        return NextResponse.json({ error: "Failed to delete all memories" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // 🔥 저품질 메모리만 삭제
    if (deleteLowQuality) {
      const { data, error } = await smartMemoryServiceV2.supabase
        .from("smart_contexts")
        .delete()
        .eq("user_id", userId)
        .lt("quality_score", 0.3)
        .select("id")

      if (error) {
        console.error("저품질 메모리 삭제 오류:", error)
        return NextResponse.json({ error: "Failed to delete low quality memories" }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        deletedCount: data?.length || 0,
        message: `${data?.length || 0}개의 저품질 메모리가 삭제되었습니다.`
      })
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

// 🔥 새로운 피드백 엔드포인트
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

    const { searchParams } = new URL(request.url)
    const memoryId = searchParams.get("id")
    
    if (!memoryId) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 })
    }

    const { helpful, feedbackType } = await request.json()

    if (typeof helpful !== "boolean") {
      return NextResponse.json({ error: "helpful field is required and must be boolean" }, { status: 400 })
    }

    // 피드백 처리
    const result = await smartMemoryServiceV2.processFeedback(
      memoryId,
      user.id,
      helpful,
      feedbackType
    )

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error("피드백 처리 오류:", error)
    return NextResponse.json({ error: "Failed to process feedback" }, { status: 500 })
  }
}
