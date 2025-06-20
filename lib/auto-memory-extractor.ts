import { enhancedMemoryService } from "./memory-service-enhanced"
import { supabase } from "./supabase-client"

interface MessageData {
  id: string
  content: string
  role: string
  session_id: string
  room_type?: string
  created_at: string
}

class AutoMemoryExtractor {
  private static instance: AutoMemoryExtractor

  static getInstance(): AutoMemoryExtractor {
    if (!AutoMemoryExtractor.instance) {
      AutoMemoryExtractor.instance = new AutoMemoryExtractor()
    }
    return AutoMemoryExtractor.instance
  }

  // 새로운 메시지에서 메모리 추출
  async extractFromMessage(messageData: MessageData, userId: string): Promise<void> {
    try {
      // 사용자 메시지만 처리
      if (messageData.role !== "user") return

      // 중요한 컨텍스트 분석
      const context = await this.analyzeMessageContext(messageData.content, messageData.room_type)

      if (context.shouldSave) {
        await enhancedMemoryService.createMemoryEntry({
          userId,
          sessionId: messageData.session_id,
          title: context.title,
          content: context.extractedContent,
          emotionalState: context.emotionalState,
          entryType: "ai_generated",
          contextData: {
            originalMessage: messageData.content.substring(0, 500),
            roomType: messageData.room_type,
            extractedAt: new Date().toISOString(),
            messageId: messageData.id,
          },
          tags: context.tags,
          category: context.category,
          isPrivate: true,
        })

        console.log("메모리 엔트리 자동 생성 완료:", context.title)
      }
    } catch (error) {
      console.error("메모리 추출 중 오류:", error)
    }
  }

  // 메시지 컨텍스트 분석
  private async analyzeMessageContext(content: string, roomType?: string) {
    const emotionalKeywords = {
      anxiety: ["불안", "걱정", "두려", "초조", "무서", "떨려"],
      sadness: ["슬프", "우울", "힘들", "괴로", "눈물", "아프"],
      happiness: ["기쁘", "행복", "좋아", "즐거", "만족", "감사"],
      anger: ["화나", "짜증", "분노", "억울", "열받", "빡쳐"],
      stress: ["스트레스", "압박", "부담", "피곤", "지쳐", "힘들"],
      hope: ["희망", "기대", "바라", "원해", "꿈꿔", "소망"],
    }

    const topicKeywords = {
      relationship: ["연애", "사랑", "썸", "헤어", "결혼", "이별", "남친", "여친", "배우자"],
      career: ["직장", "회사", "일", "업무", "취업", "이직", "승진", "동료", "상사"],
      family: ["가족", "부모", "엄마", "아빠", "형제", "자매", "친척", "시댁", "처가"],
      health: ["건강", "병원", "아프", "치료", "운동", "다이어트", "몸", "마음"],
      money: ["돈", "재정", "투자", "저축", "빚", "경제", "월급", "용돈", "비용"],
      personal: ["나", "내", "자신", "성격", "습관", "취미", "관심", "목표"],
    }

    const lifeEvents = {
      milestone: ["졸업", "입학", "취업", "퇴사", "결혼", "출산", "이사", "승진"],
      challenge: ["시험", "면접", "발표", "갈등", "문제", "어려움", "고민", "선택"],
      achievement: ["성공", "달성", "완료", "해결", "극복", "이뤄", "받았", "됐어"],
    }

    // 감정 상태 분석
    const emotionalState: Record<string, any> = {}
    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        emotionalState[emotion] = true
      }
    }

    // 주제 분석
    const tags: string[] = []
    let category: string | undefined

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        tags.push(topic)
        if (!category) category = topic
      }
    }

    // 인생 이벤트 분석
    for (const [eventType, keywords] of Object.entries(lifeEvents)) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        tags.push(eventType)
      }
    }

    // 룸 타입에 따른 카테고리 보정
    if (roomType && !category) {
      const roomTypeMapping: Record<string, string> = {
        love: "relationship",
        career: "career",
        health: "health",
        business: "money",
        marriage: "relationship",
        compatibility: "relationship",
      }
      category = roomTypeMapping[roomType] || "personal"
    }

    // 중요도 판단
    const importanceScore = this.calculateImportanceScore(content, emotionalState, tags)
    const shouldSave = importanceScore > 0.3 // 임계값

    // 제목 생성
    const title = this.generateTitle(content, category, emotionalState)

    // 핵심 내용 추출 (개인정보 제거)
    const extractedContent = this.extractKeyContent(content)

    return {
      shouldSave,
      title,
      extractedContent,
      emotionalState,
      tags,
      category,
      importanceScore,
    }
  }

  // 중요도 점수 계산
  private calculateImportanceScore(content: string, emotionalState: Record<string, any>, tags: string[]): number {
    let score = 0

    // 길이 점수 (긴 메시지일수록 중요할 가능성)
    if (content.length > 100) score += 0.2
    if (content.length > 300) score += 0.2

    // 감정 점수
    const emotionCount = Object.keys(emotionalState).length
    score += emotionCount * 0.15

    // 주제 점수
    score += tags.length * 0.1

    // 특정 키워드 점수
    const importantKeywords = ["고민", "문제", "해결", "도움", "조언", "어떻게", "왜", "힘들"]
    const keywordMatches = importantKeywords.filter((keyword) => content.includes(keyword)).length
    score += keywordMatches * 0.1

    return Math.min(score, 1.0) // 최대 1.0
  }

  // 제목 생성
  private generateTitle(content: string, category?: string, emotionalState?: Record<string, any>): string {
    const date = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })

    if (category) {
      const categoryNames: Record<string, string> = {
        relationship: "연애 고민",
        career: "직장 이야기",
        family: "가족 관련",
        health: "건강 관련",
        money: "재정 관련",
        personal: "개인적인 생각",
      }
      return `${date} ${categoryNames[category] || "일상"}`
    }

    if (emotionalState && Object.keys(emotionalState).length > 0) {
      const emotions = Object.keys(emotionalState)
      if (emotions.includes("happiness")) return `${date} 기쁜 일`
      if (emotions.includes("anxiety")) return `${date} 불안한 마음`
      if (emotions.includes("sadness")) return `${date} 힘든 하루`
    }

    return `${date} 일상 기록`
  }

  // 핵심 내용 추출 (개인정보 보호)
  private extractKeyContent(content: string): string {
    // 개인정보 패턴 제거
    const cleaned = content
      .replace(/\d{2,3}-\d{3,4}-\d{4}/g, "[전화번호]") // 전화번호
      .replace(/[가-힣]{2,4}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[이메일]") // 이메일
      .replace(/\d{6}-\d{7}/g, "[주민번호]") // 주민번호

    // 핵심 문장 추출 (첫 200자 + 마지막 100자)
    if (cleaned.length > 300) {
      const firstPart = cleaned.substring(0, 200)
      const lastPart = cleaned.substring(cleaned.length - 100)
      return `${firstPart}... ${lastPart}`
    }

    return cleaned
  }

  // 배치 처리: 기존 메시지들에서 메모리 추출
  async batchExtractFromExistingMessages(userId: string, limit = 50): Promise<void> {
    try {
      // 사용자의 세션들 가져오기
      const { data: sessions } = await supabase.from("saju_sessions").select("id").eq("user_id", userId)

      if (!sessions || sessions.length === 0) return

      const sessionIds = sessions.map((s) => s.id)

      // 최근 메시지들 가져오기
      const { data: messages } = await supabase
        .from("messages")
        .select("id, content, role, session_id, room_type, created_at")
        .in("session_id", sessionIds)
        .eq("role", "user")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!messages) return

      console.log(`${messages.length}개의 메시지에서 메모리 추출 시작...`)

      for (const message of messages) {
        await this.extractFromMessage(message, userId)
        // 요청 제한을 위한 딜레이
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      console.log("배치 메모리 추출 완료")
    } catch (error) {
      console.error("배치 메모리 추출 중 오류:", error)
    }
  }
}

export const autoMemoryExtractor = AutoMemoryExtractor.getInstance()
