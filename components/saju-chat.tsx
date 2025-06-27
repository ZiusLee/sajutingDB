"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
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

  // Refs for preventing infinite loops
  const hasLoadedHistory = useRef(false)
  const lastMessageLength = useRef(0)

  // States
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [messageIds, setMessageIds] = useState<Record<string, string>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [databaseSessionId, setDatabaseSessionId] = useState<string | null>(null)
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
  const [initialMessages, setInitialMessages] = useState<any[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAutoScrolling = useRef(false)

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general,
  )
  const [shouldGenerateQuestions, setShouldGenerateQuestions] = useState(true)

  const router = useRouter()
  const supabase = createClientComponentClient()
  const { activeChatSession, setActiveChatSession, saveChatSession, getChatSession } = useChat()

  const currentCharacter = pingCharacters.find((char) => char.roomType === roomType) || pingCharacters[0]

  // Memoize compressed saju to prevent recreation on every render
  const compressedSaju = useMemo(() => {
    return compressSaju(
      saju,
      birthInfo?.solarYear?.toString(),
      birthInfo?.solarMonth?.toString(),
      birthInfo?.solarDay?.toString(),
      birthInfo?.solarHour?.toString(),
      birthInfo?.solarMinute?.toString(),
      birthInfo?.timeUnknown,
    )
  }, [saju, birthInfo])

  // Memoize the body object for useAIChat to prevent infinite re-renders
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

  // 현재 세션 ID 가져오기 - 안정화된 버전
  const getCurrentSessionId = useCallback(async (): Promise<string | null> => {
    try {
      // 1. mypage에서 온 경우 - current_saju에서 세션 ID 확인
      const currentSajuData = localStorage.getItem("current_saju")
      if (currentSajuData) {
        const sajuData = JSON.parse(currentSajuData)
        if (sajuData.sessionId) {
          return sajuData.sessionId
        }
      }

      if (actualIsLoggedIn && userId) {
        // 2. 로그인 상태: DB에서 사용자 세션 조회
        const { data: sessions, error } = await supabase
          .from("saju_sessions")
          .select("id, name, created_at")
          .eq("auth_user_id", userId)
          .eq("name", name)
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) {
          console.error("세션 조회 오류:", error)
          return null
        }

        if (sessions && sessions.length > 0) {
          return sessions[0].id
        }

        return null
      } else {
        // 3. 비로그인 상태: localStorage에서 세션 ID 가져오기
        const storedSajuData = localStorage.getItem("tempSajuData")
        if (storedSajuData) {
          const sajuData = JSON.parse(storedSajuData)
          return sajuData.sessionId || null
        }

        // user_id도 확인 (이전 버전 호환성)
        const userId = localStorage.getItem("user_id")
        if (userId) {
          return userId
        }

        return null
      }
    } catch (error) {
      console.error("세션 ID 조회 오류:", error)
      return null
    }
  }, [actualIsLoggedIn, userId, name, supabase])

  // DB에서 채팅 히스토리 로드 - 안정화된 버전
  const loadChatHistory = useCallback(async () => {
    try {
      setIsLoadingMessages(true)

      const sessionId = await getCurrentSessionId()

      if (!sessionId) {
        const newInitialMessages =
          roomType === "sajuping"
            ? generateSajupingInitialMessages(name, saju, birthInfo)
            : [
                {
                  id: "welcome",
                  role: "assistant" as const,
                  content: getInitialMessageByRoomType(name, roomType, birthInfo),
                },
              ]

        setInitialMessages(newInitialMessages)
        setIsLoadingMessages(false)
        return
      }

      setDatabaseSessionId(sessionId)

      // DB에서 메시지 로드
      const response = await fetch(`/api/messages?sessionId=${sessionId}`)

      if (response.ok) {
        const data = await response.json()
        const dbMessages = data.messages || []

        if (dbMessages.length > 0) {
          // DB에 메시지가 있으면 사용
          const formattedMessages = dbMessages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
          }))

          setInitialMessages(formattedMessages)
        } else {
          // DB에 메시지가 없으면 초기 메시지 생성
          const newInitialMessages =
            roomType === "sajuping"
              ? generateSajupingInitialMessages(name, saju, birthInfo)
              : [
                  {
                    id: "welcome",
                    role: "assistant" as const,
                    content: getInitialMessageByRoomType(name, roomType, birthInfo),
                  },
                ]

          setInitialMessages(newInitialMessages)
        }
      } else {
        console.error("메시지 로드 실패:", response.status, response.statusText)
        // 실패 시 초기 메시지 생성
        const newInitialMessages =
          roomType === "sajuping"
            ? generateSajupingInitialMessages(name, saju, birthInfo)
            : [
                {
                  id: "welcome",
                  role: "assistant" as const,
                  content: getInitialMessageByRoomType(name, roomType, birthInfo),
                },
              ]

        setInitialMessages(newInitialMessages)
      }
    } catch (error) {
      console.error("채팅 히스토리 로드 오류:", error)
      // 에러 시 초기 메시지 생성
      const newInitialMessages =
        roomType === "sajuping"
          ? generateSajupingInitialMessages(name, saju, birthInfo)
          : [
              {
                id: "welcome",
                role: "assistant" as const,
                content: getInitialMessageByRoomType(name, roomType, birthInfo),
              },
            ]

      setInitialMessages(newInitialMessages)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [getCurrentSessionId, roomType, name, saju, birthInfo])

  // 컴포넌트 마운트 시 채팅 히스토리 로드 - 한 번만 실행
  useEffect(() => {
    if (!hasLoadedHistory.current) {
      hasLoadedHistory.current = true
      loadChatHistory()
    }
  }, [loadChatHistory])

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
    body: aiChatBody, // 메모화된 객체 사용
    onFinish: async (message) => {
      try {
        // 어시스턴트 메시지가 완료되면 현재 messages 배열에 새 메시지를 추가
        const updatedMessages = [...messages, message]

        // 어시스턴트 메시지만 추가 저장 (사용자 메시지는 이미 저장됨)
        if (databaseSessionId) {
          await saveMessagesToDatabase(updatedMessages, databaseSessionId)
        }

        setShouldGenerateQuestions(true)
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
      setShouldGenerateQuestions(true)
      setIsSubmitting(false)
    },
    onResponse: (response) => {
      setStreamingError(null)
    },
  })

  // 메시지가 변경될 때만 스크롤 - 최적화된 버전
  useEffect(() => {
    if (messages.length !== lastMessageLength.current && !isLoading && chatContainerRef.current) {
      lastMessageLength.current = messages.length
      const scrollContainer = chatContainerRef.current
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100

      if (isNearBottom) {
        // 부드러운 애니메이션 없이 즉시 스크롤
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages.length, isLoading])

  // 메시지를 데이터베이스에 저장하는 함수 - 안정화된 버전
  const saveMessagesToDatabase = useCallback(
    async (messagesToSave: any[], sessionId: string) => {
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
          console.log(`DB 저장 완료: ${data.savedCount || 0}개 메시지`)

          if (data.messageIds && data.messageIds.length > 0) {
            setTimeout(() => {
              const newMessageIds: Record<string, string> = {}
              messagesToSave.forEach((msg, index) => {
                if (data.messageIds[index]) {
                  newMessageIds[msg.id] = data.messageIds[index]
                }
              })
              setMessageIds((prev) => ({ ...prev, ...newMessageIds }))
            }, 0)
          }
        } else {
          const errorText = await response.text()
          console.error("DB 저장 실패:", errorText)
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

    // 중복 전송 방지
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

      setShouldGenerateQuestions(false)
      setStreamingError(null)
      setRetryCount(0)

      const userMessage = input.trim()

      // 사용자 메시지를 즉시 저장 (AI 응답 전에)
      if (databaseSessionId) {
        try {
          const userMessageObj = {
            id: `user-${Date.now()}`,
            role: "user" as const,
            content: userMessage,
          }

          // 현재 messages에 user 메시지 추가하여 저장
          const messagesWithUser = [...messages, userMessageObj]
          await saveMessagesToDatabase(messagesWithUser, databaseSessionId)
        } catch (error) {
          console.error("사용자 메시지 저장 오류:", error)
        }
      }

      // AI 채팅 제출
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

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [])

  const scrollToBottomSmooth = useCallback(() => {
    if (chatContainerRef.current) {
      const scrollContainer = chatContainerRef.current
      // 스트리밍 중이 아닐 때만 부드러운 스크롤 사용
      if (!isLoading) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        })
      } else {
        // 스트리밍 중에는 즉시 스크롤
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

  const handleCompatibilityAnalysis = useCallback(
    (mainPerson: any, selectedPeople: any[]) => {
      try {
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
        const mainPersonSaju = mainPerson.fullSaju || mainPerson.saju
        const mainPersonBirthTime = formatBirthTime(mainPerson)

        // 대표 사주 상세 정보
        const mainPersonInfo = `
🔮 **${mainPerson.name}님 사주 정보**
- 생년월일: ${mainPersonBirthTime}
- 사주팔자: ${mainPersonSaju.yearStem}${mainPersonSaju.yearBranch}년 ${mainPersonSaju.monthStem}${mainPersonSaju.monthBranch}월 ${mainPersonSaju.dayStem}${mainPersonSaju.dayBranch}일 ${mainPersonSaju.hourStem}${mainPersonSaju.hourBranch}시
- 일간(日干): ${mainPersonSaju.dayMaster}
- 띠: ${mainPersonSaju.yearAnimal || "정보없음"}
- 십성: 년간(${mainPersonSaju.yearStemSibseong}) 년지(${mainPersonSaju.yearBranchSibseong}) 월간(${mainPersonSaju.monthStemSibseong}) 월지(${mainPersonSaju.monthBranchSibseong}) 일간(${mainPersonSaju.dayStemSibseong}) 일지(${mainPersonSaju.dayBranchSibseong}) 시간(${mainPersonSaju.hourStemSibseong}) 시지(${mainPersonSaju.hourBranchSibseong})
- 오행분포: 목${mainPersonSaju.elements.wood} 화${mainPersonSaju.elements.fire}  토${mainPersonSaju.elements.earth} 금${mainPersonSaju.elements.metal} 수${mainPersonSaju.elements.water}
`

        // 궁합 대상들 정보
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

  const handleToolsNotification = useCallback(() => {
    if (!hasSeenToolsNotification) {
      setHasSeenToolsNotification(true)
    }
  }, [hasSeenToolsNotification])

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

  if (isLoadingMessages) {
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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackWithSave} className="text-gray-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCharacter.emoji}</span>
              <div>
                <h1 className="font-semibold">{currentCharacter.name}</h1>
                <p className="text-xs text-gray-400">{currentCharacter.description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 도구 버튼 */}
            <Sheet open={showToolsDrawer} onOpenChange={setShowToolsDrawer}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white relative"
                  onClick={handleToolsNotification}
                >
                  <Settings className="h-4 w-4" />
                  {!hasSeenToolsNotification && <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-red-500" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-gray-800 border-gray-700">
                <div className="py-4">
                  <h3 className="text-lg font-semibold mb-4 text-white">도구</h3>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left border-gray-600 hover:bg-gray-700 bg-transparent"
                      onClick={() => {
                        setShowCompatibilityTool(true)
                        setShowToolsDrawer(false)
                      }}
                    >
                      <span className="mr-2">💕</span>
                      궁합 분석 도구
                    </Button>
                    <div className="text-sm text-gray-400 px-3">여러 사람과의 궁합을 한 번에 분석할 수 있습니다.</div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* 사주 정보 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-gray-300 hover:text-white"
              >
                <User className="h-4 w-4 mr-1" />
                {name}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3 text-white">사주 정보</h3>
                    <SajuDiagram saju={saju} />
                    <div className="mt-4">
                      <DaeunDiagram saju={saju} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 채팅 메시지 영역 */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-100 border border-gray-600"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-md font-medium mb-1 text-white">{children}</h3>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-300 my-2">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto text-sm font-mono my-2">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* 로딩 인디케이터 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400">답변 생성 중...</span>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {streamingError && (
            <div className="flex justify-center">
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 max-w-md">
                <p className="text-red-200 text-sm mb-2">{streamingError}</p>
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-200 hover:bg-red-800 bg-transparent"
                >
                  {isRetrying ? "재시도 중..." : "다시 시도"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 추천 질문 */}
        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="px-4 py-2 border-t border-gray-700">
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestionClick(question)}
                  className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 입력 영역 */}
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={customHandleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder={`${currentCharacter.name}에게 질문해보세요...`}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading || isSubmitting}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {/* 질문 카운터 (비로그인 사용자용) */}
          {!actualIsLoggedIn && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400">
                질문 {questionCount}/5 {questionCount >= 5 && "(로그인하면 무제한 질문 가능)"}
              </p>
            </div>
          )}
        </div>

        {/* 스크롤 투 바텀 버튼 */}
        {showScrollToBottom && (
          <Button
            onClick={scrollToBottomSmooth}
            className="fixed bottom-20 right-6 rounded-full w-10 h-10 bg-gray-700 hover:bg-gray-600 border border-gray-600"
            size="sm"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

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
