import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"

// 개선된 메모리 타입 정의 - 더 세밀한 분류
const MemoryType = z.enum([
  "identity",       // 신원, 직업, 역할
  "goal",          // 목표, 계획
  "emotion",       // 감정 패턴
  "relationship",  // 인간관계
  "interest",      // 관심사, 취미
  "preference",    // 선호도
  "situation",     // 현재 상황
  "experience",    // 과거 경험
  "belief",        // 신념, 가치관
  "skill",         // 능력, 기술
])

// 메모리 추출 스키마 - 더 상세한 메타데이터 포함
const MemoryExtractionSchema = z.object({
  shouldSave: z.boolean(),
  memories: z.array(
    z.object({
      type: MemoryType,
      content: z.string().describe("핵심 정보만 간결하게"),
      importance: z.number().min(0).max(1),
      confidence: z.number().min(0).max(1).describe("정보의 확실성"),
      temporalContext: z.enum(["past", "present", "future", "timeless"]),
      entities: z.array(z.string()).describe("관련 인물/장소/조직"),
      keywords: z.array(z.string()).describe("검색용 키워드"),
      sourceQuote: z.string().optional().describe("원문 인용"),
    }),
  ),
  reasoning: z.string(),
})

// 쿼리 이해 스키마
const QueryUnderstandingSchema = z.object({
  intent: z.string().describe("사용자 의도"),
  keywords: z.array(z.string()).describe("핵심 키워드"),
  entities: z.array(z.string()).describe("언급된 개체"),
  temporalContext: z.enum(["past", "present", "future", "any"]),
  memoryTypes: z.array(MemoryType).describe("관련 메모리 타입"),
})

class SmartMemoryServiceV2 {
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // 개선된 임베딩 생성 - 에러 처리 및 재시도 로직
  async generateEmbedding(text: string, retries = 3): Promise<number[]> {
    for (let i = 0; i < retries; i++) {
      try {
        // Server-side에서만 실행되도록 보장
        if (typeof window !== "undefined") {
          throw new Error("Embedding generation must run on server-side")
        }

        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // 지수 백오프
      }
    }
    throw new Error("임베딩 생성 최대 재시도 횟수 초과")
  }

  // 개선된 메모리 추출 - Few-shot learning과 chain of thought
  async extractMemoryCandidate(
    userMessage: string,
    assistantResponse: string,
    previousMemories?: any[]
  ) {
    try {
      const conversation = `사용자: ${userMessage}\nAI: ${assistantResponse}`
      
      // 이전 메모리 컨텍스트 생성
      const memoryContext = previousMemories?.length 
        ? `\n\n기존 저장된 정보:\n${previousMemories.map(m => `- ${m.type}: ${m.content}`).join("\n")}`
        : ""

      const result = await generateObject({
        model: openai("gpt-4o"),  // 더 강력한 모델 사용
        schema: MemoryExtractionSchema,
        temperature: 0.5,  // 적절한 창의성
        prompt: `당신은 대화에서 중요한 정보를 추출하는 전문가입니다.

다음 대화에서 사용자에 대한 기억할 만한 정보를 추출해주세요.${memoryContext}

대화:
${conversation}

## 추출 가이드라인:

1. **높은 중요도 (0.8-1.0)**:
   - 신원 정보 (이름, 직업, 나이)
   - 주요 목표나 계획
   - 강한 선호도나 신념
   - 중요한 인간관계

2. **중간 중요도 (0.5-0.7)**:
   - 취미나 관심사
   - 일시적 상황
   - 일반적 선호도

3. **낮은 중요도 (0.3-0.4)**:
   - 일회성 언급
   - 불확실한 정보

## Few-shot Examples:

예시 1:
사용자: "저는 서울에서 개발자로 일하고 있어요. 최근에 이직을 고민하고 있습니다."
추출:
- type: identity, content: "서울에서 개발자로 일함", importance: 0.9, confidence: 1.0
- type: situation, content: "이직 고민 중", importance: 0.7, confidence: 0.9

예시 2:
사용자: "여자친구와 결혼을 앞두고 있는데, 집 문제로 스트레스받고 있어요."
추출:
- type: relationship, content: "여자친구와 결혼 예정", importance: 0.9, confidence: 1.0
- type: situation, content: "주거 문제로 스트레스", importance: 0.7, confidence: 0.9

## 중요 규칙:
- 사용자가 직접 언급한 사실만 추출
- 중복되는 정보는 제외
- AI의 추측이나 해석은 제외
- 한 대화당 최대 3개의 핵심 정보만`,
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

  // 개선된 중복 확인 - Cross-type 검색 및 의미적 유사성
  private async findSimilarMemory(
    userId: string,
    content: string,
    embedding: number[],
    type?: string
  ): Promise<any> {
    try {
      // 1. 동일 타입 내 높은 유사도 검색
      if (type) {
        const { data: exactMatch } = await this.supabase.rpc("find_similar_memory", {
          p_user_id: userId,
          p_query_embedding: embedding,
          p_memory_type: type,
          p_similarity_threshold: 0.9,  // 매우 유사한 것만
        })

        if (exactMatch && exactMatch.length > 0) {
          return exactMatch[0]
        }
      }

      // 2. 모든 타입에서 의미적 유사성 검색
      const { data: semanticMatch } = await this.supabase.rpc("search_relevant_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_query_keywords: null,
        p_memory_types: null,
        p_similarity_threshold: 0.85,
        p_result_limit: 1,
      })

      if (semanticMatch && semanticMatch.length > 0) {
        // GPT로 실제 중복인지 확인
        const isDuplicate = await this.checkSemanticDuplicate(
          content,
          semanticMatch[0].content
        )
        if (isDuplicate) {
          return semanticMatch[0]
        }
      }

      return null
    } catch (error) {
      console.error("유사 메모리 검색 실패:", error)
      return null
    }
  }

  // 의미적 중복 체크
  private async checkSemanticDuplicate(
    newContent: string,
    existingContent: string
  ): Promise<boolean> {
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
        keywords: query.split(" ").filter(w => w.length > 2),
        entities: [],
        temporalContext: "any",
        memoryTypes: [],
      }
    }
  }

  // 개선된 메모리 저장
  async saveMemories(
    userId: string,
    memories: any[],
    conversationId: string
  ) {
    const savedMemories = []

    for (const memory of memories) {
      try {
        // 중요도 + 확신도 복합 필터링
        const effectiveScore = memory.importance * (memory.confidence || 1)
        if (effectiveScore < 0.5) {
          console.log(`⏭️ Low effective score (${effectiveScore}), skipping`)
          continue
        }

        // 임베딩 생성
        const embedding = await this.generateEmbedding(memory.content)

        // 중복 확인 (개선된 로직)
        const existingMemory = await this.findSimilarMemory(
          userId,
          memory.content,
          embedding,
          memory.type
        )

        if (existingMemory) {
          // 기존 메모리 업데이트 및 병합
          const mergedContent = await this.mergeMemories(
            existingMemory.content,
            memory.content
          )

          const { error: updateError } = await this.supabase
            .from("smart_contexts")
            .update({
              content: mergedContent,
              keywords: [...new Set([
                ...(existingMemory.keywords || []),
                ...(memory.keywords || [])
              ])],
              reference_count: existingMemory.reference_count + 1,
              importance_score: Math.max(
                existingMemory.importance_score,
                memory.importance
              ),
              last_referenced: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingMemory.id)

          if (!updateError) {
            savedMemories.push({ ...existingMemory, action: "merged" })
          }
        } else {
          // 새 메모리 생성
          const { data: newMemory, error: insertError } = await this.supabase
            .from("smart_contexts")
            .insert({
              user_id: userId,
              type: memory.type,
              content: memory.content,
              source_context: memory.sourceQuote || null,
              relevance_embedding: embedding,
              keywords: memory.keywords || [],
              importance_score: memory.importance,
              reference_count: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              first_mentioned: new Date().toISOString(),
              last_referenced: new Date().toISOString(),
            })
            .select()
            .single()

          if (!insertError && newMemory) {
            // 대화 링크 추가
            await this.supabase.from("conversation_memory_links").insert({
              conversation_id: conversationId,
              memory_id: newMemory.id,
              usage_type: "created",
            })

            savedMemories.push({ ...newMemory, action: "created" })
          }
        }
      } catch (error) {
        console.error("메모리 처리 실패:", error)
        continue
      }
    }

    return savedMemories
  }

  // 메모리 병합
  private async mergeMemories(
    existing: string,
    new_content: string
  ): Promise<string> {
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
  async getRelevantMemories(
    userId: string,
    query: string,
    limit = 5
  ): Promise<string> {
    try {
      // 1. 쿼리 이해
      const understanding = await this.understandQuery(query)
      
      // 2. 쿼리 임베딩 생성
      const embedding = await this.generateEmbedding(query)

      // 3. 하이브리드 검색 (벡터 + 키워드)
      const { data, error } = await this.supabase.rpc("search_relevant_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_query_keywords: understanding.keywords,
        p_memory_types: understanding.memoryTypes.length > 0 
          ? understanding.memoryTypes 
          : null,
        p_similarity_threshold: 0.6,  // 더 낮은 threshold로 더 많은 결과
        p_result_limit: limit * 2,     // 후처리를 위해 더 많이 가져옴
      })

      if (error || !data || data.length === 0) {
        return ""
      }

      // 4. 결과 re-ranking (관련성 점수 기반)
      const rankedMemories = data
        .map((memory: any) => ({
          ...memory,
          finalScore: 
            memory.relevance_score * 0.6 +
            memory.importance_score * 0.3 +
            (memory.keyword_score || 0) * 0.1
        }))
        .sort((a: any, b: any) => b.finalScore - a.finalScore)
        .slice(0, limit)

      // 5. 컨텍스트 생성
      return this.formatMemoryContext(rankedMemories, understanding.intent)
    } catch (error) {
      console.error("관련 메모리 검색 실패:", error)
      return ""
    }
  }

  // 메모리 컨텍스트 포맷팅
  private formatMemoryContext(memories: any[], userIntent: string): string {
    if (memories.length === 0) return ""

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
        const similar = memories.filter((m: any) => 
          m.id !== memory.id &&
          !processedIds.has(m.id) &&
          m.type === memory.type
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
      const contents = memories.map(m => m.content).join("\n- ")
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
          keywords: [...new Set(memories.flatMap(m => m.keywords || []))],
          importance_score: Math.max(...memories.map(m => m.importance_score)),
          reference_count: memories.reduce((sum, m) => sum + m.reference_count, 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_mentioned: new Date(Math.min(...memories.map(m => 
            new Date(m.first_mentioned || m.created_at).getTime()
          ))).toISOString(),
          last_referenced: new Date().toISOString(),
        })
        .select()
        .single()

      if (newMemory) {
        // 기존 메모리들 삭제
        await this.supabase
          .from("smart_contexts")
          .delete()
          .in("id", memories.map(m => m.id))
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
    }
  ) {
    try {
      // 쿼리 이해
      const understanding = await this.understandQuery(query)
      
      // 쿼리 임베딩 생성
      const embedding = await this.generateEmbedding(query)

      // 검색 실행
      const { data, error } = await this.supabase.rpc("search_relevant_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_query_keywords: understanding.keywords,
        p_memory_types: options?.types || understanding.memoryTypes || null,
        p_similarity_threshold: 0.5,
        p_result_limit: options?.limit || 20,
      })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("메모리 검색 실패:", error)
      throw error
    }
  }

  // 대화 처리 (메인 함수)
  async processConversation(
    userId: string,
    conversationId: string,
    userMessage: string,
    assistantResponse: string
  ) {
    try {
      console.log("🧠 Processing conversation for user:", userId)

      // 기존 메모리 가져오기 (컨텍스트용)
      const { data: existingMemories } = await this.supabase
        .from("smart_contexts")
        .select("type, content")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10)

      // 메모리 후보 추출
      const extraction = await this.extractMemoryCandidate(
        userMessage,
        assistantResponse,
        existingMemories
      )

      if (!extraction.shouldSave || extraction.memories.length === 0) {
        console.log("🧠 No memorable information found")
        return extraction
      }

      // 메모리 저장
      console.log("🧠 Saving memories:", extraction.memories.length)
      const savedMemories = await this.saveMemories(
        userId,
        extraction.memories,
        conversationId
      )

      console.log("🧠 Successfully saved memories:", savedMemories.length)

      return {
        ...extraction,
        savedMemories,
      }
    } catch (error) {
      console.error("Memory processing failed:", error)
      throw error
    }
  }
}

export const smartMemoryServiceV2 = new SmartMemoryServiceV2()
