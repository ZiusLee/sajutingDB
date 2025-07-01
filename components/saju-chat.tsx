"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "@/next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useChat as useAIChat } from "ai/react"
import { compressSaju } from "@/lib/saju-compression"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import type { BirthInfo } from "@/types/birth-info"

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

// 정적 함수들을 컴포넌트 외부로 이동
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

function getInitialMessageByRoomType(name: string, roomType: string, birthInfo?: BirthInfo): string {
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

function convertDaeunData(daeunData: any) {
  if (!daeunData) {
    return []
  }

  if (daeunData.pillars && Array.isArray(daeunData.pillars)) {
    return daeunData.pillars
      .map((pillar: any, index: number) => {
        if (!pillar) return null

        return {
          age: pillar.startAge || index * 10,
          startYear: pillar.startAge
            ? new Date().getFullYear() - 25 + pillar.startAge
            : new Date().getFullYear() + index * 10,
          endYear: pillar.endAge
            ? new Date().getFullYear() - 25 + pillar.endAge
            : new Date().getFullYear() + index * 10 + 9,
          stem: pillar.stem || "",
          branch: pillar.branch || "",
          stemHanja: pillar.stemHanja || pillar.stem || "",
          branchHanja: pillar.branchHanja || pillar.branch || "",
          description: `${pillar.stem || ""}${pillar.branch || ""} 대운 (${pillar.startAge || index * 10}-${pillar.endAge || index * 10 + 9}세)`,
        }
      })
      .filter(Boolean)
  }

  if (Array.isArray(daeunData)) {
    return daeunData
      .map((item: any, index: number) => {
        if (!item) return null

        return {
          age: item.age || index * 10,
          startYear: item.startYear || new Date().getFullYear() + index * 10,
          endYear: item.endYear || new Date().getFullYear() + index * 10 + 9,
          stem: item.stem || "",
          branch: item.branch || "",
          stemHanja: item.stemHanja || item.stem || "",
          branchHanja: item.branchHanja || item.branch || "",
          description: item.description || `${item.stem || ""}${item.branch || ""} 대운`,
        }
      })
      .filter(Boolean)
  }

  return []
}

function createInitialMessages(name: string, roomType: string, birthInfo?: BirthInfo) {
  if (roomType === "sajuping") {
    return [
      {
        id: "saju-analysis",
        role: "assistant" as const,
        content: getInitialMessageByRoomType(name, "sajuping", birthInfo),
      },
      {
        id: "consultation-start",
        role: "assistant" as const,
        content: `오늘은 어떤 것이 궁금하세요? 😊`,
      },
    ]
  } else {
    return [
      {
        id: "welcome",
        role: "assistant" as const,
        content: getInitialMessageByRoomType(name, roomType, birthInfo),
      },
    ]
  }
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
  // 컴포넌트 마운트 상태 추적
  const mountedRef = useRef(true)
  const initRef = useRef(false)
  
  // useAuth를 완전히 제거하고 Supabase를 직접 사용
  const [authUser, setAuthUser] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authInitialized, setAuthInitialized] = useState(false)
  
  // 컴포넌트 상태들
  const [isReady, setIsReady] = useState(false)
  const [dbMessages, setDbMessages] = useState<any[]>([])
  const [databaseSessionId, setDatabaseSessionId] = useState<string | null>(null)
  
  // UI 상태들
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [messageIds, setMessageIds] = useState<Record<string, string>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showCompatibilityTool, setShowCompatibilityTool] = useState(false)
  const [showToolsDrawer, setShowToolsDrawer] = useState(false)
  const [hasSeenToolsNotification, setHasSeenToolsNotification] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [hasShownLoginPrompt, setHasShownLoginPrompt] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState("")
  const [streamingError, setStreamingError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAutoScrolling = useRef(false)
  const lastMessageLength = useRef(0)
  const supabaseRef = useRef(createClientComponentClient())

  const router = useRouter()

  // 정적 값들을 미리 계산
  const currentCharacter = useMemo(() => 
    pingCharacters.find((char) => char.roomType === roomType) || pingCharacters[0]
  , [roomType])
  
  const suggestedQuestions = useMemo(() => 
    initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general
  , [roomType])

  // 인증 상태 초기화 - 한 번만 실행
  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      try {
        const supabase = supabaseRef.current
        const { data: { user } } = await supabase.auth.getUser()
        
        if (mounted) {
          setAuthUser(user)
          setIsAuthenticated(!!user)
          setAuthInitialized(true)
        }
      } catch (error) {
        console.error("Auth init error:", error)
        if (mounted) {
          setAuthUser(null)
          setIsAuthenticated(false)
          setAuthInitialized(true)
        }
      }
    }

    initAuth()

    // Auth state listener
    const { data: { subscription } } = supabaseRef.current.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setAuthUser(session?.user || null)
        setIsAuthenticated(!!session?.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // 빈 의존성 배열

  // Separate stableBirthInfo memoization to prevent object recreation
  const stableBirthInfo = useMemo(() => {
    if (!birthInfo) return null
    
    return {
      solarYear: birthInfo.solarYear,
      solarMonth: birthInfo.solarMonth,
      solarDay: birthInfo.solarDay,
      solarHour: birthInfo.solarHour,
      solarMinute: birthInfo.solarMinute,
      timeUnknown: birthInfo.timeUnknown,
      lunarYear: birthInfo.lunarYear,
      lunarMonth: birthInfo.lunarMonth,
      lunarDay: birthInfo.lunarDay
    }
  }, [
    birthInfo?.solarYear,
    birthInfo?.solarMonth,
    birthInfo?.solarDay,
    birthInfo?.solarHour,
    birthInfo?.solarMinute,
    birthInfo?.timeUnknown,
    birthInfo?.lunarYear,
    birthInfo?.lunarMonth,
    birthInfo?.lunarDay
  ])

  // Simplified computedValues using stable birthInfo reference
  const computedValues = useMemo(() => {
    const userId = authUser?.id || null
    const actualIsLoggedIn = isAuthenticated || isLoggedIn
    
    // 대운 계산
    let calculatedDaeun = null
    try {
      if (
        saju?.daeun &&
        saju.daeun.pillars &&
        Array.isArray(saju.daeun.pillars) &&
        saju.daeun.pillars.length > 0 &&
        !saju.daeun.pillars.every((p: any) => p?.stem === "갑" && p?.branch === "자")
      ) {
        calculatedDaeun = saju.daeun
      } else if (
        saju?.yearStem &&
        saju?.monthStem &&
        saju?.monthBranch &&
        stableBirthInfo?.solarYear &&
        stableBirthInfo?.solarMonth &&
        stableBirthInfo?.solarDay &&
        gender
      ) {
        calculatedDaeun = calculateDaeunInfo(
          {
            yearStem: saju.yearStem,
            monthStem: saju.monthStem,
            monthBranch: saju.monthBranch,
          },
          stableBirthInfo.solarYear,
          stableBirthInfo.solarMonth,
          stableBirthInfo.solarDay,
          gender,
          stableBirthInfo.timeUnknown ? undefined : stableBirthInfo.solarHour,
          stableBirthInfo.timeUnknown ? undefined : stableBirthInfo.solarMinute,
          stableBirthInfo.timeUnknown || false,
        )
      }
    } catch (error) {
      console.error("대운 계산 중 오류:", error)
    }

    // 압축된 사주
    let compressedSaju = ""
    try {
      compressedSaju = compressSaju(
        saju,
        stableBirthInfo?.solarYear?.toString(),
        stableBirthInfo?.solarMonth?.toString(),
        stableBirthInfo?.solarDay?.toString(),
        stableBirthInfo?.solarHour?.toString(),
        stableBirthInfo?.solarMinute?.toString(),
        stableBirthInfo?.timeUnknown,
      )
    } catch (error) {
      console.error("사주 압축 중 오류:", error)
    }

    return {
      userId,
      actualIsLoggedIn,
      calculatedDaeun,
      compressedSaju
    }
  }, [
    authUser?.id,
    isAuthenticated,
    isLoggedIn,
    stableBirthInfo, // Use stable reference
    saju?.yearStem,
    saju?.monthStem,
    saju?.monthBranch,
    saju?.dayMaster,
    gender
  ])

  // 초기 메시지를 메모화
  const initialMessages = useMemo(() => {
    return createInitialMessages(name, roomType, stableBirthInfo)
  }, [name, roomType, stableBirthInfo])

  // 최종 메시지 배열
  const finalInitialMessages = useMemo(() => {
    return dbMessages.length > 0 ? dbMessages : initialMessages
  }, [dbMessages, initialMessages])

  // AI Chat body를 메모화
  const aiChatBody = useMemo(() => ({
    compressedSaju: computedValues.compressedSaju,
    name,
    gender,
    initialInterpretation,
    roomType,
    userId: computedValues.userId,
    currentYear: 2025,
    yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
    birthInfo: stableBirthInfo,
  }), [
    computedValues.compressedSaju,
    name,
    gender,
    initialInterpretation,
    roomType,
    computedValues.userId,
    stableBirthInfo
  ])

  // 채팅 초기화 - 인증 완료 후 한 번만 실행
  useEffect(() => {
    if (!authInitialized || initRef.current) return
    
    let mounted = true
    initRef.current = true

    const initializeChat = async () => {
      try {
        // 세션 ID 가져오기
        let sessionId = null

        const currentSajuData = localStorage.getItem("current_saju")
        if (currentSajuData) {
          try {
            const sajuData = JSON.parse(currentSajuData)
            sessionId = sajuData.sessionId
          } catch (e) {
            console.error("Failed to parse current_saju:", e)
          }
        }

        if (!sessionId && computedValues.actualIsLoggedIn && computedValues.userId) {
          try {
            const { data: sessions, error } = await supabaseRef.current
              .from("saju_sessions")
              .select("id, name, created_at")
              .eq("auth_user_id", computedValues.userId)
              .eq("name", name)
              .order("created_at", { ascending: false })
              .limit(1)

            if (!error && sessions && sessions.length > 0) {
              sessionId = sessions[0].id
            }
          } catch (e) {
            console.error("Failed to fetch sessions:", e)
          }
        }

        if (!sessionId) {
          try {
            const storedSajuData = localStorage.getItem("tempSajuData")
            if (storedSajuData) {
              const sajuData = JSON.parse(storedSajuData)
              sessionId = sajuData.sessionId
            } else {
              sessionId = localStorage.getItem("user_id")
            }
          } catch (e) {
            console.error("Failed to get fallback session ID:", e)
          }
        }

        if (mounted) {
          setDatabaseSessionId(sessionId)
        }

        // DB에서 메시지 로드 시도
        if (sessionId) {
          try {
            const response = await fetch(`/api/messages?sessionId=${sessionId}`)
            if (response.ok) {
              const data = await response.json()
              const messages = data.messages || []

              if (mounted && messages.length > 0) {
                const formattedMessages = messages.map((msg: any) => ({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                }))
                setDbMessages(formattedMessages)
              }
            }
          } catch (error) {
            console.error("메시지 로드 오류:", error)
          }
        }

        if (mounted) {
          setIsReady(true)
        }
      } catch (error) {
        console.error("초기화 오류:", error)
        if (mounted) {
          setIsReady(true)
        }
      }
    }

    initializeChat()

    return () => {
      mounted = false
    }
  }, [authInitialized]) // Only depend on authInitialized

  // 메시지 저장 함수
  const saveMessagesToDatabase = useCallback(
    async (messagesToSave: any[], sessionId: string) => {
      if (!sessionId || !messagesToSave || messagesToSave.length === 0) {
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
            messages: messagesToSave,
            roomType,
            sajuData: {
              name,
              gender,
              saju,
              birthInfo: stableBirthInfo,
            },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.messageIds && data.messageIds.length > 0) {
            const newMessageIds: Record<string, string> = {}
            messagesToSave.forEach((msg, index) => {
              if (data.messageIds[index]) {
                newMessageIds[msg.id] = data.messageIds[index]
              }
            })
            setMessageIds((prev) => ({ ...prev, ...newMessageIds }))
          }
        }
      } catch (error) {
        console.error("DB 저장 오류:", error)
      }
    },
    [roomType, name, gender, saju, stableBirthInfo],
  )

  // useAIChat 핸들러들
  const onFinishHandler = useCallback(async (message: any) => {
    try {
      if (databaseSessionId) {
        await saveMessagesToDatabase([message], databaseSessionId)
      }
      setStreamingError(null)
      setRetryCount(0)
      setIsSubmitting(false)
    } catch (error) {
      console.error("onFinish 핸들러 오류:", error)
      setIsSubmitting(false)
    }
  }, [databaseSessionId, saveMessagesToDatabase])

  const onErrorHandler = useCallback((error: Error) => {
    console.error("채팅 오류:", error)
    setStreamingError("응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.")
    setIsSubmitting(false)
  }, [])

  const onResponseHandler = useCallback((response: Response) => {
    setStreamingError(null)
  }, [])

  // useAIChat 초기화
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
    initialMessages: isReady ? finalInitialMessages : [],
    body: aiChatBody,
    onFinish: onFinishHandler,
    onError: onErrorHandler,
    onResponse: onResponseHandler,
  })

  // 스크롤 처리
  useEffect(() => {
    const scrollContainer = chatContainerRef.current
    if (scrollContainer && messages.length > lastMessageLength.current) {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
      lastMessageLength.current = messages.length

      if (isNearBottom) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages.length])

  // 이벤트 핸들러들
  const customHandleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim() || isSubmitting || isLoading) {
      return
    }

    setIsSubmitting(true)

    try {
      const newQuestionCount = questionCount + 1
      setQuestionCount(newQuestionCount)

      const shouldShowLoginPrompt = newQuestionCount >= 5 && !computedValues.actualIsLoggedIn && !hasShownLoginPrompt

      if (shouldShowLoginPrompt) {
        setLoginPromptMessage("5개의 질문을 모두 사용하셨습니다. 로그인하시면 무제한으로 질문하실 수 있습니다.")
        setShowLoginPrompt(true)
        setHasShownLoginPrompt(true)
      }

      setStreamingError(null)
      setRetryCount(0)

      const userMessage = input.trim()

      // 사용자 메시지를 즉시 저장
      if (databaseSessionId) {
        try {
          const userMessageObj = {
            id: `user-${Date.now()}`,
            role: "user" as const,
            content: userMessage,
          }
          await saveMessagesToDatabase([userMessageObj], databaseSessionId)
        } catch (error) {
          console.error("사용자 메시지 저장 오류:", error)
        }
      }

      aiHandleSubmit(e)
    } catch (error) {
      console.error("메시지 전송 오류:", error)
      setIsSubmitting(false)
    }
  }, [
    input,
    isSubmitting,
    isLoading,
    questionCount,
    computedValues.actualIsLoggedIn,
    hasShownLoginPrompt,
    databaseSessionId,
    saveMessagesToDatabase,
    aiHandleSubmit,
  ])

  const handleBackWithSave = useCallback(() => {
    try {
      localStorage.setItem(
        "last_chat_saju_data",
        JSON.stringify({
          saju,
          name,
          gender,
          interpretation: initialInterpretation,
          birthInfo: stableBirthInfo,
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
  }, [saju, name, gender, initialInterpretation, stableBirthInfo, onBack])

  const handleSuggestedQuestionClick = useCallback(
    (question: string) => {
      if (isLoading) return
      setInput(question)
      setTimeout(() => {
        const form = document.querySelector("form")
        if (form) {
          form.requestSubmit()
        }
      }, 100)
    },
    [isLoading, setInput],
  )

  const scrollToBottomSmooth = useCallback(() => {
    if (chatContainerRef.current) {
      const scrollContainer = chatContainerRef.current
      if (!isLoading) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        })
      } else {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [isLoading])

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current && !isAutoScrolling.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollToBottom(!isNearBottom)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setIsRetrying(true)
    setRetryCount((prevCount) => prevCount + 1)
    reload()
  }, [reload])

  const handleRetryMessage = useCallback(
    (messageId: string) => {
      const messageIndex = messages.findIndex((msg) => msg.id === messageId)
      if (messageIndex > 0) {
        const previousUserMessage = messages[messageIndex - 1]
        if (previousUserMessage && previousUserMessage.role === "user") {
          setInput(previousUserMessage.content)
          setTimeout(() => {
            const form = document.querySelector("form")
            if (form) {
              form.requestSubmit()
            }
          }, 100)
        }
      }
    },
    [messages, setInput],
  )

  const handleCompatibilityAnalysis = useCallback(
    (mainPerson: any, selectedPeople: any[]) => {
      try {
        const peopleNames = selectedPeople.map((p) => p.name).join(", ")

        const formatBirthTime = (person: any) => {
          const birthDate = person.birth || `${person.birthYear}.${person.birthMonth}.${person.birthDay}`
          const gender = person.gender === "male" ? "남성" : person.gender === "female" ? "여성" : "성별미상"

          if (person.birthHour && person.birthMinute && !person.timeUnknown) {
            return `${birthDate} ${person.birthHour}시 ${person.birthMinute}분 (${gender})`
          } else if (person.timeUnknown) {
            return `${birthDate} (시간 미상, ${gender})`
          } else {
            return `${birthDate} (${gender})`
          }
        }

        const mainPersonSaju = mainPerson.fullSaju || mainPerson.saju
        const mainPersonBirthTime = formatBirthTime(mainPerson)

        const mainPersonInfo = `
🔮 **${mainPerson.name}님 사주 정보**
- 생년월일: ${mainPersonBirthTime}
- 사주팔자: ${mainPersonSaju.yearStem}${mainPersonSaju.yearBranch}년 ${mainPersonSaju.monthStem}${mainPersonSaju.monthBranch}월 ${mainPersonSaju.dayStem}${mainPersonSaju.dayBranch}일 ${mainPersonSaju.hourStem}${mainPersonSaju.hourBranch}시
- 일간(日干): ${mainPersonSaju.dayMaster}
- 띠: ${mainPersonSaju.yearAnimal || "정보없음"}
- 십성: 년간(${mainPersonSaju.yearStemSibseong}) 년지(${mainPersonSaju.yearBranchSibseong}) 월간(${mainPersonSaju.monthStemSibseong}) 월지(${mainPersonSaju.monthBranchSibseong}) 일간(${mainPersonSaju.dayStemSibseong}) 일지(${mainPersonSaju.dayBranchSibseong}) 시간(${mainPersonSaju.hourStemSibseong}) 시지(${mainPersonSaju.hourBranchSibseong})
- 오행분포: 목${mainPersonSaju.elements.wood} 화${mainPersonSaju.elements.fire} 토${mainPersonSaju.elements.earth} 금${mainPersonSaju.elements.metal} 수${mainPersonSaju.elements.water}
`

        const selectedPeopleInfo = selectedPeople
          .map((person, index) => {
            const personSaju = person.fullSaju || person.saju
            const personBirthTime = formatBirthTime(person)

            return `
💫 **${person.name}님 사주 정보**
- 생년월일: ${personBirthTime}
- 사주팔자: ${personSaju.yearStem}${personSaju.yearBranch}년 ${personSaju.monthStem}${personSaju.monthBranch}월 ${personSaju.dayStem}${personSaju.dayBranch}일 ${personSaju.hourStem}${personSaju.hourBranch}시
- 일간(日干): ${personSaju.dayMaster}
- 띠: ${personSaju.yearAnimal || "정보없음"}
- 십성: 년간(${personSaju.yearStemSibseong}) 년지(${personSaju.yearBranchSibseong}) 월간(${personSaju.monthStemSibseong}) 월지(${personSaju.monthBranchSibseong}) 일간(${personSaju.dayStemSibseong}) 일지(${personSaju.dayBranchSibseong}) 시간(${personSaju.hourStemSibseong}) 시지(${personSaju.hourBranchSibseong})
- 오행분포: 목${personSaju.elements.wood} 화${personSaju.elements.fire} 토${personSaju.elements.earth} 금${personSaju.elements.metal} 수${personSaju.elements.water}
`
          })
          .join("")

        // Complete the compatibilityMessage string in handleCompatibilityAnalysis function:
        const compatibilityMessage = `${mainPerson.name}님과 ${peopleNames}님의 궁합을 분석해주세요.

${mainPersonInfo}
${selectedPeopleInfo}

위 사주 정보를 바탕으로 다음 관점에서 궁합을 분석해주세요:

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
함께 지낼
