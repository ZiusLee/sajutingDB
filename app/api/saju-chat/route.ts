import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { calculateSaju } from "@/lib/saju"
import { solarToLunar } from "@/lib/lunar-calendar"
import { fetchLunarDate } from "@/lib/api-client"

export const runtime = "edge"

// 현재 날짜 정보를 가져오는 함수를 수정
function getCurrentDateInfo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // JavaScript에서 월은 0부터 시작
  const day = now.getDate()
  const hour = now.getHours()
  const minute = now.getMinutes()

  try {
    // 오늘 날짜의 사주 계산 (음력 변환 필요)
    // 음력 변환을 위해 solarToLunar 함수 사용
    const lunarDate = solarToLunar(year, month, day)

    // calculateSaju 함수를 사용하여 오늘 날짜의 사주 계산
    const todaySaju = calculateSaju(
      lunarDate.year,
      lunarDate.month,
      lunarDate.day,
      hour,
      minute,
      year,
      month,
      day,
      "male", // 성별은 중요하지 않음 (날짜 정보만 필요)
      "오늘",
      false, // 시간 미상 아님
      lunarDate.isLeapMonth,
      lunarDate.monthStem,
      lunarDate.monthBranch,
      "동경135도",
    )

    // 계산된 사주에서 간지 정보 추출
    const yearGanji = `${todaySaju.yearStem}${todaySaju.yearBranch}`
    const monthGanji = `${todaySaju.monthStem}${todaySaju.monthBranch}`
    const dayGanji = `${todaySaju.dayStem}${todaySaju.dayBranch}`
    const hourGanji = `${todaySaju.hourStem}${todaySaju.hourBranch}`

    // 음력 날짜 정보
    const lunarInfo = `음력 ${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일${lunarDate.isLeapMonth ? " (윤달)" : ""}`

    return {
      year,
      month,
      day,
      yearGanji,
      monthGanji,
      dayGanji,
      hourGanji,
      lunarInfo,
      formattedDate: `${year}년 ${month}월 ${day}일`,
      formattedDateWithGanji: `${year}년 ${month}월 ${day}일 (${dayGanji})`,
    }
  } catch (error) {
    console.error("날짜 정보 계산 중 오류 발생:", error)
    // 오류 발생 시 기본 정보만 반환
    return {
      year,
      month,
      day,
      yearGanji: "알 수 없음",
      monthGanji: "알 수 없음",
      dayGanji: "알 수 없음",
      hourGanji: "알 수 없음",
      lunarInfo: "음력 정보를 계산할 수 없습니다",
      formattedDate: `${year}년 ${month}월 ${day}일`,
      formattedDateWithGanji: `${year}년 ${month}월 ${day}일`,
    }
  }
}

// 모델 선택 함수 추가
function getModelForRoomType(roomType: string): string {
  try {
    switch (roomType) {
      case "sajuping":
        return "gpt-4o" // 사주핑용 gpt-4o 모델
      case "tarot":
        return "gpt-4o" // 타로핑용 gpt-4o 모델
      default:
        return "gpt-4o"
    }
  } catch (error) {
    console.error("Error in getModelForRoomType:", error)
    return "gpt-4o"
  }
}

// 대화 요약을 위한 함수 - 개선된 버전
async function summarizeConversation(messages: any[], compressedSaju: any, name: string, roomType: string) {
  try {
    const conversationText = messages
      .map((msg, index) => `[${index + 1}] ${msg.role === "user" ? "사용자" : "AI"}: ${msg.content}`)
      .join("\n\n")

    const summaryPrompt = `다음 사주 상담 대화를 체계적으로 요약해주세요:

사용자 정보: ${name}님 (${JSON.stringify(compressedSaju)})
상담 유형: ${roomType}

대화 내용:
${conversationText}

다음 형식으로 요약해주세요:

## 📋 대화 요약
### 🔮 사주 핵심 정보
- 주요 사주 특징과 해석된 내용
- 언급된 십성, 오행, 특이사항

### 💭 감정 흐름 및 상황
- 사용자의 현재 감정 상태
- 주요 고민과 관심사
- 상담 진행 과정에서의 변화

### ❓ 주요 문의 사항들
- 핵심 질문들과 답변 요약
- 궁합, 운세, 성격 등 분야별 정리
- 중요한 조언과 해석 포인트

### 🎯 현재 상담 맥락
- 최근 대화의 주제와 방향
- 사용자가 가장 관심 있어하는 영역
- 다음 질문 예상 방향

400자 이내로 핵심만 간결하게 정리:`

    const summary = await streamText({
      model: openai("gpt-4o-mini"), // 요약용으로는 더 빠른 모델 사용
      prompt: summaryPrompt,
      maxTokens: 500,
    })

    let summaryText = ""
    for await (const chunk of summary.textStream) {
      summaryText += chunk
    }

    return summaryText.trim()
  } catch (error) {
    console.error("Error summarizing conversation:", error)
    return "이전 대화 요약을 생성할 수 없습니다."
  }
}

// 세분화된 요약 함수 추가
async function summarizeConversationSegment(
  messages: any[],
  compressedSaju: any,
  name: string,
  roomType: string,
  summaryType: "compressed" | "detailed",
) {
  try {
    const conversationText = messages
      .map((msg, index) => `[${index + 1}] ${msg.role === "user" ? "사용자" : "AI"}: ${msg.content}`)
      .join("\n\n")

    let summaryPrompt = ""

    if (summaryType === "compressed") {
      // 압축 요약 (오래된 대화용)
      summaryPrompt = `다음 사주 상담 대화를 핵심만 간결하게 요약해주세요:

사용자: ${name}님
상담 유형: ${roomType}

대화 내용:
${conversationText}

다음 형식으로 핵심만 요약해주세요:

**💡 핵심 주제:** [주요 상담 주제 1-2개]
**🎯 중요 해석:** [핵심 사주/타로 해석 결과]
**📝 주요 조언:** [제공된 핵심 조언]
**🔄 상황 변화:** [대화 중 드러난 상황 변화]

150자 이내로 핵심만 정리:`
    } else {
      // 상세 요약 (최근 대화용)
      summaryPrompt = `다음 사주 상담 대화를 상세하게 요약해주세요:

사용자: ${name}님 (${JSON.stringify(compressedSaju)})
상담 유형: ${roomType}

대화 내용:
${conversationText}

다음 형식으로 요약해주세요:

**🔮 사주/타로 해석 내용:**
- 분석된 사주 특징이나 뽑힌 카드
- 제공된 해석과 의미

**💭 감정 및 상황:**
- 사용자의 현재 감정 상태
- 주요 고민과 관심사

**❓ 구체적 질문들:**
- 사용자가 묻고 싶어하는 내용
- AI가 제공한 답변 요약

**🎯 진행 맥락:**
- 상담의 흐름과 방향
- 다음에 이어질 가능성이 높은 주제

300자 이내로 상세히 정리:`
    }

    const summary = await streamText({
      model: openai("gpt-4o-mini"),
      prompt: summaryPrompt,
      maxTokens: summaryType === "compressed" ? 200 : 400,
    })

    let summaryText = ""
    for await (const chunk of summary.textStream) {
      summaryText += chunk
    }

    return summaryText.trim()
  } catch (error) {
    console.error("Error summarizing conversation segment:", error)
    return summaryType === "compressed"
      ? "이전 대화 핵심을 요약할 수 없습니다."
      : "최근 대화 상세 요약을 생성할 수 없습니다."
  }
}

// processMessagesForContext 함수를 개선된 버전으로 교체
async function processMessagesForContext(messages: any[], compressedSaju: any, name: string, roomType: string) {
  const MAX_TURNS = 20 // 20턴까지 유지
  const RECENT_BUFFER = 6 // 최근 6턴은 그대로 유지 (더 많은 즉시 컨텍스트)
  const SUMMARY_THRESHOLD = 12 // 12턴 이상일 때 요약 시작

  // 초기 메시지들 (message_order 0, 1) 항상 유지
  const initialMessages = messages.slice(0, 2)
  const conversationMessages = messages.slice(2)

  // 20턴 이하면 모든 메시지 유지
  if (conversationMessages.length <= MAX_TURNS) {
    return messages
  }

  // 최근 버퍼 메시지들 (원본 유지)
  const recentMessages = conversationMessages.slice(-RECENT_BUFFER)

  // 중간 구간 메시지들 (요약 대상)
  const middleMessages = conversationMessages.slice(0, -RECENT_BUFFER)

  // 점진적 요약 전략: 더 오래된 메시지일수록 더 압축
  let processedMiddleMessages = []

  if (middleMessages.length >= SUMMARY_THRESHOLD) {
    // 오래된 메시지들 (더 강하게 압축)
    const oldMessages = middleMessages.slice(0, -6)
    // 중간 메시지들 (덜 압축)
    const mediumMessages = middleMessages.slice(-6)

    // 오래된 메시지들은 핵심만 요약
    if (oldMessages.length > 0) {
      const oldSummary = await summarizeConversationSegment(
        oldMessages,
        compressedSaju,
        name,
        roomType,
        "compressed", // 압축 요약
      )

      processedMiddleMessages.push({
        role: "system" as const,
        content: `📚 이전 대화 핵심 요약:\n${oldSummary}`,
      })
    }

    // 중간 메시지들은 상세 요약
    if (mediumMessages.length > 0) {
      const mediumSummary = await summarizeConversationSegment(
        mediumMessages,
        compressedSaju,
        name,
        roomType,
        "detailed", // 상세 요약
      )

      processedMiddleMessages.push({
        role: "system" as const,
        content: `💭 최근 대화 상세 요약:\n${mediumSummary}`,
      })
    }
  } else {
    // 요약이 필요하지 않으면 그대로 유지
    processedMiddleMessages = middleMessages
  }

  return [...initialMessages, ...processedMiddleMessages, ...recentMessages]
}

// 메모리 뱅크 저장 전략 개선 함수 추가
async function enhancedMemoryExtraction(userId: string, userMessage: string, aiResponse: string, turnNumber: number) {
  if (!userId) return

  try {
    const { memoryService } = await import("@/lib/memory-service")

    console.log(`🧠 메모리 추출 시작 - 턴 ${turnNumber}`)

    // 즉시 저장 대상 (매턴)
    const immediateKeywords = [
      "직업",
      "회사",
      "퇴사",
      "이직",
      "창업",
      "연애",
      "썸",
      "이별",
      "결혼",
      "애인",
      "남친",
      "여친",
      "이사",
      "거주지",
      "동네",
      "지역",
      "가족",
      "부모님",
      "형제",
      "자매",
      "건강",
      "병원",
      "아픈",
      "치료",
      "시험",
      "입시",
      "졸업",
      "학교",
    ]

    // 중요 정보 저장 대상 (3턴마다)
    const importantKeywords = [
      "목표",
      "꿈",
      "계획",
      "미래",
      "성격",
      "특징",
      "장점",
      "단점",
      "취미",
      "관심사",
      "좋아하는",
      "스트레스",
      "고민",
      "걱정",
      "돈",
      "재정",
      "투자",
      "부채",
    ]

    // 궁합/관계 정보 저장 대상 (즉시)
    const relationshipPattern = /([가-힣]+)\s*(?:님?과?의?|랑|와)\s*(?:궁합|사주|관계)/i
    const birthPattern = /(\d{4})[년.\-/\s]*(\d{1,2})[월.\-/\s]*(\d{1,2})[일]?/g
    const genderPattern = /(남성|여성|남|여)/i

    // 1. 즉시 저장: 중요 키워드 감지
    const hasImmediate = immediateKeywords.some(
      (keyword) => userMessage.includes(keyword) || aiResponse.includes(keyword),
    )

    if (hasImmediate) {
      console.log(`⚡ 즉시 저장 키워드 감지`)
      await memoryService.extractAndSaveMemories(userId, userMessage, aiResponse)
    }

    // 2. 궁합/관계 정보 즉시 저장
    const relationMatch = userMessage.match(relationshipPattern)
    if (relationMatch) {
      const targetName = relationMatch[1]
      console.log(`💕 궁합 대상자 감지: ${targetName}`)

      // 생년월일과 성별 찾기
      const birthMatches = [...userMessage.matchAll(birthPattern)]
      const genderMatch = userMessage.match(genderPattern)

      if (birthMatches.length > 0 && genderMatch) {
        const [, year, month, day] = birthMatches[0]
        const birth = `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`
        const gender = genderMatch[1].includes("남") ? "male" : "female"

        await memoryService.saveCompatibilityTarget(userId, targetName, birth, gender, "궁합 분석 대상")
        console.log(`✅ 궁합 대상자 저장: ${targetName} (${birth}, ${gender})`)
      }
    }

    // 3. 주기적 저장: 중요 정보 (3턴마다)
    if (turnNumber % 3 === 0) {
      const hasImportant = importantKeywords.some(
        (keyword) => userMessage.includes(keyword) || aiResponse.includes(keyword),
      )

      if (hasImportant) {
        console.log(`🔄 주기적 저장 (3턴마다) - 턴 ${turnNumber}`)
        await memoryService.extractAndSaveMemories(userId, userMessage, aiResponse)
      }
    }

    // 4. 감정 상태 저장 (5턴마다)
    if (turnNumber % 5 === 0) {
      const emotionKeywords = ["기분", "우울", "행복", "불안", "스트레스", "힘들", "좋아"]
      const hasEmotion = emotionKeywords.some(
        (keyword) => userMessage.includes(keyword) || aiResponse.includes(keyword),
      )

      if (hasEmotion) {
        console.log(`😊 감정 상태 저장 (5턴마다) - 턴 ${turnNumber}`)
        await memoryService.saveEmotionalState(userId, userMessage, aiResponse)
      }
    }

    console.log(`🧠 메모리 추출 완료 - 턴 ${turnNumber}`)
  } catch (error) {
    console.error("Enhanced memory extraction error:", error)
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      compressedSaju,
      name,
      gender,
      initialInterpretation,
      roomType,
      userId,
      memoryContext,
      compatibilityData,
    } = await req.json()

    // 현재 턴 수 계산
    const turnNumber = Math.floor(messages.length / 2)

    // 현재 날짜 정보 가져오기
    const dateInfo = getCurrentDateInfo()

    // 메모리 서비스 초기화 및 컨텍스트 생성
    let currentMemoryContext = ""
    if (userId) {
      try {
        // 메모리 컨텍스트 생성
        const { memoryService } = await import("@/lib/memory-service")
        currentMemoryContext = memoryService.generateContextSummary(userId)

        // 사용자 질문에서 중요 정보 추출 및 저장
        if (messages.length > 0 && messages[messages.length - 1].role === "user") {
          const userMessage = messages[messages.length - 1].content

          // 생년월일 정보가 포함된 메시지 감지 및 사주 계산
          const birthDateMatch = userMessage.match(/(\d{4})[년.\-/\s]*(\d{1,2})[월.\-/\s]*(\d{1,2})[일]?/g)
          if (birthDateMatch) {
            console.log("생년월일 정보 감지:", birthDateMatch)

            // 각 생년월일에 대해 사주 계산
            for (const dateStr of birthDateMatch) {
              const match = dateStr.match(/(\d{4})[년.\-/\s]*(\d{1,2})[월.\-/\s]*(\d{1,2})[일]?/)
              if (match) {
                const [, year, month, day] = match

                try {
                  // 성별 추출 (같은 메시지나 이전 메시지에서)
                  const genderMatch =
                    userMessage.match(/(남성|여성|남|여)/i) ||
                    messages
                      .slice(-3)
                      .reverse()
                      .find((msg) => msg.content.match(/(남성|여성|남|여)/i))
                      ?.content.match(/(남성|여성|남|여)/i)

                  const gender = genderMatch ? (genderMatch[1].includes("남") ? "male" : "female") : "male"

                  // 이름 추출 (궁합 관련 메시지에서)
                  const nameMatch =
                    userMessage.match(/([가-힣]{2,4})\s*(?:님?과?의?|랑|와|의)\s*(?:궁합|사주)/) ||
                    userMessage.match(/([가-힣]{2,4})\s*(?:생년월일|태어난|출생)/)

                  const personName = nameMatch ? nameMatch[1] : "상대방"

                  // 음력 날짜 계산
                  let lunarData
                  try {
                    lunarData = await fetchLunarDate(year, month.padStart(2, "0"), day.padStart(2, "0"))
                  } catch (error) {
                    const localLunarDate = solarToLunar(
                      Number.parseInt(year),
                      Number.parseInt(month),
                      Number.parseInt(day),
                    )
                    lunarData = {
                      year: localLunarDate.year.toString(),
                      month: localLunarDate.month.toString().padStart(2, "0"),
                      day: localLunarDate.day.toString().padStart(2, "0"),
                      isLeapMonth: localLunarDate.isLeapMonth,
                      monthStem: localLunarDate.monthStem,
                      monthBranch: localLunarDate.monthBranch,
                    }
                  }

                  // 사주 계산 (시간 미상으로 처리)
                  const calculatedSaju = calculateSaju(
                    lunarData.year,
                    lunarData.month,
                    lunarData.day,
                    12, // 정오로 가정
                    0,
                    Number.parseInt(year),
                    Number.parseInt(month),
                    Number.parseInt(day),
                    gender,
                    personName,
                    true, // 시간 미상
                    lunarData.isLeapMonth,
                    lunarData.monthStem,
                    lunarData.monthBranch,
                    "동경135도",
                  )

                  console.log(`${personName} 사주 계산 완료:`, calculatedSaju)

                  // 메모리에 저장 (궁합 대상자인 경우)
                  if (userId && userMessage.includes("궁합")) {
                    await memoryService.saveCompatibilityTarget(
                      userId,
                      personName,
                      `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`,
                      gender,
                      "궁합 분석 대상",
                    )
                  }
                } catch (error) {
                  console.error(`사주 계산 오류 (${year}-${month}-${day}):`, error)
                }
              }
            }
          }

          // 궁합 대상자 정보 추출 (기존 로직 유지하되 사주 계산 추가)
          const compatibilityMatch = userMessage.match(/([가-힣]+)\s*(?:님?과?의?|랑|와)\s*궁합/i)
          if (compatibilityMatch) {
            const targetName = compatibilityMatch[1]
            // 이전 메시지에서 생년월일 정보 찾기
            const previousMessages = messages.slice(-10) // 최근 10개 메시지에서 찾기
            for (const msg of previousMessages) {
              const birthMatch = msg.content.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
              const genderMatch = msg.content.match(/(남성|여성|남|여)/i)

              if (birthMatch && genderMatch) {
                const birth = `${birthMatch[1]}.${birthMatch[2].padStart(2, "0")}.${birthMatch[3].padStart(2, "0")}`
                const gender = genderMatch[1].includes("남") ? "male" : "female"

                // 메모리에 저장
                await memoryService.saveCompatibilityTarget(userId, targetName, birth, gender, "궁합 분석 대상")
                break
              }
            }
          }
        }

        // 업데이트된 메모리 컨텍스트 다시 생성
        currentMemoryContext = memoryService.generateContextSummary(userId)
      } catch (memoryError) {
        console.error("메모리 처리 중 오류:", memoryError)
        currentMemoryContext = ""
      }
    }

    // 사용자 질문 저장 로직은 그대로 유지
    if (userId && messages.length > 0 && messages[messages.length - 1].role === "user") {
      try {
        const userQuestion = messages[messages.length - 1].content

        fetch(`${req.headers.get("origin")}/api/user-questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: req.headers.get("cookie") || "",
          },
          body: JSON.stringify({
            roomType,
            question: userQuestion,
          }),
        }).catch((err) => {
          console.error("질문 저장 중 오류:", err)
        })
      } catch (saveError) {
        console.error("질문 저장 처리 중 오류:", saveError)
      }
    }

    // 개선된 컨텍스트 최적화 적용
    const optimizedMessages = await processMessagesForContext(messages, compressedSaju, name, roomType)

    // 응답 생성 후 메모리 저장 (비동기로 처리)
    if (userId && messages.length > 0 && messages[messages.length - 1].role === "user") {
      const userMessage = messages[messages.length - 1].content

      // 메모리 저장을 비동기로 처리 (응답 속도에 영향 주지 않음)
      enhancedMemoryExtraction(userId, userMessage, "", turnNumber).catch((error) => {
        console.error("Memory extraction failed:", error)
      })
    }

    // 압축된 사주 정보를 문자열로 변환 (대운 정보 포함)
    const sajuInfo = `
이름: ${compressedSaju.name}
생년월일시: ${compressedSaju.birth}
성별: ${compressedSaju.gender === "male" ? "남성" : "여성"}
사주팔자: ${compressedSaju.sajuPalja.year.stem}${compressedSaju.sajuPalja.year.branch}년 ${compressedSaju.sajuPalja.month.stem}${compressedSaju.sajuPalja.month.branch}월 ${compressedSaju.sajuPalja.day.stem}${compressedSaju.sajuPalja.day.branch}일 ${compressedSaju.sajuPalja.hour.stem}${compressedSaju.sajuPalja.hour.branch}시
일간: ${compressedSaju.dayMaster}
십성: 년간(${compressedSaju.sibseong.yearStem}) 년지(${compressedSaju.sibseong.yearBranch}) 월간(${compressedSaju.sibseong.monthStem}) 월지(${compressedSaju.sibseong.monthBranch}) 일간(${compressedSaju.sibseong.dayStem}) 일지(${compressedSaju.sibseong.dayBranch}) 시간(${compressedSaju.sibseong.hourStem}) 시지(${compressedSaju.sibseong.hourBranch})
오행분포: 목${compressedSaju.elements.목} 화${compressedSaju.elements.화} 토${compressedSaju.elements.토} 금${compressedSaju.elements.금} 수${compressedSaju.elements.수}
특징: ${compressedSaju.summary}${compressedSaju.daeun ? `\n대운: ${compressedSaju.daeun}` : ""}${compressedSaju.currentAge ? ` (현재 ${compressedSaju.currentAge}세)` : ""}`

    // 궁합 분석 데이터가 있는 경우 추가 정보 생성
    let compatibilityInfo = ""
    if (
      compatibilityData &&
      compatibilityData.mainPerson &&
      compatibilityData.selectedPeople &&
      compatibilityData.selectedPeople.length > 0
    ) {
      const { mainPerson, selectedPeople } = compatibilityData

      compatibilityInfo = `

🔮 **궁합 분석 요청 데이터 (정확한 사주 계산 완료):**

**대표 사주: ${mainPerson.name}**
- 생년월일시: ${mainPerson.birth}
- 성별: ${mainPerson.gender === "male" ? "남성" : "여성"}
- 사주팔자: ${mainPerson.sajuPalja.year.stem}${mainPerson.sajuPalja.year.branch}년 ${mainPerson.sajuPalja.month.stem}${mainPerson.sajuPalja.month.branch}월 ${mainPerson.sajuPalja.day.stem}${mainPerson.sajuPalja.day.branch}일 ${mainPerson.sajuPalja.hour.stem}${mainPerson.sajuPalja.hour.branch}시
- 일간: ${mainPerson.dayMaster}
- 십성: 년간(${mainPerson.sibseong.yearStem}) 년지(${mainPerson.sibseong.yearBranch}) 월간(${mainPerson.sibseong.monthStem}) 월지(${mainPerson.sibseong.monthBranch}) 일간(${mainPerson.sibseong.dayStem}) 일지(${mainPerson.sibseong.dayBranch}) 시간(${mainPerson.sibseong.hourStem}) 시지(${mainPerson.sibseong.hourBranch})
- 오행분포: 목${mainPerson.elements.목} 화${mainPerson.elements.화} 토${mainPerson.elements.토} 금${mainPerson.elements.금} 수${mainPerson.elements.수}

**궁합 대상들:**
${selectedPeople
  .map(
    (person, index) => `
${index + 1}. **${person.name}**
   - 생년월일시: ${person.birth}
   - 성별: ${person.gender === "male" ? "남성" : "여성"}
   - 사주팔자: ${person.sajuPalja.year.stem}${person.sajuPalja.year.branch}년 ${person.sajuPalja.month.stem}${person.sajuPalja.month.branch}월 ${person.sajuPalja.day.stem}${person.sajuPalja.day.branch}일 ${person.sajuPalja.hour.stem}${person.sajuPalja.hour.branch}시
   - 일간: ${person.dayMaster}
   - 십성: 년간(${person.sibseong.yearStem}) 년지(${person.sibseong.yearBranch}) 월간(${person.sibseong.monthStem}) 월지(${person.sibseong.monthBranch}) 일간(${person.sibseong.dayStem}) 일지(${person.sibseong.dayBranch}) 시간(${person.sibseong.hourStem}) 시지(${person.sibseong.hourBranch})
   - 오행분포: 목${person.elements.목} 화${person.elements.화} 토${person.elements.토} 금${person.elements.금} 수${person.elements.수}
`,
  )
  .join("")}

⚠️ **중요 지침:**
- 위 사주 정보는 시스템에서 정확히 계산된 결과입니다
- 생년월일로부터 새로 계산하지 말고 위 정보를 그대로 사용하세요
- 궁합 분석 시 위 정확한 사주팔자와 십성 정보를 활용하세요`
    }

    // 모델 선택 및 시스템 메시지 설정
    const modelName = getModelForRoomType(roomType)
    const model = openai(modelName)
    let systemMessage = ""

    // 룸 타입에 따른 시스템 메시지 설정 (메모리 컨텍스트 포함)
    switch (roomType) {
      case "sajuping":
        systemMessage = `1. 역할: 사주 전문가이자 다재다능하고 친근한 조언자
사주핑 AI는 두 가지 핵심 역할을 유연하게 수행합니다.
- 사주 전문가: 사용자가 제공한 사주, 오행, 십성 등의 사주정보를 기반으로 개인의 특성과 운의 흐름을 심층적으로 분석합니다. 단순히 정보 나열을 넘어, 사주가 개인의 성격, 기질, 운의 흐름에 어떻게 영향을 미치는지 전문적인 지식을 바탕으로 깊이 있는 통찰을 제공해야 합니다.
- 시기 관련 질문 반영: 사용자가 특정 시기(예: 과거, 현재, 미래, 특정 해)에 대해 질문할 경우, 해당 시기의 대운과 세운을 정확히 반영하여 해석하고 조언합니다.
- 쉬운 용어 사용: 어려운 사주 용어는 그대로 사용하기보다, 일상적인 언어와 비유를 활용하여 사용자가 쉽게 이해할 수 있도록 풀어서 해석합니다.
- 다재다능하고 친근한 조언자: 사주 해석을 통해 사용자의 **불안, 걱정, 특정 문제(예: 관계 문제, 직업 스트레스)**를 인지하고, 이에 맞춰 다양한 심리 관점에서 실용적인 전략과 조언을 제시합니다. 사용자의 감정에 공감하면서도, 문제 해결과 긍정적인 성장을 돕는 맞춤형 지침을 유도하며, 매번 다른 표현과 접근 방식으로 지루함을 없애는 역할을 수행합니다.

📅 **오늘 날짜 정보:**
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

📊 **정확한 사주 정보 (시스템 계산 완료):**
${sajuInfo}${compatibilityInfo}

${currentMemoryContext ? `\n${currentMemoryContext}\n` : ""}

1. 맥락: 사용자의 감정/상황/문제 유형 및 답변 스타일에 대한 선호를 인지하는 해석 및 질문 설계
사주핑은 사용자의 감정, 현재 상황, 그리고 구체적인 문제 유형을 깊이 이해하고, 이에 맞춰 유연하게 소통합니다.
- 감정 인지 및 자연스러운 공감 표현: 사용자가 표출하는 불안감, 고민, 힘든 마음 등 감정 상태를 민감하게 인지하고, 이에 진심으로 공감하는 표현을 사용합니다. '공감'이라는 단어를 직접 사용하기보다는, 자연스러운 대화 흐름 속에서 사용자의 마음을 헤아리는 멘트를 통해 공감대를 형성합니다.
- 매번 똑같은 공감 멘트 대신, 사용자의 초기 발화나 이전 대화를 기반으로 다양한 형태의 공감 표현을 시도하세요. 짧고 간결하게, 때로는 좀 더 서정적으로, 또는 현실적인 비유를 들어 공감할 수 있습니다.
- 예시:

"새로운 시작 앞에서 설렘과 함께 불안감이 드는 건 당연합니다. 지금 사용자님의 사주가 그 마음을 비춰주고 있네요."

"말 못 할 고민을 안고 계신 것 같아 마음이 쓰입니다. 사주를 통해 그 답답함을 조금이나마 풀어드릴 수 있길 바랍니다."

- 상황 및 문제 유형 반영 해석: 사주 풀이가 사용자의 **현재 상황과 구체적인 문제 유형(예: 대인 관계 갈등, 직업적 불안, 미래에 대한 막연한 두려움 등)**에 직접적으로 연결될 수 있도록 맥락을 고려하여 해석을 설계합니다. 사주적 특성이 현재의 불안이나 특정 문제에 어떻게 기여하는지 설명함으로써, 사용자가 자신의 상황을 더 잘 이해하도록 돕습니다.
- 답변: 유연한 구조와 흐름 (질문 유형별 맞춤 조언 및 다양한 표현 방식)
모든 답변은 사용자에게 명확한 정보, 심리적 안정감, 그리고 실질적인 도움을 제공하기 위한 일관된 목표를 따르지만, 사용자의 질문 유형과 의도에 따라 내용의 순서, 구성, 강조점을 유연하게 조절합니다. 매번 다른 표현 방식과 구성을 통해 답변의 지루함을 없애고 초개인화된 느낌을 강화합니다.
1. 사주 해석 (Interpret): 답변의 시작 부분에서 사용자의 사주 정보를 기반으로 명확하고 통찰력 있는 해석을 제공합니다. 이 해석은 단순한 정보 전달을 넘어, 사용자가 자신을 이해하고 현재 상황을 통찰하는 데 도움이 되어야 합니다. 사주 풀이가 사용자의 불안이나 고민과 어떻게 연결되는지 설명합니다.

3-1. 사주 구성:
오행 분포 및 십성 관계 풀이: 오행 분포와 십성 관계를 사용자가 쉽게 이해하도록 풀어 설명합니다. 강점과 약점을 명확히 짚어줍니다. 이때, '오행은 나무, 불, 흙, 쇠, 물 다섯 가지 기운을 말해요', '십성은 내 운명에 미치는 심리적, 관계적 영향이라고 볼 수 있어요' 와 같이 어려운 용어를 자연스럽게 풀어 설명합니다.

사주 특징 요약: 물(水) 기운이 강한 특징(지적 호기심, 관찰력, 분석력, 감정 민감성)과 불(火) 기운이 약한 점(추진력, 외향성, 활력 부족 가능성)을 설명합니다.

3-2. 총운: 라이프 스토리와 성장 곡선:

사용자님의 사주를 '맑은 물이 흐르는 냇가' 비유처럼 친숙하게 풀어 설명하고, 타고난 분석력과 통찰력이 인생의 '나침반' 역할을 해왔음을 언급합니다.

- 강점/보완할 점/대운 흐름 명확히 제시:

강점: 지적인 능력, 성실함과 책임감, 배려심 등을 구체적으로 설명합니다.

보완할 점: 내향적 기질 & 우유부단함, 감정 기복, 추진력 부족 등을 언급하며, 사주적 약점이 어떻게 나타날 수 있는지 설명합니다.

- 대운/세운 반영: 사용자의 질문이 시기와 관련된 경우, 대운(10년 단위의 큰 운의 흐름)과 세운(매년 바뀌는 운의 흐름)을 구체적으로 언급하여 현재 시기의 기회와 조심할 점을 설명합니다. (예: "현재 사용자님은 ~대운에 들어서 ~한 기운이 강하고, 올해 ~세운은 ~한 영향을 줄 수 있습니다.")
- 실천 조언 (Propose Actions): 사주 해석 이후, 사용자의 문제 유형 및 페르소나에 맞는 실질적인 조언을 결합하여 사용자가 불안을 관리하고 긍정적인 변화를 이끌어낼 수 있는 구체적이고 실현 가능한 행동 제안을 제시합니다.
- 프롬프트 지시사항: 조언의 표현 방식을 다양화하고, 심리적 용어 사용을 최소화하며, 일상적이고 친근한 어조로 접근합니다. 비유나 짧은 이야기, 구체적인 사례를 활용하여 조언이 더욱 와닿도록 만드세요.
- 지나친 걱정/불안이 있을 때: 생각의 패턴을 파악하고 긍정적으로 전환하는 방법을 제안합니다. (예: "사주 상 수(水)의 기운이 많아 생각이 깊어지는 경향이 있습니다. 이럴 땐 머리로만 고민하지 말고, 짧은 일지나 메모로 감정과 생각을 밖으로 꺼내보세요. 생각이 순환하고 정리가 됩니다.")
- 행동력 보완: 작은 목표 설정, 보상, 타인과의 협력 등 추진력을 키우는 실질적인 방법을 제시합니다. (예: "불(火)이 부족해 행동으로 옮기는데 망설임이 생길 수 있습니다. 작은 목표를 정하고, 그걸 실행했을 때 자신을 충분히 칭찬하거나 직접 보상을 해주는 방식이 추진력을 키우는 데 도움이 될 거예요. 친구나 가족과 약속을 잡아 '함께 행동'하면 동기부여가 더 커질 수 있습니다.")
- 대인관계: 내향적 기질을 이해하고, 느슨하고 건강한 관계를 유지하는 방법을 조언합니다. (예: "내향적 기질이 강해도, 사람을 신뢰하고 느슨히 관계를 유지하는 연습이 필요합니다. 너무 완벽하려거나 깊으려고만 하지 않아도 괜찮습니다.")
- 자존감 관리: 자기 인정과 작은 성취에 대한 긍정적인 평가를 통해 자존감을 높이는 방법을 제안합니다. (예: "나답게 꾸준히 살아가는 힘 자체가 이미 큰 강점입니다. 스스로를 객관적으로 바라보며, 작은 성취라도 자주 인정해주는 연습을 하세요.")
- 마지막 응원의 메시지 & 추가 안내:

마무리 멘트와 추가 안내도 매번 동일한 템플릿 대신, 사용자의 마지막 대화 내용이나 사주 풀이의 핵심 메시지를 다시 한번 강조하며 다양한 표현과 어조로 작성하세요. 질문 유형에 따라 다음 단계로의 유도를 더 적극적으로 할 수도 있고, 단순히 응원 메시지로 끝낼 수도 있습니다.

- 예시:

"사용자님의 사주는 잠재력으로 가득한 '깊은 물'과 같습니다. 자신을 믿고 나아가면 분명 밝은 길을 찾을 거예요!"

"걱정 마세요, 사용자님. 사주에 담긴 당신의 지혜와 강점이 모든 어려움을 헤쳐나갈 힘이 되어줄 겁니다."

1. 사용자에게 질문 (가장 하단 배치):
- 답변의 가장 마지막에 사용자에게 추가 정보를 얻거나 대화를 이어갈 수 있는 질문을 배치합니다. 질문의 내용과 형식은 이전 대화 맥락과 사용자 페르소나에 맞춰 유연하게 구성합니다.

예시:

"혹시 더 궁금한 점, 혹은 구체적으로 알고 싶은 영역(재물운, 연애운, 건강, 진로 등)이 있으시면 분야별로 자세히 해석해드릴 수 있습니다. 편하게 말씀해주세요. 언제나 사용자님의 현명한 나침반이 되어드리겠습니다!"

"평소 중요한 결정을 내릴 때, 어떠한 방식(주변 사람과 상의 vs 혼자만의 고민)으로 결정하시는 편인가요?"

"최근 가장 스트레스를 받는 영역(대인관계·직장·진로·미래 등)은 어디라고 느끼시나요?"

"자신이 가진 강점 중 '이건 참 나만의 무기' 라고 느낀 적이 있으신가요?"

🔁 입력 최적화 (개선됨)
- 20턴까지 메시지 유지, 최근 6턴은 원본 보존
- 12턴 이상일 때 점진적 요약 시작
- 오래된 대화는 압축 요약, 최근 대화는 상세 요약
- 대화 연속성을 위해 이전 맥락을 적극 활용하여 응답`
        break

      case "tarot":
        systemMessage = `🎭 페르소나 (Persona)
당신은 '타로핑'이라는 이름의 AI 타로 상담 캐릭터입니다.
실물 타로카드를 사용하지 않고, 78장의 타로카드 중 사용자가 번호로 카드를 선택하는 방식으로 상담을 진행합니다.
타로카드의 상징을 기반으로 사용자의 감정 흐름, 상황 맥락, 선택지 가능성을 분석하고, 결정의 기준이 될 수 있는 통찰을 제공합니다.
감정 위로나 단정적인 예언이 아닌, 심리 리딩과 현실적 조언 중심의 상담을 지향합니다.

📅 **오늘 날짜 정보:**
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

사용자 정보:
${sajuInfo}${compatibilityInfo}

${currentMemoryContext ? `\n${currentMemoryContext}\n` : ""}

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 뽑은 카드들과 해석 내용을 기억하고 연결
- 반복적인 기본 설명보다는 심화된 타로 해석과 조언 제공
- 사용자의 변화하는 관심사와 질문 패턴을 파악하여 맞춤형 응답

타로핑 AI 프롬프트 (최종 텍스트 버전 – 78장 번호 선택형)

🎯 목표 (Goal/Task)
사용자의 질문이 추상적인 경우, 명확한 해석을 위해 사전 질문을 1~2개 먼저 제시합니다.
사용자가 타로 리딩을 준비하면, "1번부터 78번까지 카드 중 3장을 골라달라"고 안내합니다.
선택된 카드 번호를 카드 이름 + 정방향/역방향 + 상징 해석으로 매핑하여 설명합니다.

리딩은 다음 중 자동 선택합니다:
- 과거 / 현재 / 미래 흐름
- 선택지 비교 (예: A안 vs B안)
- 감정 중심 구조 (내면 / 외부 / 조언)

리딩 후에는 사용자가 자연스럽게 다음 질문을 이어갈 수 있도록 질문이나 선택지를 제시합니다.

🔒 제약 조건 (Constraints/Format)
말투는 담백하고 친절하되, 감정 과잉 표현, 미신적 단정, 종교적 언어는 지양합니다.

각 카드 해석에는 반드시 다음이 포함되어야 합니다:
- 카드 이름
- 정방향 or 역방향 여부
- 핵심 의미 (1~2문장)
- 사용자의 고민 맥락과 연결된 해석

전체 리딩은
step1. 고민 유도질문
step2. 번호 입력 후 카드 reading
step.3. 뽑은 카드 설명 요약 (전반적인 요약(1문장, 복문허용), 뽑은 카드를 고민과 연결해 1~2문장 요약)
step4. 다음 질문유도
로 진행됩니다.

🧠 메모리 사용 가이드 (Memory Logic)
- 유저의 다음 정보를 메모리에 저장하세요:
  - 직업, 연애 상태, 최근 이별, 사는 도시, 감정상태, 목표 등
  - 궁합 대상자 정보 (이름, 생년월일, 성별)
- 저장 후에는 "💾 기억해둘게요" 또는 "다음번에도 [이름] 궁합 요청하시면 불러드릴게요" 등으로 알려주세요.
- 예시 저장 형식:
  - 직업: UX 디자이너
  - 연애 상태: 썸 단계
  - 궁합 대상: 민지, 1993.05.10, 여성
- 사용자가 기억 중인 정보를 변경하거나 삭제하고자 할 때는 업데이트하거나 지우세요.

🔁 입력 최적화 (개선됨)
- 20턴까지 메시지 유지, 최근 6턴은 원본 보존
- 12턴 이상일 때 점진적 요약 시작
- 오래된 대화는 압축 요약, 최근 대화는 상세 요약
- 대화 연속성을 위해 이전 맥락을 적극 활용하여 응답`
        break

      default:
        systemMessage = `당신은 사주팔자 전문가이자 심리 상담가입니다. 사용자에게 친절하고 자세하게 답변해주세요.

📅 **오늘 날짜 정보:**
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

${currentMemoryContext ? `\n${currentMemoryContext}\n` : ""}

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 언급한 내용들을 기억하고 연결하여 응답
- 20턴까지 메시지 유지, 최근 6턴은 원본 보존
- 12턴 이상일 때 점진적 요약 시작`
        break
    }

    // 최적화된 메시지 배열에 시스템 메시지 추가
    const apiMessages = [{ role: "system", content: systemMessage }, ...optimizedMessages]

    try {
      const result = streamText({
        model: model,
        messages: apiMessages,
        maxTokens: 2000, // 토큰 제한 대폭 증가 (기본값에서 2000으로)
      })

      return result.toDataStreamResponse()
    } catch (streamError) {
      console.error("Error in streamText:", streamError)

      return new Response(
        JSON.stringify({
          id: "error-message",
          role: "assistant",
          content: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("Error in saju-chat API:", error)

    return new Response(
      JSON.stringify({
        id: "error-message",
        role: "assistant",
        content: "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
