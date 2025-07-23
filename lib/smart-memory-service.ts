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
      console.log("🧠 [DEBUG] Generating embedding for text:", text.substring(0, 50))

      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
          dimensions: 1536,
        }),
      })

      if (!response.ok) {
        throw new Error(`Embedding API error: ${response.status}`)
      }

      const data = await response.json()
      console.log("🧠 [DEBUG] Embedding generated successfully")
      return data.data[0].embedding
    } catch (error) {
      console.error("🧠 [ERROR] Embedding generation failed:", error)
      throw error
    }
  }

  // 메모리 후보 추출
  async extractMemoryCandidate(userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 [INFO] Extracting memory candidates from conversation")
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

      console.log("🧠 [INFO] Memory extraction result:", {
        shouldSave: result.object.shouldSave,
        memoriesCount: result.object.memories.length,
        reasoning: result.object.reasoning,
      })

      return result.object
    } catch (error) {
      console.error("🧠 [ERROR] Memory extraction failed:", error)
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
      console.log("🧠 [DEBUG] Finding similar memory for:", { userId, type, content: content.substring(0, 30) })

      const embedding = await this.generateEmbedding(content)

      const { data, error } = await supabase.rpc("find_similar_memory", {
        user_id: userId,
        content_embedding: embedding,
        memory_type: type,
        similarity_threshold: 0.85,
      })

      if (error) {
        console.error("🧠 [ERROR] Similar memory search error:", error)
        return null
      }

      const result = data && data.length > 0 ? data[0] : null
      console.log("🧠 [DEBUG] Similar memory search result:", !!result)
      return result
    } catch (error) {
      console.error("🧠 [ERROR] Similar memory search failed:", error)
      return null
    }
  }

  // 메모리 저장
  async saveMemories(userId: string, memories: any[], conversationId: string) {
    console.log("🧠 [INFO] Starting to save memories:", {
      userId,
      memoriesCount: memories.length,
      conversationId,
    })

    const savedMemories = []

    for (const memory of memories) {
      try {
        console.log("🧠 [DEBUG] Processing memory:", {
          type: memory.type,
          importance: memory.importance,
          content: memory.content.substring(0, 50),
        })

        // 중요도 필터링 - 0.6 이상만 저장
        if (memory.importance < 0.6) {
          console.log(
            `⏭️ [INFO] Low importance score (${memory.importance}), skipping: ${memory.content.substring(0, 50)}`,
          )
          continue
        }

        // 중복 확인
        const existingMemory = await this.findSimilarMemory(userId, memory.content, memory.type)

        if (existingMemory) {
          console.log("🔄 [INFO] Updating existing memory:", existingMemory.id)

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
            console.error("🧠 [ERROR] Memory update failed:", updateError)
            continue
          }

          // 메모리 링크 추가
          await supabase.from("conversation_memory_links").insert({
            conversation_id: conversationId,
            memory_id: existingMemory.id,
            usage_type: "referenced",
          })

          savedMemories.push({ ...existingMemory, action: "updated" })
          console.log("✅ [INFO] Memory updated successfully")
        } else {
          console.log("💾 [INFO] Creating new memory")

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
            console.error("🧠 [ERROR] Memory save failed:", insertError)
            continue
          }

          // 메모리 링크 추가
          await supabase.from("conversation_memory_links").insert({
            conversation_id: conversationId,
            memory_id: newMemory.id,
            usage_type: "created",
          })

          savedMemories.push({ ...newMemory, action: "created" })
          console.log("✅ [INFO] New memory created successfully:", newMemory.id)
        }
      } catch (error) {
        console.error("🧠 [ERROR] Memory processing failed:", error)
        continue
      }
    }

    console.log("🧠 [INFO] Memory saving completed:", {
      totalProcessed: memories.length,
      totalSaved: savedMemories.length,
    })

    return savedMemories
  }

  // 관련 메모리 검색
  async getRelevantMemories(userId: string, query: string, limit = 5): Promise<string> {
    try {
      console.log("🧠 [INFO] Searching relevant memories for user:", userId)

      const embedding = await this.generateEmbedding(query)

      const { data, error } = await supabase.rpc("search_relevant_memories", {
        user_id: userId,
        query_embedding: embedding,
        similarity_threshold: 0.7,
        result_limit: limit,
      })

      if (error) {
        console.error("🧠 [ERROR] Relevant memory search error:", error)
        return ""
      }

      if (!data || data.length === 0) {
        console.log("🧠 [INFO] No relevant memories found")
        return ""
      }

      console.log("🧠 [INFO] Found relevant memories:", data.length)

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

      console.log("🧠 [INFO] Memory context generated:", {
        contextLength: context.length,
        memoryGroups: Object.keys(memoryGroups),
      })

      return context
    } catch (error) {
      console.error("🧠 [ERROR] Relevant memory search failed:", error)
      return ""
    }
  }

  // 대화 처리 (메인 함수)
  async processConversation(userId: string, conversationId: string, userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 [INFO] Processing conversation for user:", {
        userId,
        conversationId,
        userMessageLength: userMessage.length,
        assistantResponseLength: assistantResponse.length,
      })

      // 메모리 후보 추출
      const extraction = await this.extractMemoryCandidate(userMessage, assistantResponse)

      if (!extraction.shouldSave || extraction.memories.length === 0) {
        console.log("🧠 [INFO] No memorable information found")
        return extraction
      }

      // 메모리 저장
      console.log("🧠 [INFO] Saving memories:", extraction.memories.length)
      const savedMemories = await this.saveMemories(userId, extraction.memories, conversationId)

      console.log("🧠 [INFO] Successfully saved memories:", savedMemories.length)

      return {
        ...extraction,
        savedMemories,
      }
    } catch (error) {
      console.error("🧠 [ERROR] Memory processing failed:", error)
      throw error
    }
  }

  // 메모리 통계
  async getMemoryStats(userId: string) {
    try {
      console.log("🧠 [DEBUG] Getting memory stats for user:", userId)

      const { data, error } = await supabase.from("smart_contexts").select("type").eq("user_id", userId)

      if (error) {
        throw error
      }

      const stats: { [key: string]: number } = {}
      data.forEach((memory: any) => {
        stats[memory.type] = (stats[memory.type] || 0) + 1
      })

      console.log("🧠 [DEBUG] Memory stats:", { total: data.length, byType: stats })

      return {
        total: data.length,
        byType: stats,
      }
    } catch (error) {
      console.error("🧠 [ERROR] Memory stats query failed:", error)
      return { total: 0, byType: {} }
    }
  }

  // 오래된 메모리 정리
  async cleanupOldMemories(userId: string, keepCount = 1000) {
    try {
      console.log("🧠 [INFO] Cleaning up old memories for user:", userId)

      const { data: oldMemories, error } = await supabase
        .from("smart_contexts")
        .select("id")
        .eq("user_id", userId)
        .order("last_referenced", { ascending: true })
        .limit(Math.max(0, keepCount))

      if (error || !oldMemories || oldMemories.length <= keepCount) {
        console.log("🧠 [INFO] No memories to cleanup")
        return 0
      }

      const idsToDelete = oldMemories.slice(0, -keepCount).map((m: any) => m.id)

      const { error: deleteError } = await supabase.from("smart_contexts").delete().in("id", idsToDelete)

      if (deleteError) {
        throw deleteError
      }

      console.log("🧠 [INFO] Cleaned up memories:", idsToDelete.length)
      return idsToDelete.length
    } catch (error) {
      console.error("🧠 [ERROR] Memory cleanup failed:", error)
      return 0
    }
  }
}

export const smartMemoryService = new SmartMemoryService()
