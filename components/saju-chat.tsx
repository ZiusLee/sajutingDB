"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Send, ChevronDown, User, ArrowLeft, Settings } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import ReactMarkdown from "react-markdown"
import CompatibilityTool from "@/components/compatibility-tool"
import { compressSaju } from "@/lib/saju-compression"
import { useAuth } from "@/contexts/auth-context"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import DaeunDiagram from "@/components/daeun-diagram"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import type { BirthInfo } from "@/types/birth-info"
import { MessageFeedbackButtons } from "@/components/message-feedback-buttons"

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

// 대운 데이터를 변환하는 함수 - 안전한 처리
const convertDaeunData = (daeunData: any) => {
  if (!daeunData) {
    return []
  }

  // pillars 배열이 있는 경우
  if (daeunData.pillars && Array.isArray(daeunData.pillars)) {
    return daeunData.pillars
      .map((pillar: any, index: number) => {
        if (!pillar) return null

        return {
          age: pillar.startAge || index * 10,
          startYear: pillar.startAge
            ? new Date().getFullYear() - getCurrentAge() + pillar.startAge
            : new Date().getFullYear() + index * 10,
          endYear: pillar.endAge
            ? new Date().getFullYear() - getCurrentAge() + pillar.endAge
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

  // 직접 배열인 경우 (fallback)
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

// 현재 나이 계산 헬퍼 함수
const getCurrentAge = (birthInfo?: BirthInfo) => {
  if (birthInfo?.solarYear && birthInfo?.solarMonth && birthInfo?.solarDay) {
    const birthDate = new Date(birthInfo.solarYear, birthInfo.solarMonth - 1, birthInfo.solarDay)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }
  return 25 // 기본값
}

// 초기 메시지 생성 - 컴포넌트 외부로 이동하여 안정화
const createInitialMessages = (name: string, roomType: string, birthInfo?: BirthInfo) => {
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
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id || null
  const actualIsLoggedIn = isAuthenticated || isLoggedIn

  // 초기화 상태 - 단순화
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

  const dropdownRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAutoScrolling = useRef(false)
  const lastMessageLength = useRef(0)

  const router = useRouter()
  const supabase = createClientComponentClient()

  const currentCharacter = pingCharacters.find((char) => char.roomType === roomType) || pingCharacters[0]
  const suggestedQuestions = initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general

  // 안정화된 초기 메시지 - 한 번만 생성
  const stableInitialMessages = useMemo(() => {
    return createInitialMessages(name, roomType, birthInfo)
  }, [name, roomType, birthInfo])

  // 최종 메시지 배열 - DB 메시지가 있으면 사용, 없으면 초기 메시지 사용
  const finalInitialMessages = useMemo(() => {
    if (dbMessages.length > 0) {
      return dbMessages
    }
    return stableInitialMessages
  }, [dbMessages, stableInitialMessages])

  // 대운 계산을 메모화하여 무한 루프 방지 - 안전한 처리
  const calculatedDaeun = useMemo(() => {
    try {
      // 이미 올바른 대운이 있는 경우 그대로 사용
      if (
        saju?.daeun &&
        saju.daeun.pillars &&
        Array.isArray(saju.daeun.pillars) &&
        saju.daeun.pillars.length > 0 &&
        !saju.daeun.pillars.every((p: any) => p?.stem === "갑" && p?.branch === "자")
      ) {
        return saju.daeun
      }

      // 대운 계산에 필요한 데이터가 있는지 확인
      if (
        saju?.yearStem &&
        saju?.monthStem &&
        saju?.monthBranch &&
        birthInfo?.solarYear &&
        birthInfo?.solarMonth &&
        birthInfo?.solarDay &&
        gender
      ) {
        const daeunData = calculateDaeunInfo(
          {
            yearStem: saju.yearStem,
            monthStem: saju.monthStem,
            monthBranch: saju.monthBranch,
          },
          birthInfo.solarYear,
          birthInfo.solarMonth,
          birthInfo.solarDay,
          gender,
          birthInfo.timeUnknown ? undefined : birthInfo.solarHour,
          birthInfo.timeUnknown ? undefined : birthInfo.solarMinute,
          birthInfo.timeUnknown || false,
        )

        return daeunData
      }

      return null
    } catch (error) {
      console.error("대운 계산 중 오류:", error)
      return null
    }
  }, [
    saju?.yearStem,
    saju?.monthStem,
    saju?.monthBranch,
    saju?.daeun,
    birthInfo?.solarYear,
    birthInfo?.solarMonth,
    birthInfo?.solarDay,
    birthInfo?.solarHour,
    birthInfo?.solarMinute,
    birthInfo?.timeUnknown,
    gender,
  ])

  // Memoize compressed saju to prevent recreation on every render
  const compressedSaju = useMemo(() => {
    try {
      return compressSaju(
        saju,
        birthInfo?.solarYear?.toString(),
        birthInfo?.solarMonth?.toString(),
        birthInfo?.solarDay?.toString(),
        birthInfo?.solarHour?.toString(),
        birthInfo?.solarMinute?.toString(),
        birthInfo?.timeUnknown,
      )
    } catch (error) {
      console.error("사주 압축 중 오류:", error)
      return ""
    }
  }, [saju, birthInfo])

  // Memoize the body object for useAIChat to prevent infinite re-renders - 안정화
  const aiChatBody = useMemo(
    () => ({
      compressedSaju,
      name,
      gender,
      initialInterpretation,
      roomType,
      userId,
      currentYear: 2025,
      yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
      birthInfo,
    }),
    [compressedSaju, name, gender, initialInterpretation, roomType, userId, birthInfo],
  )

  // 초기화 로직 - 한 번만 실행
  useEffect(() => {
    let isMounted = true

    const initializeChat = async () => {
      try {
        // 세션 ID 가져오기
        let sessionId = null

        const currentSajuData = localStorage.getItem("current_saju")
        if (currentSajuData) {
          const sajuData = JSON.parse(currentSajuData)
          sessionId = sajuData.sessionId
        }

        if (!sessionId && actualIsLoggedIn && userId) {
          const { data: sessions, error } = await supabase
            .from("saju_sessions")
            .select("id, name, created_at")
            .eq("auth_user_id", userId)
            .eq("name", name)
            .order("created_at", { ascending: false })
            .limit(1)

          if (!error && sessions && sessions.length > 0) {
            sessionId = sessions[0].id
          }
        }

        if (!sessionId) {
          const storedSajuData = localStorage.getItem("tempSajuData")
          if (storedSajuData) {
            const sajuData = JSON.parse(storedSajuData)
            sessionId = sajuData.sessionId
          } else {
            sessionId = localStorage.getItem("user_id")
          }
        }

        if (isMounted) {
          setDatabaseSessionId(sessionId)
        }

        // DB에서 메시지 로드 시도
        if (sessionId) {
          try {
            const response = await fetch(`/api/messages?sessionId=${sessionId}`)
            if (response.ok) {
              const data = await response.json()
              const messages = data.messages || []

              if (isMounted && messages.length > 0) {
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

        if (isMounted) {
          setIsReady(true)
        }
      } catch (error) {
        console.error("초기화 오류:", error)
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    initializeChat()

    return () => {
      isMounted = false
    }
  }, [actualIsLoggedIn, userId, name, supabase])

  // useAIChat - isReady가 true일 때만 초기화
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
    onFinish: async (message) => {
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
    },
    onError: (error) => {
      console.error("채팅 오류:", error)
      setStreamingError("응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.")
      setIsSubmitting(false)
    },
    onResponse: (response) => {
      setStreamingError(null)
    },
  })

  // 메시지가 변경될 때만 스크롤 - 최적화된 버전
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

  // 메시지를 데이터베이스에 저장하는 함수
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
              birthInfo,
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
    [roomType, name, gender, saju, birthInfo],
  )

  const customHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim() || isSubmitting || isLoading) {
      return
    }

    setIsSubmitting(true)

    try {
      const newQuestionCount = questionCount + 1
      setQuestionCount(newQuestionCount)

      const shouldShowLoginPrompt = newQuestionCount >= 5 && !actualIsLoggedIn && !hasShownLoginPrompt

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
  }

  const handleBackWithSave = useCallback(() => {
    try {
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
  }, [saju, name, gender, initialInterpretation, birthInfo, onBack])

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
- 오행분포: 목${mainPersonSaju.elements.wood} 화${mainPersonSaju.elements.fire}  토${mainPersonSaju.elements.earth} 금${mainPersonSaju.elements.metal} 수${mainPersonSaju.elements.water}
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

        const compatibilityMessage = `${mainPerson.name}님과 ${peopleNames}님의 궁합을 분석해주세요.

${mainPersonInfo}
${selectedPeopleInfo}

위 사주 정보를 바탕으로 다음 관점에서 궁합을 분석해주세요:
1. 일간(日干) 상생상극 관계
2. 오행 균형과 보완 관계  
3. 십성 조화도
4. 전체적인 궁합 점수와 조언

각 사람과의 궁합을 개별적으로 분석하고, 종합적인 조언도 부탁드립니다.`

        setInput(compatibilityMessage)
        setShowCompatibilityTool(false)

        setTimeout(() => {
          const form = document.querySelector("form")
          if (form) {
            form.requestSubmit()
          }
        }, 100)
      } catch (error) {
        console.error("궁합 분석 처리 중 오류:", error)
        alert("궁합 분석 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    },
    [setInput],
  )

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const scrollContainer = chatContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [handleScroll])

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // 테마 및 헤더/푸터 숨김 처리
  useHideHeaderAndFooter()
  useForceDarkTheme()

  // 로딩 상태
  if (!isReady) {
    return (
      <div className="flex h-screen bg-gray-900 text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>채팅을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden h-screen supports-[height:100dvh]:h-[100dvh]">
      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 bg-white/10 backdrop-blur-md border-b border-white/20 safe-area-top">
        <div className="flex items-center min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackWithSave}
            className="mr-1 sm:mr-2 text-white/80 hover:text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <div className="flex items-center min-w-0 flex-1 justify-center">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="flex items-center space-x-1 sm:space-x-2 text-white hover:text-white hover:bg-white/20 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg min-w-0"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-base sm:text-lg flex-shrink-0">{currentCharacter.emoji}</span>
              <span className="font-medium text-sm sm:text-base truncate">{currentCharacter.name}</span>
              <ChevronDown
                className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform flex-shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </Button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[99998]" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 sm:w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-[99999]">
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
                        className={`w-full flex items-center space-x-3 p-2 sm:p-3 text-left hover:bg-white/20 transition-colors rounded-lg mx-2 ${
                          character.roomType === roomType ? "bg-white/20" : ""
                        }`}
                      >
                        <span className="text-base sm:text-lg flex-shrink-0">{character.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-white text-sm sm:text-base">{character.name}</p>
                          <p className="text-xs text-white/70 truncate">{character.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {actualIsLoggedIn ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/mypage")}
              className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 sm:p-2 rounded-lg"
              title="마이페이지"
            >
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/login")}
              className="text-white border-white/30 hover:bg-white/20 hover:text-white hover:border-white/50 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm"
            >
              로그인
            </Button>
          )}
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto overscroll-behavior-y-contain"
        onScroll={handleScroll}
      >
        <div className="pb-32 pt-4 sm:pt-6">
          {/* 사주 다이어그램 */}
          <div className="px-3 sm:px-4 mb-4 sm:mb-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                <SajuDiagram
                  saju={saju}
                  timeUnknown={birthInfo?.timeUnknown}
                  size="sm"
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

          {/* 대운 다이어그램 - 안전한 처리 */}
          {calculatedDaeun && (
            <div className="px-3 sm:px-4 mb-4 sm:mb-6">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                  <DaeunDiagram
                    daeun={convertDaeunData(calculatedDaeun)}
                    birthInfo={birthInfo}
                    name={name}
                    gender={gender}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 메시지들 */}
          {messages &&
            messages.length > 0 &&
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`px-3 sm:px-4 py-3 sm:py-4 ${message.role === "assistant" ? "bg-white/5" : ""} group relative`}
              >
                <div className="max-w-3xl mx-auto flex space-x-2 sm:space-x-4">
                  <div className="flex-shrink-0">
                    {message.role === "assistant" ? (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                        {currentCharacter.emoji}
                      </div>
                    ) : (
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                        나
                      </div>
                    )}
                  </div>
                  <div className="flex-1 prose prose-invert max-w-none min-w-0">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="text-white/90 leading-relaxed mb-2 sm:mb-3 last:mb-0 text-sm sm:text-base">
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic text-white/80">{children}</em>,
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 mb-2 sm:mb-3 text-white/90 text-sm sm:text-base">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 mb-2 sm:mb-3 text-white/90 text-sm sm:text-base">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => <li className="text-white/90 text-sm sm:text-base">{children}</li>,
                        h1: ({ children }) => (
                          <h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-white">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2 text-white">{children}</h3>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>

                    {/* 메시지 피드백 버튼들 - assistant 메시지에만 표시 */}
                    {message.role === "assistant" && (
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <MessageFeedbackButtons
                          messageId={messageIds[message.id] || message.id}
                          messageContent={message.content}
                          sessionId={databaseSessionId || "anonymous"}
                          onRetry={() => handleRetryMessage(message.id)}
                          className="flex items-center space-x-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="px-3 sm:px-4 py-3 sm:py-4 bg-white/5">
              <div className="max-w-3xl mx-auto flex space-x-2 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {currentCharacter.emoji}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex space-x-1">
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {streamingError && (
            <div className="px-3 sm:px-4 py-3 sm:py-4">
              <div className="max-w-3xl mx-auto">
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 sm:p-4">
                  <p className="text-red-200 text-xs sm:text-sm mb-2 sm:mb-3">{streamingError}</p>
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    size="sm"
                    className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm"
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
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 to-transparent backdrop-blur-md safe-area-bottom">
        {/* 추천 질문 */}
        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-white/10 max-h-[50px] sm:max-h-[60px] flex items-center">
            <div className="max-w-3xl mx-auto w-full">
              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1">
                {suggestedQuestions.slice(0, 6).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestionClick(question)}
                    className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full px-2 sm:px-3 py-1 whitespace-nowrap flex-shrink-0 h-7 sm:h-8"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 입력창 */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 pb-safe">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={customHandleSubmit} className="relative">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 focus-within:border-white/40">
                <Sheet open={showToolsDrawer} onOpenChange={setShowToolsDrawer}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 sm:ml-3 text-white/60 hover:text-white p-1.5 sm:p-2 relative flex-shrink-0"
                      onClick={() => {
                        setShowToolsDrawer(true)
                        setHasSeenToolsNotification(true)
                      }}
                    >
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {!hasSeenToolsNotification && (
                        <Badge
                          variant="destructive"
                          className="absolute -top-0.5 -right-0.5 h-3 w-6 sm:h-4 sm:w-8 text-xs px-1 bg-red-500 text-white animate-pulse"
                        >
                          new
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="bg-slate-900/90 border-white/20 backdrop-blur-md">
                    <div className="py-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Tools</h3>
                      <div className="space-y-3">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-white hover:bg-white/20 p-3 sm:p-4 rounded-lg relative"
                          onClick={() => {
                            setShowCompatibilityTool(true)
                            setShowToolsDrawer(false)
                          }}
                        >
                          <span className="mr-2 sm:mr-3">💕</span>
                          궁합 보기
                          {!hasSeenToolsNotification && (
                            <Badge
                              variant="destructive"
                              className="ml-auto h-4 w-8 sm:h-5 sm:w-10 text-xs bg-red-500 text-white animate-pulse"
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
                  className="flex-1 bg-transparent border-none px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-white/50 focus:outline-none text-sm sm:text-base min-w-0"
                  disabled={isLoading || isSubmitting}
                />

                <Button
                  type="submit"
                  disabled={isLoading || !input.trim() || isSubmitting}
                  className="mr-2 sm:mr-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 rounded-full p-1.5 sm:p-2 flex-shrink-0"
                >
                  <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white z-10"
          size="sm"
        >
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )}

      {/* 궁합 분석 도구 모달 */}
      {showCompatibilityTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">궁합 분석 도구</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompatibilityTool(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <CompatibilityTool
                currentUserSaju={{
                  name,
                  gender,
                  saju,
                  birthInfo,
                }}
                onAnalyze={handleCompatibilityAnalysis}
                onClose={() => setShowCompatibilityTool(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 로그인 프롬프트 다이얼로그 */}
      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        message={loginPromptMessage}
        onLogin={() => {
          setShowLoginPrompt(false)
          router.push("/login")
        }}
      />
    </div>
  )
}
