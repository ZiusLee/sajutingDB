import { supabase } from "./supabase-client"

export interface MemoryEntry {
  id: string
  userId: string | null
  sessionId?: string | null
  title?: string | null
  content: string
  entryDate: string
  entryTime: string
  emotionalState: Record<string, any>
  entryType: "manual" | "ai_generated" | "session_summary" | "insight_summary"
  contextData: Record<string, any>
  tags: string[]
  category?: string | null
  isPrivate: boolean
  visibility: "private" | "shared" | "public"
  aiProcessed: boolean
  aiInsights: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface MemoryInsight {
  id: string
  userId: string
  insightType: "pattern" | "trend" | "recommendation" | "warning" | "milestone" | "achievement"
  title: string
  description: string
  patternData: Record<string, any>
  sourceMemoryIds: string[]
  dateRangeStart?: string | null
  dateRangeEnd?: string | null
  confidenceScore: number
  modelUsed?: string | null
  generatedAt: string
  userAcknowledged: boolean
  userFeedback: Record<string, any>
  isActive: boolean
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface MemorySajuLink {
  id: string
  memoryId: string
  sajuSessionId: string
  relevanceScore: number
  linkType: "related" | "triggered_by" | "resulted_in" | "referenced" | "manual"
  contextNotes?: string | null
  aiConfidence: number
  createdAt: string
}

class EnhancedMemoryService {
  private static instance: EnhancedMemoryService

  static getInstance(): EnhancedMemoryService {
    if (!EnhancedMemoryService.instance) {
      EnhancedMemoryService.instance = new EnhancedMemoryService()
    }
    return EnhancedMemoryService.instance
  }

  // Create memory entry
  async createMemoryEntry(entry: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    try {
      const { data, error } = await supabase
        .from("memory_entries")
        .insert({
          user_id: entry.userId, // auth.users.id
          session_id: entry.sessionId, // saju_sessions.id (선택적)
          title: entry.title,
          content: entry.content,
          entry_date: entry.entryDate || new Date().toISOString().split("T")[0],
          entry_time: entry.entryTime || new Date().toTimeString().split(" ")[0],
          emotional_state: entry.emotionalState || {},
          entry_type: entry.entryType || "manual",
          context_data: entry.contextData || {},
          tags: entry.tags || [],
          category: entry.category,
          is_private: entry.isPrivate !== false,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating memory entry:", error)
        return null
      }

      return this.mapDatabaseToMemoryEntry(data)
    } catch (error) {
      console.error("Error in createMemoryEntry:", error)
      return null
    }
  }

  // Get memory entries with filters
  async getMemoryEntries(
    userId: string,
    filters: {
      startDate?: string
      endDate?: string
      tags?: string[]
      category?: string
      search?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<MemoryEntry[]> {
    try {
      // Check if memory_entries table exists first
      const { data: tableCheck } = await supabase.from("memory_entries").select("id").limit(1)

      // If table doesn't exist or is empty, return empty array
      if (!tableCheck) {
        console.log("Memory entries table not found or empty")
        return []
      }

      // auth.users.id를 사용 (로그인한 사용자)
      let query = supabase
        .from("memory_entries")
        .select(`
        *,
        memory_saju_links (
          saju_session_id,
          relevance_score,
          link_type
        )
      `)
        .eq("user_id", userId) // auth.users.id 사용
        .or("is_deleted.is.null,is_deleted.eq.false") // Handle both null and false
        .order("entry_date", { ascending: false })
        .order("entry_time", { ascending: false })

      if (filters.startDate) {
        query = query.gte("entry_date", filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte("entry_date", filters.endDate)
      }
      if (filters.category) {
        query = query.eq("category", filters.category)
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps("tags", filters.tags)
      }
      if (filters.search) {
        // Use simple text search instead of full-text search for compatibility
        query = query.ilike("content", `%${filters.search}%`)
      }

      const limit = filters.limit || 50
      const offset = filters.offset || 0
      query = query.range(offset, offset + limit - 1)

      const { data, error } = await query

      if (error) {
        console.error("Error fetching memory entries:", error)
        return []
      }

      return data?.map(this.mapDatabaseToMemoryEntry) || []
    } catch (error) {
      console.error("Error in getMemoryEntries:", error)
      return []
    }
  }

  // Get relevant memories for AI context
  async getRelevantMemoriesForContext(userId: string, contextKeywords: string[], limit = 5): Promise<MemoryEntry[]> {
    try {
      // Search by keywords in content and tags
      const searchQuery = contextKeywords.join(" | ")

      const { data, error } = await supabase
        .from("memory_entries")
        .select("*")
        .eq("user_id", userId)
        .or(`tags.cs.{${contextKeywords.join(",")}},search_vector.fts.${searchQuery}`)
        .order("entry_date", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("Error fetching relevant memories:", error)
        return []
      }

      return data?.map(this.mapDatabaseToMemoryEntry) || []
    } catch (error) {
      console.error("Error in getRelevantMemoriesForContext:", error)
      return []
    }
  }

  // Extract insights from conversation
  async extractInsightsFromConversation(
    userId: string,
    userMessage: string,
    assistantResponse: string,
    sessionId?: string,
  ): Promise<MemoryEntry | null> {
    try {
      // Analyze conversation for emotional content and insights
      const insights = await this.analyzeConversationContent(userMessage, assistantResponse)

      if (!insights.shouldSave) {
        return null
      }

      const memoryEntry = await this.createMemoryEntry({
        userId,
        sessionId,
        title: insights.title,
        content: insights.content,
        emotionalState: insights.emotionalState,
        entryType: "ai_generated",
        contextData: {
          userMessage: userMessage.substring(0, 500), // Truncate for storage
          assistantResponse: assistantResponse.substring(0, 500),
          extractedAt: new Date().toISOString(),
        },
        tags: insights.tags,
        category: insights.category,
      })

      return memoryEntry
    } catch (error) {
      console.error("Error in extractInsightsFromConversation:", error)
      return null
    }
  }

  // Generate insights from memory patterns
  async generateInsights(userId: string, dateRange?: { start: string; end: string }): Promise<MemoryInsight[]> {
    try {
      const entries = await this.getMemoryEntries(userId, {
        startDate: dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: dateRange?.end || new Date().toISOString().split("T")[0],
        limit: 100,
      })

      if (entries.length < 3) {
        return []
      }

      const insights = await this.analyzeMemoryPatterns(entries)
      const savedInsights: MemoryInsight[] = []

      for (const insight of insights) {
        const { data, error } = await supabase
          .from("memory_insights")
          .insert({
            user_id: userId,
            insight_type: insight.type,
            title: insight.title,
            description: insight.description,
            pattern_data: insight.patternData,
            source_memory_ids: insight.sourceMemoryIds,
            date_range_start: dateRange?.start,
            date_range_end: dateRange?.end,
            confidence_score: insight.confidence,
            model_used: "enhanced_pattern_analyzer_v1",
          })
          .select()
          .single()

        if (!error && data) {
          savedInsights.push(this.mapDatabaseToInsight(data))
        }
      }

      return savedInsights
    } catch (error) {
      console.error("Error in generateInsights:", error)
      return []
    }
  }

  // Link memory to saju session
  async linkMemoryToSession(
    memoryId: string,
    sessionId: string,
    relevanceScore = 0.5,
    linkType = "related",
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("memory_saju_links").upsert({
        memory_id: memoryId,
        saju_session_id: sessionId,
        relevance_score: relevanceScore,
        link_type: linkType,
        ai_confidence: 0.8,
      })

      return !error
    } catch (error) {
      console.error("Error in linkMemoryToSession:", error)
      return false
    }
  }

  // Get memory analytics
  async getMemoryAnalytics(userId: string, days = 30): Promise<any> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      const { data, error } = await supabase
        .from("memory_analytics")
        .select("*")
        .eq("user_id", userId)
        .gte("date", startDate)
        .order("date", { ascending: false })

      if (error) {
        console.error("Error fetching analytics:", error)
        return null
      }

      return this.aggregateAnalytics(data || [])
    } catch (error) {
      console.error("Error in getMemoryAnalytics:", error)
      return null
    }
  }

  // Private helper methods
  private mapDatabaseToMemoryEntry(data: any): MemoryEntry {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      title: data.title,
      content: data.content,
      entryDate: data.entry_date,
      entryTime: data.entry_time,
      emotionalState: data.emotional_state || {},
      entryType: data.entry_type,
      contextData: data.context_data || {},
      tags: data.tags || [],
      category: data.category,
      isPrivate: data.is_private,
      visibility: data.visibility,
      aiProcessed: data.ai_processed,
      aiInsights: data.ai_insights || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private mapDatabaseToInsight(data: any): MemoryInsight {
    return {
      id: data.id,
      userId: data.user_id,
      insightType: data.insight_type,
      title: data.title,
      description: data.description,
      patternData: data.pattern_data || {},
      sourceMemoryIds: data.source_memory_ids || [],
      dateRangeStart: data.date_range_start,
      dateRangeEnd: data.date_range_end,
      confidenceScore: data.confidence_score,
      modelUsed: data.model_used,
      generatedAt: data.generated_at,
      userAcknowledged: data.user_acknowledged,
      userFeedback: data.user_feedback || {},
      isActive: data.is_active,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private async analyzeConversationContent(userMessage: string, assistantResponse: string) {
    // Enhanced conversation analysis
    const emotionalKeywords = {
      anxiety: ["불안", "걱정", "두려", "초조"],
      sadness: ["슬프", "우울", "힘들", "괴로"],
      happiness: ["기쁘", "행복", "좋아", "즐거"],
      anger: ["화나", "짜증", "분노", "억울"],
      stress: ["스트레스", "압박", "부담", "피곤"],
    }

    const topicKeywords = {
      relationship: ["연애", "사랑", "썸", "헤어", "결혼", "이별"],
      career: ["직장", "회사", "일", "업무", "취업", "이직"],
      family: ["가족", "부모", "형제", "자매", "친척"],
      health: ["건강", "병원", "아프", "치료", "운동"],
      money: ["돈", "재정", "투자", "저축", "빚", "경제"],
    }

    const emotionalState: Record<string, any> = {}
    const tags: string[] = []
    let category: string | undefined

    // Detect emotions
    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      if (keywords.some((keyword) => userMessage.includes(keyword))) {
        emotionalState[emotion] = true
      }
    }

    // Detect topics
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => userMessage.includes(keyword))) {
        tags.push(topic)
        if (!category) category = topic
      }
    }

    // Determine if worth saving
    const shouldSave = Object.keys(emotionalState).length > 0 || tags.length > 0 || userMessage.length > 100

    return {
      shouldSave,
      title: `${new Date().toLocaleDateString("ko-KR")} 상담 기록`,
      content: userMessage,
      emotionalState,
      tags,
      category,
    }
  }

  private async analyzeMemoryPatterns(entries: MemoryEntry[]) {
    const insights = []

    // Emotional trend analysis
    const emotionalEntries = entries.filter((e) => Object.keys(e.emotionalState).length > 0)
    if (emotionalEntries.length >= 3) {
      const trend = this.calculateEmotionalTrend(emotionalEntries)
      insights.push({
        type: "emotional_trend",
        title: "감정 변화 패턴",
        description: trend.description,
        patternData: trend.data,
        sourceMemoryIds: emotionalEntries.map((e) => e.id),
        confidence: trend.confidence,
      })
    }

    // Topic frequency analysis
    const allTags = entries.flatMap((e) => e.tags)
    const tagFrequency = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    if (Object.keys(tagFrequency).length > 0) {
      const topTags = Object.entries(tagFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)

      insights.push({
        type: "topic_frequency",
        title: "주요 관심사 분석",
        description: `최근 주요 관심사: ${topTags.map(([tag]) => tag).join(", ")}`,
        patternData: { tagFrequency, topTags },
        sourceMemoryIds: entries.map((e) => e.id),
        confidence: 0.8,
      })
    }

    return insights
  }

  private calculateEmotionalTrend(entries: MemoryEntry[]) {
    // Calculate emotional trend over time
    const emotionalScores = entries
      .map((entry) => {
        let score = 0
        const emotions = entry.emotionalState

        if (emotions.happiness) score += 2
        if (emotions.anxiety) score -= 1
        if (emotions.sadness) score -= 2
        if (emotions.anger) score -= 1
        if (emotions.stress) score -= 1

        return {
          date: entry.entryDate,
          score,
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (emotionalScores.length < 2) {
      return {
        description: "감정 데이터가 부족합니다.",
        data: {},
        confidence: 0.3,
      }
    }

    const firstHalf = emotionalScores.slice(0, Math.floor(emotionalScores.length / 2))
    const secondHalf = emotionalScores.slice(Math.floor(emotionalScores.length / 2))

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.score, 0) / secondHalf.length

    const trend = secondAvg - firstAvg

    return {
      description:
        trend > 0.5
          ? "감정 상태가 개선되고 있습니다."
          : trend < -0.5
            ? "감정 상태에 주의가 필요합니다."
            : "감정 상태가 안정적입니다.",
      data: { trend, emotionalScores, firstAvg, secondAvg },
      confidence: Math.abs(trend) > 0.3 ? 0.8 : 0.5,
    }
  }

  private aggregateAnalytics(analyticsData: any[]) {
    if (analyticsData.length === 0) return null

    const totalEntries = analyticsData.reduce((sum, day) => sum + (day.entries_created || 0), 0)
    const avgEntriesPerDay = totalEntries / analyticsData.length

    const allTags = analyticsData.flatMap((day) => day.most_used_tags || [])
    const tagFrequency = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalEntries,
      avgEntriesPerDay: Math.round(avgEntriesPerDay * 100) / 100,
      totalDays: analyticsData.length,
      topTags: Object.entries(tagFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count })),
      dailyData: analyticsData,
    }
  }
}

export const enhancedMemoryService = EnhancedMemoryService.getInstance()
