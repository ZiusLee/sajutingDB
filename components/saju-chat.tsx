"use client"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Send, ArrowLeft, MoreHorizontal, ArrowDown } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import type { BirthInfo } from "@/types/birth-date"
import { toast } from "sonner"
import DaeunDiagram from "@/components/daeun-diagram"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { compressSaju } from "@/lib/saju-compression"
import { getSessionMessages, saveMessages } from "@/lib/message-service"
import { MessageFeedbackButtons } from "@/components/message-feedback-buttons"
import Sidebar from "@/components/sidebar"

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

  const personalizedQuestions = concerns.flatMap((concern) => concernQuestionMap[concern] || [])
  const baseQuestionsForType = baseQuestions[roomType] || baseQuestions.general
  const allQuestions = [...new Set([...personalizedQuestions, ...baseQuestionsForType])]
  return allQuestions.slice(0, 6)
}

const getInitialMessage = (name: string, roomType: string): string => {
  const userName = name || "사용자"
  if (roomType === "sajuping") {
    return `안녕하세요, ${userName}님! 저는 사주핑이에요. ${userName}님의 사주를 바탕으로 인생의 모든 영역에 대해 상담해드릴게요. 나에 사주에 대한 설명, 나의 오행 특징, 사주적 성향, 올해의 연애운, 재물운등 나의 사주에 대해 채팅창에 물어보세요`
  }
  return `안녕하세요, ${userName}님! 무엇을 도와드릴까요?`
}

// Generate a simple UUID v4
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
}: SajuChatProps) {
  const { user } = useAuth()
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

  // Get sessionId from localStorage - memoized and stable
  const sessionId = useMemo(() => {
    try {
      const savedSaju = localStorage.getItem("current_saju")
      if (savedSaju) {
        const parsedSaju = JSON.parse(savedSaju)
        if (parsedSaju.sessionId) {
          return parsedSaju.sessionId
        }
      }

      const userId = localStorage.getItem("user_id")
      console.log("🔍 [DEBUG] localStorage user_id check:", {
        userId: userId || "❌ NOT FOUND",
        userAgent: navigator.userAgent,
        storageKeys: Object.keys(localStorage),
        currentOrigin: window.location.origin,
      })

      if (userId) {
        return userId
      }
    } catch (error) {
      console.error("Error getting session ID:", error)
    }

    const fallbackId = `fallback-${Date.now()}`
    console.log("⚠️ [DEBUG] Using fallback userId:", fallbackId)
    return fallbackId
  }, [])

  // Stable state that won't cause re-renders
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

  // Stabilize all props to prevent infinite re-renders
  const stableSaju = useMemo(() => {
    if (!saju) return null
    return JSON.parse(JSON.stringify(saju))
  }, [JSON.stringify(saju)])

  const stableBirthInfo = useMemo(() => {
    if (!birthInfo) return null
    return JSON.parse(JSON.stringify(birthInfo))
  }, [JSON.stringify(birthInfo)])

  const stableConcerns = useMemo(() => {
    if (!concerns) return []
    return [...concerns]
  }, [JSON.stringify(concerns)])

  const stableUserId = useMemo(() => user?.id || null, [user?.id])

  // Get the effective chat room ID (persisted ID takes precedence)
  const effectiveChatRoomId = persistedChatRoomId || currentChatRoomId

  // This derived state ensures the body for the AI hook is always up-to-date.
  const aiChatBody = useMemo(() => {
    if (!chatData.isInitialized) return {}

    const compressedSajuObject =
      stableSaju && chatData.stableBirthInfo
        ? compressSaju(
            stableSaju,
            chatData.stableBirthInfo.solarYear?.toString(),
            chatData.stableBirthInfo.solarMonth?.toString(),
            chatData.stableBirthInfo.solarDay?.toString(),
            chatData.stableBirthInfo.solarHour?.toString(),
            chatData.stableBirthInfo.solarMinute?.toString(),
            chatData.stableBirthInfo.timeUnknown,
          )
        : stableSaju

    return {
      name,
      gender,
      roomType,
      userId: stableUserId,
      currentYear: 2025,
      yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
      birthInfo: chatData.stableBirthInfo,
      compressedSaju: compressedSajuObject,
      daeun: chatData.calculatedDaeun,
      chatRoomId: effectiveChatRoomId,
    }
  }, [
    chatData.isInitialized,
    chatData.stableBirthInfo,
    chatData.calculatedDaeun,
    stableSaju,
    name,
    gender,
    roomType,
    stableUserId,
    effectiveChatRoomId,
  ])

  // Initialize chat data
  useEffect(() => {
    let isMounted = true

    const initializeChatData = async () => {
      if (isPersistingRef.current) {
        isPersistingRef.current = false
        return
      }

      if (!stableSaju) {
        return
      }

      if (chatData.isInitialized && aiChatBody.chatRoomId === effectiveChatRoomId) {
        return
      }

      try {
        let calculatedDaeunData = null
        if (stableSaju?.yearStem && stableBirthInfo?.solarYear && gender) {
          try {
            calculatedDaeunData = calculateDaeunInfo(
              { yearStem: stableSaju.yearStem, monthStem: stableSaju.monthStem, monthBranch: stableSaju.monthBranch },
              stableBirthInfo.solarYear,
              stableBirthInfo.solarMonth,
              stableBirthInfo.solarDay,
              gender,
              stableBirthInfo.solarHour,
              stableBirthInfo.solarMinute,
              stableBirthInfo.timeUnknown,
            )
          } catch (error) {
            console.error("❌ 대운 계산 오류:", error)
          }
        }

        let pastMessages: any[] = []
        try {
          if (sessionId && effectiveChatRoomId && !effectiveChatRoomId.startsWith("temp-")) {
            const messages = await getSessionMessages(sessionId, effectiveChatRoomId)

            pastMessages = messages
              .filter((msg) => msg.role === "user" || msg.role === "assistant")
              .sort((a, b) => (a.messageOrder || 0) - (b.messageOrder || 0))
              .map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
              }))
          }
        } catch (error) {
          console.error("❌ Error loading past messages:", error)
        }

        const initialChatMessages =
          pastMessages.length > 0
            ? pastMessages
            : [{ id: generateUUID(), role: "assistant" as const, content: getInitialMessage(name, roomType) }]

        if (isMounted) {
          setChatData({
            calculatedDaeun: calculatedDaeunData,
            stableBirthInfo: stableBirthInfo,
            initialMessages: initialChatMessages,
            isInitialized: true,
          })
          setLastSavedMessageCount(pastMessages.length)
        }
      } catch (error) {
        console.error("❌ Error initializing chat data:", error)
      }
    }

    if (
      !chatData.isInitialized ||
      (aiChatBody.chatRoomId !== effectiveChatRoomId && !effectiveChatRoomId?.startsWith("temp-"))
    ) {
      setChatData((prev) => ({ ...prev, isInitialized: false }))
    }

    initializeChatData()

    return () => {
      isMounted = false
    }
  }, [stableSaju, stableBirthInfo, gender, name, roomType, effectiveChatRoomId, sessionId])

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, reload } = useAIChat({
    api: "/api/saju-chat",
    id: effectiveChatRoomId ? `${sessionId}-${effectiveChatRoomId}` : sessionId,
    initialMessages: transitionMessages ?? chatData.initialMessages, // Use transition messages if available
    body: aiChatBody,
    experimental_throttle: 50,
    onFinish: () => {
      // After a message is successfully sent with the new persisted ID,
      // we can clear the transition state.
      if (transitionMessages) {
        setTransitionMessages(null)
      }
    },
    onError: (error) => {
      console.error("❌ 채팅 오류 상세:", {
        error,
        message: error.message,
        stack: error.stack,
        body: aiChatBody,
        sessionId,
        effectiveChatRoomId,
      })

      // Show more specific error message
      let errorMessage = "오류가 발생했습니다. 다시 시도해주세요."

      if (error.message?.includes("Internal server error")) {
        errorMessage = "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      } else if (error.message?.includes("Configuration error")) {
        errorMessage = "서버 설정에 문제가 있습니다. 관리자에게 문의해주세요."
      }

      toast.error(errorMessage)
    },
  })

  // Save messages to database when new messages are added
  useEffect(() => {
    const saveNewMessages = async () => {
      if (savingRef.current || messages.length <= lastSavedMessageCount || !chatData.isInitialized) {
        return
      }

      savingRef.current = true
      const newMessages = messages.slice(lastSavedMessageCount)

      const messagesToSave = newMessages.map((msg, index) => ({
        id: generateUUID(),
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt || new Date().toISOString(),
        messageOrder: lastSavedMessageCount + index,
        chatRoomId: effectiveChatRoomId,
      }))

      try {
        console.log("💾 Saving messages:", {
          sessionId,
          messageCount: messagesToSave.length,
          chatRoomId: effectiveChatRoomId,
          temporaryRoom: temporaryChatRoom?.isTemporary,
        })

        const result = await saveMessages(sessionId, messagesToSave, roomType, effectiveChatRoomId, temporaryChatRoom)

        setLastSavedMessageCount(messages.length)

        // If a temporary chat room was persisted, update our state
        if (result.persistedChatRoomId && result.persistedChatRoomId !== effectiveChatRoomId) {
          console.log(
            `Transitioning from temp room ${effectiveChatRoomId} to persisted room ${result.persistedChatRoomId}`,
          )

          // Save current scroll position before transition
          if (chatContainerRef.current) {
            scrollPositionRef.current = chatContainerRef.current.scrollTop
            isTransitioningRef.current = true
          }

          // 1. Preserve the current messages for the next render
          setTransitionMessages(messages)

          // 2. Update the chat room ID state, which will trigger a re-render
          setPersistedChatRoomId(result.persistedChatRoomId)
          onChatRoomPersisted?.(result.persistedChatRoomId)

          // 3. Update URL without page refresh
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

    if (messages.length > 0 && !isLoading) {
      saveNewMessages()
    }
  }, [
    messages,
    lastSavedMessageCount,
    isLoading,
    roomType,
    chatData.isInitialized,
    effectiveChatRoomId,
    sessionId,
    temporaryChatRoom,
    onChatRoomPersisted,
  ])

  // Restore scroll position after chat room transition
  useEffect(() => {
    if (isTransitioningRef.current && chatContainerRef.current && transitionMessages === null) {
      // Transition is complete, restore scroll position
      const container = chatContainerRef.current

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (scrollPositionRef.current > 0) {
          container.scrollTop = scrollPositionRef.current
        } else {
          // If we were at the bottom, stay at the bottom
          container.scrollTop = container.scrollHeight
        }

        // Reset transition state
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

  const handleChatRoomSelect = (chatRoomId: string) => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
    // Use window.location instead of router to avoid hook issues
    window.location.href = `/saju-chat/${roomType}?roomId=${chatRoomId}`
  }

  const handleNewChat = () => {
    // Navigate to a new chat without roomId to trigger auto-creation
    window.location.href = `/saju-chat/${roomType}`
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  // Auto-scroll to bottom when new messages arrive (기존 useEffect 수정)
  useEffect(() => {
    if (chatContainerRef.current && !isTransitioningRef.current) {
      const container = chatContainerRef.current
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

      if (isNearBottom || messages.length === 1) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        })
      }
    }
  }, [messages])

  // Handle scroll button visibility
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
      setShowScrollButton(!isNearBottom && messages.length > 1)
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [messages.length])

    // Handle mobile keyboard and viewport changes
    useEffect(() => {
      const handleResize = () => {
        // Force a re-render when viewport changes (keyboard open/close)
        if (chatContainerRef.current) {
          const container = chatContainerRef.current
          // Scroll to bottom if user was already at bottom
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
          if (isNearBottom) {
            setTimeout(() => {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: "smooth",
              })
            }, 100)
          }
        }
      }

      // Listen for viewport changes (keyboard open/close on mobile)
      window.addEventListener("resize", handleResize)
      window.addEventListener("orientationchange", handleResize)

      // Visual viewport API for better mobile support
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleResize)
      }

      return () => {
        window.removeEventListener("resize", handleResize)
        window.removeEventListener("orientationchange", handleResize)
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", handleResize)
        }
      }
    }, [])

  const suggestedQuestions = useMemo(
    () => generateSuggestedQuestions(stableConcerns, roomType),
    [stableConcerns, roomType],
  )

  // Validate aiChatBody before initializing chat
  useEffect(() => {
    if (chatData.isInitialized && aiChatBody.compressedSaju) {
      console.log("✅ Chat initialized with body:", {
        hasCompressedSaju: !!aiChatBody.compressedSaju,
        name: aiChatBody.name,
        gender: aiChatBody.gender,
        roomType: aiChatBody.roomType,
        userId: aiChatBody.userId,
        chatRoomId: aiChatBody.chatRoomId,
      })
    }
  }, [chatData.isInitialized, aiChatBody])

  // Loading and error states
  if (!chatData.isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          채팅을 불러오는 중...
        </div>
      </div>
    )
  }

  if (!stableSaju || !aiChatBody.compressedSaju) {
    console.error("❌ Missing required data:", {
      hasStableSaju: !!stableSaju,
      hasCompressedSaju: !!aiChatBody.compressedSaju,
      chatDataInitialized: chatData.isInitialized,
    })

    return (
      <div className="flex h-screen items-center justify-center bg-background p-4 text-center">
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

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop Sidebar - Fixed width */}
      <div className="hidden lg:block w-96 flex-shrink-0">
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

      {/* Mobile Sidebar Sheet - 2/3 width */}
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[66.67vw] max-w-sm p-0">
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

      {/* Main Chat Area - Flexible width */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Chat Messages Container - Mobile optimized */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto"
          style={{
            height: "calc(100dvh - 140px)", // Reserve space for input area
            minHeight: 0,
          }}
        >
          <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-4">
            {/* Show temporary room indicator */}
            {temporaryChatRoom?.isTemporary && !persistedChatRoomId && (
              <div className="text-center text-xs sm:text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 sm:p-3">
                💬 새로운 대화가 시작되었습니다. 첫 메시지를 보내면 대화가 저장됩니다.
              </div>
            )}

            {messages.map((message, index) => (
              <div key={message.id || index}>
                {message.role === "assistant" ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="text-foreground text-base sm:text-lg leading-relaxed prose prose-sm sm:prose-lg max-w-none break-words [&>p]:mb-3 sm:[&>p]:mb-4 [&>h1]:text-lg sm:[&>h1]:text-xl [&>h2]:text-base sm:[&>h2]:text-lg [&>h3]:text-base sm:[&>h3]:text-lg [&>ul]:mb-3 sm:[&>ul]:mb-4 [&>li]:mb-1 sm:[&>li]:mb-2 [&>ul]:pl-3 sm:[&>ul]:pl-4 [&>li]:text-base sm:[&>li]:text-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                    {index === 0 && (
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                        <SajuDiagram
                          saju={stableSaju}
                          name={name}
                          gender={gender}
                          variant="card"
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
                        {chatData.calculatedDaeun && (
                          <DaeunDiagram
                            daeun={chatData.calculatedDaeun.pillars || []}
                            birthInfo={chatData.stableBirthInfo}
                            name={name}
                            gender={gender}
                          />
                        )}
                      </div>
                    )}
                    <MessageFeedbackButtons
                      messageId={message.id || `temp-${index}`}
                      messageContent={message.content}
                      sessionId={sessionId}
                      onRetry={() => reload()}
                    />
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-2xl rounded-br-md max-w-[85%] sm:max-w-md text-sm sm:text-base leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 pt-2">
                <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full [animation-delay:-0.3s]"></div>
                <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full [animation-delay:-0.15s]"></div>
                <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full"></div>
              </div>
            )}
          </div>
        </div>

         {/* Input Area - Fixed at bottom with mobile optimization and safe area */}
        <div className="border-t bg-white p-3 sm:p-4 flex-shrink-0 pb-[max(12px,env(safe-area-inset-bottom))] sm:pb-4">
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              variant="outline"
              size="sm"
              className="absolute right-4 sm:right-6 bottom-20 sm:bottom-24 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}

          <div className="space-y-2">
            {!isLoading && messages.length >= 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full whitespace-nowrap bg-gray-100 border-gray-200 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 min-w-fit"
                    onClick={() => handleSuggestedQuestionClick(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="무엇이든 물어보세요"
                  className="h-10 sm:h-12 rounded-full pl-3 sm:pl-4 pr-12 sm:pr-14 bg-gray-100 border-gray-200 focus:ring-gray-900 text-base"
                  disabled={isLoading}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                    >
                      <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 sm:w-56 p-2 mb-2" align="end">
                    <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm">
                      <span className="mr-2 sm:mr-3 text-sm sm:text-base">💕</span>궁합 보기
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm">
                      <span className="mr-2 sm:mr-3 text-sm sm:text-base">👥</span>다른 사람 사주 봐주기
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0 bg-gray-900 hover:bg-gray-800"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
