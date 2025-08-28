import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // 사용자의 모든 smart_context 데이터를 가져옴 (품질 점수 기준으로 필터링)
    const { data: contexts, error } = await supabase
      .from("smart_contexts")
      .select(
        "id, type, content, source_context, keywords, importance_score, quality_score, reference_count, is_pinned, created_at, updated_at",
      )
      .eq("user_id", userId)
      .gte("quality_score", 0.3) // 최소 품질 점수 필터
      .order("quality_score", { ascending: false })
      .order("importance_score", { ascending: false })
      .limit(50) // 최대 50개로 제한

    if (error) {
      console.error("Error fetching user context:", error)
      return NextResponse.json({ error: "Failed to fetch user context" }, { status: 500 })
    }

    // 타입별로 그룹화하여 구조화된 컨텍스트 생성
    const contextByType =
      contexts?.reduce((acc: any, context: any) => {
        if (!acc[context.type]) {
          acc[context.type] = []
        }
        acc[context.type].push({
          id: context.id,
          content: context.content,
          source_context: context.source_context,
          keywords: context.keywords,
          importance_score: context.importance_score,
          quality_score: context.quality_score,
          reference_count: context.reference_count,
          is_pinned: context.is_pinned,
          created_at: context.created_at,
          updated_at: context.updated_at,
        })
        return acc
      }, {}) || {}

    // 컨텍스트 요약 생성
    const contextSummary = Object.entries(contextByType).map(([type, items]: [string, any]) => {
      const topItems = items.slice(0, 5) // 각 타입별로 상위 5개만
      return {
        type,
        count: items.length,
        items: topItems,
      }
    })

    return NextResponse.json({
      success: true,
      contextByType,
      contextSummary,
      totalContexts: contexts?.length || 0,
    })
  } catch (error) {
    console.error("Error in user-context API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
