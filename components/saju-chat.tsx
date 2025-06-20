"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Send, ChevronDown, User, Mic, ArrowLeft, Settings, Database, Coins } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import ReactMarkdown from "react-markdown"
import CompatibilityTool from "@/components/compatibility-tool"
import MemoryBank from "@/components/memory-bank"
import { compressSaju } from "@/lib/saju-compression"
import { memoryService } from "@/lib/memory-service"
import { useAuth } from "@/contexts/auth-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { CoinPurchaseModal } from "@/components/coin-purchase-modal"

const useHideHeaderAndFooter = () => {
  useEffect(() => {
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")
    const body = document.body

    if (header) {
      header.style.display = "none"
    }

    if (footer) {
      footer.style.display = "none"
    }

    body.style.overflow = "hidden"

    return () => {
      if (header) {
        header.style.display = ""
      }
      if (footer) {
        footer.style.display = ""
      }
      body.style.overflow = ""
    }
  }, [])
}

const useForceDarkTheme = () => {
  useEffect(() => {
    const wasAlreadyDark = document.documentElement.classList.contains("dark")
    const currentTheme = localStorage.getItem("theme")

    document.documentElement.classList.add("dark")

    return () => {
      if (!wasAlreadyDark && currentTheme !== "dark") {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])
}

interface BirthInfo {
  solarYear: number
  solarMonth: number
  solarDay: number
  solarHour?: number
  solarMinute?: number
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  timeUnknown?: boolean
  birthCityId?: string
  timeStandard?: string
}

interface SajuChatProps {
  saju: any
  name: string
  gender: string
  initialInterpretation: string
  roomType: string
  onBack: () => void
  isLoggedIn?: boolean
  sessionKey: string
  birthInfo?: BirthInfo
}

const pingCharacters = [
  {
    id: "sajuping",
    name: "사주핑",
    emoji: "🔮",
    description: "사주와 운세 전문",
    roomType: "sajuping",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: "taroping",
    name: "타로핑",
    emoji: "🃏",
    description: "타로카드 리딩 전문",
    roomType: "tarot",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
  },
]

const initialSuggestedQuestionsByType: Record<string, string[]> = {
  sajuping: [
    "직업운 알려줘",
    "연애운 알려줘",
    "건강운 알려줘",
    "재물운 알려줘",
    "올해 운세는 어떤가요?",
    "제 성격과 기질은 어떤가요?",
  ],
  tarot: [
    "오늘의 타로 카드 뽑아줘",
    "연애운 타로 봐줘",
    "직업운 타로 리딩해줘",
    "오늘 주의할 점은?",
    "이번 주 운세는?",
    "중요한 결정을 앞두고 있어요",
  ],
  general: ["2025년 운세는 어떤가요?", "제 사주의 장단점은?", "가장 강한 기운은 무엇인가요?"],
}

function formatBirthInfo(birthInfo?: BirthInfo): string {
  if (!birthInfo) return ""

  const { solarYear, solarMonth, solarDay, solarHour, solarMinute, timeUnknown } = birthInfo

  let dateStr = `${solarYear}년 ${solarMonth}월 ${solarDay}일`

  if (!timeUnknown && solarHour !== undefined && solarMinute !== undefined) {
    dateStr += ` ${solarHour.toString().padStart(2, "0")}시 ${solarMinute.toString().padStart(2, "0")}분`
  } else if (timeUnknown) {
    dateStr += " (시간 미상)"
  }

  return dateStr
}

const getInitialMessageByRoomType = (name: string, roomType: string, birthInfo?: BirthInfo): string => {
  const currentYear = 2025
  const userName = name || "사용자"
  const birthDateStr = formatBirthInfo(birthInfo)

  switch (roomType) {
    case "sajuping":
      return `안녕하세요, ${userName}님! 저는 사주핑이에요! 🔮✨

${userName}님의 사주를 바탕으로 인생의 모든 영역에 대해 상담해드릴게요. 

📅 **${userName}님의 생년월일:** ${birthDateStr}

💫 **상담 가능한 영역:**
• 직업운 & 적성 분석
• 연애운 & 결혼운 
• 건강운 & 체질 분석
• 재물운 & 투자 운세
• 성격 & 기질 분석
• 인생의 큰 흐름과 조언

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해에 ${userName}님이 궁금한 모든 것을 물어보세요! 

아래 추천 질문을 눌러보시거나, 직접 궁금한 점을 말씀해주세요 😊`

    case "tarot":
      return `안녕하세요, ${userName}님! 저는 타로핑이에요! 🃏✨

신비로운 타로카드의 세계로 여러분을 안내해드릴게요!

📅 **${userName}님의 생년월일:** ${birthDateStr}

🔮 **타로 리딩 서비스:**
• 오늘의 운세 타로
• 연애운 타로 리딩
• 직업운 타로 상담
• 중요한 결정 도움
• 미래 전망 타로
• 관계 상담 타로

${currentYear}년 을사년, 푸른 뱀의 해에 타로카드가 ${userName}님에게 전하는 메시지를 들어보세요! 

어떤 것이 궁금하신가요? 🌟`

    default:
      return `안녕하세요, ${userName}님! 무엇을 도와드릴까요?

📅 **생년월일:** ${birthDateStr}`
  }
}

const generateSajupingInitialMessages = (name: string, saju: any, birthInfo?: BirthInfo): any[] => {
  const userName = name || "사용자"

  const firstMessage = {
    id: "saju-analysis",
    role: "assistant" as const,
    content: getInitialMessageByRoomType(userName, "sajuping", birthInfo),
  }

  const secondMessage = {
    id: "consultation-start",
    role: "assistant" as const,
    content: `오늘은 어떤 것이 궁금하세요? 😊`,
  }

  return [firstMessage, secondMessage]
}

function generateChatSessionKey(name: string, saju: any, roomType: string) {
  const birthYear = saju.year || ""
  const birthMonth = saju.month || ""
  const birthDay = saju.day || ""
  const birthHour = saju.hour || ""
  const gender = saju.gender || ""

  return `chat_${name}_${birthYear}${birthMonth}${birthDay}${birthHour}_${gender}_${roomType}`
}

export default function SajuChat({
  saju,
  name,
  gender,
  initialInterpretation,
  roomType,
  onBack,
  isLoggedIn = false,
  sessionKey,
  birthInfo,
}: SajuChatProps) {
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id || null
  const actualIsLoggedIn = isAuthenticated || isLoggedIn

  // States
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isNewUser, setIsNewUser] = useState(true)
  const [messageIds, setMessageIds] = useState<Record<string, string>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [databaseSessionId, setDatabaseSessionId] = useState<string | null>(null)
  const [sessionInitialized, setSessionInitialized] = useState(false)
  const [showCompatibilityTool, setShowCompatibilityTool] = useState(false)
  const [showMemoryBank, setShowMemoryBank] = useState(false)
  const [showToolsDrawer, setShowToolsDrawer] = useState(false)
  const [hasSeenToolsNotification, setHasSeenToolsNotification] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [hasShownLoginPrompt, setHasShownLoginPrompt] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState("")
  const [streamingError, setStreamingError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isLoadingPastMessages, setIsLoadingPastMessages] = useState(false)
  const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false)
  const [userCoins, setUserCoins] = useState<number>(0)
  const [showCoinPurchase, setShowCoinPurchase] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general,
  )
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [shouldGenerateQuestions, setShouldGenerateQuestions] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()
  const { activeChatSession, setActiveChatSession, saveChatSession, getChatSession } = useChat()

  const currentCharacter = pingCharacters.find((char) => char.roomType === roomType) || pingCharacters[0]

  const getMemoryContext = useCallback(() => {
    if (!userId) return ""
    return memoryService.generateContextSummary(userId)
  }, [userId])

  const loadUserCoins = useCallback(async () => {
    if (!actualIsLoggedIn) return

    try {
      const response = await fetch("/api/user-coins")
      if (response.ok) {
        const data = await response.json()
        setUserCoins(data.coins || 0)
      }
    } catch (error) {
      console.error("코인 정보 로드 오류:", error)
    }
  }, [actualIsLoggedIn])

  useEffect(() => {
    if (actualIsLoggedIn) {
      loadUserCoins()
    }
  }, [actualIsLoggedIn, loadUserCoins])

  // 과거 메시지와 초기 메시지를 합치는 함수
  const combineMessagesWithInitial = useCallback(
    (pastMessages: any[]) => {
      // 초기 메시지 생성
      let baseInitialMessages: any[] = []
      if (roomType === "sajuping") {
        baseInitialMessages = generateSajupingInitialMessages(name, saju, birthInfo)
      } else {
        baseInitialMessages = [
          {
            id: "welcome",
            role: "assistant" as const,
            content: getInitialMessageByRoomType(name, roomType, birthInfo),
          },
        ]
      }

      if (pastMessages.length === 0) {
        return baseInitialMessages
      }

      // 과거 메시지를 message_order 기준으로 정렬
      const sortedPastMessages = [...pastMessages].sort((a, b) => a.messageOrder - b.messageOrder)

      // 초기 메시지와 과거 메시지를 올바른 순서로 결합
      const combinedMessages = [...baseInitialMessages]

      // 과거 메시지를 순서대로 추가 (초기 메시지 이후부터)
      sortedPastMessages.forEach((msg) => {
        // message_order가 초기 메시지 개수보다 큰 경우에만 추가
        const initialMessageCount = roomType === "sajuping" ? 2 : 1
        if (msg.messageOrder >= initialMessageCount) {
          combinedMessages.push({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          })
        }
      })

      console.log(
        `[CLIENT] Combined ${baseInitialMessages.length} initial + ${sortedPastMessages.length} past messages = ${combinedMessages.length} total`,
      )
      return combinedMessages
    },
    [name, saju, birthInfo, roomType],
  )

  // 과거 메시지 불러오기 함수
  const loadPastMessages = useCallback(async (sessionId: string) => {
    if (!sessionId) return []

    try {
      setIsLoadingPastMessages(true)
      console.log(`[CLIENT] Loading past messages for session: ${sessionId}`)

      const response = await fetch(`/api/messages?sessionId=${sessionId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`[CLIENT] Loaded ${data.messages?.length || 0} past messages from database`)

      return data.messages || []
    } catch (error) {
      console.error("[CLIENT] Error loading past messages:", error)
      return []
    } finally {
      setIsLoadingPastMessages(false)
    }
  }, [])

  // 세션 ID 초기화 및 초기 메시지 설정
  const initializeSession = useCallback(async () => {
    if (sessionInitialized || initialMessagesLoaded) {
      return null
    }

    try {
      setSessionInitialized(true)

      let sessionId: string | null = null
      let pastMessages: any[] = []

      // 1. 먼저 전달받은 sessionKey 확인 (홈페이지에서 넘어온 경우)
      if (sessionKey && sessionKey !== generateChatSessionKey(name, saju, roomType)) {
        console.log("Using sessionKey from props (homepage flow):", sessionKey)
        sessionId = sessionKey
        setDatabaseSessionId(sessionId)

        // 과거 메시지 불러오기 시도
        pastMessages = await loadPastMessages(sessionId)
      }
      // 2. 마이페이지에서 온 경우 체크
      else {
        const fromMyPage = sessionStorage.getItem("from_mypage")
        const storedSajuData = localStorage.getItem("current_saju")

        if (fromMyPage === "true" && storedSajuData) {
          console.log("Processing session from mypage")
          const sajuData = JSON.parse(storedSajuData)

          if (sajuData.sessionId) {
            console.log("Using existing sessionId from mypage:", sajuData.sessionId)
            sessionId = sajuData.sessionId
            setDatabaseSessionId(sessionId)

            // 과거 메시지 불러오기
            pastMessages = await loadPastMessages(sessionId)

            // 세션 스토리지에서 플래그 제거
            sessionStorage.removeItem("from_mypage")
          }
        } else if (storedSajuData) {
          // 일반적인 경우 처리
          const sajuData = JSON.parse(storedSajuData)
          if (sajuData.sessionId) {
            sessionId = sajuData.sessionId
            setDatabaseSessionId(sessionId)
            pastMessages = await loadPastMessages(sessionId)
          }
        }
      }

      // 3. 여전히 sessionId가 없으면 새로 생성 (홈페이지 플로우용)
      if (!sessionId) {
        console.log("No existing session found, using sessionKey or generating new one")
        sessionId = sessionKey || generateChatSessionKey(name, saju, roomType)
        setDatabaseSessionId(sessionId)

        // localStorage에 sessionId 저장
        const storedData = JSON.parse(localStorage.getItem("current_saju") || "{}")
        storedData.sessionId = sessionId
        localStorage.setItem("current_saju", JSON.stringify(storedData))
      }

      console.log("Final sessionId:", sessionId)

      // 초기 메시지와 과거 메시지 결합
      const combinedMessages = combineMessagesWithInitial(pastMessages)
      setInitialMessagesLoaded(true)

      return combinedMessages
    } catch (error) {
      console.error("Error initializing session:", error)
      setInitialMessagesLoaded(true)

      // 에러 발생 시에도 sessionKey 사용
      if (sessionKey) {
        setDatabaseSessionId(sessionKey)
      }

      return combineMessagesWithInitial([])
    }
  }, [
    sessionInitialized,
    initialMessagesLoaded,
    loadPastMessages,
    combineMessagesWithInitial,
    sessionKey,
    name,
    saju,
    roomType,
  ])

  // 초기 메시지 설정
  const [initialMessages, setInitialMessages] = useState<any[]>([])

  useEffect(() => {
    const loadInitialMessages = async () => {
      const messages = await initializeSession()
      if (messages) {
        setInitialMessages(messages)
      }
    }

    if (!initialMessagesLoaded) {
      loadInitialMessages()
    }
  }, [initializeSession, initialMessagesLoaded])

  // 기본 초기 메시지 (로딩 중일 때 사용)
  const defaultInitialMessages =
    roomType === "sajuping"
      ? generateSajupingInitialMessages(name, saju, birthInfo)
      : [
          {
            id: "welcome",
            role: "assistant" as const,
            content: getInitialMessageByRoomType(name, roomType, birthInfo),
          },
        ]

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    isLoading,
    setInput,
    error,
    reload,
    append,
  } = useAIChat({
    api: "/api/saju-chat",
    initialMessages: initialMessages.length > 0 ? initialMessages : defaultInitialMessages,
    body: {
      compressedSaju: compressSaju(
        saju,
        birthInfo?.solarYear?.toString(),
        birthInfo?.solarMonth?.toString(),
        birthInfo?.solarDay?.toString(),
        birthInfo?.solarHour?.toString(),
        birthInfo?.solarMinute?.toString(),
        birthInfo?.timeUnknown,
      ),
      name,
      gender,
      initialInterpretation,
      roomType,
      userId,
      currentYear: 2025,
      yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
      birthInfo,
      memoryContext: getMemoryContext(),
    },
    onFinish: async (message) => {
      try {
        // 로컬 스토리지에만 저장 (단순화)
        const currentSessionKey = sessionKey || generateChatSessionKey(name, saju, roomType)
        const updatedMessages = [...messages, message]
        const sessionData = {
          saju,
          name,
          gender,
          interpretation: initialInterpretation,
          roomType,
          messages: updatedMessages,
          lastMessageTime: new Date().toISOString(),
          birthInfo,
        }

        saveChatSession(currentSessionKey, sessionData)
        setActiveChatSession(sessionData)

        setShouldGenerateQuestions(true)
        setStreamingError(null)
        setRetryCount(0)
      } catch (error) {
        console.error("Error in onFinish handler:", error)
      }
    },
    onError: (error) => {
      setStreamingError("응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.")
      setShouldGenerateQuestions(true)
    },
    onResponse: (response) => {
      // 스크롤 최적화
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
          })
        }, 100)
      }
      setStreamingError(null)
    },
  })

  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim()) {
      return
    }

    // 입력창 즉시 클리어
    const userInput = input.trim()
    setInput("")

    // 로그인한 사용자의 경우 코인 차감
    if (actualIsLoggedIn) {
      if (userCoins <= 0) {
        setShowCoinPurchase(true)
        setInput(userInput) // 코인 부족시 입력 복원
        return
      }

      // 코인 차감 (비동기로 처리하여 UI 블로킹 방지)
      fetch("/api/user-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "use", amount: 1 }),
      })
        .then((response) => {
          if (response.ok) {
            response.json().then((data) => setUserCoins(data.coins))
          }
        })
        .catch((error) => {
          console.error("코인 차감 오류:", error)
        })
    }

    const newQuestionCount = questionCount + 1
    setQuestionCount(newQuestionCount)

    const shouldShowLoginPrompt = newQuestionCount >= 5 && !actualIsLoggedIn && !hasShownLoginPrompt

    if (shouldShowLoginPrompt) {
      setLoginPromptMessage("5개의 질문을 모두 사용하셨습니다. 로그인하시면 무제한으로 질문하실 수 있습니다.")
      setShowLoginPrompt(true)
      setHasShownLoginPrompt(true)
    }

    setShouldGenerateQuestions(false)
    setStreamingError(null)
    setRetryCount(0)

    // AI 채팅 제출 (입력값을 직접 전달)
    append({
      role: "user",
      content: userInput,
    })
  }

  const handleBackWithSave = () => {
    try {
      const sessionData = {
        saju,
        name,
        gender,
        interpretation: initialInterpretation,
        roomType,
        messages,
        lastMessageTime: new Date().toISOString(),
        birthInfo,
      }
      saveChatSession(sessionKey, sessionData)

      localStorage.setItem(
        "last_chat_saju_data",
        JSON.stringify({
          saju,
          name,
          gender,
          interpretation: initialInterpretation,
          birthInfo,
        }),
      )

      const fromMyPage = sessionStorage.getItem("from_mypage") === "true"
      sessionStorage.removeItem("from_mypage")

      if (fromMyPage) {
        setTimeout(() => {
          window.location.href = "/mypage"
        }, 100)
      } else {
        if (typeof onBack === "function") {
          onBack()
        } else {
          setTimeout(() => {
            window.location.href = "/"
          }, 100)
        }
      }
    } catch (error) {
      console.error("뒤로가기 처리 중 오류:", error)
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    }
  }

  const handleSuggestedQuestionClick = (question: string) => {
    if (isLoading) return
    setInput(question)
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  const scrollToBottomSmooth = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollToBottom(!isNearBottom)
    }
  }, [])

  const handleRetry = () => {
    setIsRetrying(true)
    setRetryCount((prevCount) => prevCount + 1)
    reload()
  }

  const handleCompatibilityAnalysis = (mainPerson: any, selectedPeople: any[]) => {
    try {
      console.log("handleCompatibilityAnalysis called with:", { mainPerson, selectedPeople })

      const peopleNames = selectedPeople.map((p) => p.name).join(", ")

      // 출생시간 정보 포맷팅 함수
      const formatBirthTime = (person: any) => {
        const birthDate = person.birth || `${person.birthYear}.${person.birthMonth}.${person.birthDay}`
        const gender = person.gender === "male" ? "남성" : person.gender === "female" ? "여성" : "성별미상"

        // 시간 정보가 있고 timeUnknown이 아닌 경우
        if (person.birthHour && person.birthMinute && !person.timeUnknown) {
          return `${birthDate} ${person.birthHour}시 ${person.birthMinute}분 (${gender})`
        } else if (person.timeUnknown) {
          return `${birthDate} (시간 미상, ${gender})`
        } else {
          return `${birthDate} (${gender})`
        }
      }

      // 사주 정보 직접 사용 (이미 완전한 데이터)
      const mainPersonSaju = mainPerson.saju
      const mainPersonBirthTime = formatBirthTime(mainPerson)

      // 대표 사주 상세 정보
      const mainPersonInfo = `
🔮 **${mainPerson.name}님 사주 정보**
- 생년월일: ${mainPersonBirthTime}
- 사주팔자: ${mainPersonSaju.yearStem}${mainPersonSaju.yearBranch}년 ${mainPersonSaju.monthStem}${mainPersonSaju.monthBranch}월 ${mainPersonSaju.dayStem}${mainPersonSaju.dayBranch}일 ${mainPersonSaju.hourStem}${mainPersonSaju.hourBranch}시
- 일간(日干): ${mainPersonSaju.dayMaster}
- 띠: ${mainPersonSaju.yearAnimal}
- 십성: 년간(${mainPersonSaju.yearStemSibseong}) 년지(${mainPersonSaju.yearBranchSibseong}) 월간(${mainPersonSaju.monthStemSibseong}) 월지(${mainPersonSaju.monthBranchSibseong}) 일간(${mainPersonSaju.dayStemSibseong}) 일지(${mainPersonSaju.dayBranchSibseong}) 시간(${mainPersonSaju.hourStemSibseong}) 시지(${mainPersonSaju.hourBranchSibseong})
- 오행분포: 목${mainPersonSaju.elements.wood} 화${mainPersonSaju.elements.fire} 토${mainPersonSaju.elements.earth} 금${mainPersonSaju.elements.metal} 수${mainPersonSaju.elements.water}`

      // 궁합 대상들 상세 정보
      const selectedPeopleInfo = selectedPeople
        .map((person) => {
          const personSaju = person.saju
          const personBirthTime = formatBirthTime(person)

          return `
🔮 **${person.name}님 사주 정보**
- 생년월일: ${personBirthTime}
- 사주팔자: ${personSaju.yearStem}${personSaju.yearBranch}년 ${personSaju.monthStem}${personSaju.monthBranch}월 ${personSaju.dayStem}${personSaju.dayBranch}일 ${personSaju.hourStem}${personSaju.hourBranch}시
- 일간(日干): ${personSaju.dayMaster}
- 띠: ${personSaju.yearAnimal}
- 십성: 년간(${personSaju.yearStemSibseong}) 년지(${personSaju.yearBranchSibseong}) 월간(${personSaju.monthStemSibseong}) 월지(${personSaju.monthBranchSibseong}) 일간(${personSaju.dayStemSibseong}) 일지(${personSaju.dayBranchSibseong}) 시간(${personSaju.hourStemSibseong}) 시지(${personSaju.hourBranchSibseong})
- 오행분포: 목${personSaju.elements.wood} 화${personSaju.elements.fire} 토${personSaju.elements.earth} 금${personSaju.elements.metal} 수${personSaju.elements.water}`
        })
        .join("\n")

      const compatibilityMessage = `${mainPerson.name}님과 ${peopleNames}님의 사주 궁합을 자세히 분석해주세요. 

🔮 **궁합 분석 요청**

${mainPersonInfo}

${selectedPeopleInfo}

다음 내용을 포함해서 분석해주세요:
1. **사주팔자 궁합 분석**
   - 연주(年柱) 궁합: 조상운, 초년운 상성
   - 월주(月柱) 궁합: 부모운, 청년운 상성  
   - 일주(日柱) 궁합: 본인운, 배우자운 상성
   - 시주(時柱) 궁합: 자식운, 말년운 상성

2. **십성(十星) 궁합 분석**
   - 각자의 십성 배치와 상호 작용
   - 보완 관계와 충돌 관계

3. **오행(五行) 궁합 분석**
   - 목화토금수 균형과 보완 관계
   - 상생상극 관계 분석

4. **천간지지 상성**
   - 천간 합화 관계
   - 지지 삼합, 육합, 충극 관계

5. **성격 및 가치관 궁합**
   - 일간을 통한 성격 분석
   - 생활 패턴과 가치관 조화

6. **관계 발전 가능성**
   - 연애 궁합
   - 결혼 궁합
   - 사업 파트너십 가능성

7. **주의사항 및 조언**
   - 갈등 요소와 해결 방안
   - 관계 발전을 위한 구체적 조언

8. **종합 궁합 점수** (100점 만점)

위 모든 사주 정보를 바탕으로 상세하고 전문적인 궁합 분석을 해주세요.`

      console.log("Sending simplified compatibility message:", compatibilityMessage)

      // 메시지 전송
      append({
        role: "user",
        content: compatibilityMessage,
      })

      setShowCompatibilityTool(false)
    } catch (error) {
      console.error("Error in handleCompatibilityAnalysis:", error)
      alert("궁합 분석 중 오류가 발생했습니다: " + error.message)
    }
  }

  useHideHeaderAndFooter()
  useForceDarkTheme()

  // 컴포넌트 언마운트 시 타이머 정리

  // 로딩 상태 표시
  if (isLoadingPastMessages || !initialMessagesLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-white/80 text-sm">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackWithSave}
            className="mr-2 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-white hover:text-white hover:bg-white/20 px-4 py-2 rounded-lg"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-lg">{currentCharacter.emoji}</span>
              <span className="font-medium">{currentCharacter.name}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </Button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[99998]" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-[99999]">
                  <div className="py-2">
                    {pingCharacters.map((character) => (
                      <button
                        key={character.id}
                        onClick={() => {
                          router.push(
                            `/saju-chat/${character.roomType}?name=${name}&gender=${gender}&solarYear=${birthInfo?.solarYear}&solarMonth=${birthInfo?.solarMonth}&solarDay=${birthInfo?.solarDay}&solarHour=${birthInfo?.solarHour}&solarMinute=${birthInfo?.solarMinute}&timeUnknown=${birthInfo?.timeUnknown}`,
                          )
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-white/20 transition-colors rounded-lg mx-2 ${
                          character.roomType === roomType ? "bg-white/20" : ""
                        }`}
                      >
                        <span className="text-lg">{character.emoji}</span>
                        <div>
                          <p className="font-medium text-white">{character.name}</p>
                          <p className="text-xs text-white/70">{character.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {actualIsLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/coin-shop")}
              className="flex items-center space-x-2 text-amber-400 hover:text-amber-300 hover:bg-white/20 px-3 py-2 rounded-lg"
              title="코인 충전소"
            >
              <Coins className="h-4 w-4" />
              <span className="text-sm font-medium">{userCoins}핑</span>
            </Button>
          )}
          {actualIsLoggedIn ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/mypage")}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg"
                title="마이페이지"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMemoryBank(true)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg"
                title="메모리뱅크"
              >
                <Database className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-white border-white/30 hover:bg-white/20 hover:text-white hover:border-white/50 px-3 py-1 rounded-lg text-sm"
            >
              로그인
            </Button>
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <div className="pb-32 pt-6">
          {/* 사주 다이어그램 */}
          <div className="px-4 mb-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <SajuDiagram
                  saju={saju}
                  timeUnknown={birthInfo?.timeUnknown}
                  size="md"
                  name={name}
                  gender={gender}
                  solarYear={birthInfo?.solarYear?.toString()}
                  solarMonth={birthInfo?.solarMonth?.toString()}
                  solarDay={birthInfo?.solarDay?.toString()}
                  hour={birthInfo?.solarHour?.toString()}
                  minute={birthInfo?.solarMinute?.toString()}
                  lunarYear={birthInfo?.lunarYear?.toString()}
                  lunarMonth={birthInfo?.lunarMonth?.toString()}
                  lunarDay={birthInfo?.lunarDay?.toString()}
                  location="서울특별시"
                />
              </div>
            </div>
          </div>

          {/* 메시지들 */}
          {messages.map((message, index) => (
            <div key={message.id} className={`px-4 py-4 ${message.role === "assistant" ? "bg-white/5" : ""}`}>
              <div className="max-w-3xl mx-auto flex space-x-4">
                <div className="flex-shrink-0">
                  {message.role === "assistant" ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {currentCharacter.emoji}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                      나
                    </div>
                  )}
                </div>
                <div className="flex-1 prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-white/90 leading-relaxed mb-3 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic text-white/80">{children}</em>,
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 mb-3 text-white/90">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 mb-3 text-white/90">{children}</ol>
                      ),
                      li: ({ children }) => <li className="text-white/90">{children}</li>,
                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-white">{children}</h3>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="px-4 py-4 bg-white/5">
              <div className="max-w-3xl mx-auto flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {currentCharacter.emoji}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {streamingError && (
            <div className="px-4 py-4">
              <div className="max-w-3xl mx-auto">
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-200 text-sm mb-3">{streamingError}</p>
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isRetrying ? "재시도 중..." : "다시 시도"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 입력 영역 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent backdrop-blur-md">
        {/* 추천 질문 */}
        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="px-4 py-3 border-t border-white/10 h-[60px] flex items-center">
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {suggestedQuestions.slice(0, 6).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestionClick(question)}
                    className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full px-3 py-1 whitespace-nowrap flex-shrink-0"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 입력창 */}
        <div className="px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={customHandleSubmit} className="relative">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 focus-within:border-white/40">
                <Sheet open={showToolsDrawer} onOpenChange={setShowToolsDrawer}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-3 text-white/60 hover:text-white p-2 relative"
                      onClick={() => {
                        setShowToolsDrawer(true)
                        setHasSeenToolsNotification(true)
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      {!hasSeenToolsNotification && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-1 -right-1 h-4 w-8 text-xs px-1 bg-red-500 text-white animate-pulse"
                        >
                          new
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="bg-slate-900/90 border-white/20 backdrop-blur-md">
                    <div className="py-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>
                      <div className="space-y-3">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-white/20 p-4 rounded-lg relative"
                          onClick={() => {
                            setShowCompatibilityTool(true)
                            setShowToolsDrawer(false)
                          }}
                        >
                          <span className="mr-3">💕</span>
                          궁합 보기
                          {!hasSeenToolsNotification && (
                            <Badge
                              variant="destructive"
                              className="ml-auto h-5 w-10 text-xs bg-red-500 text-white animate-pulse"
                            >
                              new
                            </Badge>
                          )}
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask anything"
                  className="flex-1 bg-transparent border-none px-4 py-3 text-white placeholder-white/50 focus:outline-none"
                  disabled={isLoading}
                />

                <Button type="button" variant="ghost" size="sm" className="text-white/60 hover:text-white p-2">
                  <Mic className="h-5 w-5" />
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="mr-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded-full p-2"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 스크롤 하단 버튼 */}
      {showScrollToBottom && (
        <Button
          onClick={scrollToBottomSmooth}
          className="fixed bottom-24 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white z-10"
          size="sm"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* 궁합 도구 모달 */}
      <CompatibilityTool
        isOpen={showCompatibilityTool}
        onClose={() => setShowCompatibilityTool(false)}
        currentSaju={saju}
        currentName={name}
        currentGender={gender}
        currentBirthInfo={birthInfo}
        isLoggedIn={actualIsLoggedIn}
        userId={userId}
        sessionId={databaseSessionId}
        onCompatibilityAnalysis={handleCompatibilityAnalysis}
      />

      {/* 메모리뱅크 */}
      <MemoryBank
        isOpen={showMemoryBank}
        onClose={() => setShowMemoryBank(false)}
        userId={userId}
        sessionId={!userId ? sessionKey : null}
      />

      {/* 로그인 프롬프트 */}
      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={() => router.push("/login")}
        message={loginPromptMessage}
      />

      <CoinPurchaseModal
        isOpen={showCoinPurchase}
        onClose={() => setShowCoinPurchase(false)}
        onSuccess={(coins) => {
          setUserCoins((prev) => prev + coins)
          setShowCoinPurchase(false)
        }}
      />
    </div>
  )
}
