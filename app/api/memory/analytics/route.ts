import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// GET - Get memory analytics for user
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = Number.parseInt(searchParams.get("days") || "30")
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    // auth.users.id를 사용 (로그인한 사용자)
    const authUserId = user.id

    // 기본 통계 가져오기 (함수 사용 시도, 실패하면 직접 쿼리)
    let stats = null
    try {
      const { data: functionStats, error: statsError } = await supabaseClient.rpc("get_user_memory_stats", {
        p_user_id: authUserId,
      })

      if (!statsError && functionStats) {
        stats = functionStats
      }
    } catch (error) {
      console.log("Function not available, using direct queries")
    }

    // 함수가 없으면 직접 쿼리로 통계 계산
    if (!stats) {
      stats = await calculateStatsDirectly(supabaseClient, authUserId)
    }

    // 분석용 엔트리 가져오기
    const { data: entries, error: entriesError } = await supabaseClient
      .from("memory_entries")
      .select("entry_date, emotional_state, tags, category")
      .eq("user_id", authUserId)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .gte("entry_date", startDate)
      .order("entry_date", { ascending: true })

    if (entriesError) {
      console.error("Error fetching entries for analytics:", entriesError)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    // 분석 데이터 처리
    const analytics = processAnalyticsData(entries || [], days)

    return NextResponse.json({
      success: true,
      stats,
      analytics,
      period: {
        days,
        startDate,
        endDate: new Date().toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Error in memory analytics GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 직접 쿼리로 통계 계산하는 함수
async function calculateStatsDirectly(supabaseClient: any, userId: string) {
  try {
    // 총 엔트리 수
    const { count: totalEntries } = await supabaseClient
      .from("memory_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .or("is_deleted.is.null,is_deleted.eq.false")

    // 이번 달 엔트리 수
    const thisMonth = new Date()
    thisMonth.setDate(1)
    const { count: entriesThisMonth } = await supabaseClient
      .from("memory_entries")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .gte("entry_date", thisMonth.toISOString().split("T")[0])

    // 가장 많이 사용된 태그들
    const { data: entriesWithTags } = await supabaseClient
      .from("memory_entries")
      .select("tags")
      .eq("user_id", userId)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .not("tags", "is", null)

    const allTags = (entriesWithTags || []).flatMap((entry: any) => entry.tags || [])
    const tagFrequency = allTags.reduce(
      (acc: Record<string, number>, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const mostUsedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag]) => tag)

    // 평균 감정 상태
    const { data: emotionalEntries } = await supabaseClient
      .from("memory_entries")
      .select("emotional_state")
      .eq("user_id", userId)
      .or("is_deleted.is.null,is_deleted.eq.false")
      .not("emotional_state", "is", null)

    let avgMood = 0
    if (emotionalEntries && emotionalEntries.length > 0) {
      const happinessCount = emotionalEntries.filter((entry: any) => entry.emotional_state?.happiness === true).length
      avgMood = happinessCount / emotionalEntries.length
    }

    return {
      total_entries: totalEntries || 0,
      entries_this_month: entriesThisMonth || 0,
      most_used_tags: mostUsedTags,
      avg_mood: avgMood,
    }
  } catch (error) {
    console.error("Error calculating stats directly:", error)
    return {
      total_entries: 0,
      entries_this_month: 0,
      most_used_tags: [],
      avg_mood: 0,
    }
  }
}

function processAnalyticsData(entries: any[], days: number) {
  // 일별 엔트리 수
  const dailyCounts: Record<string, number> = {}
  const emotionalTrends: Record<string, number[]> = {}
  const tagFrequency: Record<string, number> = {}
  const categoryDistribution: Record<string, number> = {}

  // 날짜 범위 초기화
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    dailyCounts[date] = 0
  }

  // 엔트리 처리
  entries.forEach((entry) => {
    const date = entry.entry_date
    dailyCounts[date] = (dailyCounts[date] || 0) + 1

    // 감정 상태 처리
    if (entry.emotional_state && typeof entry.emotional_state === "object") {
      Object.keys(entry.emotional_state).forEach((emotion) => {
        if (entry.emotional_state[emotion]) {
          if (!emotionalTrends[emotion]) {
            emotionalTrends[emotion] = new Array(days).fill(0)
          }
          const dayIndex = Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000))
          if (dayIndex >= 0 && dayIndex < days) {
            emotionalTrends[emotion][days - 1 - dayIndex]++
          }
        }
      })
    }

    // 태그 처리
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag: string) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
      })
    }

    // 카테고리 처리
    if (entry.category) {
      categoryDistribution[entry.category] = (categoryDistribution[entry.category] || 0) + 1
    }
  })

  // 통계 계산
  const totalEntries = Object.values(dailyCounts).reduce((sum, count) => sum + count, 0)
  const avgEntriesPerDay = totalEntries / days

  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  const topCategories = Object.entries(categoryDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }))

  return {
    totalEntries,
    avgEntriesPerDay: Math.round(avgEntriesPerDay * 100) / 100,
    dailyCounts: Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    emotionalTrends,
    topTags,
    topCategories,
    activeDays: Object.values(dailyCounts).filter((count) => count > 0).length,
    streakDays: calculateStreak(dailyCounts),
  }
}

function calculateStreak(dailyCounts: Record<string, number>): number {
  const dates = Object.keys(dailyCounts).sort().reverse()
  let streak = 0

  for (const date of dates) {
    if (dailyCounts[date] > 0) {
      streak++
    } else {
      break
    }
  }

  return streak
}
