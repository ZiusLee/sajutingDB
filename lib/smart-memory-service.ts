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
      return data.data[0].embedding
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
        prompt: `다음 대화에서 사용자에 대해 기억할 만한 정보를 추출해주세요.

대화:
${conversation}

🚨 핵심 규칙:
1. 한 대화당 최대 1-2개의 정말 중요한 정보만 저장
2. 사용자가 직접 말한 사실만 저장 (AI 추측/조언은 절대 저장 금지)
3. 중요도 0.7 이상인 것만 저장

- identity: 이름, 나이, 직업, 성격 특성, 가족 관계
- goal: 목표, 꿈, 계획, 야망
- emotion: 현재 감정 상태, 스트레스, 걱정거리
- relationship: 인간관계, 연인, 친구, 가족 관계
- interest: 취미, 관심사, 좋아하는 것
- schedule: 일정, 중요한 날짜, 이벤트
- preference: 선호도, 취향, 가치관
- situation: 현재 상황, 문제, 환경

✅기억할 가치가 있는 정보 (사용자가 직접 언급한 경우만):
  새로운 자아 정체성 변화 ("승진했어", "이직했어", "결혼했어")
  지속적이고 중요한 목표 ("내년에 창업할거야", "의사가 되고 싶어")
  반복되는 심각한 문제 ("매일 불안해", "부모님과 계속 갈등")
  중대한 관계 변화 ("연인과 헤어졌어", "새로운 사람 만나고 있어")
  명확한 강한 선호 ("절대 단 것 안 먹어", "직설적으로만 얘기해줘")

❌ 절대 저장하지 말 것:
   AI가 분석하거나 추측한 내용 ("당신은 ~한 성격인 것 같아요")
   AI가 제안한 조언이나 해석 ("금전운이 좋을 것 같습니다")  
   사주/운세 해석 결과 ("화목한 가정을 이룰 수 있어요")
   일시적 감정 ("오늘 좀 우울해", "지금 스트레스 받아")
   일반적인 관심사 ("사주가 궁금해", "운세 알고 싶어")
   인사말이나 감사 인사 등`,
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
        // 중요도 필터링 - 0.7 이상만 저장
        if (memory.importance < 0.7) {
          console.log(`⏭️ Low importance score (${memory.importance}), skipping: ${memory.content.substring(0, 50)}`);
          continue;
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

      const { data, error } = await supabase.rpc("search_relevant_memories", {
        user_id: userId,
        query_embedding: embedding,
        similarity_threshold: 0.7,
        result_limit: limit,
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

export const smartMemoryService = new SmartMemoryService()
