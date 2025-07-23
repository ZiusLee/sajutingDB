import { createClient } from "@supabase/supabase-js"
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
      console.log("🧠 [EMBEDDING] Generating embedding for text:", text.substring(0, 100))
      
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
      console.log
