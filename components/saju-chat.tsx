"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { ChevronDown, ArrowLeft, Settings, User, Database, Mic, Send } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import { compressSaju } from "@/lib/saju-compression"
import { memoryService } from "@/lib/memory-service"
import SajuDiagram from "@/components/saju-diagram"
import CompatibilityTool from "@/components/compatibility-tool"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"

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

// 마크다운 렌더링 함수 추가 (handleCompatibilityAnalysis 함수 위에)
const renderMarkdown = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-white/90">$1</em>')
    .replace(
      /### (.*?)(\n|$)/g,
      '<h3 class="text-lg font-bold text-white mb-2 mt-4 border-b border-white/20 pb-1">$1</h3>',
    )
    .replace(
      /## (.*?)(\n|$)/g,
      '<h2 class="text-xl font-bold text-white mb-3 mt-4 border-b border-white/30 pb-2">$1</h2>',
    )
    .replace(
      /# (.*?)(\n|$)/g,
      '<h1 class="text-2xl font-bold text-white mb-4 mt-4 border-b border-white/40 pb-2">$1</h1>',
    )
    .replace(
      /• (.*?)(\n|$)/g,
      '<div class="flex items-start ml-4 mb-1"><span class="text-purple-400 mr-2 mt-1">•</span><span class="text-white/90 flex-1">$1</span></div>',
    )
    .replace(
      /(\d+)\. (.*?)(\n|$)/g,
      '<div class="flex items-start ml-4 mb-1"><span class="text-purple-400 mr-2 mt-1 font-semibold">$1.</span><span class="text-white/90 flex-1">$2</span></div>',
    )
}

// 궁합 키워드 감지 및 자동 안내 함수
const detectCompatibilityKeywords = (message: string): boolean => {
  const keywords = ["궁합", "궁합보기", "상성", "사주궁합", "연인궁합", "부부궁합", "친구궁합", "동료궁합"]
  return keywords.some((keyword) => message.includes(keyword))
}

const generateCompatibilityGuideMessage = (): string => {
  const responses = [
    `아, 궁합이 궁금하시군요! 😊 채팅창 하단에 있는 설정 버튼(⚙️)을 눌러보세요. 거기에 "궁합 보기" 메뉴가 있어요. 상대방의 생년월일만 입력해주시면 바로 사주 궁합을 분석해드릴게요! 💕`,

    `궁합 분석이 필요하시네요! 🔮 화면 하단 입력창 왼쪽에 있는 도구 아이콘을 터치해보세요. "궁합 보기"를 선택하시고 상대방 정보를 입력하시면 상세한 궁합 분석을 해드려요! ✨`,

    `오, 궁합이 궁금하시군요! 💫 아래쪽 채팅 입력창 옆에 작은 설정 버튼이 보이시죠? 그걸 누르시면 "궁합 보기" 기능이 있어요. 거기서 상대방 생년월일을 넣어주시면 제가 자세히 분석해드릴게요! 🎯`,

    `궁합 보고 싶으시네요! 😄 입력창 왼쪽에 있는 도구 버튼(⚙️)을 눌러보세요. "궁합 보기"에서 상대방의 생년월일과 시간을 입력하시면 사주 기반으로 정확한 궁합을 알려드려요! 🌟`,
  ]

  return responses[Math.floor(Math.random() * responses.length)]
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
  const [hasSeenToolsNotification, setHasSeenToolsNotification] = useState(false)
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

  // 툴 알림 확인 상태 로드
  useEffect(() => {
    const hasSeenNotification = localStorage.getItem("hasSeenToolsNotification") === "true"
    setHasSeenToolsNotification(hasSeenNotification)
  }, [])

  // 툴 드로어 열 때 알림 상태 업데이트
  const handleToolsDrawerOpen = () => {
    setShowToolsDrawer(true)
    if (!hasSeenToolsNotification) {
      setHasSeenToolsNotification(true)
      localStorage.setItem("hasSeenToolsNotification", "true")
    }
  }

  // 오늘의 운세 요청 함수
  const handleTodaysFortune = () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`

    // 사용자의 일간지 정보 추출
    const dayMaster = saju.dayStem + saju.dayBranch

    const fortuneMessage = `오늘(${todayStr})의 운세를 알려주세요.

제 사주 정보:
- 일간지: ${dayMaster}
- 성별: ${gender === "male" ? "남성" : "여성"}
- 오행 분포: 목${saju.elements?.wood || 0} 화${saju.elements?.fire || 0} 토${saju.elements?.earth || 0} 금${saju.elements?.metal || 0} 수${saju.elements?.water || 0}

다음 내용을 포함해서 오늘의 운세를 분석해주세요:
1. 전체 운세 (오늘의 기운과 나의 사주 궁합)
2. 연애운 (만남, 관계 발전 등)
3. 직업운 (업무, 성과, 인간관계 등)
4. 재물운 (금전, 투자, 소비 등)
5. 건강운 (컨디션, 주의사항 등)
6. 오늘의 행운 색상과 방향
7. 오늘 주의할 점과 조언

구체적이고 실용적인 조언을 부탁드립니다.`

    append({
      role: "user",
      content: fortuneMessage,
    })

    setShowToolsDrawer(false)
  }

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
    } catch (error) {
      console.error("Error getting existing session ID:", error)
    }
  }, [sessionInitialized, databaseSessionId, isLoggedIn, userId, name, gender])

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
  }, [savedSession])

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

    // 궁합 키워드 감지
    if (detectCompatibilityKeywords(input.trim())) {
      // 사용자 메시지 먼저 추가
      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content: input.trim(),
      }

      // 자동 안내 메시지 생성
      const guideMessage = {
        id: `guide-${Date.now()}`,
        role: "assistant" as const,
        content: generateCompatibilityGuideMessage(),
      }

      // 메시지 추가 (useAIChat의 setMessages 대신 직접 추가)
      const updatedMessages = [...messages, userMessage, guideMessage]

      // 로컬 세션에 저장
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
        databaseSessionId,
      }

      try {
        saveChatSession(currentSessionKey, sessionData)
        setActiveChatSession(sessionData)
      } catch (saveError) {
        console.error("Error saving chat session:", saveError)
      }

      // 입력창 초기화
      setInput("")

      // 스크롤 하단으로
      setTimeout(() => {
        scrollToBottom()
      }, 100)

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

    // 일반 메시지 전송
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
    console.log("handleCompatibilityAnalysis called in saju-chat")
    console.log("mainPerson received:", mainPerson)
    console.log("selectedPeople received:", selectedPeople)

    try {
      // 궁합 분석 메시지 생성 - 데이터 구조에 맞게 수정
      const peopleNames = selectedPeople.map((p) => p.name).join(", ")

      // 일주 정보 추출 - 다양한 데이터 구조에 대응
      const getIlju = (person: any) => {
        // 압축된 사주 데이터 구조
        if (person.sajuPalja && person.sajuPalja.day) {
          return `${person.sajuPalja.day.stem}${person.sajuPalja.day.branch}`
        }
        // 기본 사주 데이터 구조
        if (person.dayStem && person.dayBranch) {
          return `${person.dayStem}${person.dayBranch}`
        }
        // dayMaster가 있는 경우
        if (person.dayMaster) {
          return `${person.dayMaster}일주`
        }
        return "정보 없음"
      }

      const mainPersonIlju = getIlju(mainPerson)
      const selectedPeopleInfo = selectedPeople.map((p) => `- ${p.name}: ${getIlju(p)}일주`).join("\n")

      const compatibilityMessage = `${mainPerson.name}님과 ${peopleNames}님의 사주 궁합을 자세히 분석해주세요. 

다음 정보를 포함해서 분석해주세요:
1. 일간 궁합 (천간 상성)
2. 오행 궁합 (오행 보완 관계)
3. 십이지 궁합 (지지 상성)
4. 성격 및 가치관 궁합
5. 관계 발전 가능성
6. 주의사항 및 조언
7. 궁합 점수 (100점 만점)

각 사람의 사주 정보:
- ${mainPerson.name}: ${mainPersonIlju}일주
${selectedPeopleInfo}

상세하고 구체적인 분석을 부탁드립니다.`

      console.log("Sending compatibility message:", compatibilityMessage)

      // 메시지를 채팅에 추가
      append({
        role: "user",
        content: compatibilityMessage,
      })

      console.log("Compatibility message appended to chat")

      // 궁합 도구 닫기
      setShowCompatibilityTool(false)
    } catch (error) {
      console.error("Error in handleCompatibilityAnalysis:", error)
      alert("궁합 분석 요청 중 오류가 발생했습니다: " + error.message)
    }
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
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-2xl transition-shadow duration-300 ease-in-out">
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
              <>
                {/* 배경 오버레이 */}
                <div className="fixed inset-0 z-[99998]" onClick={() => setIsDropdownOpen(false)} />
                {/* 드롭다운 */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-[99999]">
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
              </>
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
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-white border-white/30 hover:bg-white/20 hover:text-white hover:border-white/50 px-3 py-1 rounded-lg transition-all duration-200 text-sm"
            >
              로그인
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
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl transition-shadow duration-300 ease-in-out hover:shadow-3xl">
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
                  {message.content.split("\n").map((line, i) => {
                    const renderedLine = renderMarkdown(line || "\u00A0")
                    return (
                      <div
                        key={i}
                        className={`${i === 0 ? "mt-0" : "mt-2"} text-white/90 leading-relaxed`}
                        dangerouslySetInnerHTML={{ __html: renderedLine }}
                      />
                    )
                  })}
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
          <div className="px-4 py-3 border-t border-white/10 h-[60px] flex items-center">
            <div className="max-w-3xl mx-auto w-full">
              <div
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {suggestedQuestions.slice(0, 6).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestionClick(question)}
                    className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full px-3 py-1 backdrop-blur-md transition-all duration-200 whitespace-nowrap flex-shrink-0"
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
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 focus-within:border-white/40 shadow-2xl transition-all duration-300 ease-in-out">
                <Sheet open={showToolsDrawer} onOpenChange={setShowToolsDrawer}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-3 text-white/60 hover:text-white p-2 relative"
                      onClick={handleToolsDrawerOpen}
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
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-white/20 p-4 rounded-lg"
                          onClick={handleTodaysFortune}
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

                <Button type="button" variant="ghost" size="sm" className="text-white/60 hover:text-white p-2">
                  <Mic className="h-5 w-5" />
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="mr-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-400 rounded-full p-2 shadow-lg transition-all duration-300 ease-in-out"
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
          className="fixed bottom-24 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white shadow-2xl z-10 backdrop-blur-md border border-white/20 transition-all duration-300 ease-in-out hover:shadow-3xl"
          size="sm"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* 궁합 도구 모달 */}
      <CompatibilityTool
        isOpen={showCompatibilityTool}
        onClose={() => {
          console.log("Closing compatibility tool")
          setShowCompatibilityTool(false)
        }}
        currentSaju={saju}
        currentName={name}
        currentGender={gender}
        currentBirthInfo={birthInfo}
        isLoggedIn={isLoggedIn}
        userId={userId}
        onCompatibilityAnalysis={(mainPerson, selectedPeople) => {
          console.log("onCompatibilityAnalysis prop called")
          handleCompatibilityAnalysis(mainPerson, selectedPeople)
        }}
      />
    </div>
  )
}
