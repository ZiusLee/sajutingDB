"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Send, ChevronDown, ArrowLeft, Menu, User, MoreHorizontal } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import { compressSaju } from "@/lib/saju-compression"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import type { BirthInfo } from "@/types/birth-info"
import { MessageFeedbackButtons } from "@/components/message-feedback-buttons"
import { toast } from "sonner"
import { BackNavigationErrorDialog } from "@/components/back-navigation-error-dialog"
import DaeunDiagram from "@/components/daeun-diagram"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  concerns?: string[] // Add this line
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

// Replace the static object with this function
const generateSuggestedQuestions = (concerns: string[], roomType: string): string[] => {
  const concernQuestionMap: Record<string, string[]> = {
    love: ["몇 월달에 연애운이 좋을까요?", "연애운 알려주세요"],
    breakup: ["이별 후 회복 시기는 언제인가요?", "새로운 만남은 언제쯤일까요?"],
    health: ["건강운 알려주세요", "주의해야 할 건강 문제가 있나요?"],
    marriage: ["결혼운은 어떤가요?", "결혼 적령기는 언제인가요?"],
    money: ["재물운 알려주세요", "투자운은 어떤가요?"],
    work: ["학업운은 어떤가요?", "시험운 알려주세요"],
    relationship: ["연인과의 궁합은 어떤가요?", "관계 발전 방향은?"],
    career: ["직업운 알려주세요", "커리어 전환 시기는?"],
    job: ["취업운은 어떤가요?", "면접운 알려주세요"],
    future: ["제 인생의 방향성은?", "앞으로의 운세는?"],
    workplace: ["직장 내 인간관계는?", "승진운은 어떤가요?"],
    friend: ["인간관계운 알려주세요", "새로운 인연은 언제?"],
    family: ["가족운은 어떤가요?", "가족 간 화합 방법은?"],
  }

  const baseQuestions: Record<string, string[]> = {
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

  // Get personalized questions based on concerns
  const personalizedQuestions: string[] = []
  concerns.forEach((concern) => {
    if (concernQuestionMap[concern]) {
      personalizedQuestions.push(...concernQuestionMap[concern])
    }
  })

  // Get base questions for the room type
  const baseQuestionsForType = baseQuestions[roomType] || baseQuestions.general

  // Combine and deduplicate
  const allQuestions = [...personalizedQuestions, ...baseQuestionsForType]
  const uniqueQuestions = Array.from(new Set(allQuestions))

  return uniqueQuestions.slice(0, 6) // Return max 6 questions
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
      return `안녕하세요, ${userName}님! 저는 사주핑이에요.

${userName}님의 사주를 바탕으로 인생의 모든 영역에 대해 상담해드릴게요.`

    case "tarot":
      return `안녕하세요, ${userName}님! 저는 타로핑이에요.

신비로운 타로카드의 세계로 여러분을 안내해드릴게요!`

    default:
      return `안녕하세요, ${userName}님! 무엇을 도와드릴까요?`
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
  concerns = [], // Add this line
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
    const suggestedQuestions = generateSuggestedQuestions(concerns, roomType)

    const stableBirthInfo = birthInfo
      ? {
          solarYear: birthInfo.solarYear,
          solarMonth: birthInfo.solarMonth,
          solarDay: birthInfo.solarDay,
          solarHour: birthInfo.solarHour,
          solarMinute: birthInfo.solarMinute,
          timeUnknown: birthInfo.timeUnknown,
          lunarYear: birthInfo.lunarYear,
          lunarMonth: birthInfo.lunarDay,
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

    const defaultInitialMessages = [
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
    showBackError: false,
    showSidebar: false, // 사이드바 상태 추가
    showToolMenu: false,
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

  const navigateToMyPage = () => {
    router.push("/mypage")
  }

  const handleToolButtonClick = useCallback(() => {
    setUiState((prev) => ({ ...prev, showToolMenu: !prev.showToolMenu }))
  }, [])

  const handleToolMenuClose = useCallback(() => {
    setUiState((prev) => ({ ...prev, showToolMenu: false }))
  }, [])

  const handleCompatibilityCheck = useCallback(() => {
    setUiState((prev) => ({ ...prev, showToolMenu: false }))
    // Add compatibility check logic here
    setInput("궁합을 봐주세요")
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }, [setInput])

  const handleOtherPersonSaju = useCallback(() => {
    setUiState((prev) => ({ ...prev, showToolMenu: false }))
    // Add other person saju logic here
    setInput("다른 사람 사주를 봐주세요")
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }, [setInput])

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
    <div className="flex h-screen bg-white" style={{ height: "100dvh" }}>
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex w-80 bg-gray-50 border-r border-gray-200 flex-col`}>
        <div className="p-4 space-y-6">
          <SajuDiagram
            saju={saju}
            name={name}
            gender={gender}
            variant="sidebar"
            solarYear={stableBirthInfo?.solarYear?.toString()}
            solarMonth={stableBirthInfo?.solarMonth?.toString()}
            solarDay={stableBirthInfo?.solarDay?.toString()}
            hour={stableBirthInfo?.solarHour?.toString()}
            minute={stableBirthInfo?.solarMinute?.toString()}
            location={stableBirthInfo?.location}
            timeUnknown={stableBirthInfo?.timeUnknown}
          />
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={uiState.showSidebar} onOpenChange={(open) => setUiState((prev) => ({ ...prev, showSidebar: open }))}>
        <SheetContent side="left" className="w-80 p-0 bg-gray-50">
          <div className="p-4 space-y-6">
            <SajuDiagram
              saju={saju}
              name={name}
              gender={gender}
              variant="sidebar"
              solarYear={stableBirthInfo?.solarYear?.toString()}
              solarMonth={stableBirthInfo?.solarMonth?.toString()}
              solarDay={stableBirthInfo?.solarDay?.toString()}
              hour={stableBirthInfo?.solarHour?.toString()}
              minute={stableBirthInfo?.solarMinute?.toString()}
              location={stableBirthInfo?.location}
              timeUnknown={stableBirthInfo?.timeUnknown}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header - Clean and minimal like screenshot */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden p-2"
              onClick={() => setUiState((prev) => ({ ...prev, showSidebar: open }))}
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Back Button */}
            <Button variant="ghost" size="icon" className="p-2" onClick={handleBackWithSave}>
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>

            {/* Character Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">
                K
              </div>
              <div>
                <h1 className="font-medium text-gray-900 text-sm">{currentCharacter.name}</h1>
              </div>
            </div>
          </div>

          {/* MyPage Button */}
          <Button variant="ghost" size="icon" className="p-2" onClick={navigateToMyPage}>
            <User className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {/* Chat Messages - No bubbles, clean text blocks */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-white" onScroll={handleScroll}>
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message, index) => (
              <div key={message.id || index} className="space-y-4">
                {message.role === "assistant" && (
                  <div className="space-y-4">
                    {/* AI Message - Clean text block, no bubble */}
                    <div className="text-gray-900 text-base leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="mb-4 last:mb-0 pl-6 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-4 last:mb-0 pl-6 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="mb-2">{children}</li>,
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-bold mb-3">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className
                            return isInline ? (
                              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                            ) : (
                              <code className={className}>{children}</code>
                            )
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Show Saju Diagram for first message */}
                    {index === 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">🔮</span>
                          <span className="text-sm font-medium text-gray-700">{name}님의 사주 프로필</span>
                        </div>
                        <SajuDiagram
                          saju={saju}
                          name={name}
                          gender={gender}
                          variant="card"
                          solarYear={stableBirthInfo?.solarYear?.toString()}
                          solarMonth={stableBirthInfo?.solarMonth?.toString()}
                          solarDay={stableBirthInfo?.solarDay?.toString()}
                          hour={stableBirthInfo?.solarHour?.toString()}
                          minute={stableBirthInfo?.solarMinute?.toString()}
                          location={stableBirthInfo?.location}
                          timeUnknown={stableBirthInfo?.timeUnknown}
                        />
                      </div>
                    )}

                    {/* Show current Daeun info */}
                    {index === 0 && calculatedDaeun && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📅</span>
                          <span className="text-sm font-medium text-gray-700">{name}님의 현재 대운</span>
                        </div>
                        <DaeunDiagram
                          daeun={calculatedDaeun.pillars || []}
                          birthInfo={stableBirthInfo}
                          name={name}
                          gender={gender}
                        />
                      </div>
                    )}

                    {/* Message feedback buttons */}
                    <MessageFeedbackButtons
                      messageId={message.id || `msg-${index}`}
                      messageContent={message.content}
                      sessionId={initState.sessionId || ""}
                      onRetry={handleRetry}
                    />
                  </div>
                )}

                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-xs">
                      <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-br-md">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  <span className="text-sm text-gray-500">답변을 생성하고 있습니다...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-sm bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    onClick={() => handleSuggestedQuestionClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input Area - Clean and minimal with tool button */}
        <div
          className="border-t border-gray-200 bg-white px-6 py-6"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="max-w-2xl mx-auto w-full">
            <form onSubmit={handleSubmit} className="flex gap-3 items-end w-full">
              <div className="flex-1 relative min-w-0">
                <div className="flex items-center border border-gray-300 rounded-full bg-white pr-2 w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    placeholder="무엇이든 물어보세요"
                    className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0"
                    disabled={isLoading || uiState.isSubmitting}
                  />

                  {/* Tool Button */}
                  <Popover
                    open={uiState.showToolMenu}
                    onOpenChange={(open) => setUiState((prev) => ({ ...prev, showToolMenu: open }))}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
                        onClick={handleToolButtonClick}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end" side="top" sideOffset={8}>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm py-2.5 px-3 hover:bg-gray-100 rounded-md"
                          onClick={handleCompatibilityCheck}
                        >
                          <span className="mr-3 text-base">💕</span>
                          궁합 보기
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm py-2.5 px-3 hover:bg-gray-100 rounded-md"
                          onClick={handleOtherPersonSaju}
                        >
                          <span className="mr-3 text-base">👥</span>
                          다른 사람 사주 봐주기
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button
                type="submit"
                size="icon"
                className="rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 w-10 h-10 flex-shrink-0"
                disabled={!input.trim() || isLoading || uiState.isSubmitting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {/* Question counter for non-logged in users */}
            {!initState.authUser && !isLoggedIn && (
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-500">
                  무료 질문: {Math.max(0, 5 - uiState.questionCount)}/5 남음
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      {uiState.showScrollToBottom && (
        <Button
          onClick={scrollToBottomSmooth}
          className="fixed bottom-20 right-4 rounded-full shadow-lg z-10 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          size="icon"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* Login Prompt Dialog */}
      <LoginPromptDialog
        isOpen={uiState.showLoginPrompt}
        onClose={() => setUiState((prev) => ({ ...prev, showLoginPrompt: false }))}
        message={uiState.loginPromptMessage}
      />

      {/* Back Navigation Error Dialog */}
      <BackNavigationErrorDialog
        isOpen={uiState.showBackError}
        onClose={handleBackErrorClose}
        onGoHome={handleGoHome}
        onGoLogin={handleGoLogin}
      />
    </div>
  )
}
