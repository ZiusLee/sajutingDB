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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import DaeunDiagram from "@/components/daeun-diagram"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import type { BirthInfo } from "@/types/birth-info"
import { MessageFeedbackButtons } from "@/components/message-feedback-buttons"
import { toast } from "sonner"
import { BackNavigationErrorDialog } from "@/components/back-navigation-error-dialog"

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

// 메시지가 중간에 멈췄는지 감지하는 함수
function isMessageIncomplete(content: string): boolean {
  const trimmedContent = content.trim()

  // 빈 메시지
  if (!trimmedContent) return true

  // 문장이 중간에 끊어진 경우들
  const incompletePatterns = [
    /[가-힣][ㄱ-ㅎㅏ-ㅣ]$/, // 한글 자음/모음으로 끝남
    /\s+$/, // 공백으로 끝남
    /[,，]\s*$/, // 쉼표로 끝남
    /[가-힣]\s*\.\.\.$/, // 말줄임표로 끝남
    /[가-힣]\s*…$/, // 말줄임표로 끝남
    /[가-힣]\s*-$/, // 하이픈으로 끝남
    /[가-힣]\s*:$/, // 콜론으로 끝남
    /[가-힣]\s*;$/, // 세미콜론으로 끝남
    /\*\*[^*]*$/, // 볼드 마크다운이 닫히지 않음
    /\*[^*]*$/, // 이탤릭 마크다운이 닫히지 않음
    /^[^가-힣]*$/, // 한글이 전혀 없음 (에러 메시지 등)
  ]

  return incompletePatterns.some((pattern) => pattern.test(trimmedContent))
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
  // 🔧 Ultra-Stable: 절대 변경되지 않는 정적 데이터
  const immutableDataRef = useRef<{
    currentCharacter: any
    suggestedQuestions: string[]
    stableBirthInfo: any
    calculatedDaeun: any
    compressedSaju: string
    defaultInitialMessages: any[]
    chatId: string
    baseAiChatBody: any
  } | null>(null)

  // 🔧 Ultra-Stable: 한 번만 계산하고 절대 변경하지 않음
  if (!immutableDataRef.current) {
    const currentCharacter = pingCharacters.find((char) => char.roomType === roomType) || pingCharacters[0]
    const suggestedQuestions = initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general

    const stableBirthInfo = birthInfo
      ? {
          solarYear: birthInfo.solarYear,
          solarMonth: birthInfo.solarMonth,
          solarDay: birthInfo.solarDay,
          solarHour: birthInfo.solarHour,
          solarMinute: birthInfo.solarMinute,
          timeUnknown: birthInfo.timeUnknown,
          lunarYear: birthInfo.lunarYear,
          lunarMonth: birthInfo.lunarMonth,
          lunarDay: birthInfo.lunarDay,
        }
      : null

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

    const defaultInitialMessages =
      roomType === "sajuping"
        ? [
            {
              id: "saju-analysis",
              role: "assistant" as const,
              content: getInitialMessageByRoomType(name, "sajuping", stableBirthInfo),
            },
            {
              id: "consultation-start",
              role: "assistant" as const,
              content: `오늘은 어떤 것이 궁금하세요? 😊`,
            },
          ]
        : [
            {
              id: "welcome",
              role: "assistant" as const,
              content: getInitialMessageByRoomType(name, roomType, stableBirthInfo),
            },
          ]

    const chatId = `${sessionKey}-${roomType}-${Date.now()}`

    const baseAiChatBody = {
      compressedSaju,
      name,
      gender,
      initialInterpretation,
      roomType,
      userId: null, // 나중에 설정
      currentYear: 2025,
      yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
      birthInfo: stableBirthInfo,
    }

    immutableDataRef.current = {
      currentCharacter,
      suggestedQuestions,
      stableBirthInfo,
      calculatedDaeun,
      compressedSaju,
      defaultInitialMessages,
      chatId,
      baseAiChatBody,
    }
  }

  // 🔧 Ultra-Stable: 초기화 상태만 관리하는 최소 상태
  const [initState, setInitState] = useState<{
    isReady: boolean
    authUser: any
    sessionId: string | null
    dbMessages: any[]
  }>({
    isReady: false,
    authUser: null,
    sessionId: null,
    dbMessages: [],
  })

  // 🔧 Ultra-Stable: UI 상태만 관리하는 분리된 상태
  const [uiState, setUiState] = useState({
    questionCount: 0,
    showLoginPrompt: false,
    loginPromptMessage: "",
    isDropdownOpen: false,
    showCompatibilityTool: false,
    showToolsDrawer: false,
    hasSeenToolsNotification: false,
    showScrollToBottom: false,
    isSubmitting: false,
    showBackError: false, // 추가
  })

  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClientComponentClient())
  const lastMessageLength = useRef(0)
  const isAutoScrolling = useRef(false)
  const initOnceRef = useRef(false)
  const router = useRouter()

  // 🔧 Ultra-Stable: 완전히 고정된 초기 메시지
  const stableInitialMessages = useMemo(() => {
    if (!initState.isReady) return []

    // DB 메시지가 있으면 사용 (한 번만)
    if (initState.dbMessages.length > 0) {
      return [...initState.dbMessages]
    }

    // 기본 메시지 사용 (한 번만)
    return [...(immutableDataRef.current?.defaultInitialMessages || [])]
  }, [initState.isReady, initState.dbMessages])

  // 🔧 Ultra-Stable: 완전히 고정된 AI Chat Body
  const stableAiChatBody = useMemo(() => {
    if (!immutableDataRef.current?.baseAiChatBody) return {}

    return {
      ...immutableDataRef.current.baseAiChatBody,
      userId: initState.authUser?.id || null,
    }
  }, [initState.authUser?.id])

  // 🔧 Ultra-Stable: 한 번만 실행되는 초기화
  useEffect(() => {
    if (initOnceRef.current) return
    initOnceRef.current = true

    let isMounted = true

    const initializeOnce = async () => {
      try {
        const supabase = supabaseRef.current
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!isMounted) return

        // 세션 ID 가져오기
        let sessionId = null
        try {
          const currentSajuData = localStorage.getItem("current_saju")
          if (currentSajuData) {
            const sajuData = JSON.parse(currentSajuData)
            sessionId = sajuData.sessionId
          }
        } catch (e) {
          console.error("Failed to parse current_saju:", e)
        }

        if (!sessionId && user) {
          try {
            const { data: sessions, error } = await supabase
              .from("saju_sessions")
              .select("id, name, created_at")
              .eq("auth_user_id", user.id)
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

        // DB에서 메시지 로드
        let dbMessages: any[] = []
        if (sessionId && isMounted) {
          try {
            const response = await fetch(`/api/messages?sessionId=${sessionId}`)
            if (response.ok) {
              const data = await response.json()
              const messages = data.messages || []

              if (messages.length > 0) {
                dbMessages = messages.map((msg: any) => ({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content,
                }))
              }
            }
          } catch (error) {
            console.error("메시지 로드 오류:", error)
          }
        }

        if (isMounted) {
          // 🔧 Ultra-Stable: 한 번에 모든 초기화 상태 설정
          setInitState({
            isReady: true,
            authUser: user,
            sessionId,
            dbMessages,
          })
        }
      } catch (error) {
        console.error("초기화 오류:", error)
        if (isMounted) {
          setInitState((prev) => ({ ...prev, isReady: true }))
        }
      }
    }

    initializeOnce()

    return () => {
      isMounted = false
    }
  }, [name])

  // useAIChat 초기화 - 완전히 안정화된 설정 사용
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
    setMessages,
    stop,
  } = useAIChat({
    api: "/api/saju-chat",
    id: immutableDataRef.current?.chatId || `fallback-${sessionKey}`,
    initialMessages: stableInitialMessages,
    body: stableAiChatBody,
    onFinish: useCallback(
      async (message: any) => {
        // 🔧 Ultra-Stable: 메시지 저장을 비동기로 처리하여 스트리밍 방해 방지
        if (initState.sessionId) {
          setTimeout(async () => {
            try {
              await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: initState.sessionId,
                  messages: [message],
                  roomType,
                  sajuData: {
                    name,
                    gender,
                    saju,
                    birthInfo: immutableDataRef.current?.stableBirthInfo,
                  },
                }),
              })
            } catch (error) {
              console.error("메시지 저장 오류:", error)
            }
          }, 100)
        }
      },
      [initState.sessionId, roomType, name, gender, saju],
    ),
    onError: useCallback((error: Error) => {
      console.error("채팅 오류:", error)
    }, []),
  })

  // 🔧 Ultra-Stable: 완전히 안정화된 submit 핸들러
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!input.trim() || uiState.isSubmitting || isLoading) {
        return
      }

      setUiState((prev) => ({ ...prev, isSubmitting: true }))

      try {
        const newQuestionCount = uiState.questionCount + 1
        setUiState((prev) => ({ ...prev, questionCount: newQuestionCount }))

        const actualIsLoggedIn = !!initState.authUser || isLoggedIn
        if (newQuestionCount >= 5 && !actualIsLoggedIn) {
          setUiState((prev) => ({
            ...prev,
            loginPromptMessage: "5개의 질문을 모두 사용하셨습니다. 로그인하시면 무제한으로 질문하실 수 있습니다.",
            showLoginPrompt: true,
            isSubmitting: false,
          }))
          return
        }

        // 🔧 Ultra-Stable: 사용자 메시지 저장을 비동기로 처리
        if (initState.sessionId) {
          setTimeout(async () => {
            try {
              const userMessageObj = {
                id: `user-${Date.now()}`,
                role: "user" as const,
                content: input.trim(),
              }
              await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sessionId: initState.sessionId,
                  messages: [userMessageObj],
                  roomType,
                  sajuData: {
                    name,
                    gender,
                    saju,
                    birthInfo: immutableDataRef.current?.stableBirthInfo,
                  },
                }),
              })
            } catch (error) {
              console.error("사용자 메시지 저장 오류:", error)
            }
          }, 50)
        }

        // useAIChat의 handleSubmit 호출 (스트리밍)
        await aiHandleSubmit(e)
      } catch (error) {
        console.error("메시지 전송 오류:", error)
      } finally {
        setUiState((prev) => ({ ...prev, isSubmitting: false }))
      }
    },
    [
      input,
      uiState.isSubmitting,
      uiState.questionCount,
      isLoading,
      initState.authUser,
      initState.sessionId,
      isLoggedIn,
      aiHandleSubmit,
      roomType,
      name,
      gender,
      saju,
    ],
  )

  // 🔧 Ultra-Stable: 완전히 안정화된 뒤로가기 핸들러
  const handleBackWithSave = useCallback(() => {
    try {
      localStorage.setItem(
        "last_chat_saju_data",
        JSON.stringify({
          saju,
          name,
          gender,
          interpretation: initialInterpretation,
          birthInfo: immutableDataRef.current?.stableBirthInfo,
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
      // 에러 다이얼로그 표시
      setUiState((prev) => ({ ...prev, showBackError: true }))
    }
  }, [saju, name, gender, initialInterpretation, onBack])

  // 에러 다이얼로그 핸들러들 추가:
  const handleBackErrorClose = useCallback(() => {
    setUiState((prev) => ({ ...prev, showBackError: false }))
  }, [])

  const handleGoHome = useCallback(() => {
    setUiState((prev) => ({ ...prev, showBackError: false }))
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }, [])

  const handleGoLogin = useCallback(() => {
    setUiState((prev) => ({ ...prev, showBackError: false }))
    setTimeout(() => {
      window.location.href = "/login"
    }, 100)
  }, [])

  // Continue generation 함수
  const handleContinueGeneration = useCallback(async () => {
    if (isLoading || uiState.isSubmitting) return

    setUiState((prev) => ({ ...prev, isSubmitting: true }))

    try {
      const response = await fetch("/api/saju-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          ...stableAiChatBody,
          continueFromMessage: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Continue generation failed")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }

      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === "assistant") {
        let updatedContent = lastMessage.content

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("0:")) {
                try {
                  const data = JSON.parse(line.slice(2))
                  if (data.type === "text-delta" && data.textDelta) {
                    updatedContent += data.textDelta

                    // 실시간으로 메시지 업데이트
                    setMessages((prev) => {
                      const newMessages = [...prev]
                      newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        content: updatedContent,
                      }
                      return newMessages
                    })
                  }
                } catch (parseError) {
                  console.error("Parse error:", parseError)
                }
              }
            }
          }
        } finally {
          reader.releaseLock()
        }
      }
    } catch (error) {
      console.error("Continue generation error:", error)
      toast.error("계속 생성하는 중 오류가 발생했습니다")
    } finally {
      setUiState((prev) => ({ ...prev, isSubmitting: false }))
    }
  }, [messages, stableAiChatBody, isLoading, uiState.isSubmitting, setMessages])

  // 피드백 핸들러들
  const handleLike = useCallback(
    async (messageId: string) => {
      try {
        await fetch("/api/message-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message_id: messageId,
            feedback_type: "like",
            session_id: initState.sessionId,
          }),
        })
      } catch (error) {
        console.error("Like feedback error:", error)
      }
    },
    [initState.sessionId],
  )

  const handleDislike = useCallback(
    async (messageId: string) => {
      try {
        await fetch("/api/message-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message_id: messageId,
            feedback_type: "dislike",
            session_id: initState.sessionId,
          }),
        })
      } catch (error) {
        console.error("Dislike feedback error:", error)
      }
    },
    [initState.sessionId],
  )

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content).catch((err) => {
      console.error("복사 실패:", err)
    })
  }, [])

  const handleRetry = useCallback(() => {
    if (isLoading || uiState.isSubmitting) return
    setUiState((prev) => ({ ...prev, isSubmitting: true }))
    reload()
    setTimeout(() => {
      setUiState((prev) => ({ ...prev, isSubmitting: false }))
    }, 1000)
  }, [reload, isLoading, uiState.isSubmitting])

  // 🔧 Ultra-Stable: 스크롤 처리 - 메시지 길이만 체크
  useEffect(() => {
    const scrollContainer = chatContainerRef.current
    if (scrollContainer && messages.length > lastMessageLength.current) {
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
      lastMessageLength.current = messages.length

      if (isNearBottom) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // 🔧 Ultra-Stable: 완전히 안정화된 이벤트 핸들러들
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
      setUiState((prev) => ({ ...prev, showScrollToBottom: !isNearBottom }))
    }
  }, [])

  // 테마 및 헤더/푸터 숨김 처리
  useHideHeaderAndFooter()
  useForceDarkTheme()

  // 🔧 Ultra-Stable: 로딩 상태 체크
  if (!initState.isReady || !immutableDataRef.current) {
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

  const { currentCharacter, suggestedQuestions, stableBirthInfo, calculatedDaeun } = immutableDataRef.current

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
              onClick={() => setUiState((prev) => ({ ...prev, isDropdownOpen: !prev.isDropdownOpen }))}
            >
              <span className="text-base sm:text-lg flex-shrink-0">{currentCharacter.emoji}</span>
              <span className="font-medium text-sm sm:text-base truncate">{currentCharacter.name}</span>
              <ChevronDown
                className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform flex-shrink-0 ${uiState.isDropdownOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {initState.authUser ? (
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
                  timeUnknown={stableBirthInfo?.timeUnknown}
                  size="sm"
                  name={name}
                  gender={gender}
                  solarYear={stableBirthInfo?.solarYear?.toString()}
                  solarMonth={stableBirthInfo?.solarMonth?.toString()}
                  solarDay={stableBirthInfo?.solarDay?.toString()}
                  hour={stableBirthInfo?.solarHour?.toString()}
                  minute={stableBirthInfo?.solarMinute?.toString()}
                  lunarYear={stableBirthInfo?.lunarYear?.toString()}
                  lunarMonth={stableBirthInfo?.lunarMonth?.toString()}
                  lunarDay={stableBirthInfo?.lunarDay?.toString()}
                  location="서울특별시"
                />
              </div>
            </div>
          </div>

          {/* 대운 다이어그램 */}
          {calculatedDaeun && (
            <div className="px-3 sm:px-4 mb-4 sm:mb-6">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
                  <DaeunDiagram
                    daeun={convertDaeunData(calculatedDaeun)}
                    birthInfo={stableBirthInfo}
                    name={name}
                    gender={gender}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 메시지들 */}
          {messages.map((message, index) => (
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

                  {/* 피드백 버튼들 - AI 메시지에만 표시 */}
                  {message.role === "assistant" && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                      <MessageFeedbackButtons
                        messageId={message.id || `msg-${index}`}
                        messageContent={message.content}
                        sessionId={initState.sessionId || ""}
                        onRetry={index === messages.length - 1 ? handleRetry : undefined}
                      />

                      {/* Continue Generate 버튼 - 마지막 메시지이고 불완전한 경우에만 표시 */}
                      {index === messages.length - 1 &&
                        !isLoading &&
                        !uiState.isSubmitting &&
                        isMessageIncomplete(message.content) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleContinueGeneration}
                            className="text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full px-3 py-1"
                          >
                            계속 생성
                          </Button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 로딩 상태 */}
          {(isLoading || uiState.isSubmitting) && (
            <div className="px-3 sm:px-4 py-3 sm:py-4 bg-white/5">
              <div className="max-w-3xl mx-auto flex space-x-2 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {currentCharacter.emoji}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
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
                  <span className="text-sm text-white/60">답변 생성 중...</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={stop}
                    className="text-xs text-white/60 hover:text-white px-2 py-1"
                  >
                    중단
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 스크롤 하단 버튼 */}
      {uiState.showScrollToBottom && (
        <Button
          onClick={scrollToBottomSmooth}
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white z-10"
          size="sm"
        >
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )}

      {/* 하단 입력 영역 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 to-transparent backdrop-blur-md safe-area-bottom">
        {/* 추천 질문 */}
        {suggestedQuestions.length > 0 && !isLoading && !uiState.isSubmitting && (
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
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 focus-within:border-white/40">
                <Sheet
                  open={uiState.showToolsDrawer}
                  onOpenChange={(open) => setUiState((prev) => ({ ...prev, showToolsDrawer: open }))}
                >
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 sm:ml-3 text-white/60 hover:text-white p-1.5 sm:p-2 relative flex-shrink-0"
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                      {!uiState.hasSeenToolsNotification && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="bg-slate-900 border-white/20 text-white">
                    <div className="py-4">
                      <h3 className="text-lg font-semibold mb-4">추가 도구</h3>
                      <div className="space-y-3">
                        <Button
                          onClick={() => {
                            setUiState((prev) => ({
                              ...prev,
                              showCompatibilityTool: true,
                              showToolsDrawer: false,
                              hasSeenToolsNotification: true,
                            }))
                          }}
                          className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border-white/20"
                          variant="outline"
                        >
                          💕 궁합 분석 도구
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={`${currentCharacter.name}에게 질문해보세요...`}
                  className="flex-1 bg-transparent text-white placeholder-white/50 px-2 sm:px-3 py-2.5 sm:py-3 focus:outline-none text-sm sm:text-base min-w-0"
                  disabled={isLoading || uiState.isSubmitting}
                />

                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading || uiState.isSubmitting}
                  className="mr-2 sm:mr-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg p-2 sm:p-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              {/* 질문 카운터 */}
              {!initState.authUser && !isLoggedIn && (
                <div className="flex justify-center mt-2">
                  <Badge variant="secondary" className="bg-white/10 text-white/70 text-xs">
                    {uiState.questionCount}/5 질문 사용
                  </Badge>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 궁합 분석 도구 */}
      {uiState.showCompatibilityTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">궁합 분석 도구</h2>
                <Button
                  variant="ghost"
                  onClick={() => setUiState((prev) => ({ ...prev, showCompatibilityTool: false }))}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <CompatibilityTool
                mainPersonSaju={saju}
                mainPersonName={name}
                mainPersonGender={gender}
                onAnalysisComplete={(data) => {
                  setUiState((prev) => ({ ...prev, showCompatibilityTool: false }))
                  // 궁합 분석 결과를 채팅에 추가
                  append({
                    role: "user",
                    content: `${data.mainPerson.name}과 ${data.selectedPeople.map((p: any) => p.name).join(", ")}의 궁합을 분석해주세요.`,
                  })
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 로그인 프롬프트 */}
      <LoginPromptDialog
        isOpen={uiState.showLoginPrompt}
        onClose={() => setUiState((prev) => ({ ...prev, showLoginPrompt: false }))}
        message={uiState.loginPromptMessage}
      />

      {/* 캐릭터 선택 드롭다운 */}
      {uiState.isDropdownOpen && (
        <div className="absolute top-12 sm:top-14 left-1/2 transform -translate-x-1/2 z-50 bg-slate-800/95 backdrop-blur-md rounded-xl border border-white/20 shadow-xl min-w-[200px] sm:min-w-[240px]">
          <div className="p-2">
            {pingCharacters.map((character) => (
              <Button
                key={character.id}
                variant="ghost"
                className={`w-full justify-start p-2 sm:p-3 rounded-lg mb-1 last:mb-0 ${
                  character.roomType === roomType
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => {
                  if (character.roomType !== roomType) {
                    router.push(`/saju-chat/${character.roomType}`)
                  }
                  setUiState((prev) => ({ ...prev, isDropdownOpen: false }))
                }}
              >
                <span className="text-base sm:text-lg mr-2 sm:mr-3">{character.emoji}</span>
                <div className="text-left">
                  <div className="font-medium text-sm sm:text-base">{character.name}</div>
                  <div className="text-xs text-white/60">{character.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 뒤로가기 에러 다이얼로그 */}
      <BackNavigationErrorDialog
        isOpen={uiState.showBackError}
        onClose={handleBackErrorClose}
        onGoHome={handleGoHome}
        onLogin={handleGoLogin}
      />
    </div>
  )
}
