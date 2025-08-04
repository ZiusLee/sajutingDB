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

const getInitialUserQuestions = (name: string, roomType: string, concerns: string[] = []): string[] => {
  if (roomType === "sajuping") {
    const firstQuestion = "내 사주팔자의 성격과 기질을 오행과 일주를 바탕으로 분석해줘 3줄정도로"

    const generateConcernQuestion = (concerns: string[]): string => {
      const concernLabels: Record<string, string> = {
        love: "연애운",
        breakup: "이별 후 회복",
        health: "건강운",
        marriage: "결혼운",
        money: "재물운",
        work: "학업운",
        relationship: "인간관계",
        career: "직업운",
        job: "취업운",
        future: "미래 방향성",
        workplace: "직장 생활",
        friend: "인간관계",
        family: "가족운",
      }

      if (concerns.length === 0) {
        return "연애운에 대해서 나의 대운과 올해 세운을 기반으로 5줄로 설명해줘."
      }

      const primaryConcern = concerns[0]
      const concernLabel = concernLabels[primaryConcern] || "운세"
      return `${concernLabel}에 대해서 나의 대운과 올해 세운을 기반으로 5줄로 설명해줘.`
    }

    const secondQuestion = generateConcernQuestion(concerns)
    const questions = [firstQuestion, secondQuestion]
    console.log("🎯 Generated exactly 2 initial questions:", questions)
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

          if (shouldSendInitialQuestions) {
            const questions = isFirstRoom
              ? getInitialUserQuestions(name, roomType, stableConcerns)
              : ["오늘은 무엇이 궁금하신가요?"]
            setInitialQuestionsToSend(questions)
            setIsInitialQuestionsMode(true)
          }
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

  useEffect(() => {
    if (
      isInitialQuestionsMode &&
      isFirstChatRoom &&
      !isLoading &&
      messages.length === 2 &&
      messages[1].role === "assistant" &&
      initialQuestionsToSend.length > 1 &&
      !initialQuestionsSent.q2
    ) {
      console.log("📤 [Flow] Received first answer. Sending second question...")
      const timeoutId = setTimeout(() => {
        setInitialQuestionsSent((prev) => ({ ...prev, q2: true }))
        append({ role: "user", content: initialQuestionsToSend[1] })
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [
    isInitialQuestionsMode,
    isFirstChatRoom,
    isLoading,
    messages,
    initialQuestionsToSend,
    append,
    initialQuestionsSent.q2,
  ])

  useEffect(() => {
    const endInitialMode = () => {
      console.log("✅ [Flow] Ending initial questions mode.")
      setIsInitialQuestionsMode(false)
      setInitialQuestionsToSend([])
    }

    if (isInitialQuestionsMode && !isLoading) {
      if (isFirstChatRoom && messages.length === 4 && messages[3].role === "assistant") {
        endInitialMode()
      } else if (!isFirstChatRoom && messages.length === 2 && messages[1].role === "assistant") {
        endInitialMode()
      }
    }
  }, [isInitialQuestionsMode, isFirstChatRoom, isLoading, messages])

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

  const suggestedQuestions = useMemo(
    () => generateSuggestedQuestions(stableConcerns, roomType),
    [stableConcerns, roomType],
  )

  if (!chatData.isInitialized || isFirstChatRoom === null) {
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
    // 첫 번째 채팅룸에서만 대운 다이어그램 표시 (네 번째 메시지)
    return isFirstChatRoom && index === 3 && messages[index].role === "assistant"
  }

  return (
    <div className="flex h-screen bg-white">
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
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto"
          style={{ height: "calc(100dvh - 140px)", minHeight: 0 }}
        >
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
                    {shouldShowSajuDiagram(index) && (
                      <div className="max-w-md mx-auto">
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
                    {shouldShowDaeunDiagram(index) && chatData.calculatedDaeun && (
                      <div className="max-w-md mx-auto">
                        <DaeunDiagram
                          daeun={chatData.calculatedDaeun.pillars || []}
                          birthInfo={chatData.stableBirthInfo}
                          name={name}
                          gender={gender}
                        />
                      </div>
                    )}
                    <div className="text-foreground text-base sm:text-lg leading-relaxed prose prose-sm sm:prose-lg max-w-none break-words [&>p]:mb-3 sm:[&>p]:mb-4 [&>h1]:text-lg sm:[&>h1]:text-xl [&>h2]:text-base sm:[&>h2]:text-lg [&>h3]:text-base sm:[&>h3]:text-lg [&>ul]:mb-3 sm:[&>ul]:mb-4 [&>li]:mb-1 sm:[&>li]:mb-2 [&>ul]:pl-3 sm:[&>ul]:pl-4 [&>li]:text-base sm:[&>li]:text-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
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
            {!isLoading && messages.length >= 4 && !isInitialQuestionsMode && (
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
                disabled={!input.trim() || isLoading || isInitialQuestionsMode}
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
