"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { ChevronDown, ArrowLeft, Plus, Settings, User, Database, LogIn, Mic, Send } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import { compressSaju } from "@/lib/saju-compression"
import { memoryService } from "@/lib/memory-service"
import SajuDiagram from "@/components/saju-diagram"
import CompatibilityTool from "@/components/compatibility-tool"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"

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

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOffline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
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
  isLoggedIn: propIsLoggedIn,
  sessionKey,
  birthInfo,
}: SajuChatProps) {
  // 필수 훅 사용
  useHideHeaderAndFooter()
  useForceDarkTheme()
  const isOnline = useNetworkStatus()

  // AuthContext에서 로그인 상태 가져오기
  const { user, isAuthenticated } = useAuth()
  // props의 isLoggedIn과 AuthContext의 isAuthenticated를 모두 확인
  const isLoggedIn = propIsLoggedIn || isAuthenticated
  const userId = user?.id || null

  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isNewUser, setIsNewUser] = useState(true)
  const [messageIds, setMessageIds] = useState<Record<string, string>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showCompatibilityTool, setShowCompatibilityTool] = useState(false)
  const [showToolsDrawer, setShowToolsDrawer] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [databaseSessionId, setDatabaseSessionId] = useState<string | null>(null)
  const [sessionInitialized, setSessionInitialized] = useState(false)

  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState("")
  const [questionCount, setQuestionCount] = useState(0)
  const [hasShownLoginPrompt, setHasShownLoginPrompt] = useState(false)
  const supabase = createClientComponentClient()

  const { activeChatSession, setActiveChatSession, saveChatSession, getChatSession } = useChat()

  const saveMessagesToDatabase = useCallback(
    async (messages: any[], sessionId: string) => {
      if (!sessionId) {
        return
      }

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            messages: messages,
            roomType,
            sajuData: {
              name,
              gender,
              saju,
              birthInfo,
            },
          }),
        })

        if (response.ok) {
          const data = await response.json()

          if (data.messageIds && data.messageIds.length > 0) {
            setTimeout(() => {
              const newMessageIds: Record<string, string> = {}
              const savableMessages = messages.filter((_, index) => index >= 2)
              savableMessages.forEach((msg, index) => {
                if (data.messageIds[index]) {
                  newMessageIds[msg.id] = data.messageIds[index]
                }
              })
              setMessageIds((prev) => ({ ...prev, ...newMessageIds }))
            }, 0)
          }
        }
      } catch (error) {
        console.error("Error saving messages to database:", error)
      }
    },
    [roomType, name, gender, saju, birthInfo],
  )

  const getExistingSessionId = useCallback(async () => {
    if (sessionInitialized || databaseSessionId) {
      return
    }

    try {
      setSessionInitialized(true)

      // 먼저 로컬 스토리지에서 current_saju 데이터 확인
      const currentSajuData = localStorage.getItem("current_saju")
      if (currentSajuData) {
        try {
          const parsedData = JSON.parse(currentSajuData)
          if (parsedData.sessionId) {
            console.log("Found session ID in current_saju:", parsedData.sessionId)
            setDatabaseSessionId(parsedData.sessionId)
            await loadExistingMessages(parsedData.sessionId)
            return
          }
        } catch (e) {
          console.error("Error parsing current_saju data:", e)
        }
      }

      // 로그인된 사용자의 경우 사용자별 세션을 찾음
      if (isLoggedIn && userId) {
        const response = await fetch("/api/saju-sessions", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.sessions && data.sessions.length > 0) {
            // 현재 사주와 매칭되는 세션 찾기
            const matchingSession = data.sessions.find(
              (session: any) => session.name === name && session.gender === gender,
            )

            if (matchingSession) {
              setDatabaseSessionId(matchingSession.id)
              console.log("Found matching session for logged in user:", matchingSession.id)

              // 기존 메시지 로드
              await loadExistingMessages(matchingSession.id)
              return
            }

            // 매칭되는 세션이 없으면 가장 최근 세션 사용
            const recentSession = data.sessions[0]
            setDatabaseSessionId(recentSession.id)
            await loadExistingMessages(recentSession.id)
            return
          }
        }
      }

      // 비로그인 사용자의 경우 로컬 스토리지에서 세션 ID 확인
      const storedSajuData = localStorage.getItem("tempSajuData")
      if (storedSajuData) {
        const sajuData = JSON.parse(storedSajuData)
        if (sajuData.sessionId) {
          setDatabaseSessionId(sajuData.sessionId)
          await loadExistingMessages(sajuData.sessionId)
          return
        }
      }
    }
  } catch (error) {
    console.error("Error getting existing session ID:", error)
  }
}
, [sessionInitialized, databaseSessionId, isLoggedIn, userId, name, gender])

const loadExistingMessages = useCallback(
  async (sessionId: string) => {
    try {
      const response = await fetch(`/api/messages?sessionId=${sessionId}`)

      if (response.ok) {
        const data = await response.json()
        if (data.messages && data.messages.length > 0) {
          console.log(`Loaded ${data.messages.length} existing messages from database`)

          // 메시지를 올바른 형태로 변환
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }))

          // 기존 메시지 로딩 로직은 useAIChat 초기화 시점에서 처리
          console.log("Messages loaded from database")
        }
      }
    } catch (error) {
      console.error("Error loading existing messages:", error)
    }
  },
  [], // messages 의존성 제거
)

useEffect(() => {
  if (isLoggedIn && !sessionInitialized) {
    getExistingSessionId()
  }
}, [isLoggedIn, sessionInitialized, getExistingSessionId])
\
const messagesEndRef = useRef<HTMLDivElement>(null)
const inputRef = useRef<HTMLInputElement>(null)
const chatContainerRef = useRef<HTMLDivElement>(null)
const [isInitialized, setIsInitialized] = useState(false)
const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
  initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general,
)
const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
const [lastMessageTime, setLastMessageTime] = useState<Date>(new Date())
const [lastMessageId, setLastMessageId] = useState<string>("")
const [shouldGenerateQuestions, setShouldGenerateQuestions] = useState(true)
const [showSajuInfo, setShowSajuInfo] = useState(false)
const [streamingError, setStreamingError] = useState<string | null>(null)
const [isRetrying, setIsRetrying] = useState(false)
const [retryCount, setRetryCount] = useState(0)

const currentCharacter = pingCharacters.find((char) => char.roomType === roomType) || pingCharacters[0]

const handleCharacterChange = (newCharacter: (typeof pingCharacters)[0]) => {
  if (newCharacter.roomType === roomType) return

  try {
    const currentSajuData = {
      saju,
      name,
      gender,
      interpretation: initialInterpretation,
      birthInfo,
    }
    localStorage.setItem("current_saju", JSON.stringify(currentSajuData))

    router.push(`/saju-chat/${newCharacter.roomType}`)
  } catch (error) {
    console.error("Error changing character:", error)
  }
}

const checkResponseQuality = useCallback((content: string) => {
  if (content.length < 100) {
    return {
      isGoodQuality: false,
      reason: "응답이 너무 짧습니다.",
    }
  }

  if (
    content.endsWith("...") ||
    content.endsWith("…") ||
    content.endsWith(",") ||
    content.endsWith("하지만") ||
    content.endsWith("그러나") ||
    content.endsWith("따라서")
  ) {
    return {
      isGoodQuality: false,
      reason: "응답이 완전하지 않습니다.",
    }
  }

  return { isGoodQuality: true }
}, [])

const savedSession = activeChatSession || getChatSession(sessionKey)

useEffect(() => {
  const hasExistingSession = savedSession?.messages && savedSession.messages.length > 0
  setIsNewUser(!hasExistingSession)
}, [savedSession, setIsNewUser])

let initialMessages: any[] = []
if (savedSession?.messages) {
  initialMessages = savedSession.messages
} else if (roomType === "sajuping") {
  try {
    initialMessages = generateSajupingInitialMessages(name, saju, birthInfo)
  } catch (error) {
    console.error("Error generating sajuping initial messages:", error)
    initialMessages = [
      {
        id: "welcome",
        role: "assistant" as const,
        content: getInitialMessageByRoomType(name, roomType, birthInfo),
      },
    ]
  }
} else {
  initialMessages = [
    {
      id: "welcome",
      role: "assistant" as const,
      content: getInitialMessageByRoomType(name, roomType, birthInfo),
    },
  ]
}

// 메모리 컨텍스트 생성
const getMemoryContext = useCallback(() => {
  if (!userId) return ""
  return memoryService.generateContextSummary(userId)
}, [userId])

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
  initialMessages,
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
    const qualityCheck = checkResponseQuality(message.content)

    if (!qualityCheck.isGoodQuality && retryCount < 2) {
      setRetryCount((prev) => prev + 1)
      setTimeout(() => {
        reload()
      }, 1000)
      return
    }

    const updatedMessages = [...messages, message]

    // 데이터베이스에 메시지 저장 (로그인된 사용자의 경우)
    if (databaseSessionId && isLoggedIn) {
      try {
        await saveMessagesToDatabase(updatedMessages, databaseSessionId)
        console.log("Messages saved to database successfully")
      } catch (error) {
        console.error("Failed to save messages to database:", error)
      }
    }

    // 로컬 세션에도 저장
    const currentSessionKey = sessionKey || generateChatSessionKey(name, saju, roomType)
    const sessionData = {
      saju,
      name,
      gender,
      interpretation: initialInterpretation,
      roomType,
      messages: updatedMessages,
      lastMessageTime: new Date().toISOString(),
      birthInfo,
      databaseSessionId, // 데이터베이스 세션 ID도 저장
    }

    try {
      saveChatSession(currentSessionKey, sessionData)
      setActiveChatSession(sessionData)
    } catch (saveError) {
      console.error("Error saving chat session to localStorage:", saveError)
    }

    const newTime = new Date()
    setLastMessageTime(newTime)
    setLastMessageId(message.id)

    setShouldGenerateQuestions(true)
    setStreamingError(null)
    setRetryCount(0)
  },
  onError: (error) => {
    console.error("Chat error:", error)

    let errorMessage = "응답 생성 중 오류가 발생했습니다."

    if (error.message) {
      errorMessage = error.message

      if (error.message.includes("network") || error.message.includes("fetch")) {
        errorMessage = "네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요."
      } else if (error.message.includes("timeout")) {
        errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요."
      } else if (error.message.includes("model")) {
        errorMessage = "AI 모델 로딩 중 오류가 발생했습니다. 다시 시도해주세요."
      } else if (error.message.includes("parse") || error.message.includes("JSON")) {
        errorMessage = "응답 처리 중 오류가 발생했습니다. 다시 시도해주세요."
      }
    }

    setStreamingError(errorMessage)
    setShouldGenerateQuestions(true)
  },
  onResponse: (response) => {
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
  options: {
    timeout: 60000,
  },
})

const handleRetry = useCallback(() => {
  if (retryCount >= 3) {
    setStreamingError("여러 번 재시도했으나 계속 오류가 발생합니다. 잠시 후 다시 시도해주세요.")
    return
  }

  setIsRetrying(true)
  setStreamingError(null)
  setRetryCount((prev) => prev + 1)

  try {
    const lastUserMessageIndex = [...messages].reverse().findIndex((msg) => msg.role === "user")

    if (lastUserMessageIndex !== -1) {
      const lastUserMessage = [...messages].reverse()[lastUserMessageIndex]

      append({
        role: "user",
        content: lastUserMessage.content,
      })
    } else {
      reload()
    }
  } catch (error) {
    console.error("Error in retry handler:", error)
    setStreamingError("재시도 중 오류가 발생했습니다. 페이지를 새로고침해주세요.")
  } finally {
    setIsRetrying(false)
  }
}, [messages, append, reload, retryCount])

const originalHandleSubmit = aiHandleSubmit

const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()

  if (!input.trim()) {
    return
  }

  const newQuestionCount = questionCount + 1
  setQuestionCount(newQuestionCount)

  // 로그인 프롬프트 로직
  const shouldShowLoginPrompt = newQuestionCount >= 5 && !isLoggedIn && !hasShownLoginPrompt
  if (shouldShowLoginPrompt) {
    setLoginPromptMessage("5개의 질문을 모두 사용하셨습니다. 로그인하시면 무제한으로 질문하실 수 있습니다.")
    setShowLoginPrompt(true)
    setHasShownLoginPrompt(true)
  }

  setShouldGenerateQuestions(false)
  setStreamingError(null)
  setRetryCount(0)

  // 메시지 전송만 하고 saveUserMessage는 onFinish에서 처리
  originalHandleSubmit(e)
}

const handleBackWithSave = () => {
  try {
    console.log("handleBackWithSave called")

    // 세션 저장
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

    // 로컬 스토리지에 마지막 사주 데이터 저장
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

    // 마이페이지에서 온 경우 체크
    const fromMyPage = sessionStorage.getItem("from_mypage") === "true"
    console.log("fromMyPage:", fromMyPage)

    // 세션 스토리지 클리어 (먼저 클리어)
    sessionStorage.removeItem("from_mypage")

    if (fromMyPage) {
      console.log("Returning to mypage via window.location")
      // 즉시 리디렉션하지 말고 약간의 지연을 둠
      setTimeout(() => {
        window.location.href = "/mypage"
      }, 100)
    } else {
      console.log("Calling onBack function")
      // onBack 함수가 있는지 확인
      if (typeof onBack === "function") {
        onBack()
      } else {
        console.log("onBack is not a function, redirecting to home")
        setTimeout(() => {
          window.location.href = "/"
        }, 100)
      }
    }
  } catch (error) {
    console.error("뒤로가기 처리 중 오류:", error)
    // 오류 발생 시 기본 동작
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

const generateSuggestedQuestions = useCallback(async () => {
  if (!shouldGenerateQuestions || isGeneratingQuestions || messages.length < 2) {
    return
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role !== "assistant") {
    return
  }

  setIsGeneratingQuestions(true)
  setShouldGenerateQuestions(false)

  try {
    const defaultQuestions = initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general

    const response = await fetch("/api/suggested-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages.slice(-6),
        roomType,
        saju,
        name,
        currentContext: lastMessage.content.slice(0, 500),
        birthInfo,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setSuggestedQuestions(data.questions.filter((q) => q.length > 5 && q.length < 50))
      } else {
        setSuggestedQuestions(defaultQuestions)
      }
    } else {
      setSuggestedQuestions(defaultQuestions)
    }
  } catch (error) {
    console.error("추천 질문 생성 오류:", error)
    setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
  } finally {
    setIsGeneratingQuestions(false)
  }
}, [messages, roomType, shouldGenerateQuestions, isGeneratingQuestions, birthInfo, saju, name])

// 추천 질문 생성
useEffect(() => {
  if (shouldGenerateQuestions && !isGeneratingQuestions && messages.length > 0) {
    generateSuggestedQuestions()
  }
}, [shouldGenerateQuestions, isGeneratingQuestions, messages, generateSuggestedQuestions])

const handleCompatibilityAnalysis = (mainPerson: any, selectedPeople: any[]) => {
  // 궁합 분석 결과를 채팅에 추가
  const compatibilityMessage = `궁합 분석을 시작합니다. ${mainPerson.name}님과 ${selectedPeople.map((p) => p.name).join(", ")}님의 궁합을 분석해주세요.`

  append({
    role: "user",
    content: compatibilityMessage,
  })
}

const scrollToBottom = () => {
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
  }
}

useEffect(() => {
  if (chatContainerRef.current && !isNewUser) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200

    if (isNearBottom) {
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }
}, [messages, isNewUser])

useEffect(() => {
  if (!isInitialized) {
    setTimeout(() => {
      if (!isNewUser) {
        scrollToBottom()
      }
      setIsInitialized(true)
    }, 100)
  }
}, [isInitialized, isNewUser])

const handleScroll = useCallback(() => {
  if (chatContainerRef.current) {
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    setShowScrollToBottom(!isNearBottom)
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

return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* 개선된 헤더 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackWithSave}
            className="mr-2 text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-white hover:text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-200"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-lg">{currentCharacter.emoji}</span>
              <span className="font-medium">{currentCharacter.name}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </Button>

            {isDropdownOpen && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
                <div className="py-2">
                  {pingCharacters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => {
                        handleCharacterChange(character)
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
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isLoggedIn ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/mypage")}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                title="마이페이지"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  /* 메모리뱅크 기능 */
                }}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                title="메모리뱅크"
              >
                <Database className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
              title="로그인"
            >
              <LogIn className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <div className="pb-32 pt-6">
          {/* 사주 다이어그램 - 개선된 스타일 */}
          <div className="px-4 mb-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
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
                  showSibseong={true}
                  showYearAnimal={true}
                />
              </div>
            </div>
          </div>

          {messages.map((message, index) => (
            <div key={message.id} className={`px-4 py-4 ${message.role === "assistant" ? "bg-white/5" : ""}`}>
              <div className="max-w-3xl mx-auto flex space-x-4">
                <div className="flex-shrink-0">
                  {message.role === "assistant" ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {currentCharacter.emoji}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">
                      나
                    </div>
                  )}
                </div>
                <div className="flex-1 prose prose-invert max-w-none">
                  {message.content.split("\n").map((line, i) => (
                    <p key={i} className={`${i === 0 ? "mt-0" : ""} text-white/90 leading-relaxed`}>
                      {line || "\u00A0"}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="px-4 py-4 bg-white/5">
              <div className="max-w-3xl mx-auto flex space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
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

          {streamingError && (
            <div className="px-4 py-4">
              <div className="max-w-3xl mx-auto">
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 backdrop-blur-md">
                  <p className="text-red-200 text-sm mb-3">{streamingError}</p>
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
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
        {/* 추천 질문 영역 */}
        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="px-4 py-3 border-t border-white/10">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestionClick(question)}
                    className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full px-3 py-1 backdrop-blur-md transition-all duration-200"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 입력 영역 */}
        <div className="px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={customHandleSubmit} className="relative">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 focus-within:border-white/40 shadow-xl transition-all duration-200">
                <Button type="button" variant="ghost" size="sm" className="ml-3 text-white/60 hover:text-white p-2">
                  <Plus className="h-5 w-5" />
                </Button>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="text-white/60 hover:text-white p-2">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="bg-slate-900/90 border-white/20 backdrop-blur-md">
                    <div className="py-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Tools</h3>
                      <div className="space-y-3">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-white/20 p-4 rounded-lg"
                          onClick={() => {
                            setShowCompatibilityTool(true)
                          }}
                        >
                          <span className="mr-3">💕</span>
                          궁합 보기
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-white/20 p-4 rounded-lg"
                          onClick={() => {
                            router.push("/daily-fortune")
                          }}
                        >
                          <span className="mr-3">🔮</span>
                          오늘의 운세
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

                <Button type="button" variant="ghost" size="sm" className="mr-2 text-white/60 hover:text-white p-2">
                  <Mic className="h-5 w-5" />
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="mr-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 rounded-full p-2 shadow-lg transition-all duration-200"
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
          className="fixed bottom-24 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white shadow-lg z-10 backdrop-blur-md border border-white/20 transition-all duration-200"
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
        isLoggedIn={isLoggedIn}
        userId={userId}
        onCompatibilityAnalysis={handleCompatibilityAnalysis}
      />
    </div>
  )
}
