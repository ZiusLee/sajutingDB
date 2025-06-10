export interface MemoryEntry {
  id: string
  userId: string
  type: "relationship" | "career" | "emotion" | "location" | "compatibility" | "personal"
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

  // 메모리 저장 - 개선된 버전
  async saveMemory(userId: string, entry: Omit<MemoryEntry, "id" | "userId" | "timestamp">): Promise<string> {
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

    // 중복 체크 및 업데이트
    const existingIndex = userMemory.entries.findIndex((e) => e.type === entry.type && e.label === entry.label)

    if (existingIndex >= 0) {
      userMemory.entries[existingIndex] = newEntry
    } else {
      userMemory.entries.push(newEntry)
    }

    userMemory.lastUpdated = new Date().toISOString()
    this.memories.set(userId, userMemory)

    // 로컬 스토리지에도 저장 - 개선된 버전
    try {
      const storageKey = `user_memory_${userId}`
      localStorage.setItem(storageKey, JSON.stringify(userMemory))

      // 전역 메모리 인덱스도 업데이트
      const globalMemoryIndex = JSON.parse(localStorage.getItem("memory_index") || "[]")
      if (!globalMemoryIndex.includes(userId)) {
        globalMemoryIndex.push(userId)
        localStorage.setItem("memory_index", JSON.stringify(globalMemoryIndex))
      }

      console.log(`메모리 저장 완료: ${entry.label} = ${entry.value}`)
    } catch (error) {
      console.error("Error saving memory to localStorage:", error)
    }

    return memoryId
  }

  // 메모리 조회 - 개선된 버전
  getMemory(userId: string): UserMemory | null {
    let userMemory = this.memories.get(userId)

    if (!userMemory) {
      // 로컬 스토리지에서 복원 시도
      try {
        const stored = localStorage.getItem(`user_memory_${userId}`)
        if (stored) {
          userMemory = JSON.parse(stored)
          this.memories.set(userId, userMemory!)
          console.log(`메모리 복원 완료: ${userMemory?.entries.length}개 항목`)
        }
      } catch (error) {
        console.error("Error loading memory from localStorage:", error)
      }
    }

    return userMemory || null
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
  getMemoriesByType(userId: string, type: MemoryEntry["type"]): MemoryEntry[] {
    const userMemory = this.getMemory(userId)
    return userMemory?.entries.filter((entry) => entry.type === type) || []
  }

  // 궁합 대상자 조회
  getCompatibilityTargets(userId: string): MemoryEntry[] {
    return this.getMemoriesByType(userId, "compatibility")
  }

  // 메모리 삭제
  deleteMemory(userId: string, memoryId: string): boolean {
    const userMemory = this.getMemory(userId)
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
    const userMemory = this.getMemory(userId)
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

    // 궁합 대상자들 - 더 상세하게
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

    return `📖 기억된 정보:
• ${summaryParts.join("\n• ")}

💡 위 정보를 활용하여 더 개인화된 상담을 제공하세요. 특히 궁합 대상자가 언급되면 저장된 정보를 즉시 활용하세요.`
  }

  // 자동 메모리 추출
  async extractAndSaveMemories(userId: string, userMessage: string, assistantResponse: string): Promise<MemoryEntry[]> {
    const savedMemories: MemoryEntry[] = []

    // 직업 정보 추출
    const jobPatterns = [
      /(?:직업|일|회사|업무).*?(?:은|는|이)?\s*([가-힣a-zA-Z\s]+)(?:이에요|예요|입니다|해요|하고)/,
      /([가-힣a-zA-Z\s]+)(?:로|으로|에서)?\s*(?:일|근무|다녀|회사)/,
    ]

    for (const pattern of jobPatterns) {
      const match = userMessage.match(pattern)
      if (match && match[1]) {
        const job = match[1].trim()
        if (job.length > 1 && job.length < 20) {
          const memoryId = await this.saveMemory(userId, {
            type: "career",
            label: "직업",
            value: job,
          })
          savedMemories.push({
            id: memoryId,
            userId,
            type: "career",
            label: "직업",
            value: job,
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    // 거주지 정보 추출
    const locationPatterns = [
      /(?:살고|거주|사는|있는).*?(?:곳|지역|동네).*?(?:은|는|이)?\s*([가-힣\s]+)(?:이에요|예요|입니다)/,
      /([가-힣]+(?:시|구|동|읍|면))(?:에|에서)?\s*(?:살고|거주|있어)/,
    ]

    for (const pattern of locationPatterns) {
      const match = userMessage.match(pattern)
      if (match && match[1]) {
        const location = match[1].trim()
        if (location.length > 1 && location.length < 20) {
          const memoryId = await this.saveMemory(userId, {
            type: "location",
            label: "거주지",
            value: location,
          })
          savedMemories.push({
            id: memoryId,
            userId,
            type: "location",
            label: "거주지",
            value: location,
            timestamp: new Date().toISOString(),
          })
        }
      }
    }

    // 연애 상태 추출
    const relationshipPatterns = [
      /(?:연애|썸|사귀|헤어|이별).*?(?:중|상태|이에요|예요|했어|했습니다)/,
      /(썸|연애|사귀는|헤어진|이별한)\s*(?:상태|중|사람|상대)/,
    ]

    for (const pattern of relationshipPatterns) {
      const match = userMessage.match(pattern)
      if (match) {
        let status = "알 수 없음"
        if (match[0].includes("썸")) status = "썸 단계"
        else if (match[0].includes("사귀")) status = "연애 중"
        else if (match[0].includes("헤어") || match[0].includes("이별")) status = "이별 후"

        const memoryId = await this.saveMemory(userId, {
          type: "emotion",
          label: "연애상태",
          value: status,
        })
        savedMemories.push({
          id: memoryId,
          userId,
          type: "emotion",
          label: "연애상태",
          value: status,
          timestamp: new Date().toISOString(),
        })
      }
    }

    return savedMemories
  }

  // 궁합 대상자 저장 - 압축된 사주 포함
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

  // 이름으로 궁합 대상자 찾기 - 더 유연하게
  findCompatibilityTargetByName(userId: string, name: string): MemoryEntry | null {
    const targets = this.getCompatibilityTargets(userId)

    // 정확한 이름 매칭
    let target = targets.find((target) => target.metadata?.name === name)

    // 부분 매칭 (예: "채원" -> "나채원")
    if (!target) {
      target = targets.find(
        (target) => target.metadata?.name?.includes(name) || name.includes(target.metadata?.name || ""),
      )
    }

    return target || null
  }

  // 궁합 대상자 정보를 포맷된 문자열로 반환
  getCompatibilityTargetInfo(userId: string, name: string): string | null {
    const target = this.findCompatibilityTargetByName(userId, name)
    if (!target || !target.metadata) {
      return null
    }

    const { name: fullName, birth, gender, relationship } = target.metadata
    return `${fullName} (${birth}, ${gender === "male" ? "남성" : "여성"}, ${relationship || "관계미상"})`
  }

  // 압축된 사주 정보 조회
  getCompatibilityTargetSaju(userId: string, name: string): any | null {
    const target = this.findCompatibilityTargetByName(userId, name)
    return target?.metadata?.compressedSaju || null
  }
}

export const memoryService = MemoryService.getInstance()
