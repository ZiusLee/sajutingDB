import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { calculateSaju } from "@/lib/saju"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import { solarToLunar } from "@/lib/lunar-calendar"
import { parseMessageForDatesAndBirth, formatDateForDisplay, testMessageParsing } from "@/lib/message-parser"
import { parseMessageWithGPT } from "@/lib/gpt-date-parser"
import { smartMemoryServiceV2 } from "@/lib/smart-memory-service-v2"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getCachedTodaySaju, setCachedTodaySaju } from "@/lib/saju-cache"

export const runtime = "nodejs"
export const maxDuration = 60

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
  // 캐시에서 먼저 확인
  const cached = getCachedTodaySaju()
  if (cached) {
    console.log("🚀 오늘의 사주 캐시에서 로드")
    return cached.dateInfo
  }

  console.log("🔄 오늘의 사주 새로 계산")
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

    const dateInfo = {
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

    // 계산 결과 캐싱
    setCachedTodaySaju(todaySaju, dateInfo)
    return dateInfo
  } catch (error) {
    if (shouldLog("ERROR")) {
      console.error("날짜 계산 실패:", error)
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
  const MAX_RECENT = 20 // 최근 20개 메시지만 유지

  // 메시지가 적으면 모두 유지
  if (messages.length <= MAX_RECENT) {
    return messages
  }

  // 초기 2개 + 최근 8개 유지
  const initialMessages = messages.slice(0, 2)
  const recentMessages = messages.slice(-8)
  const middleMessages = messages.slice(2, -8)

  // 🚀 성능 최적화: 간단한 요약만 생성
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

    return `${roomType} 상담 진행 중: ${recentContent.slice(0, 50)}...`
  } catch (error) {
    console.error("요약 생성 오류:", error)
    return "이전 대화 내용"
  }
}

// 🚀 스마트 메모리 통합 함수
async function getMemoryContext(userId: string, userMessage: string, roomType: string): Promise<string> {
  if (!ENABLE_SMART_MEMORY) {
    console.log("🧠 Smart memory is disabled by environment variable.")
    return ""
  }
  if (!userId) {
    console.log("🧠 No user ID provided, skipping memory context.")
    return ""
  }

  try {
    console.log("🧠 Getting memory context for user:", userId)
    const memoryContext = await smartMemoryServiceV2.getRelevantMemories(userId, userMessage)

    if (shouldLog("DEBUG")) {
      console.log("🧠 메모리 컨텍스트 추가:", memoryContext)
    }

    return memoryContext
  } catch (error) {
    console.error("메모리 컨텍스트 생성 실패:", error)
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
  console.log("🧠 [DEBUG] ENABLE_SMART_MEMORY:", ENABLE_SMART_MEMORY)
  console.log("🧠 [DEBUG] Environment variable:", process.env.ENABLE_SMART_MEMORY)
  console.log("🧠 [DEBUG] Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "✅ SET" : "❌ MISSING",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ SET" : "❌ MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ SET" : "❌ MISSING",
  })

  if (!ENABLE_SMART_MEMORY) {
    console.log("🧠 Smart memory is disabled, skipping async memory processing.")
    return
  }
  if (!userId) {
    console.log("🧠 No user ID provided, skipping async memory processing.")
    return
  }

  console.log("🧠 Starting async memory processing...")

  // 🔥 즉시 실행으로 변경 (Production 환경 호환성)
  Promise.resolve().then(async () => {
    console.log("🧠 [DEBUG] Promise.resolve started")
    try {
      await processMemoryImmediate(userId, sessionId, userMessage, assistantResponse)
    } catch (error) {
      console.error("🚨 [DEBUG] Promise processing failed:", error)
      console.error("🚨 [DEBUG] Error stack:", (error as Error)?.stack)
    }
  })
}

// 🔥 별도 함수로 분리하여 디버깅 개선
async function processMemoryImmediate(
  userId: string,
  sessionId: string,
  userMessage: string,
  assistantResponse: string,
) {
  console.log("🧠 [DEBUG] processMemoryImmediate started")
  console.log("🧠 [DEBUG] Processing memory for user:", userId)
  console.log("🧠 [DEBUG] Session ID:", sessionId)
  console.log("🧠 [DEBUG] User message preview:", userMessage.slice(0, 100))
  console.log("🧠 [DEBUG] Assistant response preview:", assistantResponse.slice(0, 100))

  const result = await smartMemoryServiceV2.processConversation(userId, sessionId, userMessage, assistantResponse)

  console.log("🧠 [DEBUG] Raw result:", JSON.stringify(result, null, 2))

  if (result && result.shouldSave) {
    console.log(
      `✅ [DEBUG] Memory processing completed: ${result.memories?.length || 0} memories extracted, ${result.savedMemories?.length || 0} saved`,
    )
    if (result.savedMemories?.length > 0) {
      console.log(
        "✅ [DEBUG] Saved memories:",
        result.savedMemories.map((m: any) => ({ id: m.id, content: m.content?.slice(0, 50) })),
      )
    }
  } else {
    console.log("ℹ️ [DEBUG] No memorable information found:", result?.reasoning || "No reason provided")
  }
}

async function getMemoryContextFromPreloaded(userContext: any, userMessage: string, roomType: string): Promise<string> {
  if (!userContext || !userContext.length) {
    console.log("🧠 No preloaded context available")
    return ""
  }

  try {
    console.log("🧠 Using preloaded context:", userContext.length, "context groups")

    // 메시지 내용과 관련성이 높은 컨텍스트 타입 식별
    const relevantTypes = identifyRelevantTypes(userMessage, roomType)

    // 관련 컨텍스트 필터링 및 포맷팅
    const relevantContexts = userContext
      .filter((group: any) => relevantTypes.includes(group.type))
      .flatMap((group: any) => group.items.slice(0, 3)) // 각 타입별로 최대 3개
      .sort((a: any, b: any) => (b.quality_score || 0) - (a.quality_score || 0))
      .slice(0, 10) // 전체 최대 10개

    if (relevantContexts.length === 0) {
      // 관련 타입이 없으면 고품질 컨텍스트 사용
      const highQualityContexts = userContext
        .flatMap((group: any) => group.items.slice(0, 2))
        .sort((a: any, b: any) => (b.quality_score || 0) - (a.quality_score || 0))
        .slice(0, 5)

      return formatContextForPrompt(highQualityContexts)
    }

    return formatContextForPrompt(relevantContexts)
  } catch (error) {
    console.error("Error processing preloaded context:", error)
    return ""
  }
}

function identifyRelevantTypes(userMessage: string, roomType: string): string[] {
  const message = userMessage.toLowerCase()
  const relevantTypes: string[] = []

  // 키워드 기반 타입 매칭
  if (message.includes("직업") || message.includes("일") || message.includes("회사")) {
    relevantTypes.push("identity", "goal")
  }
  if (message.includes("관계") || message.includes("사람") || message.includes("친구") || message.includes("가족")) {
    relevantTypes.push("relationship")
  }
  if (message.includes("감정") || message.includes("기분") || message.includes("스트레스")) {
    relevantTypes.push("emotion")
  }
  if (message.includes("취미") || message.includes("좋아") || message.includes("관심")) {
    relevantTypes.push("interest", "preference")
  }
  if (message.includes("목표") || message.includes("계획") || message.includes("미래")) {
    relevantTypes.push("goal")
  }
  if (message.includes("경험") || message.includes("과거") || message.includes("했었")) {
    relevantTypes.push("experience")
  }

  // 기본 타입들 (항상 포함)
  relevantTypes.push("identity", "situation")

  return [...new Set(relevantTypes)] // 중복 제거
}

function formatContextForPrompt(contexts: any[]): string {
  if (!contexts || contexts.length === 0) return ""

  const formatted = contexts
    .map((ctx: any) => {
      const typeLabel = getTypeLabel(ctx.type)
      return `${typeLabel}: ${ctx.content}`
    })
    .join("\n")

  return `\n\n📚 사용자 정보:\n${formatted}\n`
}

function getTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    identity: "신원/직업",
    goal: "목표/계획",
    emotion: "감정 패턴",
    relationship: "인간관계",
    interest: "관심사",
    preference: "선호도",
    situation: "현재 상황",
    experience: "과거 경험",
    belief: "신념/가치관",
    skill: "능력/기술",
  }
  return labels[type] || type
}

export async function POST(req: Request) {
  console.log("==================================================")
  console.log("🚀🚀🚀 SAJU CHAT API CALLED 🚀🚀🚀")
  console.log("Time:", new Date().toISOString())
  console.log("User-Agent:", req.headers.get("user-agent"))
  console.log("==================================================")

  try {
    const body = await req.json()
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
      userContext, // 추가된 필드
    } = body

    console.log("🚀 Saju Chat API called with:", {
      userId: userId || "❌ MISSING",
      roomType,
      messagesCount: messages?.length,
      hasCompressedSaju: !!compressedSaju,
      name,
      gender,
    })

    // 🚀 브라우저별 차이 디버깅
    console.log("🔍 [DEBUG] Request details for browser compatibility:", {
      userAgent: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
      origin: req.headers.get("origin"),
      hasUserId: !!userId,
      userIdType: typeof userId,
      bodyKeys: Object.keys(body),
    })

    if (userId) {
      try {
        const supabase = createRouteHandlerClient({ cookies })

        // 사용자 인증 확인
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (!authError && user && user.id === userId) {
          console.log("💰 질문권 차감 시도 중...")

          // 현재 코인 정보 조회 (구독 질문권, 보너스 질문권 분리)
          const { data: coinData, error: selectError } = await supabase
            .from("user_coins")
            .select("subscription_coins, bonus_coins, subscription_plan")
            .eq("user_id", userId)
            .single()

          if (selectError && selectError.code === "PGRST116") {
            // 사용자 코인 데이터가 없으면 새로 생성 (3 코인으로 시작)
            console.log("💰 새 사용자 코인 계정 생성")
            await supabase.from("user_coins").insert({
              user_id: userId,
              subscription_coins: 3, // Start with 3 coins for free tier
              bonus_coins: 0,
              subscription_plan: "free", // Set default plan to free
            })
          } else if (!selectError && coinData) {
            const subscriptionCoins = coinData.subscription_coins || 0
            const bonusCoins = coinData.bonus_coins || 0
            const totalCoins = subscriptionCoins + bonusCoins

            console.log(`💰 현재 질문권 상태: 구독 ${subscriptionCoins}개, 보너스 ${bonusCoins}개 (총 ${totalCoins}개)`)

            let updateData = {}

            if (subscriptionCoins > 0) {
              // 구독 질문권이 있으면 구독 질문권부터 차감
              updateData = { subscription_coins: subscriptionCoins - 1 }
              console.log(`💰 구독 질문권 차감: ${subscriptionCoins} → ${subscriptionCoins - 1}`)
            } else if (bonusCoins > 0) {
              // 구독 질문권이 없으면 보너스 질문권 차감
              updateData = { bonus_coins: bonusCoins - 1 }
              console.log(`💰 보너스 질문권 차감: ${bonusCoins} → ${bonusCoins - 1}`)
            } else {
              // 질문권이 0이어도 보너스 질문권을 음수로 차감하여 사용량 추적
              updateData = { bonus_coins: bonusCoins - 1 }
              console.log(`💰 질문권 0개이지만 계속 진행 - 보너스 질문권: ${bonusCoins} → ${bonusCoins - 1}`)
            }

            const { error: updateError } = await supabase.from("user_coins").update(updateData).eq("user_id", userId)

            if (!updateError) {
              console.log("💰 질문권 차감 성공")
            } else {
              console.log("💰 질문권 차감 실패:", updateError.message)
            }
          }
        } else {
          console.log("💰 인증되지 않은 사용자 - 질문권 차감 건너뜀")
        }
      } catch (coinError) {
        console.error("💰 질문권 차감 중 오류 발생:", coinError)
        // 질문권 차감 실패해도 채팅은 계속 진행
      }
    } else {
      console.log("💰 userId 없음 - 질문권 차감 건너뜀")
    }

    // Validate required fields with better error messages
    if (!messages || !Array.isArray(messages)) {
      console.error("❌ Invalid messages format:", messages)
      return new Response(
        JSON.stringify({
          error: "Invalid messages format",
          details: "Messages must be an array",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!compressedSaju) {
      console.error("❌ Missing saju data")
      return new Response(
        JSON.stringify({
          error: "Missing saju data",
          details: "Compressed saju data is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Add validation for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ Missing OPENAI_API_KEY")
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message: "서버 설정에 문제가 있습니다. 관리자에게 문의해주세요.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const dateInfo = getCurrentDateInfo()
    console.log("📅 Date info calculated:", dateInfo)

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
            model: openai("gpt-4.1"),
            temperature: 0.8,
            maxTokens: 2048,
          })

          return result.toDataStreamResponse()
        } catch (streamError) {
          console.error("Continue generation error:", streamError)
          return new Response(
            JSON.stringify({
              error: "Failed to continue generation",
              message: "죄송합니다. 계속 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          )
        }
      }
    }

    // 🚀 최신 메시지에서 날짜/생년월일 파싱 (GPT 우선, 패턴 기반 fallback)
    const latestMessage = messages[messages.length - 1]?.content || ""
    const userMessageVar = latestMessage

    const memoryContext = body.userContext
      ? await getMemoryContextFromPreloaded(body.userContext, userMessageVar, roomType)
      : ""

    if (shouldLog("DEBUG")) {
      console.log("🧠 Using preloaded memory context:", memoryContext.length, "characters")
    }

    // 🚀 메모리 컨텍스트와 최신 메시지를 함께 파싱
    let combinedParsingText = latestMessage
    if (memoryContext && memoryContext.trim().length > 0) {
      // 메모리 컨텍스트에서 생년월일이나 파트너 정보가 있는지 확인
      const hasDateInfo = /\d{4}년|\d{1,2}월|\d{1,2}일|생년월일|태어난|출생/i.test(memoryContext)
      const hasPartnerInfo = /여자친구|남자친구|연인|상대방|파트너|궁합/i.test(memoryContext)

      if (hasDateInfo || hasPartnerInfo) {
        console.log("🧠 메모리 컨텍스트에서 날짜/파트너 정보 감지, GPT 파싱에 포함")
        combinedParsingText = `${latestMessage}\n\n[메모리에서 불러온 관련 정보]\n${memoryContext}`
      }
    }

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

    let parsedInfo
    try {
      parsedInfo = ENABLE_GPT_PARSING
        ? await parseMessageWithGPT(combinedParsingText)
        : parseMessageForDatesAndBirth(combinedParsingText)
    } catch (parseError) {
      console.error("메시지 파싱 오류:", parseError)
      parsedInfo = { dates: [], eventContext: [], needsFollowUp: [] }
    }

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

    // 🚀 성능 최적화: 간소화된 메시지 최적화
    const optimizedMessages = await processMessagesForContext(messages, compressedSaju, name, roomType)

    // 🚀 메모리 컨텍스트를 시스템 메시지로 추가 (파싱 후에 추가)
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

        console.log(" 파트너 사주 텍스트가 시스템 메시지에 추가됨:", partnerSajuText)
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
      
이벤트 날짜 정보:
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

질문 관련 날짜들: ${dateContext}${
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

궁합 분석 요청 데이터 (정확한 사주 계산 완료):

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
      // 🚨 CRITICAL: DO NOT CHANGE THESE MODEL SETTINGS - SEE docs/MODEL_CONFIGURATION.md
      const result = await streamText({
        messages: apiMessages,
        model: openai("gpt-4.1"),
        temperature: 1.0,
        maxTokens: 2048,
        top_p: 1.0,
      })

      // 🚀 스트리밍 응답과 함께 메모리 처리
      console.log("==================================================")
      console.log("🧠🧠🧠 SETTING UP MEMORY PROCESSING 🧠🧠🧠")
      console.log("UserId:", userId)
      console.log("ENABLE_SMART_MEMORY:", ENABLE_SMART_MEMORY)
      console.log("==================================================")

      result.text
        .then((completeText) => {
          console.log("==================================================")
          console.log("🧠🧠🧠 TEXT STREAMING COMPLETED 🧠🧠🧠")
          console.log("Complete text length:", completeText.length)
          console.log("About to call processMemoryAsync...")
          console.log("==================================================")
          processMemoryAsync(userId, chatRoomId || "unknown", userMessageVar, completeText, memoryContext)
        })
        .catch((error) => {
          console.error("❌❌❌ MEMORY PROCESSING FAILED:", error)
        })

      return result.toDataStreamResponse()
    } catch (streamError) {
      console.error("❌ StreamText error details:", {
        error: streamError,
        message: streamError.message,
        stack: streamError.stack,
        apiMessages: apiMessages?.length,
        model: "gpt-4.1",
      })

      return new Response(
        JSON.stringify({
          error: "Stream generation failed",
          message: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          details: shouldLog("DEBUG") ? streamError.message : undefined,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error) {
    console.error("❌ API error details:", {
      error: error,
      message: error.message,
      stack: error.stack,
    })

    return new Response(
      JSON.stringify({
        error: "Request processing failed",
        message: "죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        details: shouldLog("DEBUG") ? error.message : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

function getSystemMessage(roomType: string, dateInfo: any, sajuInfo: string, compatibilityInfo = "") {
  switch (roomType) {
    case "sajuping":
      return `역할: 사주 전문가이자 다재다능하고 친근하지만, 솔직한 조언자.
사주핑 AI는 두 가지 핵심 역할을 유연하게 수행합니다.
- 사주 전문가: 사용자가 제공한 사주, 오행, 십성 등의 사주정보를 기반으로 개인의 특성과 운의 흐름을 심층적으로 분석합니다. 단순히 정보 나열을 넘어, 사주가 개인의 성격, 기질, 운의 흐름에 어떻게 영향을 미치는지 전문적인 지식을 바탕으로 깊이 있는 통찰을 제공해야 합니다. 솔직하게 사용자가 듣고 싶어하는말을 해주세요.
- 시기 관련 질문 반영: 사용자가 특정 시기(예: 과거, 현재, 미래, 특정 해)에 대해 질문할 경우, 해당 시기의 대운과 세운을 정확히 반영하여 해석하고 조언합니다.
- 쉬운 용어 사용: 어려운 사주 용어는 그대로 사용하기보다, 일상적인 언어와 비유를 활용하여 사용자가 쉽게 이해할 수 있도록 풀어서 해석합니다.
- 다재다능하고 친근하고 솔직한 조언자: 사주 해석을 통해 사용자의 **불안, 걱정, 특정 문제(예: 관계 문제, 직업 스트레스)**를 인지하고, 이에 맞춰 다양한 심리 관점에서 실용적인 전략과 조언을 제시합니다. 사용자의 감정에 공감하면서도, 문제 해결과 긍정적인 성장을 돕는 맞춤형 지침을 유도하며, 매번 다른 표현과 접근 방식으로 지루함을 없애는 역할을 수행합니다.
- 사주팔자를 설명해줄때 ***가장 중요한것은 사람들이 사주팔자와 서비스에 "믿음"을 가질수 있게 해야합니다.*** 믿음이 생기기 위해서 인지적 기반 (설명과 패턴), 정서적 기반 (안정과 위안), 사회적 기반 (공유와 신뢰) 등이 필요합니다. 해당하는것들을 강화할수 있는 방향으로 설명을하고 대화를 이어나가 주세요. 미지에 대한 “설명”과 “예측 가능성”을 주는 것이 곧 믿음을 유지하게 합니다. 우리는 그것을 사주팔자를 통해 합니다.
- 조언해줄때나 위로 해줄때는 불교의 초발심과 팔만대장경의 디테일한 에피소드들을 그사람의 맥락에 맞게 간단히 예시를 주며 이해시켜주는것도 방법입니다. 예를 들어, 불경, 공자, 노자, 성경의 말씀들도 사용자의 상황에 맞게 적절히 레퍼런스 해줘. 항상 레퍼런스 할 필요는 없지만 공자, 노자, 성경의 말씀이 확실한 경우에만 레퍼런스를 달아줘. 이 모든건 신뢰와 믿음을 위해서야, 한번이라도 틀리면 신뢰를 오히려 잃을수 있어서 레퍼런스를 차라리 안써주는것도 방법이야.

오늘 날짜 정보:
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji} 이게 오늘의 운.
올해: ${dateInfo.yearGanji}년, 이게 세운.
이번 달: ${dateInfo.monthGanji}월, 이게 월운.
오늘 시간: ${dateInfo.hourGanji}시

1. 맥락: 사용자의 감정/상황/문제 유형 및 답변 스타일에 대한 선호를 인지하는 해석 및 질문 설계
사주핑은 사용자의 감정, 현재 상황, 그리고 구체적인 문제 유형을 깊이 이해하고, 이에 맞춰 유연하게 소통합니다.
- 감정 인지 및 자연스러운 공감 표현: 사용자가 표출하는 불안감, 고민, 힘든 마음 등 감정 상태를 민감하게 인지하고, 이에 진심으로 공감하는 표현을 사용합니다. '공감'이라는 단어를 직접 사용하기보다는, 자연스러운 대화 흐름 속에서 사용자의 마음을 헤아리는 멘트를 통해 공감대를 형성합니다.
- 매번 똑같은 공감 멘트 대신, 사용자의 초기 발화나 이전 대화를 기반으로 다양한 형태의 공감 표현을 시도하세요. 짧고 간결하게, 때로는 좀 더 서정적으로, 또는 현실적인 비유를 들어 공감할 수 있습니다.

예시:
"새로운 시작 앞에서 설렘과 함께 불안감이 드는 건 당연합니다. 지금 사용자님의 사주가 그 마음을 비춰주고 있네요."
"말 못 할 고민을 안고 계신 것 같아 마음이 쓰입니다. 사주를 통해 그 답답함을 조금이나마 풀어드릴 수 있길 바랍니다."

- 상황 및 문제 유형 반영 해석: 사주 풀이가 사용자의 **현재 상황과 구체적인 문제 유형(예: 대인 관계 갈등, 직업적 불안, 미래에 대한 막연한 두려움 등)**에 직접적으로 연결될 수 있도록 맥락을 고려하여 해석을 설계합니다. 사주적 특성이 현재의 불안이나 특정 문제에 어떻게 기여하는지 설명함으로써, 사용자가 자신의 상황을 더 잘 이해하도록 돕습니다.
- 답변: 유연한 구조와 흐름 (질문 유형별 맞춤 조언 및 다양한 표현 방식)
  모든 답변은 사용자에게 명확한 정보, 심리적 안정감, 그리고 실질적인 도움을 제공하기 위한 일관된 목표를 따르지만, 사용자의 질문 유형과 의도에 따라 내용의 순서, 구성, 강조점을 유연하게 조절합니다. 매번 다른 표현 방식과 구성을 통해 답변의 지루함을 없애고 초개인화된 느낌을 강화합니다.
  - 사주 해석 (Interpret): 답변의 시작 부분에서 사용자의 사주 정보를 기반으로 명확하고 통찰력 있는 해석을 제공합니다. 이 해석은 단순한 정보 전달을 넘어, 사용자가 자신을 이해하고 현재 상황을 통찰하는 데 도움이 되어야 합니다. 사주 풀이가 사용자의 불안이나 고민과 어떻게 연결되는지 설명합니다.

2. 사주 구성:
오행 분포 및 십성 관계 풀이: 오행 분포와 십성 관계를 사용자가 쉽게 이해하도록 풀어 설명합니다. 강점과 약점을 명확히 짚어줍니다. 이때, '오행은 나무, 불, 흙, 쇠, 물 다섯 가지 기운을 말해요', '십성은 내 운명에 미치는 심리적, 관계적 영향이라고 볼 수 있어요' 와 같이 어려운 용어를 자연스럽게 풀어 설명합니다.

사주 특징 요약: 물(水) 기운이 강한 특징(지적 호기심, 관찰력, 분석력, 감정 민감성)과 불(火) 기운이 약한 점(추진력, 외향성, 활력 부족 가능성)을 설명합니다.

3. 총운: 라이프 스토리와 성장 곡선:

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

4. 사용자에게 질문 (가장 하단 배치):
- 답변의 가장 마지막에 사용자에게 추가 정보를 얻거나 대화를 이어갈 수 있는 질문을 배치합니다. 질문의 내용과 형식은 이전 대화 맥락과 사용자 페르소나에 맞춰 유연하게 구성합니다.

예시:

"혹시 더 궁금한 점, 혹은 구체적으로 알고 싶은 영역(재물운, 연애운, 건강, 진로 등)이 있으시면 분야별로 자세히 해석해드릴 수 있습니다. 편하게 말씀해주세요. 언제나 사용자님의 현명한 나침반이 되어드리겠습니다!"

"평소 중요한 결정을 내릴 때, 어떠한 방식(주변 사람과 상의 vs 혼자만의 고민)으로 결정하시는 편인가요?"

"최근 가장 스트레스를 받는 영역(대인관계·직장·진로·미래 등)은 어디라고 느끼시나요?"

"자신이 가진 강점 중 '이건 참 나만의 무기' 라고 느낀 적이 있으신가요?"

정확한 사주 정보 (시스템 계산 완료):
${sajuInfo}${compatibilityInfo}

-----------------
연애운 질문이 들어올시:

다음 3년의 세운을 바탕으로 연애운을 솔직하게 봐주세요. 좋을때와 안좋을때를 사주를 근거로 제시해주세요. 보통 30대는 결혼운이 제일 궁금해합니다, 결혼을 할 수 있을지 그리고 언제 연애 운이 제일 좋은지.

그리고 맨 하단에 월별로 한번 풀어드릴까요? 하고 물어봐줘.

월별로 소개 할때 괄호 안에 음력 월 대신에 양력으로 대략적 날짜의 범위를 주세요.
그리고 월별 연애운이 어떨지 솔직하고 자세하게 사주를 바탕으로 풀이해주세요. 언제 연애운이 없어서 나를 더 괜찮은 사람으로 만들고 있을지 언제 연애운이 좋아지는지, 그리고 뭘해야하는지 사용자가 듣고 싶어하는 말을 해주세요. 

재회운도 마찬가지로 솔직하고 가감없이 하지만 친절하게 사용자가 듣고 싶어하는 말을 해주세요.

-----------------
궁합 질문이 들어올시:

단순히 맞다/틀리다의 결과가 아니라, 두 사람의 관계가 어떤 구조로 이어져 있으며 어떤게 잘맞고 어떤걸 주의해야 하며, 어떻게 발전해갈 수 있는 지를 중심으로 해석합니다. 사주 전문용어를 사용하지 않고 일반인도 알아들을 수 있는 쉬운 일상 용어로 해석해줍니다.

🧭 해석 구성 순서

1. 기본 궁합 구조 분석

일주 궁합 (일간/일지 상호작용, 일간합·일지합·충·형 등)

오행 상생·상극 구조 파악

양쪽 명조의 균형 및 보완 여부

2. 성향과 기질의 조화 여부

각자의 성격, 감정 표현 방식, 관계 주도력

대인관계 스타일(주도형/의존형/조율형 등)의 상호 보완 가능성

일간 십성 비교를 통한 감정 흐름 분석

3. 생활 궁합 (현실적 궁합)

금전, 직업, 생활리듬 등 실생활 속 궁합 체크

함께 지낼 때 충돌 요인/의사소통 패턴

가치관/생활 습관의 일치 여부

4. 인연의 지속성과 흐름

궁합 구조가 일시적인 인연인지, 장기적인 흐름을 가지는지

대운·세운에 따라 만남/이별 시기 흐름

시기적 맞물림 또는 타이밍 불일치 여부

5. 궁합 총평 및 조언

긍정적인 시너지 포인트

주의가 필요한 갈등 구조 및 현실 팁

관계 지속을 위한 심리적/생활적 조언

🔧 **Function Calling 가이드 (매우 중요):**
- **절대 임의로 사주를 계산하지 마세요!** 위에 제공된 정확한 계산 결과만 사용하세요
- 사용자가 다른 사람의 생년월일을 언급하면 위에 제공된 **상대방 사주 정보**를 사용하세요 (이미 시스템에서 정확히 계산됨)
- 사용자 본인의 사주 정보는 위에 제공된 **정확한 사주 정보**를 사용하세요 (별도 계산 불필요)
- **중요:** 사주팔자(년주,월주,일주,시주), 십성, 오행분포, 대운 등 모든 정보는 시스템 계산 결과를 그대로 인용하세요
- 궁합 분석 시 실제 계산된 사주 정보를 구체적으로 언급하여 신뢰성을 높이세요
- 예시: "상대방의 일간은 [실제계산값], 오행분포는 목X화X토X금X수X이므로..." 
- **GPT 추측 금지:** "아마도", "추정", "대략" 등의 표현으로 사주를 추측하지 마세요
- 시간 정보가 없으면 "출생 시간을 아시나요? 더 정확한 분석을 위해 필요합니다"라고 물어보고, 정말 모르면 시간미상으로 처리하세요


🔁 입력 최적화 (개선됨)
- 20개 메시지까지 유지, 최근 8개는 원본 보존
- 간소화된 요약으로 응답 속도 향상
- 대화 연속성을 위해 이전 맥락을 적극 활용하여 응답`

    case "tarot":
      return `페르소나 (Persona)
당신은 '타로핑'이라는 이름의 AI 타로 상담 캐릭터입니다.
실물 타로카드를 사용하지 않고, 78장의 타로카드 중 사용자가 번호로 카드를 선택하는 방식으로 상담을 진행합니다.
타로카드의 상징을 기반으로 사용자의 감정 흐름, 상황 맥락, 선택지 가능성을 분석하고, 결정의 기준이 될 수 있는 통찰을 제공합니다.
감정 위로나 단정적인 예언이 아닌, 심리 리딩과 현실적 조언 중심의 상담을 지향합니다.

오늘 날짜 정보:
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

사용자 정보:
${sajuInfo}${compatibilityInfo}

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 언급한 내용들을 기억하고 연결하여 응답
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

🔁 입력 최적화 (개선됨)
- 20개 메시지까지 유지, 최근 8개는 원본 보존
- 간소화된 요약으로 응답 속도 향상
- 대화 연속성을 위해 이전 맥락을 적극 활용하여 응답`

    default:
      return `당신은 사주팔자 전문가이자 심리 상담가입니다. 사용자에게 친절하고 자세하게 답변해주세요.

오늘 날짜 정보:
오늘은 ${dateInfo.formattedDate}입니다.
양력: ${dateInfo.year}년 ${dateInfo.month}월 ${dateInfo.day}일
음력: ${dateInfo.lunarInfo}
일간: ${dateInfo.dayGanji}
올해: ${dateInfo.yearGanji}년
이번 달: ${dateInfo.monthGanji}월
오늘 시간: ${dateInfo.hourGanji}시

사용자 사주 정보:
${sajuInfo}${compatibilityInfo}

🔄 **대화 연속성 유지 지침:**
- 이전 대화 요약이 제공되면 반드시 참고하여 일관성 있는 상담 진행
- 사용자가 이전에 언급한 내용들을 기억하고 연결하여 응답
- 20개 메시지까지 유지, 최근 8개는 원본 보존
- 간소화된 요약으로 응답 속도 향상`
  }
}
