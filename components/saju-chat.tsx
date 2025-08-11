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
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard"
import { SiteHeader } from "@/components/site-header"
import { useGuestUsage } from "@/hooks/use-guest-usage"
import { SignupDialog } from "@/components/signup-dialog"

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
}: SajuChatProps) {
  const { user } = useAuth()
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard()
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

  const { count, limit, isOverLimit, increment, reset } = useGuestUsage(5)

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

  useEffect(() => {
    let isMounted = true
    const initializeChatData = async () => {
      if (!stableSaju) return
      try {
        const calculatedDaeunData =
          stableSaju?.yearStem && stableBirthInfo?.solarYear && gender
            ? calculateDaeunInfo(
                { yearStem: stableSaju.yearStem, monthStem: stableSaju.monthStem, monthBranch: stableSaju.monthBranch },
                stableBirthInfo.solarYear,
                stableBirthInfo.solarMonth,
                stableBirthInfo.solarDay,
                gender,
                stableBirthInfo.solarHour,
                stableBirthInfo.solarMinute,
                stableBirthInfo.timeUnknown,
              )
            : null

        let pastMessages: any[] = []
        let shouldSendInitialQuestions = false
        let isFirstRoom = false

        if (sessionId && effectiveChatRoomId && !effectiveChatRoomId.startsWith("temp-")) {
          const response = await fetch(`/api/chat-rooms?sessionId=${sessionId}`)
          if (response.ok) {
            const result = await response.json()
            const chatRooms = result.chatRooms || []
            const sortedRooms = chatRooms.sort(
              (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            )
            isFirstRoom = sortedRooms.length > 0 && sortedRooms[0].id === effectiveChatRoomId
          }
          pastMessages = (await getSessionMessages(sessionId, effectiveChatRoomId))
            .filter((msg) => msg.role === "user" || msg.role === "assistant")
            .sort((a, b) => (a.messageOrder || 0) - (b.messageOrder || 0))
            .map((msg) => ({ id: msg.id, role: msg.role, content: msg.content, createdAt: msg.createdAt }))
        } else {
          shouldSendInitialQuestions = true
          const response = await fetch(`/api/chat-rooms?sessionId=${sessionId}`)
          isFirstRoom = !(response.ok && (await response.json()).chatRooms?.length > 0)
        }

        if (isMounted) {
          setChatData({
            calculatedDaeun: calculatedDaeunData,
            stableBirthInfo: stableBirthInfo,
            initialMessages: pastMessages,
            isInitialized: true,
          })
          setLastSavedMessageCount(pastMessages.length)
          setIsFirstChatRoom(isFirstRoom)

          // 첫 번째 채팅방이거나 임시 채팅방인 경우에만 초기 질문 전송
          if (shouldSendInitialQuestions && isFirstRoom) {
            const questions = getInitialUserQuestions(name, roomType, stableConcerns)
            setInitialQuestionsToSend(questions)
            setIsInitialQuestionsMode(true)
          }
          // 로그인한 사용자의 새로운 채팅방(첫 번째가 아닌)에서는 자동 질문 비활성화
          // shouldSendInitialQuestions가 true이지만 isFirstRoom이 false인 경우는 아무것도 하지 않음
        }
      } catch (error) {
        console.error("❌ Error initializing chat data:", error)
      }
    }
    initializeChatData()
    return () => {
      isMounted = false
    }
  }, [stableSaju, stableBirthInfo, gender, name, roomType, effectiveChatRoomId, sessionId, stableConcerns])

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, reload, append } = useAIChat({
    api: "/api/saju-chat",
    id: effectiveChatRoomId ? `${sessionId}-${effectiveChatRoomId}` : sessionId,
    initialMessages: transitionMessages ?? chatData.initialMessages,
    body: aiChatBody,
    experimental_throttle: 50,
    onFinish: (message) => {
      if (transitionMessages) setTransitionMessages(null)
      console.log("✅ onFinish triggered for message from:", message.role)
    },
    onError: (error) => {
      console.error("❌ 채팅 오류 상세:", { error, body: aiChatBody })
      toast.error("오류가 발생했습니다. 다시 시도해주세요.")
    },
  })

  // --- FUNDAMENTAL FIX: useEffect-driven initial question flow ---

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

  // Remove the second question useEffect completely

  useEffect(() => {
    const endInitialMode = () => {
      console.log("✅ [Flow] Ending initial questions mode.")
      setIsInitialQuestionsMode(false)
      setInitialQuestionsToSend([])
    }

    if (isInitialQuestionsMode && !isLoading) {
      // End after first response for both first room and non-first room
      if (messages.length === 2 && messages[1].role === "assistant") {
        endInitialMode()
      }
    }
  }, [isInitialQuestionsMode, isLoading, messages])

  // --- End of fundamental fix ---

  useEffect(() => {
    const saveNewMessages = async () => {
      if (savingRef.current || messages.length <= lastSavedMessageCount || !chatData.isInitialized) return
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
        const result = await saveMessages(sessionId, messagesToSave, roomType, effectiveChatRoomId, temporaryChatRoom)
        setLastSavedMessageCount(messages.length)
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
    if (messages.length > 0 && !isLoading) saveNewMessages()
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

  const handleChatRoomSelect = (chatRoomId: string) => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
    window.location.href = `/saju-chat/${roomType}?roomId=${chatRoomId}`
  }

  const handleNewChat = () => {
    window.location.href = `/saju-chat/${roomType}`
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "smooth" })
  }

  const handleSignupProvider = async (provider: "kakao" | "google" | "apple") => {
    try {
      // Save current location for redirect after auth
      localStorage.setItem("auth_return_url", window.location.href)
      
      // Redirect to auth provider
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

  useEffect(() => {
    if (chatContainerRef.current && !isTransitioningRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = chatContainerRef.current
      if (scrollHeight - scrollTop - clientHeight < 100 || messages.length === 1) {
        scrollToBottom()
      }
    }
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
    // Reset guest usage when user logs in
    if (user) {
      reset()
      localStorage.removeItem("previous_user_message_count")
    }
  }, [user, reset])

  useEffect(() => {
    // Increment guest usage when user sends a message (not logged in)
    if (!user && messages.length > 0) {
      const userMessages = messages.filter((msg) => msg.role === "user")
      const currentUserMessageCount = userMessages.length
      
      // localStorage에서 이전 메시지 개수 가져오기
      const previousCount = parseInt(localStorage.getItem("previous_user_message_count") || "0", 10)
      
      // 새로운 사용자 메시지가 있으면 카운트 증가
      if (currentUserMessageCount > previousCount) {
        const newMessagesCount = currentUserMessageCount - previousCount
        for (let i = 0; i < newMessagesCount; i++) {
          increment()
        }
        localStorage.setItem("previous_user_message_count", currentUserMessageCount.toString())
      }
    }
  }, [messages, user, increment])

  const suggestedQuestions = useMemo(
    () => generateSuggestedQuestions(stableConcerns, roomType),
    [stableConcerns, roomType],
  )

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
    // 첫 번째 채팅룸: 두 번째 메시지(index 1)에서 사주 다이어그램 표시
    if (isFirstChatRoom && index === 1 && messages[index].role === "assistant") {
      return true
    }
    // 첫 번째가 아닌 채팅룸: 첫 번째 메시지(index 0)에서 사주 다이어그램 표시
    if (!isFirstChatRoom && index === 0 && messages[index].role === "assistant") {
      return true
    }
    return false
  }

  const shouldShowDaeunDiagram = (index: number) => {
    // 첫 번째 채팅룸에서만 대운 다이어그램 표시 (두 번째 메시지와 함께)
    return isFirstChatRoom && index === 1 && messages[index].role === "assistant"
  }

  return (
    <div className="flex h-screen-mobile bg-white">
      {/* Mobile Header - only show on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <SiteHeader />
      </div>

      {/* Sidebar for desktop */}
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
      <div className="flex-1 flex flex-col min-w-0 h-screen-mobile pt-16 lg:pt-0">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto chat-messages-container chat-container-height">
          <div className="px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-4">
            {temporaryChatRoom?.isTemporary && !persistedChatRoomId && (
              <div className="text-center text-xs sm:text-sm text-muted-foreground bg-muted/50 rounded-lg p-2 sm:p-3">
                💬 새로운 대화가 시작되었습니다. 첫 메시지를 보내면 대화가 저장됩니다.
              </div>
            )}
            {messages.map((message, index) => (
              <div key={message.id || index}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-2xl rounded-br-md max-w-[85%] sm:max-w-md text-sm sm:text-base leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {(shouldShowSajuDiagram(index) || shouldShowDaeunDiagram(index)) && (
                      <div className="flex flex-col lg:flex-row gap-4 max-w-full">
                        {/* 대운 다이어그램을 왼쪽에 배치 */}
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
                        {/* 사주 다이어그램을 오른쪽에 배치 */}
                        {shouldShowSajuDiagram(index) && (
                          <div className="flex-1 w-full lg:max-w-md mx-auto lg:mx-0 order-2 lg:order-2">
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
                          </div>
                        )}
                      </div>
                    )}
                    <div className="ai-response-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // 제목들 스타일링
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
                          // 단락 스타일링
                          p: ({ children }) => (
                            <p className="text-base sm:text-lg leading-relaxed text-gray-700 mb-4 last:mb-0">
                              {children}
                            </p>
                          ),
                          // 구분선 스타일링
                          hr: () => (
                            <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                          ),
                          // 리스트 스타일링
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
                          // 강조 텍스트 스타일링
                          strong: ({ children }) => (
                            <strong className="font-semibold text-gray-900 bg-yellow-50 px-1 py-0.5 rounded">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => <em className="italic text-gray-600 font-medium">{children}</em>,
                          // 코드 블록 스타일링
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
                          // 인용문 스타일링
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">
                              {children}
                            </blockquote>
                          ),
                          // 테이블 스타일링
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
                        {message.content}
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
          className={`border-t bg-white p-3 sm:p-4 flex-shrink-0 chat-input-container ${
            isKeyboardOpen ? "ios-keyboard-adjust" : "pb-[max(12px,env(safe-area-inset-bottom))] sm:pb-4"
          }`}
          style={isKeyboardOpen ? { paddingBottom: `max(12px, ${keyboardHeight}px)` } : {}}
        >
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
            {!isLoading && messages.length >= 0 && !isInitialQuestionsMode && (
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
            <form onSubmit={(e) => {
              // Check if user is over limit before submitting
              if (!user && isOverLimit) {
                e.preventDefault()
                setShowSignupDialog(true)
                return
              }
              handleSubmit(e)
            }} className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="무엇이든 물어보세요"
                  className="h-10 sm:h-12 rounded-full pl-3 sm:pl-4 pr-12 sm:pr-14 bg-gray-100 border-gray-200 focus:ring-gray-900 text-base"
                  disabled={isLoading || isInitialQuestionsMode}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                      disabled={isInitialQuestionsMode}
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
                disabled={!input.trim() || isLoading || isInitialQuestionsMode || (!user && isOverLimit)}
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </form>
            {/* Message counter for guests - positioned below input like ChatGPT */}
            {!user && (
              <div className="flex justify-center mt-2">
                <div
                  className={`text-xs text-center ${
                    isOverLimit ? "text-red-600" : count >= limit - 1 ? "text-orange-600" : "text-gray-500"
                  }`}
                >
                  무료 메시지 {Math.max(0, limit - count)}/{limit}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Signup Dialog */}
      <SignupDialog
        open={showSignupDialog}
        onOpenChange={setShowSignupDialog}
        onSelectProvider={handleSignupProvider}
      />
    </div>
  )
}
