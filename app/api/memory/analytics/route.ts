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

    // Get basic stats
    const { data: stats, error: statsError } = await supabaseClient.rpc("get_user_memory_stats", {
      p_user_id: user.id,
    })

    if (statsError) {
      console.error("Error fetching memory stats:", statsError)
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }

    // Get entries for trend analysis
    const { data: entries, error: entriesError } = await supabaseClient
      .from("memory_entries")
      .select("entry_date, emotional_state, tags, category")
      .eq("user_id", user.id)
      .gte("entry_date", startDate)
      .order("entry_date", { ascending: true })

    if (entriesError) {
      console.error("Error fetching entries for analytics:", entriesError)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    // Process analytics data
    const analytics = processAnalyticsData(entries || [], days)

    return NextResponse.json({
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

function processAnalyticsData(entries: any[], days: number) {
  // Daily entry counts
  const dailyCounts: Record<string, number> = {}
  const emotionalTrends: Record<string, number[]> = {}
  const tagFrequency: Record<string, number> = {}
  const categoryDistribution: Record<string, number> = {}

  // Initialize daily counts for the period
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    dailyCounts[date] = 0
  }

  // Process entries
  entries.forEach((entry) => {
    const date = entry.entry_date
    dailyCounts[date] = (dailyCounts[date] || 0) + 1

    // Process emotional states
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

    // Process tags
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag: string) => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
      })
    }

    // Process categories
    if (entry.category) {
      categoryDistribution[entry.category] = (categoryDistribution[entry.category] || 0) + 1
    }
  })

  // Calculate trends
  const totalEntries = Object.values(dailyCounts).reduce((sum, count) => sum + count, 0)
  const avgEntriesPerDay = totalEntries / days

  // Get top tags and categories
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
