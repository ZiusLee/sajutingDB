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

// 🚀 로그 레벨 설정 - production에서도 메모리 로그 확인 가능
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === "development" ? "DEBUG" : "INFO")
const shouldLog = (level: string) => {
  if (LOG_LEVEL === "ERROR") return level === "ERROR"
  if (LOG_LEVEL === "INFO") return ["ERROR", "INFO"].includes(level)
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
    console.log("🧠 Smart memory disabled or no user ID", { ENABLE_SMART_MEMORY, userId: !!userId })
    return ""
  }

  try {
    console.log("🧠 [INFO] Getting memory context for user:", userId)
    const memoryContext = await smartMemoryService.getRelevantMemories(userId, userMessage)

    console.log("🧠 [INFO] Memory context retrieved:", {
      hasContext: !!memoryContext,
      contextLength: memoryContext.length,
      preview: memoryContext.substring(0, 100),
    })

    return memoryContext
  } catch (error) {
    console.error("🧠 [ERROR] Memory context generation failed:", error)
    return ""
  }
}

// 🚀 비동기 메모리 처리 함수
async function processMemoryAsync(
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantResponse: string,
  existingContext?: string,
) {
  if (!ENABLE_SMART_MEMORY || !userId) {
    console.log("🧠 [INFO] Smart memory disabled or no user ID - skipping memory processing", {
      ENABLE_SMART_MEMORY,
      userId: !!userId,
    })
    return
  }

  console.log("🧠 [INFO] Starting async memory processing...", {
    userId,
    sessionId,
    userMessageLength: userMessage.length,
    assistantResponseLength: assistantResponse.length,
  })

  // 비동기로 실행하여 응답 속도에 영향 없음
  setTimeout(async () => {
    try {
      console.log("🧠 [INFO] Processing memory for user:", userId)
      const result = await smartMemoryService.processConversation(userId, sessionId, userMessage, assistantResponse)

      console.log("🧠 [INFO] Memory processing result:", {
        shouldSave: result?.shouldSave,
        memoriesCount: result?.memories?.length || 0,
        reasoning: result?.reasoning,
      })

      if (result && result.shouldSave) {
        console.log(`✅ [INFO] Memory processing completed: ${result.memories.length} memories processed`)
        if (result.savedMemories) {
          console.log(
            "💾 [INFO] Saved memories details:",
            result.savedMemories.map((m) => ({
              type: m.type,
              content: m.content?.substring(0, 50),
              action: m.action,
            })),
          )
        }
      } else {
        console.log("ℹ️ [INFO] No memorable information found in this conversation")
      }
    } catch (error) {
      console.error("🧠 [ERROR] Async memory processing failed:", error)
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

    console.log("🚀 [INFO] Saju Chat API called", {
      userId: userId || "no-user",
      roomType,
      enableSmartMemory: ENABLE_SMART_MEMORY,
      messageCount: messages?.length || 0,
    })

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
        const partnerMatch = msg.content.match(/🔮 \*\*상대방 사주 정보[\s\S]*?(?=\n\n|\n|$)/)
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
        maxTokens: 4096,
        topP: 1.0,
      })

      // 🚀 스트리밍 응답과 함께 메모리 처리
      result.text
        .then((completeText) => {
          console.log("🧠 [INFO] Starting memory processing with complete response", {
            userId: userId || "no-user",
            chatRoomId: chatRoomId || "unknown",
            responseLength: completeText.length,
          })
          processMemoryAsync(userId, chatRoomId || "unknown", userMessage, completeText, memoryContext)
        })
        .catch((error) => {
          console.error("🧠 [ERROR] Failed to get complete text for memory processing:", error)
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

1. 맥락: 사용자의 감정/상황/문제 유형 및 답변 스타일에 대한 선호를 인지하는 해석 및 질문 설계
사주핑은 사용자의 감정, 현재 상황, 그리고 구체적인 문제 유형을 깊이 이해하고, 이에 맞춰 유연하게 소통합니다.
- 감정 인지 및 자연스러운 공감 표현: 사용자가 표출하는 불안감, 고민, 힘든 마음 등 감정 상태를 민감하게 인지하고, 이에 진심으로 공감하는 표현을 사용합니다. '공감'이라는 단어를 직접 사용하기보다는, 자연스러운 대화 흐름 속에서 사용자의 마음을 헤아리는 멘트를 통해 공감대를 형성합니다.
- 매번 똑같은 공감 멘트 대신, 사용자의 초기 발화나 이전 대화를 기반으로 다양한 형태의 공감 표현을 시도하세요. 짧고 간결하게, 때로는 좀 더 서정적으로, 또는 현실적인 비유를 들어 공감할 수 있습니다.

- 상황 및 문제 유형 반영 해석: 사주 풀이가 사용자의 **현재 상황과 구체적인 문제 유형(예: 대인 관계 갈등, 직업적 불안, 미래에 대한 막연한 두려움 등)**에 직접적으로 연결될 수 있도록 맥락을 고려하여 해석을 설계합니다. 사주적 특성이 현재의 불안이나 특정 문제에 어떻게 기여하는지 설명함으로써, 사용자가 자신의 상황을 더 잘 이해하도록 돕습니다.
- 답변: 유연한 구조와 흐름 (질문 유형별 맞춤 조언 및 다양한 표현 방식)
모든 답변
