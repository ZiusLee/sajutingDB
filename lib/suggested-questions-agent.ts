import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface SuggestedQuestionsRequest {
  messages: Array<{ role: string; content: string }>
  saju?: any
  roomType: string
  concerns?: string[]
  name?: string
  gender?: string
}

export interface SuggestedQuestionsResponse {
  questions: string[]
  reasoning?: string
}

/**
 * AI 기반 suggested questions 생성 에이전트
 * 사용자의 대화 맥락과 사주 정보를 분석해서 개인화된 follow-up 질문들을 생성
 */
export class SuggestedQuestionsAgent {
  private static readonly SYSTEM_PROMPT =
    `당신은 사주 상담에서 사용자가 더 깊이 알고 싶어할 만한 follow-up 질문을 생성하는 AI입니다.

핵심 원칙:
1. 사용자의 실제 관심사와 고민을 파악해서 그와 연관된 질문을 생성
2. 단순한 일반적 질문이 아닌, 대화 맥락에 맞는 개인화된 질문
3. 사용자가 "정말 궁금해할 만한" 구체적이고 실용적인 질문

질문 생성 전략:
- 이별/연애 고민 → "걔 속마음", "재회 가능성", "언제 다시 연락올까", "헤어진 이유"
- 직업/진로 고민 → "언제 이직하면 좋을까", "어떤 직업이 맞을까", "승진 시기"
- 건강 고민 → "주의할 질병", "건강한 생활습관", "체질에 맞는 음식"
- 인간관계 고민 → "상대방이 나를 어떻게 생각하는지", "관계 개선 방법"

질문 형식:
- 15-25자 내외의 간결한 질문
- 물음표(?)로 끝나는 자연스러운 한국어
- "제", "저", "우리" 등 1인칭 관점
- 구체적이고 실용적인 내용

반드시 3개의 질문만 생성하세요.`

  /**
   * 대화 맥락을 분석해서 개인화된 suggested questions 생성
   */
  static async generateQuestions(request: SuggestedQuestionsRequest): Promise<SuggestedQuestionsResponse> {
    try {
      // 최근 대화 내용 분석
      const recentMessages = request.messages.slice(-6) // 최근 6개 메시지만 분석
      const lastUserMessage = recentMessages.filter((m) => m.role === "user").pop()?.content || ""
      const lastAssistantMessage = recentMessages.filter((m) => m.role === "assistant").pop()?.content || ""

      // 사용자의 관심사와 고민 키워드 추출
      const contextKeywords = this.extractContextKeywords(lastUserMessage, lastAssistantMessage)

      // 사주 정보 요약
      const sajuSummary = request.saju ? this.summarizeSaju(request.saju) : ""

      const prompt = `
대화 맥락 분석:
- 최근 사용자 질문: "${lastUserMessage}"
- AI 응답 요약: "${lastAssistantMessage.slice(0, 200)}..."
- 감지된 관심사: ${contextKeywords.join(", ")}
- 상담 유형: ${request.roomType}
- 사용자 정보: ${request.name || "사용자"}님 (${request.gender === "male" ? "남성" : "여성"})
${sajuSummary}

위 맥락을 바탕으로 사용자가 정말 궁금해할 만한 follow-up 질문 3개를 생성해주세요.
각 질문은 15-25자 내외로 간결하게 작성하고, 대화의 자연스러운 연장선상에 있어야 합니다.

질문만 번호 없이 나열해주세요:
`

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        messages: [
          { role: "system", content: this.SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        maxTokens: 300,
      })

      // 응답에서 질문 추출
      const questions = this.parseQuestions(result.text)

      return {
        questions: questions.slice(0, 3), // 최대 3개만
        reasoning: `Generated based on context: ${contextKeywords.join(", ")}`,
      }
    } catch (error) {
      console.error("Suggested questions generation failed:", error)

      // 실패 시 fallback 질문들 반환
      return {
        questions: this.getFallbackQuestions(request.roomType, request.concerns),
        reasoning: "Fallback questions due to generation error",
      }
    }
  }

  /**
   * 대화에서 관심사 키워드 추출
   */
  private static extractContextKeywords(userMessage: string, assistantMessage: string): string[] {
    const keywords: string[] = []
    const text = `${userMessage} ${assistantMessage}`.toLowerCase()

    // 관심사별 키워드 매핑
    const keywordMap = {
      연애: ["연애", "사랑", "애정", "남자친구", "여자친구", "연인", "좋아하는"],
      이별: ["이별", "헤어", "재회", "복합", "전남친", "전여친", "다시"],
      직업: ["직업", "일", "회사", "직장", "취업", "이직", "승진", "커리어"],
      건강: ["건강", "몸", "아프", "병", "질병", "체질", "운동"],
      재물: ["돈", "재물", "투자", "사업", "부자", "경제", "수입"],
      가족: ["가족", "부모", "엄마", "아빠", "형제", "자매", "결혼"],
      인간관계: ["친구", "사람", "관계", "소통", "갈등", "화해"],
    }

    for (const [category, words] of Object.entries(keywordMap)) {
      if (words.some((word) => text.includes(word))) {
        keywords.push(category)
      }
    }

    return keywords
  }

  /**
   * 사주 정보 요약
   */
  private static summarizeSaju(saju: any): string {
    if (!saju) return ""

    return `
- 일간: ${saju.dayMaster || "정보없음"}
- 주요 특징: ${saju.summary || ""}
- 현재 나이: ${saju.currentAge || ""}세
`
  }

  /**
   * AI 응답에서 질문들 파싱
   */
  private static parseQuestions(text: string): string[] {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((line) => line.includes("?"))
      .map((line) => line.replace(/^[0-9\-*.\s]+/, "").trim()) // 번호나 불릿 제거
      .filter((line) => line.length >= 10 && line.length <= 50) // 적절한 길이 필터

    return lines.slice(0, 3) // 최대 3개
  }

  /**
   * 실패 시 사용할 fallback 질문들
   */
  private static getFallbackQuestions(roomType: string, concerns: string[] = []): string[] {
    const fallbackMap: Record<string, string[]> = {
      sajuping: ["올해 가장 좋은 시기는 언제인가요?", "제 성격의 장단점은 무엇인가요?", "앞으로 주의해야 할 점은?"],
      tarot: ["오늘 하루 어떻게 보내면 좋을까요?", "현재 상황에서 놓치고 있는 것은?", "앞으로의 방향성은 어떤가요?"],
      general: ["제 인생의 전환점은 언제인가요?", "가장 강한 운의 흐름은?", "올해 집중해야 할 영역은?"],
    }

    // 관심사 기반 질문 추가
    const concernQuestions: Record<string, string[]> = {
      love: ["연애운이 가장 좋은 시기는?", "이상형과 만날 가능성은?"],
      breakup: ["상처 회복은 언제쯤 될까요?", "새로운 인연은 언제 올까요?"],
      career: ["직업 전환 시기는 언제가 좋을까요?", "승진 가능성은 어떤가요?"],
      health: ["건강 관리 포인트는?", "주의해야 할 시기는 언제인가요?"],
    }

    let questions = fallbackMap[roomType] || fallbackMap.general

    // 관심사가 있으면 관련 질문 우선 추가
    if (concerns.length > 0) {
      const concernBasedQuestions = concerns.flatMap((concern) => concernQuestions[concern] || [])
      questions = [...concernBasedQuestions.slice(0, 2), ...questions.slice(0, 1)]
    }

    return questions.slice(0, 3)
  }
}
