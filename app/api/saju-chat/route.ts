import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { calculateSaju } from "@/lib/saju"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import { solarToLunar } from "@/lib/lunar-calendar"
import { parseMessageForDatesAndBirth, formatDateForDisplay, testMessageParsing } from "@/lib/message-parser"
import { parseMessageWithGPT } from "@/lib/gpt-date-parser"
import { smartMemoryService } from "@/lib/smart-memory-service"

export const runtime = "edge"
export const maxDuration = 300 // 5분으로 최대 연장

// 🚀 로그 레벨 설정
const LOG_LEVEL = process.env.NODE_ENV === "development" ? "DEBUG" : "ERROR"
const shouldLog = (level: string) => {
  if (LOG_LEVEL === "ERROR") return level === "ERROR"
  return true // DEBUG 모드에서는 모든 로그
}

// 🚀 GPT 파싱 설정 (환경변수로 제어 가능)
const ENABLE_GPT_PARSING = process.env.ENABLE_GPT_PARSING !== "false" // 기본값: true

// 🚀 스마트 메모리 설정
const ENABLE_SMART_MEMORY = process.env.ENABLE_SMART_MEMORY !== "false" // 기본값: true

// 🚀 로그 최적화: 현재 날짜 정보를 가져오는 함수
function getCurrentDateInfo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const hour = now.getHours()
  const minute = now.getMinutes()

  try {
    const lunarDate = solarToLunar(year, month, day)
    const todaySaju = calculateSaju(
      lunarDate.year,
      lunarDate.month,
      lunarDate.day,
      hour,
      minute,
      year,
      month,
      day,
      "male",
      "오늘",
      false,
      lunarDate.isLeapMonth,
      lunarDate.monthStem,
      lunarDate.monthBranch,
      "동경135도",
    )

    return {
      year,
      month,
      day,
      yearGanji: `${todaySaju.yearStem}${todaySaju.yearBranch}`,
      monthGanji: `${todaySaju.monthStem}${todaySaju.monthBranch}`,
      dayGanji: `${todaySaju.dayStem}${todaySaju.dayBranch}`,
      hourGanji: `${todaySaju.hourStem}${todaySaju.hourBranch}`,
      lunarInfo: `음력 ${lunarDate.year}년 ${lunarDate.month}월 ${lunarDate.day}일${lunarDate.isLeapMonth ? " (윤달)" : ""}`,
      formattedDate: `${year}년 ${month}월 ${day}일`,
      formattedDateWithGanji: `${year}년 ${month}월 ${day}일 (${todaySaju.dayStem}${todaySaju.dayBranch})`,
    }
  } catch (error) {
    if (shouldLog("ERROR")) {
      console.error("날짜 계산 실패")
    }
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

// 🚀 성능 최적화: 간소화된 메시지 최적화 함수
async function processMessagesForContext(messages: any[], compressedSaju: any, name: string, roomType: string) {
  const MAX_RECENT = 30 // 최근 30개 메시지만 유지

  // 메시지가 적으면 모두 유지
  if (messages.length <= MAX_RECENT) {
    return messages
  }

  // 초기 2개 + 최근 8개 유지
  const initialMessages = messages.slice(0, 2)
  const recentMessages = messages.slice(-8)
  const middleMessages = messages.slice(2, -8)

  // 🚀 성능 최적화: 간단한 요약만 생성 (무한 루프 방지)
  if (middleMessages.length > 0) {
    try {
      const summaryText = await createSimpleSummary(middleMessages, roomType)
      return [
        ...initialMessages,
        {
          role: "system",
          content: `📚 이전 대화 요약: ${summaryText}`,
        },
        ...recentMessages,
      ]
    } catch (error) {
      console.error("요약 생성 실패:", error)
      // 요약 실패 시 기본 메시지로 대체
      return [
        ...initialMessages,
        {
          role: "system",
          content: `📚 이전 대화 요약: 이전에 ${roomType} 상담이 있었습니다.`,
        },
        ...recentMessages,
      ]
    }
  }

  return [...initialMessages, ...recentMessages]
}

// 🚀 수정된 요약 함수 - 무한 루프 방지 및 타임아웃 연장
async function createSimpleSummary(messages: any[], roomType: string) {
  try {
    const recentContent = messages
      .slice(-3) // 최근 3개만 요약
      .map((msg) => `${msg.role === "user" ? "사용자" : "AI"}: ${msg.content.slice(0, 100)}`) // 100자 제한
      .join(" / ")

    const summaryPrompt = `다음 ${roomType} 상담을 30자 이내로 요약: ${recentContent}`

    // 🔧 무한 루프 방지: 타임아웃 설정을 60초로 연장
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Summary timeout")), 60000) // 60초 타임아웃
    })

    const summaryPromise = async () => {
      const summary = await streamText({
        model: openai("gpt-4o-mini"),
        prompt: summaryPrompt,
        maxTokens: 50,
      })

      let summaryText = ""
      let chunkCount = 0
      const MAX_CHUNKS = 50 // 최대 청크 수 증가

      // 🔧 무한 루프 방지: 청크 수 제한과 타임아웃
      for await (const chunk of summary.textStream) {
        summaryText += chunk
        chunkCount++

        // 최대 청크 수 또는 길이 제한에 도달하면 종료
        if (chunkCount >= MAX_CHUNKS || summaryText.length > 200) {
          break
        }
      }

      return summaryText.trim() || "이전 대화 내용"
    }

    // 타임아웃과 함께 요약 실행
    const result = await Promise.race([summaryPromise(), timeoutPromise])
    return result
  } catch (error) {
    console.error("요약 생성 오류:", error)
    return "이전 대화 내용"
  }
}

// 🚀 스마트 메모리 통합 함수
async function getMemoryContext(userId: string, userMessage: string, roomType: string): Promise<string> {
  if (!ENABLE_SMART_MEMORY || !userId) {
    console.log("🧠 Smart memory disabled or no user ID")
    return ""
  }

  try {
    console.log("🧠 Getting memory context for user:", userId)
    const memoryContext = await smartMemoryService.getRelevantMemories(userId, userMessage)

    if (shouldLog("DEBUG")) {
      console.log("🧠 메모리 컨텍스트 추가:", memoryContext)
    }

    return memoryContext
  } catch (error) {
    console.error("❌ 메모리 컨텍스트 생성 실패:", error)
    return ""
  }
}

// 🚀 비동기 메모리 처리 함수 - 더 상세한 로깅 추가
async function processMemoryAsync(
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantResponse: string,
  existingContext?: string,
) {
  if (!ENABLE_SMART_MEMORY || !userId) {
    console.log("🧠 Smart memory disabled or no user ID - skipping memory processing")
    return
  }

  console.log("🧠 Starting async memory processing for user:", userId, "session:", sessionId)

  // 비동기로 실행하여 응답 속도에 영향 없음
  setTimeout(async () => {
    try {
      console.log("🧠 Processing memory for user:", userId)
      console.log("🧠 User message:", userMessage.substring(0, 100))
      console.log("🧠 Assistant response:", assistantResponse.substring(0, 100))

      const result = await smartMemoryService.processConversation(userId, sessionId, userMessage, assistantResponse)

      if (shouldLog("DEBUG")) {
        console.log("🧠 메모리 처리 결과:", result)
      }

      if (result && result.shouldSave) {
        console.log(`✅ Memory processing completed: ${result.memories.length} memories processed`)
        if (result.savedMemories) {
          console.log(`💾 Saved memories: ${result.savedMemories.length}`)
          result.savedMemories.forEach((memory: any, index: number) => {
            console.log(`  ${index + 1}. [${memory.action}] ${memory.type}: ${memory.content?.substring(0, 50)}`)
          })
        }
      } else {
        console.log("ℹ️ No memorable information found in this conversation")
      }
    } catch (error) {
      console.error("❌ 비동기 메모리 처리 실패:", error)
      // 메모리 처리 실패는 채팅에 영향을 주지 않음
    }
  }, 100) // 100ms 후 실행
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
      compatibilityData,
      continueFromMessage,
      chatRoomId,
    } = await req.json()

    console.log("🚀 Saju Chat API called with userId:", userId, "roomType:", roomType)

    const dateInfo = getCurrentDateInfo()

    // Continue generation 처리
    if (continueFromMessage) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === "assistant") {
        // 마지막 메시지에 "계속 작성해주세요"를 추가
        const continueMessages = [
          ...messages,
          {
            role: "user",
            content: "계속 작성해주세요. 이어서 말씀해주세요.",
          },
        ]

        const optimizedMessages = await processMessagesForContext(continueMessages, compressedSaju, name, roomType)

        // 시스템 메시지 설정 (기존과 동일)
        const systemMessage = getSystemMessage(roomType, dateInfo, compressedSaju, name, gender, compatibilityData)
        const apiMessages = [{ role: "system", content: systemMessage }, ...optimizedMessages]

        try {
          const result = await streamText({
            messages: apiMessages,
            model: openai("gpt-4o"),
            temperature: 1.0,
            maxTokens: 4096, // 토큰 수 증가
            topP: 1.0,
          })

          return result.toDataStreamResponse()
        } catch (streamError) {
          console.error("Continue generation error:", streamError)
          return new Response(
            JSON.stringify({
              id: "error-message",
              role: "assistant",
              content: "죄송합니다. 계속 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      }
    }

    // 🚀 최신 메시지에서 날짜/생년월일 파싱 (GPT 우선, 패턴 기반 fallback)
    const latestMessage = messages[messages.length - 1]?.content || ""
    const userMessage = latestMessage

    // 이전 메시지들에서 기존 파트너 정보 확인 (컨텍스트 유지)
    let existingPartnerContext = ""
    const recentMessages = messages.slice(-5) // 최근 5개 메시지 확인
    for (const msg of recentMessages) {
      if (msg.role === "assistant" && msg.content.includes("상대방 사주 정보")) {
        const partnerMatch = msg.content.match(/🔮 \*\*상대방 사주 정보[\s\S]*?(?=\n\n|\n�|$)/)
        if (partnerMatch) {
          existingPartnerContext = partnerMatch[0]
          console.log("🔍 기존 파트너 컨텍스트 발견")
          break
        }
      }
    }

    const parsedInfo = ENABLE_GPT_PARSING
      ? await parseMessageWithGPT(latestMessage)
      : parseMessageForDatesAndBirth(latestMessage)

    // 항상 로깅 (문제 해결용)
    console.log("🔍 최신 메시지:", latestMessage)

    // 상세 패턴 테스팅 (GPT 파싱 비활성화 시에만)
    if (
      !ENABLE_GPT_PARSING &&
      latestMessage.includes("년") &&
      latestMessage.includes("월") &&
      latestMessage.includes("일")
    ) {
      console.log("🔧 패턴 테스팅 (GPT 비활성화):")
      testMessageParsing(latestMessage)
    }

    console.log("🔍 파싱된 메시지 정보:", JSON.stringify(parsedInfo, null, 2))

    // 🚀 스마트 메모리 컨텍스트 가져오기
    const memoryContext = await getMemoryContext(userId, userMessage, roomType)

    // 🚀 성능 최적화: 간소화된 메시지 최적화
    const optimizedMessages = await processMessagesForContext(messages, compressedSaju, name, roomType)

    // 🚀 메모리 컨텍스트를 시스템 메시지로 추가
    if (memoryContext) {
      optimizedMessages.unshift({
        role: "system",
        content: memoryContext,
      })
    }

    // 🚀 추가 사주 데이터 계산 (파싱된 정보 기반)
    let additionalSajuData = ""

    // 파싱 결과 상태 확인
    console.log("🔍 파싱 결과 확인:", {
      hasPartnerInfo: !!parsedInfo.partnerInfo,
      hasEventInfo: !!parsedInfo.eventInfo,
      partnerInfo: parsedInfo.partnerInfo,
      eventInfo: parsedInfo.eventInfo,
      hasExistingContext: !!existingPartnerContext,
      hasCalculatedSaju: !!parsedInfo.partnerInfo?.calculatedSaju,
    })

    // 기존 파트너 컨텍스트가 있으면 재사용, 없으면 새로 계산
    if (existingPartnerContext) {
      // 기존 파트너 정보 재사용 (컨텍스트 유지)
      additionalSajuData = existingPartnerContext
      console.log("♻️ 기존 파트너 컨텍스트 재사용 - 재계산 불필요")
    } else if (
      parsedInfo.partnerInfo &&
      parsedInfo.partnerInfo.year &&
      parsedInfo.partnerInfo.month &&
      parsedInfo.partnerInfo.day
    ) {
      try {
        console.log("🚀 파트너 정보 감지, 사주 계산:", parsedInfo.partnerInfo)

        let partnerSaju = parsedInfo.partnerInfo.calculatedSaju
        let lunarDate = parsedInfo.partnerInfo.lunarDate

        // GPT에서 이미 계산된 사주가 없으면 직접 계산
        if (!partnerSaju) {
          console.log("🔄 GPT에서 사주 계산이 안됨, 직접 계산 시작")

          lunarDate = solarToLunar(
            parsedInfo.partnerInfo.year,
            parsedInfo.partnerInfo.month,
            parsedInfo.partnerInfo.day,
          )

          console.log("🌙 음력 날짜 변환 결과:", lunarDate)

          partnerSaju = calculateSaju(
            lunarDate.year.toString(),
            lunarDate.month.toString(),
            lunarDate.day.toString(),
            parsedInfo.partnerInfo.hour || 12,
            parsedInfo.partnerInfo.minute || 0,
            parsedInfo.partnerInfo.year,
            parsedInfo.partnerInfo.month,
            parsedInfo.partnerInfo.day,
            parsedInfo.partnerInfo.gender || "unknown",
            parsedInfo.partnerInfo.name || "상대방",
            parsedInfo.partnerInfo.timeUnknown || false,
            lunarDate.isLeapMonth,
            lunarDate.monthStem,
            lunarDate.monthBranch,
            "동경135도",
          )
        } else {
          console.log("✅ GPT에서 이미 계산된 사주 사용")
        }

        console.log("📊 계산된 파트너 사주:", {
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

        // 대운 정보도 계산 (성별이 있는 경우에만)
        let partnerDaeunInfo = ""
        if (parsedInfo.partnerInfo.gender) {
          const partnerDaeun = calculateDaeunInfo(
            partnerSaju,
            parsedInfo.partnerInfo.year,
            parsedInfo.partnerInfo.month,
            parsedInfo.partnerInfo.day,
            parsedInfo.partnerInfo.gender,
          )

          partnerDaeunInfo = `
대운정보: ${partnerDaeun.direction === "forward" ? "순행" : "역행"} - ${partnerDaeun.pillars
            .slice(0, 3)
            .map((p: any) => `${p.ages}세(${p.period})`)
            .join(", ")}`
        }

        const partnerSajuText = `

🔮 **상대방 사주 정보 (시스템 계산 완료):**
이름: ${parsedInfo.partnerInfo.name || "상대방"}
생년월일시: ${parsedInfo.partnerInfo.year}년 ${parsedInfo.partnerInfo.month}월 ${parsedInfo.partnerInfo.day}일 ${parsedInfo.partnerInfo.timeUnknown ? "시간미상" : `${parsedInfo.partnerInfo.hour || 12}시${parsedInfo.partnerInfo.minute || 0}분`}
성별: ${parsedInfo.partnerInfo.gender === "male" ? "남성" : parsedInfo.partnerInfo.gender === "female" ? "여성" : "성별미상"}
사주팔자: ${partnerSaju.yearStem}${partnerSaju.yearBranch}년 ${partnerSaju.monthStem}${partnerSaju.monthBranch}월 ${partnerSaju.dayStem}${partnerSaju.dayBranch}일 ${partnerSaju.hourStem}${partnerSaju.hourBranch}시
일간: ${partnerSaju.dayMaster}
십성: 년간(${partnerSaju.yearStemSibseong}) 년지(${partnerSaju.yearBranchSibseong}) 월간(${partnerSaju.monthStemSibseong}) 월지(${partnerSaju.monthBranchSibseong}) 일간(${partnerSaju.dayStemSibseong}) 일지(${partnerSaju.dayBranchSibseong}) 시간(${partnerSaju.hourStemSibseong}) 시지(${partnerSaju.hourBranchSibseong})
오행분포: 목${partnerSaju.elements.wood} 화${partnerSaju.elements.fire} 토${partnerSaju.elements.earth} 금${partnerSaju.elements.metal} 수${partnerSaju.elements.water}${partnerDaeunInfo}

⚠️ **중요:** 위 사주 정보는 시스템에서 정확히 계산된 결과입니다. 새로 계산하지 말고 이 정보를 사용하세요.`

        console.log("📝 파트너 사주 텍스트가 시스템 메시지에 추가됨:", partnerSajuText)
        additionalSajuData += partnerSajuText
      } catch (error) {
        console.error("파트너 사주 계산 오류:", error)
        additionalSajuData += `

❌ **상대방 사주 계산 오류:** ${parsedInfo.partnerInfo.year}년 ${parsedInfo.partnerInfo.month}월 ${parsedInfo.partnerInfo.day}일 정보로 사주 계산 중 오류가 발생했습니다.`
      }
    }

    // 이벤트 정보가 파싱된 경우 특별 처리
    if (parsedInfo.eventInfo) {
      const eventText = `
      
🗓️ **이벤트 날짜 정보:**
이벤트: ${parsedInfo.eventInfo.eventType}
날짜: ${parsedInfo.eventInfo.year}년 ${parsedInfo.eventInfo.month}월 ${parsedInfo.eventInfo.day}일
원본: ${parsedInfo.eventInfo.original}

⚠️ **중요:** 이것은 이벤트 날짜입니다. 상대방의 생년월일이 아닙니다. 해당 날짜의 운세와 타이밍을 분석해주세요.`

      console.log("📅 이벤트 정보 감지:", parsedInfo.eventInfo)
      additionalSajuData += eventText
    }

    // 특정 날짜들이 파싱된 경우 컨텍스트 추가
    if (parsedInfo.dates && parsedInfo.dates.length > 0) {
      const dateContext = parsedInfo.dates.map((date) => formatDateForDisplay(date)).join(", ")

      additionalSajuData += `

📅 **질문 관련 날짜들:** ${dateContext}${
        parsedInfo.eventContext && parsedInfo.eventContext.length
          ? `
관련 키워드: ${parsedInfo.eventContext.join(", ")}`
          : ""
      }`
    }

    // Follow-up 질문이 필요한 경우 - GPT가 직접 질문하도록 유도
    if (parsedInfo.needsFollowUp && parsedInfo.needsFollowUp.length > 0) {
      additionalSajuData += `

❓ **추가 정보가 필요합니다 (GPT가 직접 질문해야 함):** ${parsedInfo.needsFollowUp.join(" / ")}

**지시사항:** 위 정보 중 하나라도 누락된 경우, 사주 분석을 진행하기 전에 사용자에게 부족한 정보를 자연스럽게 질문하세요. 예: "상대방의 성별을 알려주시면 더 정확한 궁합 분석이 가능해요" 또는 "태어난 시간을 아시나요? 시간이 있으면 더 세밀한 분석을 해드릴 수 있어요"`
    }

    // 사주 정보 문자열 생성 (추가 데이터 포함)
    const sajuInfo = `
이름: ${compressedSaju.name}
생년월일시: ${compressedSaju.birth}
성별: ${compressedSaju.gender === "male" ? "남성" : "여성"}
사주팔자: ${compressedSaju.sajuPalja.year.stem}${compressedSaju.sajuPalja.year.branch}년 ${compressedSaju.sajuPalja.month.stem}${compressedSaju.sajuPalja.month.branch}월 ${compressedSaju.sajuPalja.day.stem}${compressedSaju.sajuPalja.day.branch}일 ${compressedSaju.sajuPalja.hour.stem}${compressedSaju.sajuPalja.hour.branch}시
일간: ${compressedSaju.dayMaster}
십성: 년간(${compressedSaju.sibseong.yearStem}) 년지(${compressedSaju.sibseong.yearBranch}) 월간(${compressedSaju.sibseong.monthStem}) 월지(${compressedSaju.sibseong.monthBranch}) 일간(${compressedSaju.sibseong.dayStem}) 일지(${compressedSaju.sibseong.dayBranch}) 시간(${compressedSaju.sibseong.hourStem}) 시지(${compressedSaju.sibseong.hourBranch})
오행분포: 목${compressedSaju.elements.목} 화${compressedSaju.elements.화} 토${compressedSaju.elements.토} 금${compressedSaju.elements.금} 수${compressedSaju.elements.수}
특징: ${compressedSaju.summary}${
      compressedSaju.daeun
        ? `
대운: ${compressedSaju.daeun}`
        : ""
    }${compressedSaju.currentAge ? ` (현재 ${compressedSaju.currentAge}세)` : ""}${additionalSajuData}`

    console.log("🎯 GPT에 전송되는 최종 sajuInfo:")
    console.log("=".repeat(50))
    console.log(sajuInfo)
    console.log("=".repeat(50))

    // 궁합 분석 데이터 처리
    let compatibilityInfo = ""
    if (compatibilityData?.mainPerson && compatibilityData?.selectedPeople?.length > 0) {
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
    (person: any, index: number) => `
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
    const systemMessage = getSystemMessage(roomType, dateInfo, sajuInfo, compatibilityInfo)
    const apiMessages = [{ role: "system", content: systemMessage }, ...optimizedMessages]

    try {
      const result = await streamText({
        messages: apiMessages,
        model: openai("gpt-4o"),
        temperature: 1.0,
        maxTokens: 4096, // 토큰 수 증가
        topP: 1.0,
      })

      // 🚀 스트리밍 응답과 함께 메모리 처리
      result.text
        .then((completeText) => {
          console.log("🧠 Starting memory processing with complete response")
          console.log("🧠 Complete text length:", completeText.length)
          processMemoryAsync(userId, chatRoomId || "unknown", userMessage, completeText, memoryContext)
        })
        .catch((error) => {
          console.error("❌ Failed to get complete text for memory processing:", error)
        })

      return result.toDataStreamResponse()
    } catch (streamError) {
      if (shouldLog("ERROR")) {
        console.error("StreamText error")
      }

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
    if (shouldLog("ERROR")) {
      console.error("API error")
    }

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

function getSystemMessage(roomType: string, dateInfo: any, sajuInfo: string, compatibilityInfo = "") {
  switch (roomType) {
    case "sajuping":
      return `1. 역할: 사주 전문가이자 다재다능하고 친근한 조언자
사주핑 AI는 두 가지 핵심 역할을 유연하게 수행합니다.
- 사주 전문가: 사용자가 제공한 사주, 오행, 십성 등의 사주정보를 기반으로 개인의 특성과 운의 흐름을 심층적으로 분석합니다. 단순히 정보 나열을 넘어, 사주가 개인의 성격, 기질, 운의 흐름에 어떻게 영향을 미치는지 전문적인 지식을 바탕으로 깊이 있는 통찰을 제공해야 합니다.
- 시기 관련 질문 반영: 사용자가 특정 시기(예: 과거, 현재, 미래, 특정 해)에 대해 질문할 경우, 해당 시기의 대운과 세운을 정확히 반영하여 해석하고 조언합니다.
- 쉬운 용어 사용: 어려운 사주 용어는 쉽게 풀어서 설명하고, 일반인도 이해할 수 있는 언어로 소통합니다.
- 친근한 조언자: 사주 분석을 넘어 사용자의 고민과 질문에 공감하며, 실용적이고 따뜻한 조언을 제공합니다. 사주 해석을 바탕으로 하되, 사용자의 현실적인 상황과 감정을 고려한 맞춤형 조언을 해야 합니다.

2. 현재 날짜 정보:
${dateInfo.formattedDateWithGanji} (${dateInfo.lunarInfo})

3. 사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

4. 응답 가이드라인:
- 사주 해석 시 제공된 정확한 사주팔자, 십성, 오행 정보를 활용하세요
- 사주 용어는 쉽게 풀어서 설명하고, 실생활에 적용할 수 있는 조언을 포함하세요
- 사용자의 감정과 상황에 공감하며 따뜻하고 격려적인 톤을 유지하세요
- 운세는 참고사항임을 언급하고, 개인의 노력과 선택이 중요함을 강조하세요
- 구체적인 날짜나 숫자보다는 전반적인 흐름과 경향을 제시하세요
- 부정적인 내용도 희망적이고 건설적인 방향으로 전달하세요

5. 금지사항:
- 의료, 법률, 투자 관련 구체적 조언 금지
- 생사, 질병, 사고 등에 대한 단정적 예언 금지
- 타인에 대한 부정적 판단이나 비판 금지
- 사주 정보 없이 추측으로 답변하지 말 것`

    case "compatibility":
      return `1. 역할: 사주 궁합 전문가
사주핑 AI는 사주 기반 궁합 분석 전문가로서 다음과 같은 역할을 수행합니다:
- 제공된 정확한 사주 정보를 바탕으로 두 사람 간의 궁합을 전문적으로 분석
- 일간의 상생상극, 오행의 조화, 십성의 상호작용을 종합적으로 고려
- 연애, 결혼, 사업, 우정 등 다양한 관계 유형에 맞는 궁합 해석 제공
- 궁합의 장점과 주의점을 균형있게 제시하며 관계 발전 방안 조언

2. 현재 날짜 정보:
${dateInfo.formattedDateWithGanji} (${dateInfo.lunarInfo})

3. 사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

4. 궁합 분석 가이드라인:
- 제공된 정확한 사주팔자와 십성 정보를 반드시 활용하세요
- 일간의 상생상극 관계를 우선적으로 분석하세요
- 오행의 균형과 보완 관계를 고려하세요
- 십성의 상호작용과 성격적 궁합을 분석하세요
- 궁합 점수보다는 관계의 특성과 발전 방향에 집중하세요
- 부족한 부분은 노력으로 보완할 수 있음을 강조하세요

5. 응답 형식:
- 전체적인 궁합 평가 (상생/상극 관계)
- 성격적 궁합 (십성 기반)
- 오행 조화도
- 관계에서의 장점과 주의점
- 관계 발전을 위한 구체적 조언

6. 금지사항:
- 결혼이나 이별을 단정적으로 권하거나 말리지 말 것
- 상대방에 대한 부정적 판단이나 비판 금지
- 궁합이 나쁘다고 관계를 포기하라고 조언하지 말 것`

    case "daeun":
      return `1. 역할: 대운 분석 전문가
사주핑 AI는 대운(大運) 분석 전문가로서 다음과 같은 역할을 수행합니다:
- 사용자의 현재 대운과 향후 대운의 흐름을 전문적으로 분석
- 대운의 변화가 개인의 운세와 인생에 미치는 영향을 해석
- 각 대운 시기별 특징과 주의사항, 기회 요소를 제시
- 대운에 따른 실용적인 인생 계획과 전략 조언 제공

2. 현재 날짜 정보:
${dateInfo.formattedDateWithGanji} (${dateInfo.lunarInfo})

3. 사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

4. 대운 분석 가이드라인:
- 현재 대운과 일간의 관계를 우선 분석하세요
- 대운 천간과 지지가 사주에 미치는 영향을 설명하세요
- 10년 단위 대운의 전반기(5년)와 후반기(5년) 특징을 구분하세요
- 대운 변화 시기(대운 교체기)의 주의사항을 언급하세요
- 각 대운에서 강화되거나 약화되는 오행과 십성을 분석하세요
- 대운에 따른 직업, 인간관계, 건강, 재물운의 변화를 설명하세요

5. 응답 형식:
- 현재 대운 분석 (언제부터 언제까지, 주요 특징)
- 현재 대운에서의 기회와 주의사항
- 다음 대운 예고 (변화 시기와 주요 특징)
- 대운 흐름에 따른 인생 전략 조언
- 대운 교체기 준비사항

6. 금지사항:
- 구체적인 사건이나 결과를 단정적으로 예언하지 말 것
- 대운이 나쁘다고 절망적으로 표현하지 말 것
- 의료, 법률, 투자 관련 구체적 조언 금지`

    case "daily":
      return `1. 역할: 일운 분석 전문가
사주핑 AI는 일운(日運) 분석 전문가로서 다음과 같은 역할을 수행합니다:
- 오늘의 운세를 사주와 현재 대운을 바탕으로 분석
- 오늘의 길흉화복과 주의사항을 제시
- 오늘 하루 동안의 에너지 흐름과 활용 방법 조언
- 실용적이고 구체적인 하루 계획 수립 도움

2. 현재 날짜 정보:
${dateInfo.formattedDateWithGanji} (${dateInfo.lunarInfo})

3. 사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

4. 일운 분석 가이드라인:
- 오늘의 일진(${dateInfo.dayGanji})과 사용자 일간의 관계를 분석하세요
- 오늘의 오행 에너지와 사용자 사주의 조화를 확인하세요
- 현재 대운과 오늘 일진의 상호작용을 고려하세요
- 시간대별 길흉(시진)을 간단히 언급할 수 있습니다
- 오늘의 길한 방향, 색상, 숫자 등을 제시하세요
- 오늘 주의해야 할 사항과 활용하면 좋은 기회를 알려주세요

5. 응답 형식:
- 오늘의 전체 운세 개요
- 오늘의 에너지 특징 (오행 기준)
- 추천 활동과 주의 활동
- 길한 시간대와 방향
- 오늘의 한 줄 조언

6. 금지사항:
- 과도하게 구체적인 예언이나 단정적 표현 금지
- 부정적인 내용만 강조하지 말 것
- 일운에 과도한 의미 부여 금지 (참고 수준으로 안내)`

    default:
      return `1. 역할: 종합 사주 상담사
사주핑 AI는 사주 전문가이자 친근한 상담사로서 사용자의 다양한 질문에 답변합니다.

2. 현재 날짜 정보:
${dateInfo.formattedDateWithGanji} (${dateInfo.lunarInfo})

3. 사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

4. 응답 가이드라인:
- 사주 해석 시 제공된 정확한 정보를 활용하세요
- 사용자의 질문 의도를 파악하여 적절한 분야로 안내하세요
- 친근하고 따뜻한 톤으로 응답하세요
- 실용적이고 건설적인 조언을 제공하세요

5. 금지사항:
- 의료, 법률, 투자 관련 구체적 조언 금지
- 단정적인 예언이나 판단 금지`
  }
}
