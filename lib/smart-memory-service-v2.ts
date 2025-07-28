import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"

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
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

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
      // Pre-filter: Skip extraction for low-value conversations
      if (!this.shouldExtractFromConversation(userMessage, assistantResponse)) {
        return {
          shouldSave: false,
          memories: [],
          reasoning: "대화에 기억할 만한 새로운 정보가 없음",
        }
      }

      const conversation = `사용자: ${userMessage}\nAI: ${assistantResponse}`

      // 이전 메모리 컨텍스트 생성 (더 간결하게)
      const memoryContext = previousMemories?.length
        ? `\n\n기존 정보:\n${previousMemories.slice(0, 5).map((m) => `- ${m.content}`).join("\n")}`
        : ""

      const result = await generateObject({
        model: openai("gpt-4o-mini"), // 비용 효율적인 모델 사용
        schema: MemoryExtractionSchema,
        temperature: 0.1, // 더 일관된 결과
        prompt: `대화에서 사용자에 대한 새로운 사실적 정보만 추출하세요.${memoryContext}

대화:
${conversation}

## 엄격한 추출 기준:

**추출해야 할 정보:**
- 명확한 개인 사실 (이름, 직업, 나이, 거주지)
- 구체적인 목표나 계획
- 강한 선호도 ("좋아한다", "싫어한다")
- 중요한 관계 (가족, 연인, 친구)
- 현재 상황 변화 (이직, 이사, 결혼 등)

**추출하지 말아야 할 정보:**
- 일반적인 대화나 질문
- AI의 조언이나 설명 
- 모호하거나 추측적인 내용
- 일회성 감정이나 기분
- 이미 알고 있는 중복 정보

## 예시:

좋은 추출:
사용자: "저는 25살 개발자이고 부산에 살아요"
→ identity: "25살, 개발자, 부산 거주" (importance: 0.9)

나쁜 추출:
사용자: "오늘 날씨가 좋네요"  
→ 추출하지 않음 (기억할 가치 없음)

## 규칙:
- 확실한 사실만 추출 (confidence >= 0.8)
- 새로운 정보만 추출 (기존 정보와 비교)
- 최대 2개까지만 추출
- 모호하면 추출하지 않음`,
      })

      return result.object
    } catch (error) {
      console.error("메모리 추출 실패:", error)
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
    
    if (skipPatterns.some(pattern => pattern.test(userMessage))) return false
    
    // Look for personal information indicators
    const personalInfoIndicators = [
      /나는|저는|내가|제가|my|i am|i work|i live/i,
      /이름|name|직업|job|나이|age|살|years/i,
      /좋아|싫어|prefer|like|dislike|love|hate/i,
      /계획|목표|goal|plan|want|hoping/i,
      /가족|부모|형제|친구|연인|남친|여친|family|friend|partner/i,
    ]
    
    return personalInfoIndicators.some(pattern => pattern.test(conversation))
  }

  // 개선된 중복 확인 - 단계적 접근
  private async findSimilarMemory(userId: string, content: string, embedding: number[], type?: string): Promise<any> {
    try {
      // 단계 1: 정확한 텍스트 매칭 (가장 빠름)
      const exactTextMatch = await this.findExactTextMatch(userId, content, type)
      if (exactTextMatch) {
        console.log("🎯 정확한 텍스트 매칭 발견")
        return exactTextMatch
      }

      // 단계 2: 동일 타입 내 높은 유사도 검색
      if (type) {
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
            console.log(`🎯 동일 타입 유사 매칭 발견 (${type}, score: ${bestMatch.similarity_score})`)
            return bestMatch
          }
        }
      }

      // 단계 3: 크로스 타입 검색 (더 엄격한 기준)
      const { data: crossTypeMatch } = await this.supabase.rpc("find_cross_type_duplicate", {
        p_user_id: userId,
        p_query_embedding: embedding, 
        p_similarity_threshold: 0.92, // 매우 높은 유사도만
      })

      if (crossTypeMatch && crossTypeMatch.length > 0) {
        const bestMatch = crossTypeMatch[0]
        console.log(`🎯 크로스 타입 매칭 발견 (score: ${bestMatch.similarity_score})`)
        return bestMatch
      }

      return null
    } catch (error) {
      console.error("유사 메모리 검색 실패:", error)
      return null
    }
  }

  // 정확한 텍스트 매칭 (임베딩보다 빠름)
  private async findExactTextMatch(userId: string, content: string, type?: string): Promise<any> {
    const cleanContent = content.toLowerCase().trim()
    
    const query = this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .ilike("content", `%${cleanContent}%`)
      
    if (type) {
      query.eq("type", type)
    }
    
    const { data, error } = await query.limit(1)
    
    if (error) return null
    return data && data.length > 0 ? data[0] : null
  }

  // 타입별 임계값 (더 세밀한 조정)
  private getTypeSpecificThreshold(type: string): number {
    const thresholds: Record<string, number> = {
      identity: 0.95,    // 신원 정보는 매우 엄격
      goal: 0.85,       // 목표는 다양할 수 있음
      emotion: 0.8,     // 감정은 유사해도 다를 수 있음
      relationship: 0.9, // 관계 정보는 엄격
      interest: 0.8,    // 관심사는 유연
      preference: 0.85, // 선호도는 중간
      situation: 0.75,  // 상황은 자주 변함
      experience: 0.9,  // 경험은 고유함
      belief: 0.9,      // 신념은 중요
      skill: 0.85,      // 기술은 중간
    }
    
    return thresholds[type] || 0.85
  }

  // 의미적 중복 체크
  private async checkSemanticDuplicate(newContent: string, existingContent: string): Promise<boolean> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        temperature: 0,
        prompt: `다음 두 정보가 본질적으로 같은 내용인지 판단해주세요.

정보 1: "${newContent}"
정보 2: "${existingContent}"

같은 내용이면 "YES", 다른 내용이면 "NO"만 답하세요.`,
      })

      return text.trim().toUpperCase() === "YES"
    } catch (error) {
      console.error("의미적 중복 체크 실패:", error)
      return false
    }
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

  // 개선된 메모리 저장
  async saveMemories(userId: string, memories: any[], conversationId: string) {
    const savedMemories = []

    for (const memory of memories) {
      try {
        // 기본 필터링만 (더 관대하게)
        const effectiveScore = memory.importance * (memory.confidence || 1)
        if (effectiveScore < 0.3) { // 0.5에서 0.3으로 낮춤
          console.log(`⏭️ Very low effective score (${effectiveScore}), skipping: "${memory.content.slice(0, 50)}..."`)
          continue
        }

        console.log(`💾 Processing memory (score: ${effectiveScore}): "${memory.content.slice(0, 50)}..."`)

        // 품질 체크는 정보용으로만 (저장은 막지 않음)
        const qualityScore = this.calculateMemoryQuality(memory)
        console.log(`📊 Quality score: ${qualityScore} for: "${memory.content.slice(0, 30)}..."`)

        // 컨텐츠 길이만 체크 (너무 짧으면 의미 없음)
        if (!memory.content || memory.content.trim().length < 5) {
          console.log(`⏭️ Content too short, skipping: "${memory.content}"`)
          continue
        }

        // 임베딩 생성 (에러 핸들링 강화)
        let embedding: number[]
        try {
          embedding = await this.generateEmbedding(memory.content)
          console.log(`✅ Embedding generated successfully, dimensions: ${embedding.length}`)
        } catch (embeddingError) {
          console.error(`❌ Embedding generation failed for: "${memory.content.slice(0, 50)}..."`, embeddingError)
          
          // 임베딩 실패 시 건너뛰지 말고 기본값 사용 (null embeddings는 DB에서 처리 가능)
          console.log("⚠️ Continuing without embedding - will save but search may be limited")
          embedding = new Array(1536).fill(0) // 0으로 채운 더미 임베딩
        }

        // 중복 확인 (개선된 로직)
        let existingMemory: any = null
        try {
          existingMemory = await this.findSimilarMemory(userId, memory.content, embedding, memory.type)
        } catch (duplicateError) {
          console.error("❌ Duplicate check failed:", duplicateError)
          console.log("⚠️ Continuing without duplicate check")
        }

        if (existingMemory) {
          // 기존 메모리 업데이트 및 병합
          try {
            const mergedContent = await this.mergeMemories(existingMemory.content, memory.content)
            console.log(`🔄 Merging with existing memory: ${existingMemory.id}`)

            const { data: updatedMemory, error: updateError } = await this.supabase
              .from("smart_contexts")
              .update({
                content: mergedContent,
                keywords: [...new Set([...(existingMemory.keywords || []), ...(memory.keywords || [])])],
                reference_count: existingMemory.reference_count + 1,
                importance_score: Math.max(existingMemory.importance_score, memory.importance),
                last_referenced: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingMemory.id)
              .select()
              .single()

            if (updateError) {
              console.error("❌ Failed to update existing memory:", updateError)
              // 업데이트 실패해도 새로 생성 시도
            } else {
              console.log(`✅ Successfully merged memory: ${existingMemory.id}`)
              savedMemories.push({ ...updatedMemory, action: "merged" })
              continue // 성공했으면 다음 메모리로
            }
          } catch (mergeError) {
            console.error("❌ Memory merge failed:", mergeError)
            // 병합 실패해도 새로 생성 시도
          }
        }

        // 새 메모리 생성 (중복 확인 실패했거나 기존 메모리가 없는 경우)
        console.log(`💾 [DEBUG] Creating new memory: "${memory.content.slice(0, 50)}..."`)
        console.log(`💾 [DEBUG] Memory details:`, {
          type: memory.type,  
          importance: memory.importance,
          confidence: memory.confidence,
          embedding_length: embedding.length
        })
        
        try {
          const insertData = {
            user_id: userId,
            type: memory.type,
            content: memory.content,
            source_context: memory.sourceQuote || null,
            relevance_embedding: embedding,
            keywords: [], // 🔥 Empty array - pure embedding approach
            importance_score: memory.importance,
            reference_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            first_mentioned: new Date().toISOString(),
            last_referenced: new Date().toISOString(),
          }
          
          console.log(`💾 [DEBUG] Insert data:`, {
            ...insertData,
            relevance_embedding: `[${embedding.length} dimensions]`,
            content: insertData.content.slice(0, 100)
          })

          const { data: newMemory, error: insertError } = await this.supabase
            .from("smart_contexts")
            .insert(insertData)
            .select()
            .single()

          if (insertError) {
            console.error("❌ [DEBUG] Failed to insert new memory:", {
              error: insertError,
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            })
            console.error("❌ [DEBUG] Insert data was:", insertData)
            
            // DB 에러라도 계속 진행
            continue
          }

          if (newMemory) {
            console.log(`✅ [DEBUG] Successfully created memory: ${newMemory.id}`)
            console.log(`✅ [DEBUG] Created memory data:`, {
              id: newMemory.id,
              type: newMemory.type,
              content: newMemory.content?.slice(0, 50),
              keywords: newMemory.keywords
            })
            
            // 대화 링크 추가 (실패해도 메모리는 저장됨)
            try {
              await this.supabase.from("conversation_memory_links").insert({
                conversation_id: conversationId,
                memory_id: newMemory.id,
                usage_type: "created",
              })
              console.log(`✅ [DEBUG] Conversation link created for memory: ${newMemory.id}`)
            } catch (linkError) {
              console.error("⚠️ [DEBUG] Failed to create conversation link (memory still saved):", linkError)
            }

            savedMemories.push({ ...newMemory, action: "created" })
          } else {
            console.error("❌ [DEBUG] Insert succeeded but no data returned")
          }
        } catch (creationError) {
          console.error("❌ [DEBUG] Memory creation failed with exception:", creationError)
          console.error("❌ [DEBUG] Exception stack:", creationError.stack)
          continue
        }
      } catch (error) {
        console.error("메모리 처리 실패:", error)
        continue
      }
    }

    return savedMemories
  }

  // 메모리 병합
  private async mergeMemories(existing: string, new_content: string): Promise<string> {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        temperature: 0.2,
        prompt: `다음 두 정보를 자연스럽게 하나로 통합하세요. 중복을 제거하고 더 구체적이거나 최신 정보를 우선하세요.

기존 정보: "${existing}"
새로운 정보: "${new_content}"

통합된 정보 (한 문장으로):`,
      })

      return text.trim()
    } catch (error) {
      console.error("메모리 병합 실패:", error)
      return `${existing} / ${new_content}`
    }
  }

  // 개선된 관련 메모리 검색
  async getRelevantMemories(userId: string, query: string, limit = 5): Promise<string> {
    try {
      console.log("🧠 getRelevantMemories 시작:", { userId, query, limit })

      // 0. 빈 쿼리 체크 (더 관대하게)
      if (!query || query.trim().length < 2) {
        console.log("🧠 쿼리가 너무 짧음, 최근 메모리만 반환")
        return await this.getRecentMemories(userId, 5) // 더 많은 최근 메모리
      }

      // 1. 쿼리 이해
      const understanding = await this.understandQuery(query)
      console.log("🧠 쿼리 이해 결과:", understanding)

      // 2. 쿼리 임베딩 생성
      const embedding = await this.generateEmbedding(query)
      console.log("🧠 임베딩 생성 완료, 차원:", embedding.length)

      // 3. 🔥 Modern Vector-First Search
      const searchResults = await this.modernVectorSearch(userId, query, embedding, understanding, limit)
      
      if (searchResults.length === 0) {
        console.log("🧠 검색 결과 없음, fallback 적용")
        const fallbackMemories = await this.getFallbackMemories(userId, understanding.memoryTypes, 3)
        console.log("🧠 Fallback 메모리 개수:", fallbackMemories.length)
        return fallbackMemories
      }

      // 4. 컨텍스트 생성
      const context = this.formatMemoryContext(searchResults, understanding.intent)
      console.log("🧠 최종 컨텍스트 길이:", context.length)
      return context
    } catch (error) {
      console.error("관련 메모리 검색 실패:", error)
      // 에러 시 최소한의 컨텍스트라도 제공
      return await this.getRecentMemories(userId, 2)
    }
  }

  // 🔥 Modern Vector-First Search (OpenAI/Anthropic 스타일)
  private async modernVectorSearch(userId: string, query: string, embedding: number[], understanding: any, limit: number): Promise<any[]> {
    // Stage 1: Pure Vector Search (매우 낮은 임계값)
    const { data: vectorResults, error } = await this.supabase.rpc("search_relevant_memories", {
      p_user_id: userId,
      p_query_embedding: embedding,
      p_query_keywords: null, // 키워드 무시
      p_memory_types: null, // 타입 제한 없음
      p_similarity_threshold: 0.05, // 매우 낮은 임계값으로 recall 최대화
      p_result_limit: limit * 5, // 더 많은 후보
    })

    let results: any[] = []
    if (!error && vectorResults) {
      results = vectorResults
      console.log(`🔍 Pure Vector 검색 결과: ${vectorResults.length}개`)
    }

    // Stage 2: 결과가 부족하면 임계값 더 낮춤
    if (results.length < limit) {
      const { data: moreResults } = await this.supabase.rpc("search_relevant_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_query_keywords: null,
        p_memory_types: null,
        p_similarity_threshold: 0.01, // 거의 모든 메모리 포함
        p_result_limit: limit * 10,
      })
      
      if (moreResults) {
        results.push(...moreResults)
        console.log(`🔍 Extended Vector 검색 결과: ${moreResults.length}개 추가`)
      }
    }

    // Stage 3: 중복 제거 및 점수 계산  
    const uniqueResults = this.deduplicateAndScore(results, query, understanding)
    console.log(`🔍 최종 정제된 결과: ${uniqueResults.length}개`)
    
    return uniqueResults.slice(0, limit)
  }

  // 키워드 기반 검색
  private async searchByKeywords(userId: string, keywords: string[], limit: number): Promise<any[]> {
    const keywordQueries = keywords.map(keyword => `%${keyword}%`)
    
    const { data, error } = await this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .or(keywordQueries.map(kw => `content.ilike.${kw}`).join(","))
      .order("reference_count", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("키워드 검색 실패:", error)
      return []
    }

    return data || []
  }

  // 중복 제거 및 점수 계산
  private deduplicateAndScore(results: any[], query: string, understanding: any): any[] {
    const seen = new Set<string>()
    const unique = results.filter(result => {
      if (seen.has(result.id)) return false
      seen.add(result.id)
      return true
    })

    return unique.map(memory => ({
      ...memory,
      finalScore: this.calculateRelevanceScore(memory, query, understanding)
    })).sort((a, b) => b.finalScore - a.finalScore)
  }

  // 개선된 관련성 점수 계산 (더 관대하게)
  private calculateRelevanceScore(memory: any, query: string, understanding: any): number {
    let score = 0

    // 벡터 유사도 (30%) - 가중치 낮춤
    if (memory.relevance_score) {
      score += memory.relevance_score * 0.3
    }

    // 키워드 매칭 (30%) - 가중치 높임
    if (memory.keyword_score) {
      score += memory.keyword_score * 0.3
    }

    // 중요도 (20%)
    score += (memory.importance_score || 0.5) * 0.2

    // 최근성 (15%) - 더 오래된 것도 포함
    const daysSinceUpdate = (Date.now() - new Date(memory.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    const recencyScore = Math.max(0.2, 1 - daysSinceUpdate / 60) // 60일 기준, 최소 0.2점
    score += recencyScore * 0.15

    // 참조 빈도 (5%)
    const referenceScore = Math.min(1, (memory.reference_count || 1) / 5) // 더 쉽게 높은 점수
    score += referenceScore * 0.05

    return score
  }

  // 다양성 필터 (더 관대하게)
  private applyDiversityFilter(results: any[], limit: number): any[] {
    const filtered = []
    const typeCounts: Record<string, number> = {}
    const maxPerType = Math.max(2, Math.floor(limit / 2)) // 타입당 더 많이 허용

    for (const result of results) {
      const count = typeCounts[result.type] || 0
      if (count < maxPerType || filtered.length < limit) {
        filtered.push(result)
        typeCounts[result.type] = count + 1
      }
      
      if (filtered.length >= limit) break
    }

    // 만약 다양성 필터로 너무 적게 나오면 상위 결과 그대로 반환
    if (filtered.length < Math.min(3, limit) && results.length >= 3) {
      console.log("🔍 다양성 필터가 너무 제한적, 상위 결과 반환")
      return results.slice(0, limit)
    }

    return filtered
  }

  // 최근 메모리 가져오기 (fallback용)
  private async getRecentMemories(userId: string, limit: number): Promise<string> {
    const { data, error } = await this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) return ""

    return this.formatMemoryContext(data, "최근 활동")
  }

  // 타입별 fallback 메모리
  private async getFallbackMemories(userId: string, preferredTypes: string[], limit: number): Promise<string> {
    if (preferredTypes.length === 0) {
      return await this.getRecentMemories(userId, limit)
    }

    const { data, error } = await this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .in("type", preferredTypes)
      .order("importance_score", { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) {
      return await this.getRecentMemories(userId, limit)
    }

    return this.formatMemoryContext(data, "관련 정보")
  }

  // 메모리 품질 평가
  private calculateMemoryQuality(memory: any): number {
    let score = 0

    // 기본 중요도 (40%)
    score += (memory.importance || 0.5) * 0.4

    // 확신도 (20%)
    score += (memory.confidence || 0.5) * 0.2

    // 내용의 구체성 (20%)
    const specificityScore = this.calculateSpecificity(memory.content)
    score += specificityScore * 0.2

    // 키워드 품질 (10%)
    const keywordScore = this.calculateKeywordQuality(memory.keywords || [])
    score += keywordScore * 0.1

    // 타입 적절성 (10%)
    const typeScore = this.calculateTypeAppropriateScore(memory.type, memory.content)
    score += typeScore * 0.1

    return Math.min(1, Math.max(0, score))
  }

  // 내용 구체성 계산
  private calculateSpecificity(content: string): number {
    if (!content || content.length < 10) return 0.1

    let score = 0.5 // 기본 점수

    // 길이 점수 (적당한 길이가 좋음)
    const length = content.length
    if (length >= 20 && length <= 200) {
      score += 0.2
    } else if (length < 10) {
      score -= 0.3
    }

    // 구체적인 정보 지시자
    const specificIndicators = [
      /\d+/g, // 숫자
      /[가-힣]+[시도군구]/g, // 지역명
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, // 이메일
      /\d{2,4}[-년]\d{1,2}[-월]/g, // 날짜
      /(주식회사|회사|대학교|학교)/g, // 조직명
    ]

    specificIndicators.forEach(regex => {
      if (regex.test(content)) {
        score += 0.1
      }
    })

    // 모호한 표현 감점
    const vagueIndicators = [
      /(아마|아마도|아닌가|같다|것 같다|될 것 같다)/g,
      /(가끔|때때로|종종|보통)/g,
    ]

    vagueIndicators.forEach(regex => {
      const matches = content.match(regex)
      if (matches) {
        score -= matches.length * 0.05
      }
    })

    return Math.min(1, Math.max(0, score))
  }

  // 키워드 품질 계산
  private calculateKeywordQuality(keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0.3

    let score = 0.5

    // 키워드 개수 (3-7개가 적당)
    if (keywords.length >= 3 && keywords.length <= 7) {
      score += 0.3
    } else if (keywords.length > 10) {
      score -= 0.2
    }

    // 키워드 길이 (너무 짧거나 길면 안 좋음)
    const avgLength = keywords.reduce((sum, kw) => sum + kw.length, 0) / keywords.length
    if (avgLength >= 3 && avgLength <= 10) {
      score += 0.2
    }

    return Math.min(1, Math.max(0, score))
  }

  // 타입 적절성 계산
  private calculateTypeAppropriateScore(type: string, content: string): number {
    const typePatterns: Record<string, RegExp[]> = {
      identity: [/이름|나이|직업|살|years|job|work|name/i],
      goal: [/목표|계획|하고 싶|goal|plan|want|hoping/i],
      preference: [/좋아|싫어|prefer|like|dislike|love|hate/i],
      relationship: [/가족|친구|연인|부모|형제|family|friend|parent/i],
      situation: [/현재|지금|요즘|최근|currently|now|recently/i],
    }

    const patterns = typePatterns[type]
    if (!patterns) return 0.5

    const hasMatch = patterns.some(pattern => pattern.test(content))
    return hasMatch ? 0.8 : 0.3
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
        const confidence = memory.confidence ? ` (확신도: ${memory.confidence})` : ""
        context += `- ${memory.content}${confidence}\n`
      })
      context += "\n"
    })

    context += `\n💡 위 정보를 바탕으로 개인화되고 맥락에 맞는 응답을 제공하세요.\n`

    console.log("🎨 생성된 컨텍스트:", context.substring(0, 200) + "...")
    return context
  }

  // 메모리 통합 및 요약 (주기적 실행)
  async consolidateMemories(userId: string) {
    try {
      // 비슷한 메모리들을 찾아 통합
      const { data: memories } = await this.supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId)
        .order("type")

      const consolidationTasks = []
      const processedIds = new Set()

      for (const memory of memories || []) {
        if (processedIds.has(memory.id)) continue

        // 유사한 메모리 찾기
        const similar = memories.filter(
          (m: any) => m.id !== memory.id && !processedIds.has(m.id) && m.type === memory.type,
        )

        if (similar.length > 0) {
          // 통합 작업 추가
          consolidationTasks.push(this.consolidateGroup([memory, ...similar]))
          similar.forEach((m: any) => processedIds.add(m.id))
        }

        processedIds.add(memory.id)
      }

      // 병렬로 통합 실행
      await Promise.all(consolidationTasks)

      return { consolidated: consolidationTasks.length }
    } catch (error) {
      console.error("메모리 통합 실패:", error)
      return { consolidated: 0 }
    }
  }

  // 메모리 그룹 통합
  private async consolidateGroup(memories: any[]) {
    if (memories.length < 2) return

    try {
      // GPT로 통합된 메모리 생성
      const contents = memories.map((m) => m.content).join("\n- ")
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        temperature: 0.3,
        prompt: `다음 관련 정보들을 하나의 통합된 정보로 요약하세요:

- ${contents}

통합된 정보 (구체적이고 간결하게):`,
      })

      const consolidatedContent = text.trim()
      const embedding = await this.generateEmbedding(consolidatedContent)

      // 새로운 통합 메모리 생성
      const { data: newMemory } = await this.supabase
        .from("smart_contexts")
        .insert({
          user_id: memories[0].user_id,
          type: memories[0].type,
          content: consolidatedContent,
          relevance_embedding: embedding,
          keywords: [...new Set(memories.flatMap((m) => m.keywords || []))],
          importance_score: Math.max(...memories.map((m) => m.importance_score)),
          reference_count: memories.reduce((sum, m) => sum + m.reference_count, 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_mentioned: new Date(
            Math.min(...memories.map((m) => new Date(m.first_mentioned || m.created_at).getTime())),
          ).toISOString(),
          last_referenced: new Date().toISOString(),
        })
        .select()
        .single()

      if (newMemory) {
        // 기존 메모리들 삭제
        await this.supabase
          .from("smart_contexts")
          .delete()
          .in(
            "id",
            memories.map((m) => m.id),
          )
      }
    } catch (error) {
      console.error("메모리 그룹 통합 실패:", error)
    }
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

      // 쿼리 이해
      const understanding = await this.understandQuery(query)
      console.log("🔍 쿼리 이해 결과:", understanding)

      // 쿼리 임베딩 생성
      const embedding = await this.generateEmbedding(query)
      console.log("🔍 임베딩 생성 완료, 차원:", embedding.length)

      // 검색 실행 - Fixed parameter names
      console.log("🔍 DB 검색 실행 중...")
      const { data, error } = await this.supabase.rpc("search_relevant_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_query_keywords: understanding.keywords,
        p_memory_types: options?.types || understanding.memoryTypes || null,
        p_similarity_threshold: 0.15, // 매우 낮은 threshold로 더 많은 결과
        p_result_limit: options?.limit || 20,
      })

      if (error) {
        console.error("🔍 DB 검색 오류:", error)
        throw error
      }

      console.log("🔍 DB 검색 결과:", data?.length || 0, "개")
      return data || []
    } catch (error) {
      console.error("메모리 검색 실패:", error)
      throw error
    }
  }

  // 대화 처리 (메인 함수)
  async processConversation(userId: string, conversationId: string, userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 Processing conversation for user:", userId)
      console.log("🧠 User message:", userMessage.slice(0, 100) + "...")
      console.log("🧠 Assistant response:", assistantResponse.slice(0, 100) + "...")
      
      // 환경 변수 체크
      console.log("🧠 Environment check:", {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasSupabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        isClientSide: typeof window !== "undefined"
      })

      // 기존 메모리 가져오기 (컨텍스트용)
      const { data: existingMemories } = await this.supabase
        .from("smart_contexts")
        .select("type, content")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10)

      console.log("🧠 Existing memories count:", existingMemories?.length || 0)

      // 메모리 후보 추출
      console.log("🧠 Starting memory extraction...")
      const extraction = await this.extractMemoryCandidate(userMessage, assistantResponse, existingMemories)
      
      console.log("🧠 Extraction result:", {
        shouldSave: extraction.shouldSave,
        memoriesCount: extraction.memories.length,
        reasoning: extraction.reasoning
      })

      if (!extraction.shouldSave || extraction.memories.length === 0) {
        console.log("🧠 No memorable information found - skipping save")
        return extraction
      }

      // 메모리 저장
      console.log("🧠 Attempting to save memories:", extraction.memories.length)
      extraction.memories.forEach((memory, index) => {
        console.log(`🧠 Memory ${index + 1}:`, {
          type: memory.type,
          content: memory.content.slice(0, 50) + "...",
          importance: memory.importance,
          confidence: memory.confidence
        })
      })
      
      const savedMemories = await this.saveMemories(userId, extraction.memories, conversationId)

      console.log("🧠 Save operation completed:", {
        attempted: extraction.memories.length,
        saved: savedMemories.length,
        success: savedMemories.length > 0
      })

      return {
        ...extraction,
        savedMemories,
      }
    } catch (error) {
      console.error("🚨 Memory processing failed with error:", error)
      console.error("🚨 Error stack:", error.stack)
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
