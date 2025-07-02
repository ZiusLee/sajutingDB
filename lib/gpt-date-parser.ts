import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Simplified interface for testing
export interface GPTDateParseResult {
  dates: Array<{
    year: number
    month: number
    day: number
    hour?: number
    minute?: number
    timeUnknown?: boolean
    original: string
  }>
  partnerInfo?: {
    year: number
    month: number
    day: number
    hour?: number
    minute?: number
    timeUnknown?: boolean
    gender?: 'male' | 'female'
    name?: string
    original: string
  }
  eventInfo?: {
    year: number
    month: number
    day: number
    hour?: number
    minute?: number
    eventType: string // "결혼", "이사", "만남", "창업" 등
    original: string
  }
  eventContext: string[]
  needsFollowUp: string[]
}

export async function parseMessageWithGPT(message: string): Promise<GPTDateParseResult> {
  const startTime = Date.now()
  
  try {
    console.log('🤖 Attempting GPT-based date parsing for:', message.substring(0, 50) + '...')
    
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      temperature: 0.1,
      maxTokens: 1000,
      prompt: `
당신은 한국어 메시지에서 날짜와 시간 정보를 정확히 추출하는 전문가입니다.

메시지: "${message}"

다음 정보를 JSON 형식으로 추출해주세요:

**추출 규칙:**
- 년도는 4자리로 변환 (예: 84년 → 1984년, 03년 → 2003년)  
- 상대적 날짜는 절대 날짜로 변환 (예: 작년 → ${new Date().getFullYear() - 1}년)
- 나이를 년도로 변환 (예: 스무살 → ${new Date().getFullYear() - 20}년생)
- 시간 형식을 정확히 추출:
  * 0755시 → hour=7, minute=55
  * 오전 7시 55분 → hour=7, minute=55
  * 저녁 6시 → hour=18, minute=0
  * 시간 모름 → timeUnknown=true
- **맥락별 분류 규칙 (매우 중요):**
  * 파트너 정보: "~생과 궁합", "~에 태어난 사람과", "상대방이 ~년생", "~일생과 상성"
  * 이벤트 정보: "~에 결혼하면", "~에 이사하면", "~에 창업하면", "~때 어떨까", "~에 하면"
- **중요:** 미래 계획/이벤트는 절대 partnerInfo로 분류하지 마세요!
- 예시:
  * "결혼을 내년 9월에 하면" → eventInfo (결혼 이벤트)
  * "2003년생과 궁합" → partnerInfo (상대방 생년월일)
  * "이사를 2025년에 하면" → eventInfo (이사 이벤트)
- 성별이나 시간 정보가 없으면 needsFollowUp에 추가
- 월/일 정보가 없으면 중간값 추정 (6월, 15일)
- 시간 정보가 있으면 반드시 hour, minute 필드에 숫자로 입력

현재 날짜: ${new Date().toLocaleDateString('ko-KR')}

**시간 파싱 예시:**
- "2003년 12월 7일 0755시" → hour=7, minute=55
- "오전 7시 55분에 태어난" → hour=7, minute=55  
- "저녁 6시쯤" → hour=18, minute=0
- "시간 모름" 또는 시간 언급 없음 → hour와 minute 필드 생략

JSON만 응답하세요 (다른 텍스트 금지):
{
  "dates": [
    {
      "year": 2003,
      "month": 12, 
      "day": 7,
      "hour": 7,
      "minute": 55,
      "original": "원본 텍스트"
    }
  ],
  "partnerInfo": {
    "year": 2003,
    "month": 12,
    "day": 7,
    "hour": 7,
    "minute": 55,
    "original": "상대방 생년월일 텍스트"
  },
  "eventInfo": {
    "year": 2025,
    "month": 9,
    "day": 15,
    "eventType": "결혼",
    "original": "내년 9월에 결혼하면"
  },
  "eventContext": ["결혼"],
  "needsFollowUp": ["상대방의 성별을 알려주세요"]
}
      `
    })

    // Parse JSON response with better error handling
    const cleanText = text.trim()
    let jsonMatch = cleanText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      // Try to find JSON even if wrapped in markdown
      jsonMatch = cleanText.match(/```(?:json)?\n?(\{[\s\S]*?\})\n?```/)
      if (jsonMatch) {
        jsonMatch = [jsonMatch[1]]
      }
    }
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in GPT response')
    }
    
    const result = JSON.parse(jsonMatch[0])
    const parseTime = Date.now() - startTime
    
    console.log(`✅ GPT parsing successful in ${parseTime}ms`)
    console.log('🎯 GPT result:', {
      hasPartnerInfo: !!result.partnerInfo,
      partnerDate: result.partnerInfo ? `${result.partnerInfo.year}년 ${result.partnerInfo.month}월 ${result.partnerInfo.day}일` : null,
      eventContext: result.eventContext
    })
    
    // Validate basic structure
    if (!result.dates && !result.partnerInfo) {
      throw new Error('GPT result missing both dates and partnerInfo')
    }
    
    return result
    
  } catch (error) {
    const parseTime = Date.now() - startTime
    console.log(`❌ GPT parsing failed after ${parseTime}ms:`, error.message)
    console.log('🔄 Falling back to pattern-based parsing...')
    
    // Fallback to current pattern-based parser
    const { parseMessageForDatesAndBirth } = await import('./message-parser')
    const fallbackResult = parseMessageForDatesAndBirth(message)
    
    console.log('🔧 Pattern-based fallback result:', {
      hasPartnerInfo: !!fallbackResult.partnerInfo,
      partnerDate: fallbackResult.partnerInfo ? `${fallbackResult.partnerInfo.year}년 ${fallbackResult.partnerInfo.month}월 ${fallbackResult.partnerInfo.day}일` : null
    })
    
    return fallbackResult
  }
}

// Helper function to validate and sanitize GPT output
export function validateGPTDateResult(result: any): boolean {
  // Add validation logic for dates, times, etc.
  try {
    DateTimeExtractionSchema.parse(result)
    return true
  } catch {
    return false
  }
}
