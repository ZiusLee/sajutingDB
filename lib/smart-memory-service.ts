import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Supabase 클라이언트 생성
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 메모리 타입 정의
const MemoryType = z.enum([
  "identity",
  "goal",
  "emotion",
  "relationship",
  "interest",
  "schedule",
  "preference",
  "situation",
])

// 메모리 추출 스키마
const MemoryExtractionSchema = z.object({
  shouldSave: z.boolean().describe("이 대화에서 기억할 만한 정보가 있는지 여부"),
  memories: z.array(
    z.object({
      type: MemoryType.describe("메모리 분류"),
      content: z.string().describe("기억할 내용 (간결하고 명확하게)"),
      importance: z.number().min(0).max(1).describe("중요도 점수 (0-1)"),
      context: z.string().optional().describe("추가 맥락 정보"),
    }),
  ),
  reasoning: z.string().describe("메모리 추출 이유"),
})

class SmartMemoryService {
  public supabase = supabase

  // 임베딩 생성
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Ensure this only runs on server-side
      if (typeof window !== "undefined") {
        throw new Error("Embedding generation must run on server-side")
      }

      const response = await fetch("/api/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Embedding API error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error("임베딩 생성 실패:", error)
      throw error
    }
  }

  // 메모리 후보 추출
  async extractMemoryCandidate(userMessage: string, assistantResponse: string) {
    try {
      const conversation = `사용자: ${userMessage}\nAI: ${assistantResponse}`

      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: MemoryExtractionSchema,
        temperature: 0.3,
        prompt: `다음 대화에서 사용자에 대해 기억할 만한 정보를 추출해주세요.

대화:
${conversation}

🎯 **메모리 분류 가이드 (시제 구분 중요!):**
- **identity**: 현재 상태, 이미 이룬 것 ("창업했다", "개발자다", "결혼했다")
- **goal**: 미래 목표, 하고 싶은 것 ("창업하고 싶다", "의사가 되고 싶다")
- **emotion**: 지속적 감정 패턴 ("자주 우울해", "항상 스트레스")
- **relationship**: 중요한 인간관계 ("연인과 사귐", "부모님과 갈등")
- **interest**: 취미, 관심사 ("음악 좋아함", "운동 즐김")
- **preference**: 강한 선호도 ("매운 음식 좋아함", "직설적 대화 선호")
- **situation**: 현재 중요한 상황 ("취업 준비 중", "이사 준비")

⚠️ **핵심 규칙:**
1. 한 대화당 최대 2개만 추출 (정말 중요한 것만!)
2. 사용자가 직접 말한 사실만 저장 (AI 추측/조언 제외)
3. 중요도 0.6 이상만 저장

❌ **저장하지 말 것:**
- AI가 분석한 내용 ("당신은 ~성격인 것 같아요")
- 사주/운세 해석 ("금전운이 좋을 것 같습니다")
- 일시적 감정 ("오늘 기분 좋아")
- 인사말, 감사 인사`,
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

  // 중복 메모리 확인
  private async findSimilarMemory(userId: string, content: string, type: string): Promise<any> {
    try {
      const embedding = await this.generateEmbedding(content)

      const { data, error } = await supabase.rpc("find_similar_memory", {
        user_id: userId,
        content_embedding: embedding,
        memory_type: type,
        similarity_threshold: 0.85,
      })

      if (error) {
        console.error("유사 메모리 검색 오류:", error)
        return null
      }

      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error("유사 메모리 검색 실패:", error)
      return null
    }
  }

  // 메모리 저장
  async saveMemories(userId: string, memories: any[], conversationId: string) {
    const savedMemories = []

    for (const memory of memories) {
      try {
        // 중요도 필터링 - 0.6 이상만 저장
        if (memory.importance < 0.6) {
          console.log(`⏭️ Low importance score (${memory.importance}), skipping: ${memory.content.substring(0, 50)}`)
          continue
        }

        // 중복 확인
        const existingMemory = await this.findSimilarMemory(userId, memory.content, memory.type)

        if (existingMemory) {
          // 기존 메모리 업데이트
          const { error: updateError } = await supabase
            .from("smart_contexts")
            .update({
              reference_count: existingMemory.reference_count + 1,
              last_referenced: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingMemory.id)

          if (updateError) {
            console.error("메모리 업데이트 실패:", updateError)
            continue
          }

          // 메모리 링크 추가
          await supabase.from("conversation_memory_links").insert({
            conversation_id: conversationId,
            memory_id: existingMemory.id,
            usage_type: "referenced",
          })

          savedMemories.push({ ...existingMemory, action: "updated" })
        } else {
          // 새 메모리 생성
          const embedding = await this.generateEmbedding(memory.content)

          const { data: newMemory, error: insertError } = await supabase
            .from("smart_contexts")
            .insert({
              user_id: userId,
              type: memory.type,
              content: memory.content,
              source_context: memory.context || null,
              importance_score: memory.importance,
              relevance_embedding: embedding,
              first_mentioned: new Date().toISOString(),
              last_referenced: new Date().toISOString(),
              reference_count: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (insertError) {
            console.error("메모리 저장 실패:", insertError)
            continue
          }

          // 메모리 링크 추가
          await supabase.from("conversation_memory_links").insert({
            conversation_id: conversationId,
            memory_id: newMemory.id,
            usage_type: "created",
          })

          savedMemories.push({ ...newMemory, action: "created" })
        }
      } catch (error) {
        console.error("메모리 처리 실패:", error)
        continue
      }
    }

    return savedMemories
  }

  // 관련 메모리 검색
  async getRelevantMemories(userId: string, query: string, limit = 5): Promise<string> {
    try {
      const embedding = await this.generateEmbedding(query)

      const { data, error } = await supabase.rpc("find_user_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_query_keywords: null,
        p_memory_types: null,
        p_similarity_threshold: 0.005,
        p_result_limit: limit,
      })

      if (error) {
        console.error("관련 메모리 검색 오류:", error)
        return ""
      }

      if (!data || data.length === 0) {
        return ""
      }

      // 메모리를 타입별로 그룹화
      const memoryGroups: { [key: string]: any[] } = {}
      data.forEach((memory: any) => {
        if (!memoryGroups[memory.type]) {
          memoryGroups[memory.type] = []
        }
        memoryGroups[memory.type].push(memory)
      })

      // 메모리 컨텍스트 생성
      let context = "🧠 **사용자에 대한 기억된 정보:**\n\n"

      Object.entries(memoryGroups).forEach(([type, memories]) => {
        const typeNames: { [key: string]: string } = {
          identity: "신원정보",
          goal: "목표/계획",
          emotion: "감정상태",
          relationship: "인간관계",
          interest: "관심사",
          schedule: "일정",
          preference: "선호도",
          situation: "상황",
        }

        context += `**${typeNames[type] || type}:**\n`
        memories.forEach((memory: any) => {
          context += `- ${memory.content}\n`
        })
        context += "\n"
      })

      context += "위 정보를 참고하여 개인화된 응답을 제공하세요.\n"

      return context
    } catch (error) {
      console.error("관련 메모리 검색 실패:", error)
      return ""
    }
  }

  // 대화 처리 (메인 함수)
  async processConversation(userId: string, conversationId: string, userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 Processing conversation for user:", userId)

      // 메모리 후보 추출
      const extraction = await this.extractMemoryCandidate(userMessage, assistantResponse)

      if (!extraction.shouldSave || extraction.memories.length === 0) {
        console.log("🧠 No memorable information found")
        return extraction
      }

      // 메모리 저장
      console.log("🧠 Saving memories:", extraction.memories.length)
      const savedMemories = await this.saveMemories(userId, extraction.memories, conversationId)

      console.log("🧠 Successfully saved memories:", savedMemories.length)

      return {
        ...extraction,
        savedMemories,
      }
    } catch (error) {
      console.error("Memory save failed:", error)
      throw error
    }
  }

  // 메모리 통계
  async getMemoryStats(userId: string) {
    try {
      const { data, error } = await supabase.from("smart_contexts").select("type").eq("user_id", userId)

      if (error) {
        throw error
      }

      const stats: { [key: string]: number } = {}
      data.forEach((memory: any) => {
        stats[memory.type] = (stats[memory.type] || 0) + 1
      })

      return {
        total: data.length,
        byType: stats,
      }
    } catch (error) {
      console.error("메모리 통계 조회 실패:", error)
      return { total: 0, byType: {} }
    }
  }

  // 오래된 메모리 정리
  async cleanupOldMemories(userId: string, keepCount = 1000) {
    try {
      const { data: oldMemories, error } = await supabase
        .from("smart_contexts")
        .select("id")
        .eq("user_id", userId)
        .order("last_referenced", { ascending: true })
        .limit(Math.max(0, keepCount))

      if (error || !oldMemories || oldMemories.length <= keepCount) {
        return 0
      }

      const idsToDelete = oldMemories.slice(0, -keepCount).map((m: any) => m.id)

      const { error: deleteError } = await supabase.from("smart_contexts").delete().in("id", idsToDelete)

      if (deleteError) {
        throw deleteError
      }

      return idsToDelete.length
    } catch (error) {
      console.error("메모리 정리 실패:", error)
      return 0
    }
  }
}

// 🚀 스마트 메모리 통합 함수
async function getMemoryContext(userId: string, userMessage: string, roomType: string): Promise<string> {
  const ENABLE_SMART_MEMORY = process.env.ENABLE_SMART_MEMORY === "true"

  if (!ENABLE_SMART_MEMORY) {
    console.log("🧠 Smart memory is disabled by environment variable.")
    return ""
  }
  if (!userId) {
    console.log("🧠 No user ID provided, skipping memory context.")
    return ""
  }

  const shouldLog = (level: string) => {
    return process.env.LOG_LEVEL === level
  }

  try {
    console.log("🧠 Getting memory context for user:", userId)
    const memoryContext = await smartMemoryService.getRelevantMemories(userId, userMessage)

    if (shouldLog("DEBUG")) {
      console.log("🧠 메모리 컨텍스트 추가:", memoryContext)
    }

    return memoryContext
  } catch (error) {
    console.error("메모리 컨텍스트 생성 실패:", error)
    // Return empty string instead of throwing to prevent chat failure
    return ""
  }
}

export const smartMemoryService = new SmartMemoryService()
