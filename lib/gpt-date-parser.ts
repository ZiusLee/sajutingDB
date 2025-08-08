import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { calculateSaju } from "@/lib/saju"
import { solarToLunar } from "@/lib/lunar-calendar"

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
    gender?: "male" | "female"
    name?: string
    original: string
    // 계산된 사주 정보 추가
    calculatedSaju?: any
    lunarDate?: any
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
    console.log("🤖 GPT 기반 날짜 파싱 시작:", message.substring(0, 50) + "...")

    const { text } = await generateText({
      model: openai("gpt-5-mini"),
      verbosity: low,
      reasoning_effort: minimal,
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

현재 날짜: ${new Date().toLocaleDateString("ko-KR")}

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
    "gender": "male",
    "name": "상대방",
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
      `,
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
      throw new Error("GPT 응답에서 유효한 JSON을 찾을 수 없습니다")
    }

    const result = JSON.parse(jsonMatch[0])
    const parseTime = Date.now() - startTime

    console.log(`✅ GPT 파싱 성공 (${parseTime}ms)`)
    console.log("🎯 GPT 결과:", {
      hasPartnerInfo: !!result.partnerInfo,
      partnerDate: result.partnerInfo
        ? `${result.partnerInfo.year}년 ${result.partnerInfo.month}월 ${result.partnerInfo.day}일`
        : null,
      eventContext: result.eventContext,
    })

    // 🚀 파트너 정보가 있으면 사주 계산 수행
    if (result.partnerInfo && result.partnerInfo.year && result.partnerInfo.month && result.partnerInfo.day) {
      try {
        console.log("🔮 파트너 사주 계산 시작:", result.partnerInfo)

        // 음력 변환
        const lunarDate = solarToLunar(result.partnerInfo.year, result.partnerInfo.month, result.partnerInfo.day)

        console.log("🌙 음력 변환 결과:", lunarDate)

        // 사주 계산
        const partnerSaju = calculateSaju(
          lunarDate.year.toString(),
          lunarDate.month.toString(),
          lunarDate.day.toString(),
          result.partnerInfo.hour || 12, // 기본값: 정오
          result.partnerInfo.minute || 0,
          result.partnerInfo.year,
          result.partnerInfo.month,
          result.partnerInfo.day,
          result.partnerInfo.gender || "unknown",
          result.partnerInfo.name || "상대방",
          result.partnerInfo.timeUnknown || !result.partnerInfo.hour,
          lunarDate.isLeapMonth,
          lunarDate.monthStem,
          lunarDate.monthBranch,
          "동경135도",
        )

        console.log("📊 파트너 사주 계산 완료:", {
          yearStem: partnerSaju.yearStem,
          yearBranch: partnerSaju.yearBranch,
          monthStem: partnerSaju.monthStem,
          monthBranch: partnerSaju.monthBranch,
          dayStem: partnerSaju.dayStem,
          dayBranch: partnerSaju.dayBranch,
          hourStem: partnerSaju.hourStem,
          hourBranch: partnerSaju.hourBranch,
          elements: partnerSaju.elements,
        })

        // 계산된 사주 정보를 결과에 추가
        result.partnerInfo.calculatedSaju = partnerSaju
        result.partnerInfo.lunarDate = lunarDate

        console.log("✅ 파트너 사주 계산 및 저장 완료")
      } catch (sajuError) {
        console.error("❌ 파트너 사주 계산 실패:", sajuError)
        // 사주 계산 실패해도 파싱 결과는 반환
      }
    }

    // Validate basic structure
    if (!result.dates && !result.partnerInfo && !result.eventInfo) {
      throw new Error("GPT 결과에 날짜, 파트너 정보, 이벤트 정보가 모두 없습니다")
    }

    return result
  } catch (error) {
    const parseTime = Date.now() - startTime
    console.log(`❌ GPT 파싱 실패 (${parseTime}ms):`, error.message)
    console.log("🔄 패턴 기반 파싱으로 대체...")

    // Fallback to current pattern-based parser
    const { parseMessageForDatesAndBirth } = await import("./message-parser")
    const fallbackResult = parseMessageForDatesAndBirth(message)

    console.log("🔧 패턴 기반 대체 결과:", {
      hasPartnerInfo: !!fallbackResult.partnerInfo,
      partnerDate: fallbackResult.partnerInfo
        ? `${fallbackResult.partnerInfo.year}년 ${fallbackResult.partnerInfo.month}월 ${fallbackResult.partnerInfo.day}일`
        : null,
    })

    return fallbackResult
  }
}

// Helper function to validate and sanitize GPT output
export function validateGPTDateResult(result: any): boolean {
  try {
    // 기본 구조 검증
    if (!result || typeof result !== "object") {
      return false
    }

    // 날짜 배열 검증
    if (result.dates && Array.isArray(result.dates)) {
      for (const date of result.dates) {
        if (!date.year || !date.month || !date.day) {
          return false
        }
        if (date.year < 1900 || date.year > 2100) {
          return false
        }
        if (date.month < 1 || date.month > 12) {
          return false
        }
        if (date.day < 1 || date.day > 31) {
          return false
        }
      }
    }

    // 파트너 정보 검증
    if (result.partnerInfo) {
      const partner = result.partnerInfo
      if (!partner.year || !partner.month || !partner.day) {
        return false
      }
      if (partner.year < 1900 || partner.year > 2100) {
        return false
      }
      if (partner.month < 1 || partner.month > 12) {
        return false
      }
      if (partner.day < 1 || partner.day > 31) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}
