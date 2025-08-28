"use client"
import type React from "react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Send, ArrowLeft, MoreHorizontal, ArrowDown } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import type { BirthInfo } from "@/types/birth-date"
import { toast } from "sonner"
import DaeunDiagram from "@/components/daeun-diagram"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Input } from "@/components/ui/input"
import { getSessionMessages, saveMessages } from "@/lib/message-service"
import { MessageFeedbackButtons } from "@/components/message-feedback-buttons"
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard"
import { SignupDialog } from "@/components/signup-dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs" // Reverting back to original Supabase client creation method
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth" // Import useAuth hook
import Sidebar from "@/components/sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { trackEvent } from "@/lib/analytics"
import { getCachedDaeunInfo, setCachedDaeunInfo, generateSajuKey } from "@/lib/saju-cache"

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
  concerns?: string[]
  isSidebarOpen?: boolean
  onSidebarToggle?: () => void
  currentChatRoomId?: string
  temporaryChatRoom?: any
  onChatRoomPersisted?: (newChatRoomId: string) => void
  setCurrentChatRoomId?: (newChatRoomId: string) => void
}

const generateSuggestedQuestions = (concerns: string[] = [], roomType: string): string[] => {
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
      "오늘의 운세를 사주기반으로 알려줘",
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

  const personalizedQuestions = concerns.flatMap((concern) => concernQuestionMap[concern] || [])
  const baseQuestionsForType = baseQuestions[roomType] || baseQuestions.general
  const allQuestions = [...new Set([...personalizedQuestions, ...baseQuestionsForType])]
  return allQuestions.slice(0, 6)
}

const getInitialUserQuestions = (name: string, roomType: string, concerns: string[] = []): string[] => {
  if (roomType === "sajuping") {
    const firstQuestion = "내 사주팔자의 성격과 기질을 오행과 일주를 바탕으로 분석해줘"

    // 첫 번째 질문만 반환
    const questions = [firstQuestion]
    console.log("🎯 Generated exactly 1 initial question:", questions)
    return questions
  }
  return []
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function SajuChat({
  saju,
  name,
  gender,
  roomType,
  onBack,
  sessionKey,
  birthInfo,
  concerns,
  isSidebarOpen: externalSidebarOpen,
  onSidebarToggle: externalSidebarToggle,
  currentChatRoomId,
  temporaryChatRoom,
  onChatRoomPersisted,
  setCurrentChatRoomId,
}: SajuChatProps) {
  const { user } = useAuth()
  const { isKeyboardOpen } = useMobileKeyboard()
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false)
  const isSidebarOpen = externalSidebarOpen ?? internalSidebarOpen
  const setSidebarOpen = externalSidebarToggle ? () => externalSidebarToggle() : setInternalSidebarOpen
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [persistedChatRoomId, setPersistedChatRoomId] = useState<string | null>(null)
  const [transitionMessages, setTransitionMessages] = useState<any[] | null>(null)
  const isPersistingRef = useRef(false)
  const scrollPositionRef = useRef<number>(0)
  const isTransitioningRef = useRef<boolean>(false)
  const [initialQuestionsToSend, setInitialQuestionsToSend] = useState<string[]>([])
  const [isInitialQuestionsMode, setIsInitialQuestionsMode] = useState(false)
  const [isFirstChatRoom, setIsFirstChatRoom] = useState<boolean | null>(null)
  const [initialQuestionsSent, setInitialQuestionsSent] = useState({ q1: false, q2: false })
  const [showSignupDialog, setShowSignupDialog] = useState(false)
  const supabase = createClientComponentClient() // Using original createClientComponentClient() method
  const [chatStreamState, setChatStreamState] = useState<{
    isStreaming: boolean
    currentMessageId: string | null
    pendingContent: string
  }>({
    isStreaming: false,
    currentMessageId: null,
    pendingContent: "",
  })
  const chatStreamRef = useRef({
    isStreaming: false,
    messageId: null,
    content: "",
  })

  const router = useRouter()

  const [userContext, setUserContext] = useState<any>(null)
  const [contextLoaded, setContextLoaded] = useState(false)

  const sessionId = useMemo(() => {
    try {
      const savedSaju = localStorage.getItem("current_saju")
      if (savedSaju) {
        const parsedSaju = JSON.parse(savedSaju)
        if (parsedSaju.sessionId) return parsedSaju.sessionId
      }
      const userId = localStorage.getItem("user_id")
      if (userId) return userId
    } catch (error) {
      console.error("Error getting session ID:", error)
    }
    return `fallback-${Date.now()}`
  }, [])

  const [chatData, setChatData] = useState<{
    calculatedDaeun: any
    stableBirthInfo: any
    initialMessages: any[]
    isInitialized: boolean
  }>({
    calculatedDaeun: null,
    stableBirthInfo: null,
    initialMessages: [],
    isInitialized: false,
  })

  const stableSaju = useMemo(() => (saju ? JSON.parse(JSON.stringify(saju)) : null), [JSON.stringify(saju)])
  const stableBirthInfo = useMemo(
    () => (birthInfo ? JSON.parse(JSON.stringify(birthInfo)) : null),
    [JSON.stringify(birthInfo)],
  )
  const stableConcerns = useMemo(() => (concerns ? [...concerns] : []), [JSON.stringify(concerns)])
  const stableUserId = useMemo(() => user?.id || null, [user?.id])
  const effectiveChatRoomId = persistedChatRoomId || currentChatRoomId

  const prevMessageCountRef = useRef(0) // Declare prevMessageCountRef

  // Auto-show signup dialog after 3 seconds for non-authenticated users
  useEffect(() => {
    if (!user) {
      console.log("🕐 Starting 3-second signup timer from page arrival...")
      const timer = setTimeout(() => {
        console.log("🕐 3 seconds elapsed since page arrival, showing signup dialog")
        setShowSignupDialog(true)
      }, 3000)

      return () => {
        console.log("🕐 Cleanup signup timer")
        clearTimeout(timer)
      }
    }
  }, [user]) // Removed chatData.isInitialized dependency

  const calculatedDaeun = useMemo(() => {
    if (!stableSaju?.yearStem || !stableBirthInfo?.solarYear || !gender) {
      return null
    }

    // 캐시 키 생성
    const sajuKey = generateSajuKey(stableSaju, stableBirthInfo)
    if (!sajuKey) return null

    // 캐시에서 먼저 확인
    const cached = getCachedDaeunInfo(sajuKey)
    if (cached) {
      console.log("🚀 대운 정보 캐시에서 로드:", sajuKey)
      return cached
    }

    // 캐시에 없으면 계산
    console.log("🔄 대운 정보 새로 계산:", sajuKey)
    const calculated = calculateDaeunInfo(
      { yearStem: stableSaju.yearStem, monthStem: stableSaju.monthStem, monthBranch: stableSaju.monthBranch },
      stableBirthInfo.solarYear,
      stableBirthInfo.solarMonth,
      stableBirthInfo.solarDay,
      gender,
      stableBirthInfo.solarHour,
      stableBirthInfo.solarMinute,
      stableBirthInfo.timeUnknown,
    )

    // 계산 결과 캐싱
    setCachedDaeunInfo(sajuKey, calculated)
    return calculated
  }, [stableSaju, stableBirthInfo, gender])

  const loadUserContext = useCallback(async () => {
    if (!user?.id || contextLoaded) return

    try {
      console.log("🔄 Loading user context...")
      const response = await fetch(`/api/user-context?userId=${user.id}`)
      if (response.ok) {
        const contextData = await response.json()
        setUserContext(contextData)
        setContextLoaded(true)
        console.log("✅ User context loaded:", contextData.totalContexts, "contexts")
      } else {
        console.error("Failed to load user context:", response.status)
      }
    } catch (error) {
      console.error("Error loading user context:", error)
    }
  }, [user?.id, contextLoaded])

  useEffect(() => {
    if (user?.id && !contextLoaded) {
      loadUserContext()
    }
  }, [user?.id, loadUserContext])

  const aiChatBody = useMemo(() => {
    const compressedSaju = stableSaju
      ? {
          year: stableSaju.year,
          month: stableSaju.month,
          day: stableSaju.day,
          hour: stableSaju.hour,
          minute: stableSaju.minute,
          gender: gender,
          name: name,
          pillars: stableSaju.pillars,
          daeun: calculatedDaeun,
        }
      : null

    const body: any = {
      sessionId,
      chatRoomId: effectiveChatRoomId,
      roomType,
      name,
      saju: stableSaju,
      compressedSaju, // 누락된 필드 추가
      birthInfo: stableBirthInfo,
      daeunInfo: calculatedDaeun,
      concerns: stableConcerns,
      gender,
      userId: user?.id,
      userContext: userContext?.contextSummary || null,
    }

    return body
  }, [
    sessionId,
    effectiveChatRoomId,
    roomType,
    name,
    stableSaju,
    stableBirthInfo,
    calculatedDaeun,
    stableConcerns,
    gender,
    user?.id,
    userContext,
  ])

  useEffect(() => {
    let isMounted = true
    const initializeChatData = async () => {
      if (!stableSaju) return

      if (stableSaju.isOptimizedLoad && stableSaju.preloadedDaeun) {
        console.log("🚀 Using optimized load - skipping unnecessary recalculations")

        try {
          let pastMessages: any[] = []
          let shouldSendInitialQuestions = false
          let isFirstRoom = false

          // 메시지와 채팅룸 정보만 로드
          if (sessionId && effectiveChatRoomId && !effectiveChatRoomId.startsWith("temp-")) {
            try {
              const response = await fetch(`/api/chat-rooms?sessionId=${sessionId}`)
              if (response.ok) {
                const result = await response.json()
                const chatRooms = result.chatRooms || []
                const sortedRooms = chatRooms.sort(
                  (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                )
                isFirstRoom = sortedRooms.length > 0 && sortedRooms[0].id === effectiveChatRoomId
              }
            } catch (error) {
              console.error("Error fetching chat rooms:", error)
            }

            try {
              pastMessages = (await getSessionMessages(sessionId, effectiveChatRoomId))
                .filter((msg) => msg.role === "user" || msg.role === "assistant")
                .sort((a, b) => (a.messageOrder || 0) - (b.messageOrder || 0))
                .map((msg) => ({ id: msg.id, role: msg.role, content: msg.content, createdAt: msg.createdAt }))
            } catch (error) {
              console.error("Error loading messages:", error)
              pastMessages = []
            }
          } else {
            shouldSendInitialQuestions = true
            try {
              const response = await fetch(`/api/chat-rooms?sessionId=${sessionId}`)
              isFirstRoom = !(response.ok && (await response.json()).chatRooms?.length > 0)
            } catch (error) {
              console.error("Error checking first room:", error)
              isFirstRoom = true
            }
          }

          if (isMounted) {
            setChatData({
              calculatedDaeun: stableSaju.preloadedDaeun, // 미리 로드된 대운 사용
              stableBirthInfo: stableBirthInfo,
              initialMessages: pastMessages,
              isInitialized: true,
            })
            setLastSavedMessageCount(pastMessages.length)
            setIsFirstChatRoom(isFirstRoom)

            if (shouldSendInitialQuestions && isFirstRoom) {
              const questions = getInitialUserQuestions(name, roomType, stableConcerns)
              setInitialQuestionsToSend(questions)
              setIsInitialQuestionsMode(true)
            }
          }
          return
        } catch (error) {
          console.error("❌ Error in optimized initialization:", error)
          // 최적화 실패 시 일반 로직으로 폴백
        }
      }

      console.log("📊 Using standard load - performing full calculations")

      let apiCallMade = false

      try {
        let pastMessages: any[] = []
        let shouldSendInitialQuestions = false
        let isFirstRoom = false

        if (sessionId && effectiveChatRoomId && !effectiveChatRoomId.startsWith("temp-")) {
          try {
            const response = await fetch(`/api/chat-rooms?sessionId=${sessionId}`)
            if (response.ok) {
              const result = await response.json()
              const chatRooms = result.chatRooms || []
              const sortedRooms = chatRooms.sort(
                (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              )
              isFirstRoom = sortedRooms.length > 0 && sortedRooms[0].id === effectiveChatRoomId
              apiCallMade = true
            } else {
              console.warn("Failed to fetch chat rooms:", response.status)
            }
          } catch (error) {
            console.error("Error fetching chat rooms:", error)
          }

          try {
            pastMessages = (await getSessionMessages(sessionId, effectiveChatRoomId))
              .filter((msg) => msg.role === "user" || msg.role === "assistant")
              .sort((a, b) => (a.messageOrder || 0) - (b.messageOrder || 0))
              .map((msg) => ({ id: msg.id, role: msg.role, content: msg.content, createdAt: msg.createdAt }))
          } catch (error) {
            console.error("Error loading messages:", error)
            pastMessages = []
          }
        } else {
          shouldSendInitialQuestions = true
          if (!apiCallMade) {
            try {
              const response = await fetch(`/api/chat-rooms?sessionId=${sessionId}`)
              isFirstRoom = !(response.ok && (await response.json()).chatRooms?.length > 0)
            } catch (error) {
              console.error("Error checking first room:", error)
              isFirstRoom = true
            }
          }
        }

        if (isMounted) {
          setChatData({
            calculatedDaeun: calculatedDaeun, // useMemo에서 계산된 값 사용
            stableBirthInfo: stableBirthInfo,
            initialMessages: pastMessages,
            isInitialized: true,
          })
          setLastSavedMessageCount(pastMessages.length)
          setIsFirstChatRoom(isFirstRoom)

          if (shouldSendInitialQuestions && isFirstRoom) {
            const questions = getInitialUserQuestions(name, roomType, stableConcerns)
            setInitialQuestionsToSend(questions)
            setIsInitialQuestionsMode(true)
          }
        }
      } catch (error) {
        console.error("❌ Error initializing chat data:", error)
        if (isMounted) {
          setChatData({
            calculatedDaeun: null,
            stableBirthInfo: stableBirthInfo,
            initialMessages: [],
            isInitialized: true,
          })
          setIsFirstChatRoom(true)
        }
      }
    }
    initializeChatData()
    return () => {
      isMounted = false
    }
  }, [stableSaju, effectiveChatRoomId, sessionId, calculatedDaeun])

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, reload, append } = useAIChat({
    api: "/api/saju-chat",
    id: effectiveChatRoomId ? `${sessionId}-${effectiveChatRoomId}` : sessionId,
    initialMessages: transitionMessages ?? chatData.initialMessages,
    body: aiChatBody,
    experimental_throttle: 50,
    onFinish: (message) => {
      if (transitionMessages) setTransitionMessages(null)
      console.log("✅ onFinish triggered for message from:", message.role)

      if (message.role === "assistant") {
        trackEvent("AI_message_sent", {
          message_length: message.content.length,
          response_time: Date.now() - (window.lastUserMessageTime || Date.now()),
          room_type: roomType,
          session_id: sessionId,
          is_logged_in: user !== null,
        })
      }

      // Clear persistent streaming state
      const streamKey = `chat-stream-${effectiveChatRoomId || sessionId}`
      localStorage.removeItem(streamKey)
      setChatStreamState({ isStreaming: false, currentMessageId: null, pendingContent: "" })
      chatStreamRef.current = { isStreaming: false, messageId: null, content: "" }
    },
    onError: (error) => {
      console.error("❌ 채팅 오류 상세:", { error, body: aiChatBody })
      toast.error("오류가 발생했습니다. 다시 시도해주세요.")

      trackEvent("AI_error", {
        error_type: "chat_response_error",
        error_message: error.message,
        room_type: roomType,
        session_id: sessionId,
      })

      // Clear persistent streaming state on error
      const streamKey = `chat-stream-${effectiveChatRoomId || sessionId}`
      localStorage.removeItem(streamKey)
      setChatStreamState({ isStreaming: false, currentMessageId: null, pendingContent: "" })
      chatStreamRef.current = { isStreaming: false, messageId: null, content: "" }
    },
  })

  useEffect(() => {
    if (
      isInitialQuestionsMode &&
      !isLoading &&
      messages.length === 0 &&
      initialQuestionsToSend.length > 0 &&
      !initialQuestionsSent.q1
    ) {
      console.log("📤 [Flow] Sending first question...")
      setInitialQuestionsSent((prev) => ({ ...prev, q1: true }))
      append({ role: "user", content: initialQuestionsToSend[0] })
    }
  }, [isInitialQuestionsMode, isLoading, messages.length, initialQuestionsToSend, append, initialQuestionsSent.q1])

  useEffect(() => {
    const endInitialMode = () => {
      console.log("✅ [Flow] Ending initial questions mode.")
      setIsInitialQuestionsMode(false)
      setInitialQuestionsToSend([])
    }

    if (isInitialQuestionsMode && !isLoading) {
      if (messages.length === 2 && messages[1].role === "assistant") {
        endInitialMode()
      }
    }
  }, [isInitialQuestionsMode, isLoading, messages])

  useEffect(() => {
    const saveNewMessages = async () => {
      if (savingRef.current || messages.length <= lastSavedMessageCount || !chatData.isInitialized || isLoading) {
        return
      }

      const newMessages = messages.slice(lastSavedMessageCount)
      if (newMessages.length === 0) {
        return
      }

      const currentMessageCount = messages.length
      if (currentMessageCount === lastSavedMessageCount) {
        return
      }

      savingRef.current = true

      const messagesToSave = newMessages.map((msg, index) => ({
        id: generateUUID(),
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt || new Date().toISOString(),
        messageOrder: lastSavedMessageCount + index + 1,
        chatRoomId: effectiveChatRoomId,
      }))

      try {
        console.log(
          `[v0] Saving ${messagesToSave.length} new messages (total: ${messages.length}, saved: ${lastSavedMessageCount})`,
        )

        const result = await saveMessages(sessionId, messagesToSave, roomType, effectiveChatRoomId, temporaryChatRoom)

        if (result.savedCount > 0) {
          setLastSavedMessageCount(currentMessageCount) // 현재 메시지 수로 업데이트
          console.log(`[v0] Successfully saved ${result.savedCount} messages`)
        }

        if (result.persistedChatRoomId && result.persistedChatRoomId !== effectiveChatRoomId) {
          if (chatContainerRef.current) {
            scrollPositionRef.current = chatContainerRef.current.scrollTop
            isTransitioningRef.current = true
          }
          setTransitionMessages(messages)
          setPersistedChatRoomId(result.persistedChatRoomId)
          onChatRoomPersisted?.(result.persistedChatRoomId)
          if (window.history.pushState) {
            const newUrl = `/saju-chat/${roomType}?roomId=${result.persistedChatRoomId}`
            window.history.replaceState(null, "", newUrl)
          }
        }
      } catch (error) {
        console.error("❌ Error saving messages:", error)
        toast.error("메시지 저장 중 오류가 발생했습니다.")
      } finally {
        savingRef.current = false
      }
    }

    saveNewMessages()
  }, [
    messages.length,
    lastSavedMessageCount,
    isLoading,
    roomType,
    chatData.isInitialized,
    effectiveChatRoomId,
    sessionId,
    temporaryChatRoom,
    onChatRoomPersisted,
    messages,
  ])

  useEffect(() => {
    if (isTransitioningRef.current && chatContainerRef.current && transitionMessages === null) {
      const container = chatContainerRef.current
      requestAnimationFrame(() => {
        container.scrollTop = scrollPositionRef.current > 0 ? scrollPositionRef.current : container.scrollHeight
        isTransitioningRef.current = false
        scrollPositionRef.current = 0
      })
    }
  }, [transitionMessages])

  const handleSuggestedQuestionClick = (question: string) => {
    if (isLoading) return
    setInput(question)
    setTimeout(() => document.querySelector("form")?.requestSubmit(), 100)
  }

  const saveScrollPosition = useCallback(() => {
    if (chatContainerRef.current) {
      const scrollPosition = chatContainerRef.current.scrollTop
      sessionStorage.setItem(`chat-scroll-${roomType}`, scrollPosition.toString())
    }
  }, [roomType])

  const [isChangingRoom, setIsChangingRoom] = useState(false)
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null)

  const handleChatRoomSelect = useCallback(
    (chatRoomId: string) => {
      console.log("[v0] Chat room selected:", chatRoomId)

      setIsChangingRoom(true)
      setLoadingStartTime(Date.now())

      if (window.innerWidth < 1024) setSidebarOpen(false)

      router.replace(`/saju-chat/${roomType}?roomId=${chatRoomId}`)

      if (setCurrentChatRoomId) {
        console.log("[v0] Setting current chat room ID:", chatRoomId)
        setCurrentChatRoomId(chatRoomId)
      } else {
        console.warn("[v0] setCurrentChatRoomId is not available")
      }
    },
    [router, roomType, setSidebarOpen, setCurrentChatRoomId],
  )

  useEffect(() => {
    if (isChangingRoom && chatData.isInitialized && effectiveChatRoomId && loadingStartTime) {
      console.log("[v0] Chat data initialized for room:", effectiveChatRoomId)
      console.log("[v0] Messages loaded:", chatData.initialMessages.length)

      // Check if we have messages or if this is a new chat room (no messages expected)
      const hasMessagesOrNewRoom = chatData.initialMessages.length > 0 || messages.length === 0

      if (hasMessagesOrNewRoom) {
        const elapsedTime = Date.now() - loadingStartTime
        const minLoadingTime = 2000
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime)

        setTimeout(() => {
          setIsChangingRoom(false)
          setLoadingStartTime(null)
          console.log("[v0] Chat room loading completed")

          // Scroll to bottom to show latest messages in new chat room
          setTimeout(() => {
            scrollToBottom()
          }, 50) // Minimal delay only for DOM update
        }, remainingTime)
      }
    }
  }, [
    isChangingRoom,
    chatData.isInitialized,
    effectiveChatRoomId,
    chatData.initialMessages.length,
    messages.length,
    loadingStartTime,
  ])

  const handleNewChat = () => {
    router.push(`/saju-chat/${roomType}`)
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" })
  }

  const scrollToTop = () => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToLastUserMessage = useCallback(() => {
    if (!chatContainerRef.current) return

    const container = chatContainerRef.current
    const messageElements = container.querySelectorAll('[data-role="user"]')
    const lastUserMessageElement = messageElements[messageElements.length - 1]

    if (!lastUserMessageElement) return

    try {
      const containerClientHeight = container.clientHeight // Moved this line above the usage
      const elementOffsetTop = (lastUserMessageElement as HTMLElement).offsetTop
      const containerScrollTop = container.scrollTop
      const offset = 20 // 20px margin

      const targetScrollPosition =
        elementOffsetTop - containerClientHeight + (lastUserMessageElement as HTMLElement).offsetHeight + offset

      container.scrollTo({
        top: Math.max(0, targetScrollPosition),
        behavior: "smooth",
      })
    } catch (error) {
      console.error("Error scrolling to last user message:", error)
    }
  }, [])

  const handleSignupProvider = async (provider: "kakao" | "google") => {
    trackEvent("auth_attempt", {
      provider: provider,
      context: "chat_signup_dialog",
      user_type: "anonymous",
      has_chat_history: messages.length > 0,
    })

    try {
      localStorage.setItem("auth_return_url", window.location.href)

      if (provider === "kakao") {
        window.location.href = `/api/auth/login?provider=kakao`
      } else if (provider === "google") {
        window.location.href = `/api/auth/login?provider=google`
      }
      setShowSignupDialog(false)
    } catch (error) {
      console.error("Signup error:", error)
      toast.error("로그인 중 오류가 발생했습니다.")
    }
  }

  const suggestedQuestions = useMemo(
    () => generateSuggestedQuestions(stableConcerns, roomType),
    [stableConcerns, roomType],
  )

  useEffect(() => {
    if (chatContainerRef.current && messages.length > prevMessageCountRef.current && !isTransitioningRef.current) {
      // No automatic scrolling - user controls scroll position
    }
    prevMessageCountRef.current = messages.length
  }, [messages])

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container
      setShowScrollButton(scrollHeight - scrollTop - clientHeight >= 100 && messages.length > 1)
    }
    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [messages.length])

  useEffect(() => {
    const streamKey = `chat-stream-${effectiveChatRoomId || sessionId}`

    // Load persistent stream state on mount
    const savedStreamState = localStorage.getItem(streamKey)
    if (savedStreamState) {
      try {
        const parsedState = JSON.parse(savedStreamState)
        if (parsedState.isStreaming && parsedState.messageId) {
          console.log("🔄 Restoring persistent chat stream:", parsedState.messageId)
          setChatStreamState(parsedState)
          chatStreamRef.current = parsedState
        }
      } catch (error) {
        console.error("❌ Error loading persistent stream state:", error)
        localStorage.removeItem(streamKey)
      }
    }

    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === "assistant") {
        const newStreamState = {
          isStreaming: true,
          messageId: lastMessage.id || `temp-${Date.now()}`,
          pendingContent: lastMessage.content || "",
          timestamp: Date.now(),
        }

        setChatStreamState({
          isStreaming: true,
          currentMessageId: newStreamState.messageId,
          pendingContent: newStreamState.pendingContent,
        })
        chatStreamRef.current = {
          isStreaming: true,
          messageId: newStreamState.messageId,
          content: newStreamState.pendingContent,
        }

        localStorage.setItem(streamKey, JSON.stringify(newStreamState))
      }
    } else if (!isLoading && chatStreamState.isStreaming) {
      const clearStreamState = () => {
        localStorage.removeItem(streamKey)
        setChatStreamState({ isStreaming: false, currentMessageId: null, pendingContent: "" })
        chatStreamRef.current = { isStreaming: false, messageId: null, content: "" }
      }

      // Wait a bit to ensure the final message content is fully rendered
      setTimeout(clearStreamState, 100)
    }

    // Cleanup function
    return () => {
      if (chatStreamRef.current.isStreaming) {
        localStorage.setItem(
          streamKey,
          JSON.stringify({
            isStreaming: chatStreamRef.current.isStreaming,
            messageId: chatStreamRef.current.messageId,
            pendingContent: chatStreamRef.current.content,
            timestamp: Date.now(),
          }),
        )
      }
    }
  }, [effectiveChatRoomId, sessionId])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const streamKey = `chat-stream-${effectiveChatRoomId || sessionId}`
      if (chatStreamRef.current.isStreaming) {
        localStorage.setItem(
          streamKey,
          JSON.stringify({
            isStreaming: chatStreamRef.current.isStreaming,
            messageId: chatStreamRef.current.messageId,
            pendingContent: chatStreamRef.current.content,
            timestamp: Date.now(),
          }),
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [effectiveChatRoomId, sessionId])

  useEffect(() => {
    // Check for interrupted streams on page load
    const streamKey = `chat-stream-${effectiveChatRoomId || sessionId}`
    const savedStream = localStorage.getItem(streamKey)

    if (savedStream && chatData.isInitialized) {
      try {
        const streamState = JSON.parse(savedStream)
        const timeDiff = Date.now() - (streamState.timestamp || 0)

        // If stream is less than 5 minutes old, try to restore it
        if (timeDiff < 5 * 60 * 1000 && streamState.isStreaming) {
          console.log("🔄 Attempting to restore interrupted stream")

          // Check if the message exists in current messages
          const messageExists = messages.some((msg) => msg.id === streamState.messageId)

          if (!messageExists && streamState.pendingContent) {
            // Add the partially streamed message back
            const restoredMessage = {
              id: streamState.messageId,
              role: "assistant" as const,
              content: streamState.pendingContent,
              createdAt: new Date().toISOString(),
            }

            // Trigger the AI to continue from where it left off
            setTimeout(() => {
              reload()
            }, 1000)
          }
        } else {
          // Clean up old stream state
          localStorage.removeItem(streamKey)
        }
      } catch (error) {
        console.error("❌ Error restoring stream state:", error)
        localStorage.removeItem(streamKey)
      }
    }
  }, [chatData.isInitialized, messages, effectiveChatRoomId, sessionId, reload])

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    // Preserve scroll position when streaming state changes
    const savedScrollTop = container.scrollTop

    const preserveScroll = () => {
      if (container.scrollTop !== savedScrollTop) {
        container.scrollTop = savedScrollTop
      }
    }

    // Use requestAnimationFrame to preserve scroll after DOM updates
    const rafId = requestAnimationFrame(preserveScroll)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [chatStreamState.isStreaming, isLoading])

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container || messages.length <= prevMessageCountRef.current || isTransitioningRef.current) {
      prevMessageCountRef.current = messages.length
      return
    }

    // Store current scroll position before message update
    const scrollTop = container.scrollTop

    // Restore scroll position after DOM update
    requestAnimationFrame(() => {
      if (container.scrollTop !== scrollTop) {
        container.scrollTop = scrollTop
      }
    })

    prevMessageCountRef.current = messages.length
  }, [messages])

  const restoreScrollPosition = () => {
    // No automatic scroll restoration
  }

  useEffect(() => {
    // No automatic scroll on room type change
  }, [roomType])

  useEffect(() => {
    // No automatic scroll on initialization
  }, [chatData.isInitialized, roomType])

  const handleUserSubmit = (e: React.FormEvent) => {
    if (input.trim()) {
      window.lastUserMessageTime = Date.now()

      trackEvent("user_message_sent", {
        message_length: input.length,
        room_type: roomType,
        session_id: sessionId,
        is_logged_in: user !== null,
        message_count: messages.filter((m) => m.role === "user").length + 1,
      })

      // Check for multiple questions in quick succession
      const recentUserMessages = messages.filter(
        (m) => m.role === "user" && Date.now() - new Date(m.createdAt || Date.now()).getTime() < 60000, // within 1 minute
      )

      if (recentUserMessages.length >= 2) {
        trackEvent("BEHAVIOR_multiple_questions", {
          questions_count: recentUserMessages.length + 1,
          time_window: "1_minute",
          room_type: roomType,
        })
      }
    }

    handleSubmit(e)
  }

  if (!chatData.isInitialized || isFirstChatRoom === null) {
    return (
      <div className="flex h-screen-mobile items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          채팅을 불러오는 중...
        </div>
      </div>
    )
  }

  if (!stableSaju || !aiChatBody.compressedSaju) {
    return (
      <div className="flex h-screen-mobile items-center justify-center bg-background p-4 text-center">
        <div>
          <h2 className="text-xl font-semibold">오류</h2>
          <p className="text-muted-foreground mt-2">
            사주 정보를 불러오지 못했습니다.
            <br />
            이전 페이지로 돌아가 다시 시도해주세요.
          </p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const shouldShowSajuDiagram = (index: number) => {
    if (isFirstChatRoom && index === 1 && messages[index].role === "assistant") {
      return true
    }
    if (!isFirstChatRoom && index === 0 && messages[index].role === "assistant") {
      return true
    }
    return false
  }

  const shouldShowDaeunDiagram = (index: number) => {
    return isFirstChatRoom && index === 1 && messages[index].role === "assistant"
  }

  return (
    <div className="flex overflow-hidden bg-white keyboard-aware-container">
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0 lg:hidden">
          <Sidebar
            saju={stableSaju}
            name={name}
            gender={gender}
            birthInfo={chatData.stableBirthInfo}
            sessionId={sessionId}
            roomType={roomType}
            currentChatRoomId={effectiveChatRoomId}
            onChatRoomSelect={handleChatRoomSelect}
            onNewChat={handleNewChat}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar - unchanged */}
      <div className="hidden lg:block lg:w-80 border-r border-gray-200/50 bg-white">
        <Sidebar
          saju={stableSaju}
          name={name}
          gender={gender}
          birthInfo={chatData.stableBirthInfo}
          sessionId={sessionId}
          roomType={roomType}
          currentChatRoomId={effectiveChatRoomId}
          onChatRoomSelect={handleChatRoomSelect}
          onNewChat={handleNewChat}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full bg-white lg:pt-0 overflow-hidden">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto chat-messages-container keyboard-aware-chat"
          style={{
            backgroundColor: "white",
            overscrollBehavior: "contain",
            position: "relative",
          }}
        >
          <div className="px-3 sm:px-4 py-1 sm:py-3 space-y-3 sm:space-y-4 pb-2">
            {temporaryChatRoom?.isTemporary && !persistedChatRoomId && (
              <div className="text-center text-xs sm:text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 mt-1">
                💬 첫 메시지를 보내면 대화가 저장됩니다.
              </div>
            )}

            {messages.length === 0 && !isInitialQuestionsMode && (
              <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <div className="mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-black leading-tight mb-3">
                    오늘은 어떤 것이
                    <br />
                    궁금하세요?
                  </h1>
                  <p className="text-base text-gray-600">사주를 바탕으로 나와 대화하는 AI Companion</p>
                </div>

                <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl bg-white border-gray-200 text-left justify-start px-4 hover:bg-gray-50 transition-colors"
                    onClick={() => handleSuggestedQuestionClick("직장을 어떤 기준으로 선택하면 좋을까?")}
                  >
                    <span className="text-lg mr-3">💼</span>
                    <span className="text-sm font-medium">직장을 어떤 기준으로 선택하면 좋을까?</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-12 rounded-xl bg-white border-gray-200 text-left justify-start px-4 hover:bg-gray-50 transition-colors"
                    onClick={() => handleSuggestedQuestionClick("올해 나의 결혼운은 어때?")}
                  >
                    <span className="text-lg mr-3">💕</span>
                    <span className="text-sm font-medium">올해 나의 결혼운은 어때?</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-12 rounded-xl bg-white border-gray-200 text-left justify-start px-4 hover:bg-gray-50 transition-colors"
                    onClick={() => handleSuggestedQuestionClick("이번달 재물운 알려줘")}
                  >
                    <span className="text-lg mr-3">💰</span>
                    <span className="text-sm font-medium">이번달 재물운 알려줘</span>
                  </Button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={message.id || index}>
                {message.role === "user" ? (
                  <div className="flex justify-end" data-role="user">
                    <div className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-2xl rounded-br-md max-w-[85%] sm:max-w-md text-sm sm:text-base leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {(shouldShowSajuDiagram(index) || shouldShowDaeunDiagram(index)) && (
                      <div className="flex flex-col lg:flex-row gap-4 max-w-full">
                        {shouldShowDaeunDiagram(index) && chatData.calculatedDaeun && (
                          <div className="flex-1 w-full lg:max-w-md mx-auto lg:mx-0 order-1 lg:order-1">
                            <DaeunDiagram
                              daeun={chatData.calculatedDaeun.pillars || []}
                              birthInfo={chatData.stableBirthInfo}
                              name={name}
                              gender={gender}
                            />
                          </div>
                        )}
                        {shouldShowSajuDiagram(index) && (
                          <div className="flex-1 w-full lg:max-w-md mx-auto lg:mx-0 order-2 lg:order-2">
                            <SajuDiagram
                              saju={stableSaju}
                              name={name}
                              gender={gender}
                              variant="chat"
                              solarYear={chatData.stableBirthInfo?.solarYear}
                              solarMonth={chatData.stableBirthInfo?.solarMonth}
                              solarDay={chatData.stableBirthInfo?.solarDay}
                              hour={chatData.stableBirthInfo?.solarHour}
                              minute={chatData.stableBirthInfo?.solarMinute}
                              timeUnknown={chatData.stableBirthInfo?.timeUnknown}
                              lunarYear={chatData.stableBirthInfo?.lunarYear}
                              lunarMonth={chatData.stableBirthInfo?.lunarMonth}
                              lunarDay={chatData.stableBirthInfo?.lunarDay}
                              location={chatData.stableBirthInfo?.birthCityId ? "서울특별시" : undefined}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="ai-response-content break-words overflow-wrap-anywhere">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 mt-8 pb-3 border-b-2 border-gray-200 first:mt-0">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 mt-6 pb-2 border-b border-gray-200">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 mt-5">{children}</h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-base sm:text-lg font-medium text-gray-700 mb-2 mt-4">{children}</h4>
                          ),
                          p: ({ children }) => (
                            <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 last:mb-0">
                              {children}
                            </p>
                          ),
                          hr: () => (
                            <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                          ),
                          ul: ({ children }) => <ul className="space-y-2 mb-4 pl-0">{children}</ul>,
                          ol: ({ children }) => <ol className="space-y-2 mb-4 pl-0 counter-reset-item">{children}</ol>,
                          li: ({ children, ordered }) => (
                            <li
                              className={`flex items-start gap-3 text-base sm:text-lg leading-relaxed text-gray-700 ${
                                ordered
                                  ? "counter-increment-item before:content-[counter(item)] before:bg-gray-900 before:text-white before:text-sm before:font-medium before:rounded-full before:w-6 before:h-6 before:flex before:items-center before:justify-center before:flex-shrink-0 before:mt-0.5"
                                  : "before:content-['•'] before:text-gray-400 before:font-bold before:text-xl before:flex-shrink-0 before:w-4 before:mt-0.5"
                              }`}
                            >
                              <span className="flex-1">{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900 bg-yellow-50 px-1 py-0.5 rounded">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => <em className="italic text-gray-600 font-medium">{children}</em>,
                          del: ({ children }) => (
                            <del className="line-through text-gray-500 opacity-75">{children}</del>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className
                            if (isInline) {
                              return (
                                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                                  {children}
                                </code>
                              )
                            }
                            return (
                              <code className="block bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm font-mono overflow-x-auto mb-4">
                                {children}
                              </code>
                            )
                          },
                          pre: ({ children }) => (
                            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto mb-4">
                              {children}
                            </pre>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto mb-4">
                              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
                          th: ({ children }) => (
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">{children}</td>
                          ),
                        }}
                      >
                        {message.content || ""}
                      </ReactMarkdown>
                    </div>
                    <MessageFeedbackButtons
                      messageId={message.id || `temp-${index}`}
                      messageContent={message.content}
                      sessionId={sessionId}
                      onRetry={() => reload()}
                    />
                  </div>
                )}
              </div>
            ))}
            {isChangingRoom && (
              <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-bounce h-3 w-3 bg-gray-600 rounded-full [animation-delay:-0.3s]"></div>
                    <div className="animate-bounce h-3 w-3 bg-gray-600 rounded-full [animation-delay:-0.15s]"></div>
                    <div className="animate-bounce h-3 w-3 bg-gray-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-gray-600">채팅방을 불러오는 중...</p>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center gap-2 pt-2">
                <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full [animation-delay:-0.3s]"></div>
                <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full [animation-delay:-0.15s]"></div>
                <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full"></div>
              </div>
            )}
          </div>
        </div>
        <div
          className="border-t bg-white p-2 sm:p-3 pb-1 sm:pb-2 flex-shrink-0 chat-input-container"
          style={{
            ...(isKeyboardOpen && {
              position: "sticky",
              bottom: 0,
              zIndex: 10,
            }),
          }}
        >
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              variant="outline"
              size="sm"
              className="absolute right-3 sm:right-4 bottom-16 sm:bottom-18 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 z-10"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
          <div className="space-y-1.5">
            {!isLoading && messages.length >= 0 && !isInitialQuestionsMode && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full whitespace-nowrap bg-gray-100 border-gray-200 text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 min-w-fit"
                    onClick={() => handleSuggestedQuestionClick(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}
            <form onSubmit={handleUserSubmit} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="무엇이든 물어보세요"
                  className="h-9 sm:h-11 rounded-full pl-3 sm:pl-4 pr-12 sm:pr-14 bg-gray-100 border-gray-200 focus:ring-gray-900 text-base transition-all duration-200"
                  disabled={isLoading || isInitialQuestionsMode}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 rounded-full shrink-0"
                  disabled={isInitialQuestionsMode}
                >
                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0 bg-gray-900 hover:bg-gray-800 transition-all duration-200"
                disabled={!input.trim() || isLoading || isInitialQuestionsMode}
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </form>
          </div>
        </div>

        <SignupDialog
          open={showSignupDialog}
          onClose={() => setShowSignupDialog(false)}
          onSignup={handleSignupProvider}
        />
      </div>
    </div>
  )
}
