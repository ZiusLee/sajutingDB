import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// GET - Retrieve memory insights
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
    const insightType = searchParams.get("type")
    const activeOnly = searchParams.get("active") === "true"

    let query = supabaseClient
      .from("memory_insights")
      .select("*")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })

    if (insightType) {
      query = query.eq("insight_type", insightType)
    }

    if (activeOnly) {
      query = query.eq("is_active", true)
    }

    const { data: insights, error } = await query

    if (error) {
      console.error("Error fetching insights:", error)
      return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error in insights GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Generate new insights from memory patterns
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { dateRange, insightType = "pattern" } = body

    // Get recent memory entries for analysis
    const { data: entries, error: entriesError } = await supabaseClient
      .from("memory_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte(
        "entry_date",
        dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      )
      .lte("entry_date", dateRange?.end || new Date().toISOString().split("T")[0])
      .order("entry_date", { ascending: false })

    if (entriesError || !entries || entries.length === 0) {
      return NextResponse.json({ error: "No entries found for analysis" }, { status: 400 })
    }

    // Analyze patterns (simplified version - in production, use AI service)
    const insights = await analyzeMemoryPatterns(entries, insightType)

    // Save insights to database
    const savedInsights = []
    for (const insight of insights) {
      const { data: savedInsight, error: saveError } = await supabaseClient
        .from("memory_insights")
        .insert({
          user_id: user.id,
          insight_type: insight.type,
          title: insight.title,
          description: insight.description,
          pattern_data: insight.patternData,
          source_memory_ids: insight.sourceMemoryIds,
          date_range_start: dateRange?.start,
          date_range_end: dateRange?.end,
          confidence_score: insight.confidence,
          model_used: "pattern_analyzer_v1",
        })
        .select()
        .single()

      if (!saveError) {
        savedInsights.push(savedInsight)
      }
    }

    return NextResponse.json({ insights: savedInsights })
  } catch (error) {
    console.error("Error in insights POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function to analyze memory patterns
async function analyzeMemoryPatterns(entries: any[], insightType: string) {
  const insights = []

  // Emotional trend analysis
  const emotionalData = entries
    .filter((entry) => entry.emotional_state && Object.keys(entry.emotional_state).length > 0)
    .map((entry) => ({
      date: entry.entry_date,
      ...entry.emotional_state,
    }))

  if (emotionalData.length >= 3) {
    const moodTrend = analyzeMoodTrend(emotionalData)
    insights.push({
      type: "emotional_trend",
      title: `감정 변화 패턴 분석`,
      description: moodTrend.description,
      patternData: moodTrend.data,
      sourceMemoryIds: entries.slice(0, 10).map((e) => e.id),
      confidence: moodTrend.confidence,
    })
  }

  // Tag frequency analysis
  const allTags = entries.flatMap((entry) => entry.tags || [])
  const tagFrequency = allTags.reduce(
    (acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topTags = Object.entries(tagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  if (topTags.length > 0) {
    insights.push({
      type: "topic_pattern",
      title: "주요 관심사 분석",
      description: `최근 가장 많이 언급된 주제들: ${topTags.map(([tag]) => tag).join(", ")}`,
      patternData: { tagFrequency, topTags },
      sourceMemoryIds: entries.map((e) => e.id),
      confidence: 0.8,
    })
  }

  return insights
}

function analyzeMoodTrend(emotionalData: any[]) {
  // Simplified mood trend analysis
  const moodValues = emotionalData
    .filter((d) => d.mood)
    .map((d) => {
      const moodScore = getMoodScore(d.mood)
      return { date: d.date, score: moodScore }
    })

  if (moodValues.length < 2) {
    return {
      description: "분석할 감정 데이터가 부족합니다.",
      data: {},
      confidence: 0.3,
    }
  }

  const trend = calculateTrend(moodValues)

  return {
    description:
      trend > 0
        ? "최근 감정 상태가 개선되고 있는 추세입니다."
        : trend < 0
          ? "최근 감정 상태에 주의가 필요할 수 있습니다."
          : "감정 상태가 안정적으로 유지되고 있습니다.",
    data: { trend, moodValues },
    confidence: Math.abs(trend) > 0.1 ? 0.8 : 0.5,
  }
}

function getMoodScore(mood: string): number {
  const moodScores: Record<string, number> = {
    very_happy: 5,
    happy: 4,
    neutral: 3,
    sad: 2,
    very_sad: 1,
    anxious: 2,
    stressed: 2,
    calm: 4,
    excited: 4,
  }
  return moodScores[mood] || 3
}

function calculateTrend(values: { date: string; score: number }[]): number {
  if (values.length < 2) return 0

  const sorted = values.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

  const firstAvg = firstHalf.reduce((sum, v) => sum + v.score, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, v) => sum + v.score, 0) / secondHalf.length

  return (secondAvg - firstAvg) / 5 // Normalize to -1 to 1
}
