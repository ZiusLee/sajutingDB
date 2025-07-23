import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Supabase 클라이언트 생성 - Service Role Key 사용
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
      console.log("🔧 Generating embedding for text:", text.substring(0, 100))

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
        const errorText = await response.text()
        console.error("Embedding API error:", response.status, errorText)
        throw new Error(`Embedding API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("✅ Embedding generated successfully, dimensions:", data.data[0].embedding.length)
      return data.data[0].embedding
    } catch (error) {
      console.error("❌ 임베딩 생성 실패:", error)
      throw error
    }
  }

  // 메모리 후보 추출
  async extractMemoryCandidate(userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 Extracting memory candidates from conversation")
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

      console.log("✅ Memory extraction result:", {
        shouldSave: result.object.shouldSave,
        memoriesCount: result.object.memories.length,
        reasoning: result.object.reasoning,
      })

      return result.object
    } catch (error) {
      console.error("❌ 메모리 추출 실패:", error)
      return {
        shouldSave: false,
        memories: [],
        reasoning: "메모리 추출 중 오류 발생",
      }
    }
  }

  // 중복 메모리 확인 - RPC 함수 대신 직접 쿼리 사용
  private async findSimilarMemory(userId: string, content: string, type: string): Promise<any> {
    try {
      console.log("🔍 Checking for similar memory:", { userId, type, content: content.substring(0, 50) })

      // RPC 함수 대신 직접 쿼리로 유사한 메모리 찾기
      const { data, error } = await supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId)
        .eq("type", type)
        .ilike("content", `%${content.substring(0, 20)}%`) // 간단한 텍스트 매칭
        .limit(1)

      if (error) {
        console.error("❌ 유사 메모리 검색 오류:", error)
        return null
      }

      console.log("✅ Similar memory search result:", data?.length || 0, "matches found")
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error("❌ 유사 메모리 검색 실패:", error)
      return null
    }
  }

  // 메모리 저장
  async saveMemories(userId: string, memories: any[], conversationId: string) {
    console.log("💾 Starting to save memories:", { userId, memoriesCount: memories.length, conversationId })
    const savedMemories = []

    for (const memory of memories) {
      try {
        console.log("💾 Processing memory:", {
          type: memory.type,
          importance: memory.importance,
          content: memory.content.substring(0, 50),
        })

        // 중요도 필터링 - 0.6 이상만 저장
        if (memory.importance < 0.6) {
          console.log(`⏭️ Low importance score (${memory.importance}), skipping: ${memory.content.substring(0, 50)}`)
          continue
        }

        // 중복 확인
        const existingMemory = await this.findSimilarMemory(userId, memory.content, memory.type)

        if (existingMemory) {
          console.log("🔄 Updating existing memory:", existingMemory.id)
          // 기존 메모리 업데이트
          const { error: updateError } = await supabase
            .from("smart_contexts")
            .update({
              reference_count: (existingMemory.reference_count || 0) + 1,
              last_referenced: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingMemory.id)

          if (updateError) {
            console.error("❌ 메모리 업데이트 실패:", updateError)
            continue
          }

          // 메모리 링크 추가 (테이블이 존재하는 경우에만)
          try {
            await supabase.from("conversation_memory_links").insert({
              conversation_id: conversationId,
              memory_id: existingMemory.id,
              usage_type: "referenced",
            })
          } catch (linkError) {
            console.warn("⚠️ Memory link creation failed (table might not exist):", linkError)
          }

          savedMemories.push({ ...existingMemory, action: "updated" })
          console.log("✅ Memory updated successfully")
        } else {
          console.log("🆕 Creating new memory")

          // 임베딩 생성 시도 (실패해도 메모리는 저장)
          let embedding = null
          try {
            embedding = await this.generateEmbedding(memory.content)
          } catch (embeddingError) {
            console.warn("⚠️ Embedding generation failed, saving without embedding:", embeddingError)
          }

          // 새 메모리 생성
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
            console.error("❌ 메모리 저장 실패:", insertError)
            continue
          }

          console.log("✅ New memory created:", newMemory.id)

          // 메모리 링크 추가 (테이블이 존재하는 경우에만)
          try {
            await supabase.from("conversation_memory_links").insert({
              conversation_id: conversationId,
              memory_id: newMemory.id,
              usage_type: "created",
            })
          } catch (linkError) {
            console.warn("⚠️ Memory link creation failed (table might not exist):", linkError)
          }

          savedMemories.push({ ...newMemory, action: "created" })
        }
      } catch (error) {
        console.error("❌ 메모리 처리 실패:", error)
        continue
      }
    }

    console.log("✅ Memory saving completed:", savedMemories.length, "memories processed")
    return savedMemories
  }

  // 관련 메모리 검색 - RPC 함수 대신 직접 쿼리 사용
  async getRelevantMemories(userId: string, query: string, limit = 5): Promise<string> {
    try {
      console.log("🔍 Getting relevant memories for user:", userId, "query:", query.substring(0, 50))

      // 간단한 키워드 기반 검색으로 대체
      const keywords = query
        .split(" ")
        .filter((word) => word.length > 1)
        .slice(0, 3)

      let queryBuilder = supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId)
        .order("last_referenced", { ascending: false })
        .limit(limit)

      // 키워드가 있으면 내용에서 검색
      if (keywords.length > 0) {
        const searchPattern = keywords.join("|")
        queryBuilder = queryBuilder.or(`content.ilike.%${keywords[0]}%,content.ilike.%${keywords[1] || ""}%`)
      }

      const { data, error } = await queryBuilder

      if (error) {
        console.error("❌ 관련 메모리 검색 오류:", error)
        return ""
      }

      if (!data || data.length === 0) {
        console.log("ℹ️ No relevant memories found")
        return ""
      }

      console.log("✅ Found relevant memories:", data.length)

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
      console.error("❌ 관련 메모리 검색 실패:", error)
      return ""
    }
  }

  // 대화 처리 (메인 함수)
  async processConversation(userId: string, conversationId: string, userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 Processing conversation for user:", userId, "conversationId:", conversationId)

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
      console.error("❌ Memory processing failed:", error)
      throw error
    }
  }

  // 메모리 통계
  async getMemoryStats(userId: string) {
    try {
      console.log("📊 Getting memory stats for user:", userId)
      const { data, error } = await supabase.from("smart_contexts").select("type").eq("user_id", userId)

      if (error) {
        console.error("❌ Memory stats error:", error)
        throw error
      }

      const stats: { [key: string]: number } = {}
      data.forEach((memory: any) => {
        stats[memory.type] = (stats[memory.type] || 0) + 1
      })

      console.log("✅ Memory stats:", { total: data.length, byType: stats })
      return {
        total: data.length,
        byType: stats,
      }
    } catch (error) {
      console.error("❌ 메모리 통계 조회 실패:", error)
      return { total: 0, byType: {} }
    }
  }

  // 오래된 메모리 정리
  async cleanupOldMemories(userId: string, keepCount = 1000) {
    try {
      console.log("🧹 Cleaning up old memories for user:", userId, "keepCount:", keepCount)

      const { data: oldMemories, error } = await supabase
        .from("smart_contexts")
        .select("id")
        .eq("user_id", userId)
        .order("last_referenced", { ascending: true })
        .limit(Math.max(0, keepCount))

      if (error || !oldMemories || oldMemories.length <= keepCount) {
        console.log("ℹ️ No cleanup needed")
        return 0
      }

      const idsToDelete = oldMemories.slice(0, -keepCount).map((m: any) => m.id)

      const { error: deleteError } = await supabase.from("smart_contexts").delete().in("id", idsToDelete)

      if (deleteError) {
        console.error("❌ Memory cleanup error:", deleteError)
        throw deleteError
      }

      console.log("✅ Cleaned up", idsToDelete.length, "old memories")
      return idsToDelete.length
    } catch (error) {
      console.error("❌ 메모리 정리 실패:", error)
      return 0
    }
  }

  // 테스트용 메모리 직접 저장 함수
  async testSaveMemory(userId: string, content: string, type = "test") {
    try {
      console.log("🧪 Test saving memory:", { userId, content, type })

      const { data, error } = await supabase
        .from("smart_contexts")
        .insert({
          user_id: userId,
          type: type,
          content: content,
          importance_score: 0.8,
          reference_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          first_mentioned: new Date().toISOString(),
          last_referenced: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Test memory save failed:", error)
        throw error
      }

      console.log("✅ Test memory saved successfully:", data)
      return data
    } catch (error) {
      console.error("❌ Test memory save error:", error)
      throw error
    }
  }
}

export const smartMemoryService = new SmartMemoryService()
