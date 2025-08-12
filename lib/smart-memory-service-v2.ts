import { createClient } from "@supabase/supabase-js"
import { openai } from "@ai-sdk/openai"
import { generateObject, generateText } from "ai"
import { z } from "zod"
import type { DuplicateCheckResult, QualityAssessment, SmartContext } from "@/types/memory"

// Environment variable validation
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is required")
  }

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
  }

  return { url, serviceKey }
}

// Improved Memory Type Schema
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

// Memory Extraction Schema
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

// Query Understanding Schema
const QueryUnderstandingSchema = z.object({
  intent: z.string().describe("사용자 의도"),
  temporalContext: z.enum(["past", "present", "future", "any"]),
  memoryTypes: z.array(MemoryType).describe("관련 메모리 타입"),
})

class SmartMemoryServiceV2 {
  private supabase: any

  constructor() {
    try {
      const { url, serviceKey } = getSupabaseConfig()
      
      this.supabase = createClient(url, serviceKey, {
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
    } catch (error) {
      console.error("SmartMemoryServiceV2 initialization failed:", error)
      throw error
    }
  }

  // Quality score calculation
  private async calculateQualityScore(memory: any): Promise<QualityAssessment> {
    let score = 1.0
    const factors = {
      length: 1.0,
      specificity: 1.0,
      uniqueness: 1.0,
      aiGenerated: 1.0,
      generic: 1.0,
    }

    // Length check
    if (memory.content.length < 8) {
      factors.length = 0.3
      score *= 0.3
    } else if (memory.content.length < 15) {
      factors.length = 0.7
      score *= 0.7
    } else if (memory.content.length > 500) {
      factors.length = 0.8
      score *= 0.8
    }

    // Generic content check
    if (this.isGenericContent(memory.content)) {
      factors.generic = 0.5
      score *= 0.5
    }

    // AI generated content check
    if (this.isAIGeneratedContent(memory.content)) {
      factors.aiGenerated = 0.2
      score *= 0.2
    }

    // Specificity score
    const specificityScore = this.calculateSpecificity(memory.content)
    factors.specificity = specificityScore
    score *= specificityScore

    // Uniqueness score
    const uniquenessScore = this.calculateUniqueness(memory.content)
    factors.uniqueness = uniquenessScore
    score *= uniquenessScore

    const finalScore = Math.max(0.1, score)

    return {
      score: finalScore,
      factors,
      reasoning: this.generateQualityReasoning(factors, finalScore),
    }
  }

  // Generic content detection
  private isGenericContent(content: string): boolean {
    const genericPatterns = [
      /^(네|예|아니오|모르겠어요|그렇네요)$/i,
      /^(안녕|하이|hello|hi)$/i,
      /^(감사|고마워|thanks)$/i,
      /^(좋아요|괜찮아요|그래요)$/i,
      /^(음|아|어|그)$/i,
    ]

    return genericPatterns.some(pattern => pattern.test(content.trim()))
  }

  // AI generated content detection
  private isAIGeneratedContent(content: string): boolean {
    const aiPatterns = [
      /당신은.*것 같습니다/i,
      /.*에 대해 더 알려주시겠어요/i,
      /.*분석해보면/i,
      /.*추천드립니다/i,
      /.*도움이 될 것 같습니다/i,
      /AI가 분석한/i,
      /인공지능.*판단/i,
    ]

    return aiPatterns.some(pattern => pattern.test(content))
  }

  // Uniqueness calculation
  private calculateUniqueness(content: string): number {
    const words = content.split(/\s+/)
    const wordCount = new Map<string, number>()
    
    words.forEach(word => {
      if (word.length > 2) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    })

    const repeatedWords = Array.from(wordCount.values()).filter(count => count > 1)
    const repetitionRatio = repeatedWords.length / words.length

    return Math.max(0.3, 1 - repetitionRatio * 2)
  }

  // Quality reasoning generation
  private generateQualityReasoning(factors: any, finalScore: number): string {
    const issues = []
    
    if (factors.length < 0.8) issues.push("내용이 너무 짧음")
    if (factors.generic < 0.8) issues.push("일반적인 내용")
    if (factors.aiGenerated < 0.8) issues.push("AI 생성 컨텐츠로 추정")
    if (factors.specificity < 0.6) issues.push("구체성 부족")
    if (factors.uniqueness < 0.7) issues.push("반복적 내용")

    if (issues.length === 0) {
      return "고품질 메모리"
    } else {
      return `품질 이슈: ${issues.join(", ")}`
    }
  }

  // Enhanced duplicate check
  private async enhancedDuplicateCheck(
    userId: string,
    memory: any,
    embedding: number[]
  ): Promise<DuplicateCheckResult> {
    try {
      console.log(`🔍 Enhanced duplicate check for: "${memory.content.slice(0, 50)}..."`)

      // Step 1: Exact text matching
      const exactMatch = await this.findExactTextMatch(userId, memory.content, memory.type)
      if (exactMatch) {
        console.log("🎯 Exact text match found")
        return {
          isDuplicate: true,
          similarity: 1.0,
          strategy: 'exact_text',
          existingMemory: exactMatch,
          confidence: 0.95,
        }
      }

      // Step 2: Same type semantic matching
      const typeThreshold = this.getTypeSpecificThreshold(memory.type)
      const sameTypeMatch = await this.findSameTypeSemanticMatch(
        userId, 
        memory.content, 
        embedding, 
        memory.type, 
        typeThreshold
      )
      
      if (sameTypeMatch && sameTypeMatch.similarity >= typeThreshold) {
        console.log(`🎯 Same-type semantic match found (${memory.type}, score: ${sameTypeMatch.similarity})`)
        return {
          isDuplicate: true,
          similarity: sameTypeMatch.similarity,
          strategy: 'same_type_semantic',
          existingMemory: sameTypeMatch,
          confidence: sameTypeMatch.similarity,
        }
      }

      // Step 3: Cross-type contradiction detection
      const contradictionMatch = await this.findCrossTypeContradiction(
        userId,
        memory.content,
        embedding,
        memory.type
      )

      if (contradictionMatch) {
        console.log(`🎯 Cross-type contradiction found (score: ${contradictionMatch.similarity})`)
        return {
          isDuplicate: true,
          similarity: contradictionMatch.similarity,
          strategy: 'cross_type_contradiction',
          existingMemory: contradictionMatch,
          confidence: contradictionMatch.similarity * 0.8,
        }
      }

      console.log("✅ No duplicates found")
      return {
        isDuplicate: false,
        similarity: 0,
        strategy: 'exact_text',
        confidence: 0,
      }

    } catch (error) {
      console.error("❌ Enhanced duplicate check failed:", error)
      return {
        isDuplicate: false,
        similarity: 0,
        strategy: 'exact_text',
        confidence: 0,
      }
    }
  }

  // Same type semantic matching
  private async findSameTypeSemanticMatch(
    userId: string,
    content: string,
    embedding: number[],
    type: string,
    threshold: number
  ): Promise<any> {
    try {
      // Try to use the stored function first
      const { data, error } = await this.supabase.rpc("find_similar_memory", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_memory_type: type,
        p_similarity_threshold: threshold,
      })

      if (!error && data && data.length > 0) {
        return data[0]
      }

      // Fallback: if function doesn't exist, use vector similarity with manual query
      console.log("🔄 Stored function not available, using fallback vector search")
      
      const { data: memories, error: queryError } = await this.supabase
        .from("smart_contexts")
        .select("*, relevance_embedding")
        .eq("user_id", userId)
        .eq("type", type)
        .gte("quality_score", 0.3)
        .limit(20)

      if (queryError || !memories || memories.length === 0) {
        return null
      }

      // Calculate cosine similarity manually
      let bestMatch = null
      let bestSimilarity = 0

      for (const memory of memories) {
        if (memory.relevance_embedding) {
          const similarity = this.calculateCosineSimilarity(embedding, memory.relevance_embedding)
          if (similarity >= threshold && similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestMatch = {
              ...memory,
              similarity
            }
          }
        }
      }

      return bestMatch
    } catch (error) {
      console.error("Same-type semantic match failed:", error)
      return null
    }
  }

  // Cross-type contradiction detection
  private async findCrossTypeContradiction(
    userId: string,
    content: string,
    embedding: number[],
    currentType: string
  ): Promise<any> {
    try {
      const contradictionTypes = this.getContradictionTypes(currentType)
    
      if (contradictionTypes.length === 0) return null

      // Try to use the stored function first
      const { data, error } = await this.supabase.rpc("find_cross_type_duplicate", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_exclude_types: [currentType],
        p_target_types: contradictionTypes,
        p_similarity_threshold: 0.88,
      })

      if (!error && data && data.length > 0) {
        return data[0]
      }

      // Fallback: if function doesn't exist, use vector similarity with manual query
      console.log("🔄 Stored function not available, using fallback vector search")

      const { data: memories, error: queryError } = await this.supabase
        .from("smart_contexts")
        .select("*, relevance_embedding")
        .eq("user_id", userId)
        .in("type", contradictionTypes)
        .gte("quality_score", 0.3)
        .limit(10)

      if (queryError || !memories || memories.length === 0) {
        return null
      }

      // Calculate cosine similarity manually
      let bestMatch = null
      let bestSimilarity = 0

      for (const memory of memories) {
        if (memory.relevance_embedding) {
          const similarity = this.calculateCosineSimilarity(embedding, memory.relevance_embedding)
          if (similarity >= 0.88 && similarity > bestSimilarity) {
            bestSimilarity = similarity
            bestMatch = {
              ...memory,
              similarity
            }
          }
        }
      }

      return bestMatch
    } catch (error) {
      console.error("Cross-type contradiction check failed:", error)
      return null
    }
  }

  // Contradiction types mapping
  private getContradictionTypes(currentType: string): string[] {
    const contradictions: Record<string, string[]> = {
      identity: ['goal'],
      goal: ['identity'],
      emotion: ['emotion'],
      situation: ['situation'],
      relationship: ['relationship'],
    }

    return contradictions[currentType] || []
  }

  // Type-specific thresholds
  private getTypeSpecificThreshold(type: string): number {
    const thresholds: Record<string, number> = {
      identity: 0.92,
      goal: 0.85,
      emotion: 0.82,
      relationship: 0.90,
      interest: 0.83,
      preference: 0.85,
      situation: 0.78,
      experience: 0.90,
      belief: 0.90,
      skill: 0.85,
    }

    return thresholds[type] || 0.85
  }

  // Embedding generation with environment support
  async generateEmbedding(text: string, retries = 3): Promise<number[]> {
    for (let i = 0; i < retries; i++) {
      try {
        // Client-side: use API endpoint
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

        // Server-side: direct OpenAI API call
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
          throw new Error("OPENAI_API_KEY environment variable is required")
        }

        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: text.slice(0, 8000),
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
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error("임베딩 생성 최대 재시도 횟수 초과")
  }

  // Memory extraction with improved prompting
  async extractMemoryCandidate(userMessage: string, assistantResponse: string, previousMemories?: any[]) {
    try {
      console.log("🧠 [EXTRACT 1] Starting extractMemoryCandidate")

      // Pre-filter: Skip extraction for low-value conversations
      const shouldExtract = this.shouldExtractFromConversation(userMessage, assistantResponse)
      if (!shouldExtract) {
        console.log("🧠 [EXTRACT 1] Skipping extraction - low value conversation")
        return {
          shouldSave: false,
          memories: [],
          reasoning: "대화에 기억할 만한 새로운 정보가 없음",
        }
      }

      const conversation = `사용자: ${userMessage}\nAI: ${assistantResponse}`

      // Previous memory context
      const memoryContext = previousMemories?.length
        ? `\n\n기존 정보:\n${previousMemories
            .slice(0, 5)
            .map((m) => `- ${m.content}`)
            .join("\n")}`
        : ""

      console.log("🧠 [EXTRACT 2] Calling GPT for memory extraction...")

      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        mode: 'tool',
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
3. 중요도 0.4 이상만 추출하고, 사용자가 직접 언급하지 않은 내용은 저장하지 마세요.

❌ **저장하지 말 것:**
- AI가 분석한 내용 ("당신은 ~성격인 것 같아요")
- AI의 질문 ("~에 대해 더 알려주시겠어요?")
- 사주/운세 해석 ("금전운이 좋을 것 같습니다")
- 일시적 감정 ("오늘 기분 좋아")
- 인사말, 감사 인사`,
      })

      return result.object
    } catch (error) {
      console.error("🚨 [EXTRACT ERROR] 메모리 추출 실패:", error)
      return {
        shouldSave: false,
        memories: [],
        reasoning: "메모리 추출 중 오류 발생",
      }
    }
  }

  // Pre-filter for conversation extraction
  private shouldExtractFromConversation(userMessage: string, assistantResponse: string): boolean {
    const conversation = `${userMessage} ${assistantResponse}`.toLowerCase()

    if (conversation.length < 50) return false

    const skipPatterns = [
      /^(안녕|하이|hello)/i,
      /^(고마워|감사|thanks)/i,
      /^(네|yes|ok|알겠)/i,
      /^(날씨|weather)/i,
      /^(시간|time)/i,
    ]

    if (skipPatterns.some((pattern) => pattern.test(userMessage))) return false

    const personalInfoIndicators = [
      /나는|저는|내가|제가|my|i am|i work|i live/i,
      /이름|name|직업|job|나이|age|살|years/i,
      /좋아|싫어|prefer|like|dislike|love|hate/i,
      /계획|목표|goal|plan|want|hoping/i,
      /가족|부모|형제|친구|연인|남친|여친|family|friend|partner/i,
    ]

    return personalInfoIndicators.some((pattern) => pattern.test(conversation))
  }

  // Exact text matching
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

  // Query understanding
  private async understandQuery(query: string): Promise<any> {
    try {
      const result = await generateObject({
        model: openai("gpt-4o-mini"),
        mode: 'tool',
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

  // Save memories with soft filtering
  async saveMemories(userId: string, memories: any[], conversationId: string) {
    const savedMemories = []

    for (const memory of memories) {
      try {
        console.log(`💾 Processing memory: "${memory.content.slice(0, 50)}..."`)

        if (!memory.content || memory.content.trim().length < 3) {
          console.log(`⏭️ Content too short, skipping: "${memory.content}"`)
          continue
        }

        // Quality assessment
        const qualityAssessment = await this.calculateQualityScore(memory)
        console.log(`📊 Quality assessment:`, {
          score: qualityAssessment.score,
          reasoning: qualityAssessment.reasoning,
        })

        // Generate embedding
        let embedding: number[]
        try {
          embedding = await this.generateEmbedding(memory.content)
          console.log(`✅ Embedding generated successfully, dimensions: ${embedding.length}`)
        } catch (embeddingError) {
          console.error(`❌ Embedding generation failed for: "${memory.content.slice(0, 50)}..."`, embeddingError)
          embedding = new Array(1536).fill(0)
        }

        // Enhanced duplicate check
        const duplicateCheck = await this.enhancedDuplicateCheck(userId, memory, embedding)
        
        if (duplicateCheck.isDuplicate && duplicateCheck.confidence > 0.8) {
          console.log(`🔄 High-confidence duplicate found (${duplicateCheck.strategy}), updating existing.`)
          
          try {
            const existingMemory = duplicateCheck.existingMemory!
            const { error: updateError } = await this.supabase
              .from("smart_contexts")
              .update({
                reference_count: (existingMemory.reference_count || 0) + 1,
                last_referenced: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                quality_score: Math.max(
                  existingMemory.quality_score || 0.5,
                  qualityAssessment.score
                ),
                usage_count: (existingMemory.usage_count || 0) + 1,
              })
              .eq("id", existingMemory.id)

            if (updateError) {
              console.error("❌ Failed to update existing memory:", updateError)
            } else {
              savedMemories.push({ 
                ...existingMemory, 
                action: "updated",
                duplicate_strategy: duplicateCheck.strategy,
              })
            }
          } catch (updateError) {
            console.error("❌ Memory update process failed:", updateError)
          }
          continue
        }

        // Create new memory
        console.log(`💾 Creating new memory with quality score: ${qualityAssessment.score}`)

        try {
          const semanticHash = this.generateSemanticHash(memory.content)

          const insertData = {
            user_id: userId,
            type: memory.type,
            content: memory.content,
            source_context: memory.sourceQuote || null,
            relevance_embedding: embedding,
            keywords: [],
            importance_score: memory.importance,
            reference_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            first_mentioned: new Date().toISOString(),
            last_referenced: new Date().toISOString(),
            quality_score: qualityAssessment.score,
            is_low_quality: qualityAssessment.score < 0.4,
            semantic_hash: semanticHash,
            usage_count: 1,
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
            console.log(`✅ Successfully created memory: ${newMemory.id} (quality: ${qualityAssessment.score})`)

            try {
              await this.supabase.from("conversation_memory_links").insert({
                conversation_id: conversationId,
                memory_id: newMemory.id,
                usage_type: "created",
              })
            } catch (linkError) {
              console.error("⚠️ Failed to create conversation link (memory still saved):", linkError)
            }

            savedMemories.push({ 
              ...newMemory, 
              action: "created",
              quality_assessment: qualityAssessment,
            })
          }
        } catch (creationError) {
          console.error("❌ Memory creation failed:", creationError)
          continue
        }
      } catch (error) {
        console.error("메모리 처리 실패:", error)
        continue
      }
    }

    return savedMemories
  }

  // Semantic hash generation
  private generateSemanticHash(content: string): string {
    const normalized = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    let hash = 0
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return hash.toString(36)
  }

  // Get relevant memories with quality consideration
  async getRelevantMemories(userId: string, query: string, limit = 5): Promise<string> {
    try {
      console.log("🧠 getRelevantMemories 시작:", { userId, query, limit })

      if (!query || query.trim().length < 2) {
        console.log("🧠 쿼리가 너무 짧음, 고품질 최근 메모리만 반환")
        return await this.getHighQualityRecentMemories(userId, 5)
      }

      const understanding = await this.understandQuery(query)
      console.log("🧠 쿼리 이해 결과:", understanding)

      const embedding = await this.generateEmbedding(query)
      console.log("🧠 임베딩 생성 완료, 차원:", embedding.length)

      const searchResults = await this.qualityAwareVectorSearch(userId, query, embedding, understanding, limit)

      if (searchResults.length === 0) {
        console.log("🧠 검색 결과 없음, fallback 적용")
        const fallbackMemories = await this.getHighQualityFallbackMemories(userId, understanding.memoryTypes, 3)
        console.log("🧠 Fallback 메모리 개수:", fallbackMemories.length)
        return fallbackMemories
      }

      const context = this.formatMemoryContext(searchResults, understanding.intent)
      console.log("🧠 최종 컨텍스트 길이:", context.length)
      return context
    } catch (error) {
      console.error("관련 메모리 검색 실패:", error)
      return await this.getHighQualityRecentMemories(userId, 2)
    }
  }

  // Quality-aware vector search
  private async qualityAwareVectorSearch(
    userId: string,
    query: string,
    embedding: number[],
    understanding: any,
    limit: number,
): Promise<any[]> {
  try {
    // Try to use the stored function first
    const { data: highQualityResults, error: hqError } = await this.supabase.rpc("find_quality_memories", {
      p_user_id: userId,
      p_query_embedding: embedding,
      p_memory_types: understanding.memoryTypes?.length > 0 ? understanding.memoryTypes : null,
      p_min_quality_score: 0.6,
      p_similarity_threshold: 0.15,
      p_result_limit: limit * 2,
    })

    if (!hqError && highQualityResults && highQualityResults.length > 0) {
      console.log(`🔍 High-quality search results: ${highQualityResults.length}개`)
      
      const scoredResults = highQualityResults.map(result => ({
        ...result,
        effective_score: this.calculateEffectiveScore(
          result.relevance_score || 0,
          result.quality_score || 0.5,
          result.importance_score || 0.5,
          result.usage_count || 0
        ),
      }))

      scoredResults.sort((a, b) => b.effective_score - a.effective_score)
      return scoredResults.slice(0, limit)
    }

    // Fallback: if function doesn't exist, use manual vector search
    console.log("🔄 Stored function not available, using fallback vector search")

    let dbQuery = this.supabase
      .from("smart_contexts")
      .select("*, relevance_embedding")
      .eq("user_id", userId)
      .gte("quality_score", 0.3)
      .order("quality_score", { ascending: false })
      .limit(limit * 3)

    // Add type filter if specified
    if (understanding.memoryTypes?.length > 0) {
      dbQuery = dbQuery.in("type", understanding.memoryTypes)
    }

    const { data, error } = await dbQuery

    if (error || !data || data.length === 0) {
      console.error("Fallback vector search error:", error)
      return []
    }

    // Calculate relevance scores using cosine similarity
    const scoredResults = data
      .map(memory => {
        if (!memory.relevance_embedding) {
          return null
        }

        const relevanceScore = this.calculateCosineSimilarity(embedding, memory.relevance_embedding)
        
        // Apply similarity threshold
        if (relevanceScore < 0.1) {
          return null
        }

        return {
          ...memory,
          relevance_score: relevanceScore,
          effective_score: this.calculateEffectiveScore(
            relevanceScore,
            memory.quality_score || 0.5,
            memory.importance_score || 0.5,
            memory.usage_count || 0
          ),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.effective_score - a.effective_score)

    console.log(`🔍 Fallback vector search results: ${scoredResults.length}개`)
    return scoredResults.slice(0, limit)
  } catch (error) {
    console.error("Quality-aware vector search failed:", error)
    return []
  }
}

  // Calculate effective score
  private calculateEffectiveScore(
    relevanceScore: number,
    qualityScore: number,
    importanceScore: number,
    usageCount: number
  ): number {
    const usageBonus = Math.min(0.2, usageCount * 0.02)
    
    return (
      relevanceScore * 0.5 +
      qualityScore * 0.25 +
      importanceScore * 0.15 +
      usageBonus * 0.1
    )
  }

  // Get high-quality recent memories
  private async getHighQualityRecentMemories(userId: string, limit: number): Promise<string> {
    const { data, error } = await this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .gte("quality_score", 0.5)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) {
      const { data: fallbackData } = await this.supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(limit)
      
      return this.formatMemoryContext(fallbackData || [], "최근 활동")
    }

    return this.formatMemoryContext(data, "최근 활동")
  }

  // Get high-quality fallback memories
  private async getHighQualityFallbackMemories(userId: string, preferredTypes: string[], limit: number): Promise<string> {
    if (preferredTypes.length === 0) {
      return await this.getHighQualityRecentMemories(userId, limit)
    }

    const { data, error } = await this.supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", userId)
      .in("type", preferredTypes)
      .gte("quality_score", 0.4)
      .order("quality_score", { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) {
      return await this.getHighQualityRecentMemories(userId, limit)
    }

    return this.formatMemoryContext(data, "관련 정보")
  }

  // Calculate specificity
  private calculateSpecificity(content: string): number {
    if (!content || content.length < 10) return 0.1

    let score = 0.5

    const length = content.length
    if (length >= 20 && length <= 200) {
      score += 0.2
    } else if (length < 10) {
      score -= 0.3
    }

    const specificIndicators = [
      /\d+/g,
      /[가-힣]+[시도군구]/g,
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
      /\d{2,4}[-년]\d{1,2}[-월]/g,
      /(주식회사|회사|대학교|학교)/g,
    ]

    specificIndicators.forEach((regex) => {
      if (regex.test(content)) {
        score += 0.1
      }
    })

    const vagueIndicators = [/(아마|아마도|아닌가|같다|것 같다|될 것 같다)/g, /(가끔|때때로|종종|보통)/g]

    vagueIndicators.forEach((regex) => {
      const matches = content.match(regex)
      if (matches) {
        score -= matches.length * 0.05
      }
    })

    return Math.min(1, Math.max(0, score))
  }

  // Format memory context
  private formatMemoryContext(memories: any[], userIntent: string): string {
    console.log("🎨 formatMemoryContext 시작:", memories.length, "개 메모리")
    if (memories.length === 0) {
      console.log("🎨 메모리 없음, 빈 컨텍스트 반환")
      return ""
    }

    const sortedMemories = memories.sort((a, b) => {
      const scoreA = a.effective_score || a.quality_score || 0.5
      const scoreB = b.effective_score || b.quality_score || 0.5
      return scoreB - scoreA
    })

    const grouped = sortedMemories.reduce((acc: any, memory: any) => {
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
        const qualityIndicator = memory.quality_score >= 0.7 ? "⭐" : 
                                memory.quality_score >= 0.5 ? "✓" : "⚠️"
        const confidence = memory.confidence ? ` (���신도: ${memory.confidence})` : ""
        context += `${qualityIndicator} ${memory.content}${confidence}\n`
      })
      context += "\n"
    })

    context += `\n💡 위 정보를 바탕으로 개인화되고 맥락에 맞는 응답을 제공하세요.\n`

    console.log("🎨 생성된 컨텍스트:", context.substring(0, 200) + "...")
    return context
  }

  // Search memories (public API)
  async searchMemories(
    userId: string,
    query: string,
    options?: {
      limit?: number
      types?: string[]
      minQuality?: number
    },
  ) {
    try {
      console.log("🔍 searchMemories 시작:", { userId, query, options })

      const understanding = await this.understandQuery(query)
      console.log("🔍 쿼리 이해 결과:", understanding)

      const embedding = await this.generateEmbedding(query)
      console.log("🔍 임베딩 생성 완료, 차원:", embedding.length)

      const { data, error } = await this.supabase.rpc("find_quality_memories", {
        p_user_id: userId,
        p_query_embedding: embedding,
        p_memory_types: options?.types || understanding.memoryTypes || null,
        p_min_quality_score: options?.minQuality || 0.2,
        p_similarity_threshold: 0.1,
        p_result_limit: options?.limit || 20,
      })

      if (error) {
        console.error("🔍 DB 검색 오류:", error)
        throw error
      }

      const scoredResults = (data || []).map(result => ({
        ...result,
        effective_score: this.calculateEffectiveScore(
          result.relevance_score || 0,
          result.quality_score || 0.5,
          result.importance_score || 0.5,
          result.usage_count || 0
        ),
      }))

      scoredResults.sort((a, b) => b.effective_score - a.effective_score)

      console.log("🔍 DB 검색 결과:", scoredResults.length, "개")
      return scoredResults
    } catch (error) {
      console.error("메모리 검색 실패:", error)
      throw error
    }
  }

  // Process feedback
  async processFeedback(memoryId: string, userId: string, helpful: boolean, feedbackType?: string) {
    try {
      const { data: memory, error: fetchError } = await this.supabase
        .from("smart_contexts")
        .select("*")
        .eq("id", memoryId)
        .eq("user_id", userId)
        .single()

      if (fetchError || !memory) {
        throw new Error("Memory not found")
      }

      const currentScore = memory.quality_score || 0.5
      let newScore = currentScore

      if (helpful) {
        newScore = Math.min(0.95, currentScore + 0.1)
      } else {
        newScore = Math.max(0.1, currentScore - 0.15)
      }

      const { error: updateError } = await this.supabase
        .from("smart_contexts")
        .update({
          quality_score: newScore,
          is_low_quality: newScore < 0.4,
          user_feedback_score: helpful ? 1 : -1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", memoryId)

      if (updateError) {
        throw updateError
      }

      await this.supabase.from("memory_feedback").insert({
        memory_id: memoryId,
        user_id: userId,
        helpful,
        feedback_type: feedbackType || (helpful ? "helpful" : "not_helpful"),
        created_at: new Date().toISOString(),
      })

      console.log(`✅ Feedback processed: ${memoryId}, helpful: ${helpful}, score: ${currentScore} → ${newScore}`)

      return {
        success: true,
        oldScore: currentScore,
        newScore,
        message: helpful ? "메모리 품질이 향상되었습니다" : "메모리 품질이 조정되었습니다",
      }
    } catch (error) {
      console.error("피드백 처리 실패:", error)
      throw error
    }
  }

  // Process conversation (main function)
  async processConversation(userId: string, conversationId: string, userMessage: string, assistantResponse: string) {
    try {
      console.log("🧠 [STEP 1] Processing conversation for user:", userId)

      const { data: existingMemories } = await this.supabase
        .from("smart_contexts")
        .select("*")
        .eq("user_id", userId)
        .gte("quality_score", 0.5)
        .order("quality_score", { ascending: false })
        .limit(10)

      console.log("🧠 [STEP 2] Existing memories count:", existingMemories?.length || 0)

      console.log("🧠 [STEP 3] Starting memory extraction...")
      const extraction = await this.extractMemoryCandidate(userMessage, assistantResponse, existingMemories)

      console.log("🧠 [STEP 3] Extraction result:", {
        shouldSave: extraction.shouldSave,
        memoriesCount: extraction.memories.length,
        reasoning: extraction.reasoning,
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
        success: savedMemories.length > 0,
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

  // Calculate cosine similarity between two vectors
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
      return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i]
      normA += vectorA[i] * vectorA[i]
      normB += vectorB[i] * vectorB[i]
    }

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

// Safe instance creation
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
