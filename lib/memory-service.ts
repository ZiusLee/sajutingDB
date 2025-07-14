import { createMemory, getMemories } from "@/lib/memory-api-service"
import type { MemoryType } from "@/lib/memory-types"

export interface MemoryEntry {
  id: string
  userId: string
  type: MemoryType
  label: string
  value: string
  metadata?: {
    name?: string
    birth?: string
    gender?: string
    relationship?: string
    compressedSaju?: any
    [key: string]: any
  }
  timestamp: string
  lastUsed?: string
}

export interface UserMemory {
  userId: string
  entries: MemoryEntry[]
  summaryChunks: string[]
  lastUpdated: string
}

class MemoryService {
  private static instance: MemoryService
  private memories: Map<string, UserMemory> = new Map()

  static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService()
    }
    return MemoryService.instance
  }

  // 중요한 발화 감지
  isImportantTurn(text: string): boolean {
    const importantKeywords = /(사주|궁합|썸|헤어짐|연애|재회|이혼|직업|회사|일|살고|거주|감정|기분|상태)/i
    return importantKeywords.test(text) || text.length > 100
  }

  // 메모리 저장 - 데이터베이스 연동
  async saveMemory(userId: string, entry: Omit<MemoryEntry, "id" | "userId" | "timestamp">): Promise<string> {
    try {
      // API를 통해 데이터베이스에 저장
      const savedMemory = await createMemory(
        entry.type,
        entry.value, // content로 value 사용
        [], // tags는 빈 배열로
        userId,
      )

      console.log(`✅ 메모리 저장 완료: ${entry.label} = ${entry.value}`)
      return savedMemory.id
    } catch (error) {
      console.error("❌ 메모리 저장 실패:", error)

      // 실패 시 로컬 스토리지에라도 저장
      const memoryId = `memory_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      const newEntry: MemoryEntry = {
        id: memoryId,
        userId,
        timestamp: new Date().toISOString(),
        ...entry,
      }

      let userMemory = this.memories.get(userId)
      if (!userMemory) {
        userMemory = {
          userId,
          entries: [],
          summaryChunks: [],
          lastUpdated: new Date().toISOString(),
        }
      }

      const existingIndex = userMemory.entries.findIndex((e) => e.type === entry.type && e.label === entry.label)
      if (existingIndex >= 0) {
        userMemory.entries[existingIndex] = newEntry
      } else {
        userMemory.entries.push(newEntry)
      }

      userMemory.lastUpdated = new Date().toISOString()
      this.memories.set(userId, userMemory)

      try {
        const storageKey = `user_memory_${userId}`
        localStorage.setItem(storageKey, JSON.stringify(userMemory))
      } catch (storageError) {
        console.error("로컬 스토리지 저장 실패:", storageError)
      }

      return memoryId
    }
  }

  // 메모리 조회 - 데이터베이스 우선
  async getMemory(userId: string): Promise<UserMemory | null> {
    try {
      // API를 통해 데이터베이스에서 조회
      const memories = await getMemories(userId)

      if (memories && memories.length > 0) {
        const userMemory: UserMemory = {
          userId,
          entries: memories.map((mem) => ({
            id: mem.id,
            userId: mem.user_id || userId,
            type: mem.type,
            label: this.getMemoryLabel(mem.type, mem.content),
            value: typeof mem.content === "string" ? mem.content : JSON.stringify(mem.content),
            timestamp: mem.created_at || mem.timestamp,
            metadata: mem.metadata,
          })),
          summaryChunks: [],
          lastUpdated: new Date().toISOString(),
        }

        console.log(`📖 데이터베이스에서 메모리 로드: ${userMemory.entries.length}개 항목`)
        return userMemory
      }
    } catch (error) {
      console.error("데이터베이스 메모리 조회 실패:", error)
    }

    // 데이터베이스 실패 시 로컬 스토리지에서 조회
    let userMemory = this.memories.get(userId)
    if (!userMemory) {
      try {
        const stored = localStorage.getItem(`user_memory_${userId}`)
        if (stored) {
          userMemory = JSON.parse(stored)
          this.memories.set(userId, userMemory!)
          console.log(`📖 로컬 스토��지에서 메모리 복원: ${userMemory?.entries.length}개 항목`)
        }
      } catch (error) {
        console.error("로컬 스토리지 메모리 로드 실패:", error)
      }
    }

    return userMemory || null
  }

  // 메모리 타입에 따른 라벨 생성
  private getMemoryLabel(type: MemoryType, content: any): string {
    switch (type) {
      case "career":
        return "직업"
      case "location":
        return "거주지"
      case "emotion":
        return "감정상태"
      case "personal":
        return "개인정보"
      case "compatibility":
        return "궁합 대상자"
      default:
        return type
    }
  }

  // 모든 사용자 메모리 조회
  getAllUserMemories(): string[] {
    try {
      const globalIndex = JSON.parse(localStorage.getItem("memory_index") || "[]")
      return globalIndex
    } catch (error) {
      console.error("Error loading memory index:", error)
      return []
    }
  }

  // 특정 타입의 메모리 조회
  async getMemoriesByType(userId: string, type: MemoryType): Promise<MemoryEntry[]> {
    const userMemory = await this.getMemory(userId)
    return userMemory?.entries.filter((entry) => entry.type === type) || []
  }

  // 궁합 대상자 조회
  async getCompatibilityTargets(userId: string): Promise<MemoryEntry[]> {
    return this.getMemoriesByType(userId, "compatibility")
  }

  // 메모리 삭제
  deleteMemory(userId: string, memoryId: string): boolean {
    // 로컬 메모리에서 삭제 (데이터베이스 삭제는 별도 API 호출 필요)
    const userMemory = this.memories.get(userId)
    if (!userMemory) return false

    const index = userMemory.entries.findIndex((entry) => entry.id === memoryId)
    if (index >= 0) {
      userMemory.entries.splice(index, 1)
      userMemory.lastUpdated = new Date().toISOString()
      this.memories.set(userId, userMemory)

      try {
        localStorage.setItem(`user_memory_${userId}`, JSON.stringify(userMemory))
      } catch (error) {
        console.error("Error updating memory in localStorage:", error)
      }
      return true
    }
    return false
  }

  // 컨텍스트 요약 생성
  generateContextSummary(userId: string): string {
    // 동기 버전으로 변경 (비동기 호출은 별도 처리)
    const userMemory = this.memories.get(userId)
    if (!userMemory || userMemory.entries.length === 0) {
      return ""
    }

    const summaryParts: string[] = []

    // 개인 정보
    const personalInfo = userMemory.entries.filter((e) => e.type === "personal")
    if (personalInfo.length > 0) {
      summaryParts.push(`개인정보: ${personalInfo.map((e) => `${e.label}(${e.value})`).join(", ")}`)
    }

    // 직업 정보
    const careerInfo = userMemory.entries.filter((e) => e.type === "career")
    if (careerInfo.length > 0) {
      summaryParts.push(`직업: ${careerInfo.map((e) => e.value).join(", ")}`)
    }

    // 위치 정보
    const locationInfo = userMemory.entries.filter((e) => e.type === "location")
    if (locationInfo.length > 0) {
      summaryParts.push(`거주지: ${locationInfo.map((e) => e.value).join(", ")}`)
    }

    // 연애 상태
    const emotionInfo = userMemory.entries.filter((e) => e.type === "emotion")
    if (emotionInfo.length > 0) {
      summaryParts.push(`감정상태: ${emotionInfo.map((e) => e.value).join(", ")}`)
    }

    // 궁합 대상자들
    const compatibilityTargets = userMemory.entries.filter((e) => e.type === "compatibility")
    if (compatibilityTargets.length > 0) {
      const targets = compatibilityTargets.map((e) => {
        const { name, birth, gender, relationship } = e.metadata || {}
        return `${name}(${birth}, ${gender === "male" ? "남" : "여"}, ${relationship || "관계미상"})`
      })
      summaryParts.push(`🔮 기억된 궁합 대상자들: ${targets.join(", ")}`)
    }

    if (summaryParts.length === 0) {
      return ""
    }

    return `📖 기억된 정보:\n• ${summaryParts.join("\n• ")}\n\n💡 위 정보를 활용하여 더 개인화된 상담을 제공하세요.`
  }

  // 자동 메모리 추출 - 개선된 버전
  async extractAndSaveMemories(userId: string, userMessage: string, aiResponse: string): Promise<MemoryEntry[]> {
    const savedMemories: MemoryEntry[] = []

    try {
      // 직업 정보 추출 (더 다양한 패턴)
      const jobPatterns = [
        /(?:직업|일|회사|업무|직장).*?(?:은|는|이)?\s*([가-힣a-zA-Z\s]+)(?:이에요|예요|입니다|해요|하고|다녀)/,
        /([가-힣a-zA-Z\s]+)(?:로|으로|에서)?\s*(?:일|근무|다녀|회사|직장)/,
        /(?:퇴사|이직|창업).*?([가-힣a-zA-Z\s]+)/,
      ]

      for (const pattern of jobPatterns) {
        const match = userMessage.match(pattern)
        if (match && match[1]) {
          const job = match[1].trim()
          if (job.length > 1 && job.length < 30) {
            const memoryId = await this.saveMemory(userId, {
              type: "career",
              label: "직업",
              value: job,
            })
            console.log(`💼 직업 정보 저장: ${job}`)
            break
          }
        }
      }

      // 거주지 정보 추출
      const locationPatterns = [
        /(?:살고|거주|사는|있는|이사).*?(?:곳|지역|동네|구|시|동).*?(?:은|는|이)?\s*([가-힣\s]+)(?:이에요|예요|입니다|에서|에)/,
        /([가-힣]+(?:시|구|동|읍|면|리))(?:에|에서)?\s*(?:살고|거주|있어|이사)/,
      ]

      for (const pattern of locationPatterns) {
        const match = userMessage.match(pattern)
        if (match && match[1]) {
          const location = match[1].trim()
          if (location.length > 1 && location.length < 20) {
            await this.saveMemory(userId, {
              type: "location",
              label: "거주지",
              value: location,
            })
            console.log(`🏠 거주지 정보 저장: ${location}`)
            break
          }
        }
      }

      // 연애 상태 추출
      const relationshipPatterns = [
        { pattern: /(썸|썸타는|썸남|썸녀)/, status: "썸 단계" },
        { pattern: /(연애|사귀는|애인|남친|여친|커플)/, status: "연애 중" },
        { pattern: /(헤어|이별|깨진|끝난)/, status: "이별 후" },
        { pattern: /(결혼|신혼|부부|배우자)/, status: "기혼" },
        { pattern: /(솔로|혼자|싱글)/, status: "솔로" },
      ]

      for (const { pattern, status } of relationshipPatterns) {
        if (pattern.test(userMessage)) {
          await this.saveMemory(userId, {
            type: "emotion",
            label: "연애상태",
            value: status,
          })
          console.log(`💕 연애상태 저장: ${status}`)
          break
        }
      }

      // 목표/계획 추출
      const goalPatterns = [
        /(?:목표|꿈|계획|하고싶은|되고싶은).*?(?:은|는|이)?\s*([가-힣a-zA-Z\s]+)(?:이에요|예요|입니다|해요)/,
        /([가-힣a-zA-Z\s]+)(?:을|를)?\s*(?:목표|꿈|계획|하고싶어|되고싶어)/,
      ]

      for (const pattern of goalPatterns) {
        const match = userMessage.match(pattern)
        if (match && match[1]) {
          const goal = match[1].trim()
          if (goal.length > 2 && goal.length < 50) {
            await this.saveMemory(userId, {
              type: "personal",
              label: "목표",
              value: goal,
            })
            console.log(`🎯 목표 정보 저장: ${goal}`)
            break
          }
        }
      }
    } catch (error) {
      console.error("메모리 추출 중 오류:", error)
    }

    return savedMemories
  }

  // 감정 상태 저장
  async saveEmotionalState(userId: string, userMessage: string, aiResponse: string): Promise<void> {
    const emotionPatterns = [
      { pattern: /(기분|우울|슬픈|힘든)/, emotion: "우울함" },
      { pattern: /(행복|좋은|기쁜|즐거운)/, emotion: "긍정적" },
      { pattern: /(불안|걱정|스트레스)/, emotion: "불안함" },
      { pattern: /(화나|짜증|분노)/, emotion: "분노" },
      { pattern: /(외로|혼자|쓸쓸)/, emotion: "외로움" },
    ]

    for (const { pattern, emotion } of emotionPatterns) {
      if (pattern.test(userMessage) || pattern.test(aiResponse)) {
        await this.saveMemory(userId, {
          type: "emotion",
          label: "감정상태",
          value: emotion,
        })
        console.log(`😊 감정상태 저장: ${emotion}`)
        break
      }
    }
  }

  // 궁합 대상자 저장
  async saveCompatibilityTarget(
    userId: string,
    name: string,
    birth: string,
    gender: string,
    relationship?: string,
    compressedSaju?: any,
  ): Promise<string> {
    return await this.saveMemory(userId, {
      type: "compatibility",
      label: "궁합 대상자",
      value: `${name} (${birth})`,
      metadata: {
        name,
        birth,
        gender,
        relationship: relationship || "알 수 없음",
        compressedSaju,
      },
    })
  }

  // 이름으로 궁합 대상자 찾기
  async findCompatibilityTargetByName(userId: string, name: string): Promise<MemoryEntry | null> {
    const targets = await this.getCompatibilityTargets(userId)

    // 정확한 이름 매칭
    let target = targets.find((target) => target.metadata?.name === name)

    // 부분 매칭
    if (!target) {
      target = targets.find(
        (target) => target.metadata?.name?.includes(name) || name.includes(target.metadata?.name || ""),
      )
    }

    return target || null
  }

  // 궁합 대상자 정보 포맷
  async getCompatibilityTargetInfo(userId: string, name: string): Promise<string | null> {
    const target = await this.findCompatibilityTargetByName(userId, name)
    if (!target || !target.metadata) {
      return null
    }

    const { name: fullName, birth, gender, relationship } = target.metadata
    return `${fullName} (${birth}, ${gender === "male" ? "남성" : "여성"}, ${relationship || "관계미상"})`
  }

  // 압축된 사주 정보 조회
  async getCompatibilityTargetSaju(userId: string, name: string): Promise<any | null> {
    const target = await this.findCompatibilityTargetByName(userId, name)
    return target?.metadata?.compressedSaju || null
  }
}

export const memoryService = MemoryService.getInstance()
