import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"
import crypto from "crypto"

// Node.js 환경 변수 타입 지원
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY?: string
      NEXT_PUBLIC_SUPABASE_URL?: string
      SUPABASE_SERVICE_ROLE_KEY?: string
    }
  }
}

// 개선된 메모리 타입 정의 - 더 세밀한 분류
const MemoryType = z.enum([
  "identity", // 신원, 직업, 역할
  "goal", // 목표, 계획
  "emotion", // 감정 패턴
  "relationship", // 인간관계
  "interest", // 관심사, 취미
  "preference", // 선호도
  "situation", // 현재 상황
  "experience", // 과거 경험
  "belief", // 신념, 가치관
  "skill", // 능력, 기술
])

// 🔥 Modern Pure Embedding Schema (키워드 제거)
const MemoryExtractionSchema = z.object({
  shouldSave: z.boolean(),
  memories: z.array(
    z.object({
      type: MemoryType,
      content: z.string().describe("핵심 정보만 간결하고 검색 가능하게 작성"),
      importance: z.number().min(0).max(1),
      confidence: z.number().min(0).max(1).describe("정보의 확실성"),
      temporalContext: z.enum(["past", "present", "future", "timeless"]),
      sourceQuote: z.string().optional().describe("원문 인용"),
    }),
  ),
  reasoning: z.string(),
})

// 🔥 Simplified Query Understanding (키워드 의존성 감소)
const QueryUnderstandingSchema = z.object({
  intent: z.string().describe("사용자 의도"),
  temporalContext: z.enum(["past", "present", "future", "any"]),
  memoryTypes: z.array(MemoryType).describe("관련 메모리 타입"),
})

class SmartMemoryServiceV2 {
  supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        "x-client-info": "smart-memory-v2",
      },
    },
  })

  // 개선된 임베딩 생성 - 클라이언트/서버 환경 모두 지원
  async generateEmbedding(text: string, retries = 3): Promise<number[]> {
    for (let i = 0; i < retries; i++) {
      try {
        // 클라이언트 사이드에서는 /api/embeddings 엔드포인트 사용
        if (typeof window !== "undefined") {
          const response = await fetch("/api/embeddings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: text.slice(0, 8000) }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(`Embedding API error: ${error.error}`)
          }

          const data = await response.json()
          return data.embedding
        }

        // 서버 사이드에서는 직접 OpenAI API 호출
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
          throw new Error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다")
        }

        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text.slice(0, 8000), // Token limit 방지
            dimensions: 1536,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Embedding API error: ${JSON.stringify(error)}`)
        }

        const data = await response.json()
        return data.data[0].embedding
      } catch (error) {
        console.error(`임베딩 생성 실패 (시도 ${i + 1}/${retries}):`, error)
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // 지수 백오프
      }
    }
    throw new Error("임베딩 생성 최대 재시도 횟수 초과")
  }

  // 개선된 메모리 추출 - Few-shot learning과 chain of thought
  async extractMemoryCandidate(userMessage: string, assistantResponse: string, previousMemories?: any[]) {
    try {
      console.log("🧠 [EXTRACT 1] Starting extractMemoryCandidate")
      console.log("🧠 [EXTRACT 1] User message:", userMessage.slice(0, 100))
      console.log("🧠 [EXTRACT 1] Assistant response:", assistantResponse.slice(0, 100))

      // Pre-filter: Skip extraction for low-value conversations
      console.log("🧠 [EXTRACT 1] Checking if conversation should be extracted...")
      const shouldExtract = this.shouldExtractFromConversation(userMessage, assistantResponse)
      console.log("🧠 [EXTRACT 1] Should extract:", shouldExtract)

      if (!shouldExtract) {
        console.log("🧠 [EXTRACT 1] Skipping extraction - low value conversation")
        return {
          shouldSave: false,
          memories: [],
          reasoning: "대화에 기억할 만한 새로운 정보가 없음",
        }
      }

      console.log("🧠 [EXTRACT 2] Building conversation and context...")
      const conversation = `사용자: ${userMessage}\nAI: ${assistantResponse}`

      // 이전 메모리 컨텍스트 생성 (더 간결하게)
      const memoryContext = previousMemories?.length
        ? `\n\n기존 정보:\n${previousMemories
            .slice(0, 5)
            .map((m) => `- ${m.content}`)
            .join("\n")}`
        : ""

      console.log("🧠 [EXTRACT 2] Memory context length:", memoryContext.length)
      console.log("🧠 [EXTRACT 2] Calling GPT for memory extraction...")

      // 🔥 GPT 호출을 제대로 된 타임아웃과 함께 실행
      let result: any
      let timeoutId: NodeJS.Timeout | null = null

      try {
        console.log("🧠 [EXTRACT 2] Starting GPT generateObject call...")

        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            console.log("🚨 [EXTRACT 2] GPT call timed out after 25s")
            reject(new Error("GPT generateObject timeout after 25s"))
          }, 25000) // 25초 타임아웃
        })

        const gptPromise = generateObject({
          model: openai("gpt-4o-mini"),
          schema: MemoryExtractionSchema,
          temperature: 0.1,
          prompt: `사용자의 발언에서만 사용자에 대한 새로운 사실 정보를 추출하세요. AI의 발언은 사용자의 발언을 이해하기 위한 맥락으로만 사용하고, AI의 발언 내용 자체를 정보로 추출해서는 안 됩니다.${memoryContext}

대화:
사용자: ${userMessage}
AI: ${assistantResponse}


🎯 **메모리 분류 가이드 (시제 구분 중요!):**
- **identity**: 현재 상태, 이미 이룬 것 ("창업했다", "개발자다", "결혼했다")
- **goal**: 미래 목표, 하고 싶은 것 ("창업하고 싶다", "의사가 되고 싶다")
- **emotion**: 지속적 감정 패턴 ("자주 우울해", "항상 스트레스")
- **relationship**: 중요한 인간관계 ("연인과 사귐", "부모님과 갈등")
- **interest**: 취미, 관심사 ("음악 좋아함", "운동 즐김")
- **preference**: 강한 선호도 ("매운 음식 좋아함", "직설적 대화 선호")
- **situation**: 현재 중요한 상황 ("취업 준비 중", "이사 준비")

⚠️ **핵심 규칙:**
1. 오직 '사용자'의 발언 내용에서만 정보를 추출하세요. 한 대화당 최대 2개만 추출 (정말 중요한 것만!)
2. AI의 질문, 조언, 분석 내용은 절대 저장하지 마세요.
3. 중요도 0.6 이상만 저장하고, 사용자가 직접 언급하지 않은 내용은 저장하지 마세요.

❌ **저장하지 말 것:**
- AI가 분석한 내용 ("당신은 ~성격인 것 같아요")
- AI의 질문 ("~에 대해 더 알려주시겠어요?")
- 사주/운세 해석 ("금전운이 좋을 것 같습니다")
- 일시적 감정 ("오늘 기분 좋아")
- 인사말, 감사 인사`,
        })

        console.log("🧠 [EXTRACT 2] Waiting for GPT response or timeout...")
        result = await Promise.race([gptPromise, timeoutPromise])

        console.log("🧠 [EXTRACT 2] GPT call completed successfully!")
        console.log("🧠 [EXTRACT 2] Result:", {
          shouldSave: result.object.shouldSave,
          memoriesCount: result.object.memories.length,
          reasoning: result.object.reasoning?.slice(0, 100),
        })

        return result.object
      } catch (error) {
        console.error("🚨 [EXTRACT 2] GPT call failed:", error)
        console.error("🚨 [EXTRACT 2] Error details:", {
          message: (error as Error)?.message,
          stack: (error as Error)?.stack?.slice(0, 500),
        })

        // 폴백: 아무것도 저장하지 않음
        console.log("🧠 [EXTRACT 2] Using fallback - saving nothing")
        return {
          shouldSave: false,
          memories: [],
          reasoning: "GPT 실패 또는 타임아웃으로 인한 폴백 - 저장하지 않음",
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    } catch (error) {
      console.error("🚨 [EXTRACT ERROR] 메모리 추출 실패:", error)
      console.error("🚨 [EXTRACT ERROR] Error details:", {
        message: (error as Error)?.message,
        stack: (error as Error)?.stack?.slice(0, 500),
      })
      return {
        shouldSave: false,
        memories: [],
        reasoning: "메모리 추출 중 오류 발생",
      }
    }
  }

  // Pre-filter to avoid unnecessary extraction
  private shouldExtractFromConversation(userMessage: string, assistantResponse: string): boolean {
    const conversation = `${userMessage} ${assistantResponse}`.toLowerCase()

    // Skip if conversation is too short or generic
    if (conversation.length < 50) return false

    // Skip common patterns that don't contain personal info
    const skipPatterns = [
      /^(안녕|하이|hello)/i,
      /^(고마워|감사|thanks)/i,
      /^(네|yes|ok|알겠)/i,
      /^(날씨|weather)/i,
      /^(시간|time)/i,
    ]

    if (skipPatterns.some((pattern) => pattern.test(userMessage))) return false

    // Look for personal information indicators
    const personalInfoIndicators = [
      /나는|저는|내가|제가|my|i am|i work|i live/i,
      /이름|name|직업|job|나이|age|살|years/i,
      /좋아|싫어|prefer|like|dislike|love|hate/i,
      /계획|목표|goal|plan|want|hoping/i,
      /가족|부모|형제|친구|연인|남친|여친|family|friend|partner/i,
    ]

    return personalInfoIndicators.some((pattern) => pattern.test(conversation))
  }

  // NEW: Helper to check for generic content
  private isGenericContent(content: string): boolean {
    const lowerContent = content.toLowerCase().trim()
    const genericPatterns = [
      /^안녕/,
      /^고마워/,
      /^감사/,
      /^네$/,
      /^알겠습니다/,
      /^(hello|thank|yes|ok)/,
      /^(오늘|내일) 날씨/,
      /^지금 몇 시/,
    ]
    return genericPatterns.some((p) => p.test(lowerContent)) || lowerContent.length < 5
  }

  // NEW: Helper to check for AI-generated content
  private isAIGeneratedContent(content: string): boolean {
    const aiIndicators = [
      "제가 분석하기로는",
      "당신은 ~인 것 같아요",
      "금전운이 좋을 것 같습니다",
      "~에 대해 더 알려주시겠어요?",
      "다음과 같은 방법",
      "몇 가지 팁",
    ]
    return aiIndicators.some((indicator) => content.includes(indicator))
  }

  // NEW: Quality score calculation
  private async calculateQualityScore(memory: any): Promise<number> {
    let score = 1.0
    const content = memory.content || ""

    // Length check (soft filter)
    if (content.length < 8) score *= 0.3
    else if (content.length < 15) score *= 0.7

    // Generic content check
    if (this.isGenericContent(content)) score *= 0.5

    // AI-generated content check
    if (this.isAIGeneratedContent(content)) score *= 0.2

    // Confidence from extraction model
    if (memory.confidence) {
      score *= 0.5 + memory.confidence * 0.5 // Scale confidence to not be too punishing
    }

    return Math.max(0.1, score) // Ensure a minimum score of 0.1
  }

  // NEW: Enhanced duplicate check
  private async enhancedDuplicateCheck(
    userId: string,
    memory: any,
    embedding: number[],
  ): Promise<{ isDuplicate: boolean; similarity: number; strategy: string; existingMemory?: any }> {
    const content = memory.content
    const type = memory.type

    // 1. Exact text matching (via semantic hash)
    const semanticHash = crypto.createHash("sha256").update(content.trim().toLowerCase()).digest("hex")
    const { data: hashMatch, error: hashError } = await this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .eq("semantic_hash", semanticHash)
      .limit(1)

    if (hashMatch && hashMatch.length > 0) {
      return { isDuplicate: true, similarity: 1.0, strategy: "semantic_hash_match", existingMemory: hashMatch[0] }
    }

    // 2. High similarity within the same type
    const typeThreshold = this.getTypeSpecificThreshold(type)
    const { data: sameTypeMatch } = await this.supabase.rpc("find_similar_memory", {
      p_user_id: userId,
      p_query_embedding: embedding,
      p_memory_type: type,
      p_similarity_threshold: typeThreshold,
    })

    if (sameTypeMatch && sameTypeMatch.length > 0) {
      const bestMatch = sameTypeMatch[0]
      if (bestMatch.similarity_score >= typeThreshold) {
        return {
          isDuplicate: true,
          similarity: bestMatch.similarity_score,
          strategy: "same_type_high_similarity",
          existingMemory: bestMatch,
        }
      }
    }

    // 3. Cross-type check for very high similarity
    const { data: crossTypeMatch } = await this.supabase.rpc("find_cross_type_duplicate", {
      p_user_id: userId,
      p_query_embedding: embedding,
      p_similarity_threshold: 0.92, // Very high similarity
    })

    if (crossTypeMatch && crossTypeMatch.length > 0) {
      const bestMatch = crossTypeMatch[0]
      return {
        isDuplicate: true,
        similarity: bestMatch.similarity_score,
        strategy: "cross_type_high_similarity",
        existingMemory: bestMatch,
      }
    }

    return { isDuplicate: false, similarity: 0, strategy: "no_duplicate_found" }
  }

  // UPDATED: Type-specific thresholds
  private getTypeSpecificThreshold(type: string): number {
    const thresholds: Record<string, number> = {
      identity: 0.92, // 0.95 → 0.92 (살짝 완화)
      goal: 0.85, // 유지
      emotion: 0.82, // 0.8 → 0.82
      relationship: 0.9, // 유지
      interest: 0.83, // 0.8 → 0.83
      preference: 0.85, // 유지
      situation: 0.78, // 0.75 → 0.78
      experience: 0.9, // 유지
      belief: 0.9, // 유지
      skill: 0.85, // 유지
    }
    return thresholds[type] || 0.85
  }

  // 쿼리 이해 및 확장
  private async understandQuery(query: string): Promise<any> {
    try {
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: QueryUnderstandingSchema,
        temperature: 0.3,
        prompt: `다음 질문/메시지를 분석하여 메모리 검색에 필요한 정보를 추출하세요.

메시지: "${query}"

관련 키워드, 개체명, 시간적 맥락, 관련 메모리 타입을 추출하세요.`,
      })

      return result.object
    } catch (error) {
      console.error("쿼리 이해 실패:", error)
      return {
        intent: query,
        keywords: query.split(" ").filter((w) => w.length > 2),
        entities: [],
        temporalContext: "any",
        memoryTypes: [],
      }
    }
  }

  // UPDATED: 개선된 메모리 저장
  async saveMemories(userId: string, memories: any[], conversationId: string) {
    const savedMemories = []

    for (const memory of memories) {
      try {
        console.log(`💾 Processing memory: "${memory.content.slice(0, 50)}..."`)

        // 1. 품질 점수 계산
        const qualityScore = await this.calculateQualityScore(memory)
        console.log(`📊 Quality score: ${qualityScore} for: "${memory.content.slice(0, 30)}..."`)

        // 2. 임베딩 생성
        const embedding = await this.generateEmbedding(memory.content)

        // 3. 강화된 중복 체크
        const duplicateCheck = await this.enhancedDuplicateCheck(userId, memory, embedding)

        if (duplicateCheck.isDuplicate && duplicateCheck.existingMemory) {
          console.log(`🔄 Duplicate found (${duplicateCheck.strategy}). Updating existing memory.`)
          const { error: updateError } = await this.supabase
            .from("smart_contexts")
            .update({
              reference_count: duplicateCheck.existingMemory.reference_count + 1,
              last_referenced: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              // Optionally, update quality score if new one is higher
              quality_score: Math.max(duplicateCheck.existingMemory.quality_score, qualityScore),
            })
            .eq("id", duplicateCheck.existingMemory.id)

          if (updateError) console.error("❌ Failed to update existing memory:", updateError)
          else savedMemories.push({ ...duplicateCheck.existingMemory, action: "refreshed" })

          continue // Skip to next memory
        }

        // 4. 새 메모리 생성 (정보 손실 방지)
        const semanticHash = crypto.createHash("sha256").update(memory.content.trim().toLowerCase()).digest("hex")

        const insertData = {
          user_id: userId,
          type: memory.type,
          content: memory.content,
          source_context: memory.sourceQuote || null,
          relevance_embedding: embedding,
          keywords: [], // Pure embedding approach
          importance_score: memory.importance,
          reference_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_mentioned: new Date().toISOString(),
          last_referenced: new Date().toISOString(),
          quality_score: qualityScore,
          is_low_quality: qualityScore < 0.5,
          semantic_hash: semanticHash,
        }

        const { data: newMemory, error: insertError } = await this.supabase
          .from("smart_contexts")
          .insert(insertData)
          .select()
          .single()

        if (insertError) {
          console.error("❌ Failed to insert new memory:", insertError)
          continue
        }

        if (newMemory) {
          console.log(`✅ Successfully created memory: ${newMemory.id} (Quality: ${qualityScore})`)
          savedMemories.push({ ...newMemory, action: "created" })
        }
      } catch (error) {
        console.error("메모리 처리 중 에러:", error)
        continue
      }
    }

    return savedMemories
  }

  // UPDATED: 개선된 관련 메모리 검색
  async getRelevantMemories(userId: string, query: string, limit = 5): Promise<string> {
    try {
      console.log("🧠 getRelevantMemories 시작:", { userId, query, limit })

      if (!query || query.trim().length < 2) {
        console.log("🧠 쿼리가 너무 짧음, 최근 고품질 메모리 반환")
        return await this.getRecentMemories(userId, 5)
      }

      const understanding = await this.understandQuery(query)
      const embedding = await this.generateEmbedding(query)

      // Vector-First Search
      const searchResults = await this.modernVectorSearch(userId, embedding, understanding, limit)

      if (searchResults.length === 0) {
        console.log("🧠 검색 결과 없음, fallback 적용")
        return await this.getRecentMemories(userId, 3)
      }

      const context = this.formatMemoryContext(searchResults, understanding.intent)
      console.log("🧠 최종 컨텍스트 길이:", context.length)
      return context
    } catch (error) {
      console.error("관련 메모리 검색 실패:", error)
      return await this.getRecentMemories(userId, 2)
    }
  }

  // UPDATED: Modern Vector-First Search with quality consideration
  private async modernVectorSearch(
    userId: string,
    embedding: number[],
    understanding: any,
    limit: number,
  ): Promise<any[]> {
    // Stage 1: Vector Search with a more reasonable threshold
    const { data: vectorResults, error } = await this.supabase.rpc("find_user_memories", {
      p_user_id: userId,
      p_query_embedding: embedding,
      p_query_keywords: null,
      p_memory_types: null,
      p_similarity_threshold: 0.25, // Increased from 0.005 to reduce noise
      p_result_limit: limit * 5,
    })

    if (error) {
      console.error("🚨 Vector search error:", error)
      return []
    }

    console.log(`🔍 Vector 검색 결과: ${vectorResults?.length || 0}개`)

    // Stage 2: Re-rank results considering quality
    const rerankedResults = this.rerankWithQuality(vectorResults || [])
    console.log(`🔍 최종 정제된 결과: ${rerankedResults.length}개`)

    return rerankedResults.slice(0, limit)
  }

  // NEW: Re-ranking function
  private rerankWithQuality(results: any[]): any[] {
    const seen = new Set<string>()
    const unique = results.filter((result) => {
      if (seen.has(result.id)) return false
      seen.add(result.id)
      return true
    })

    // Sort by a combined score: relevance, quality, and importance
    return unique.sort((a, b) => {
      const scoreA = (a.relevance_score || 0) * 0.6 + (a.quality_score || 0.5) * 0.3 + (a.importance_score || 0.5) * 0.1
      const scoreB = (b.relevance_score || 0) * 0.6 + (b.quality_score || 0.5) * 0.3 + (b.importance_score || 0.5) * 0.1
      return scoreB - scoreA
    })
  }

  // UPDATED: Get recent HIGH-QUALITY memories
  private async getRecentMemories(userId: string, limit: number): Promise<string> {
    const { data, error } = await this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_low_quality", false) // Only get high-quality memories
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) return ""
    return this.formatMemoryContext(data, "최근 활동")
  }

  // 메모리 컨텍스트 포맷팅
  private formatMemoryContext(memories: any[], userIntent: string): string {
    console.log("🎨 formatMemoryContext 시작:", memories.length, "개 메모리")
    if (memories.length === 0) {
      console.log("🎨 메모리 없음, 빈 컨텍스트 반환")
      return ""
    }

    // 타입별 그룹화
    const grouped = memories.reduce((acc: any, memory: any) => {
      if (!acc[memory.type]) acc[memory.type] = []
      acc[memory.type].push(memory)
      return acc
    }, {})

    const typeNames: { [key: string]: string } = {
      identity: "🆔 신원정보",
      goal: "🎯 목표/계획",
      emotion: "💭 감정상태",
      relationship: "👥 인간관계",
      interest: "✨ 관심사",
      preference: "❤️ 선호도",
      situation: "📍 현재상황",
      experience: "📚 경험",
      belief: "💡 신념",
      skill: "🛠️ 능력",
    }

    let context = `## 🧠 사용자 컨텍스트 (의도: ${userIntent})\n\n`

    Object.entries(grouped).forEach(([type, mems]: [string, any]) => {
      context += `### ${typeNames[type] || type}\n`
      mems.forEach((memory: any) => {
        const quality = memory.quality_score ? ` (품질: ${memory.quality_score.toFixed(2)})` : ""
        context += `- ${memory.content}${quality}\n`
      })
      context += "\n"
    })

    context += `\n💡 위 정보를 바탕으로 개인화되고 맥락에 맞는 응답을 제공하세요.\n`

    console.log("🎨 생성된 컨텍스트:", context.substring(0, 200) + "...")
    return context
  }

  // 메모리 검색 (public method for API)
  async searchMemories(
    userId: string,
    query: string,
    options?: {
      limit?: number
      types?: string[]
    },
  ) {
    try {
      console.log("🔍 searchMemories 시작:", { userId, query, options })

      const understanding = await this.understandQuery(query)
      const embedding = await this.generateEmbedding(query)

      console.log("🔍 DB 검색 실행 중...")
      const { data, error } = await this.supabase.rpc("find_user_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_query_keywords: understanding.keywords,
        p_memory_types: options?.types || understanding.memoryTypes || null,
        p_similarity_threshold: 0.25, // Increased threshold
        p_result_limit: (options?.limit || 20) * 2, // Fetch more to re-rank
      })

      if (error) {
        console.error("🔍 DB 검색 오류:", error)
        throw error
      }

      const reranked = this.rerankWithQuality(data || [])

      console.log("🔍 DB 검색 결과:", reranked.length || 0, "개")
      return reranked.slice(0, options?.limit || 20)
    } catch (error) {
      console.error("메모리 검색 실패:", error)
      throw error
    }
  }

  // 대화 처리 (메인 함수)
  async processConversation(userId: string, conversationId: string, userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 [STEP 1] Processing conversation for user:", userId)

      const extraction = await this.extractMemoryCandidate(userMessage, assistantResponse)

      console.log("🧠 [STEP 3] Extraction result:", {
        shouldSave: extraction.shouldSave,
        memoriesCount: extraction.memories.length,
      })

      if (!extraction.shouldSave || extraction.memories.length === 0) {
        console.log("🧠 [STEP 4] No memorable information found - skipping save")
        return extraction
      }

      console.log("🧠 [STEP 4] Attempting to save memories:", extraction.memories.length)
      const savedMemories = await this.saveMemories(userId, extraction.memories, conversationId)

      console.log("🧠 [STEP 4] Save operation completed:", {
        attempted: extraction.memories.length,
        saved: savedMemories.length,
      })

      return {
        ...extraction,
        savedMemories,
      }
    } catch (error) {
      console.error("🚨 Memory processing failed with error:", error)
      throw error
    }
  }
}

// 안전한 인스턴스 생성
let _smartMemoryServiceV2: SmartMemoryServiceV2 | null = null

export const smartMemoryServiceV2 = (() => {
  if (!_smartMemoryServiceV2) {
    try {
      _smartMemoryServiceV2 = new SmartMemoryServiceV2()
    } catch (error) {
      console.error("SmartMemoryServiceV2 초기화 실패:", error)
      throw error
    }
  }
  return _smartMemoryServiceV2
})()
