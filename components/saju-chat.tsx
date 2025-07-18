"use client"
import { useState, useRef, useEffect, useMemo } from "react"

import { useRouter } from "next/navigation"
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
}: SajuChatProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false)
  const isSidebarOpen = externalSidebarOpen ?? internalSidebarOpen
  const setSidebarOpen = externalSidebarToggle ? () => externalSidebarToggle() : setInternalSidebarOpen
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // Stable state that won't cause re-renders
  const [chatData, setChatData] = useState<{
    calculatedDaeun: any
    stableBirthInfo: any
    initialMessages: any[]
    aiChatBody: any
    isInitialized: boolean
  }>({
    calculatedDaeun: null,
    stableBirthInfo: null,
    initialMessages: [],
    aiChatBody: {},
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

  // Get sessionId - memoized and stable
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
      if (userId) {
        return userId
      }
    } catch (error) {
      console.error("Error getting session ID:", error)
    }

    return `fallback-${Date.now()}`
  }, [])

  // Initialize chat data
  useEffect(() => {
    let isMounted = true

    const initializeChatData = async () => {
      if (!stableSaju) {
        console.log("⏭️ No saju data, skipping initialization")
        return
      }

      console.log("🔄 Initializing chat data for room:", currentChatRoomId)

      try {
        const compressedSajuObject =
          stableSaju && stableBirthInfo
            ? compressSaju(
                stableSaju,
                stableBirthInfo.solarYear?.toString(),
                stableBirthInfo.solarMonth?.toString(),
                stableBirthInfo.solarDay?.toString(),
                stableBirthInfo.solarHour?.toString(),
                stableBirthInfo.solarMinute?.toString(),
                stableBirthInfo.timeUnknown,
              )
            : stableSaju

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
          if (sessionId) {
            const messages = currentChatRoomId
              ? await getSessionMessages(sessionId, currentChatRoomId)
              : await getSessionMessages(sessionId)

            pastMessages = messages
              .filter((msg) => msg.role === "user" || msg.role === "assistant")
              .sort((a, b) => (a.messageOrder || 0) - (b.messageOrder || 0))
              .map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.createdAt,
              }))

            console.log(`📨 Loaded ${pastMessages.length} messages for chat room ${currentChatRoomId || "default"}`)
          }
        } catch (error) {
          console.error("❌ Error loading past messages:", error)
        }

        const initialChatMessages =
          pastMessages.length > 0
            ? pastMessages
            : [{ id: generateUUID(), role: "assistant" as const, content: getInitialMessage(name, roomType) }]

        const chatBody = {
          name,
          gender,
          roomType,
          userId: stableUserId,
          currentYear: 2025,
          yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
          birthInfo: stableBirthInfo,
          compressedSaju: compressedSajuObject,
          daeun: calculatedDaeunData,
          chatRoomId: currentChatRoomId,
        }

        if (isMounted) {
          setChatData({
            calculatedDaeun: calculatedDaeunData,
            stableBirthInfo: stableBirthInfo,
            initialMessages: initialChatMessages,
            aiChatBody: chatBody,
            isInitialized: true,
          })
          setLastSavedMessageCount(pastMessages.length)
          console.log("✅ Chat data initialized successfully")
        }
      } catch (error) {
        console.error("❌ Error initializing chat data:", error)
      }
    }

    setChatData((prev) => ({ ...prev, isInitialized: false }))
    initializeChatData()

    return () => {
      isMounted = false
    }
  }, [stableSaju, name, gender, roomType, stableBirthInfo, stableUserId, currentChatRoomId, sessionId])

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, reload } = useAIChat({
    api: "/api/saju-chat",
    id: currentChatRoomId ? `${sessionId}-${currentChatRoomId}` : sessionId,
    initialMessages: chatData.initialMessages,
    body: chatData.aiChatBody,
    onError: (error) => {
      console.error("❌ 채팅 오류:", error)
      toast.error("오류가 발생했습니다. 다시 시도해주세요.")
    },
    key: currentChatRoomId || "default",
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
        chatRoomId: currentChatRoomId,
      }))

      try {
        await saveMessages(sessionId, messagesToSave, roomType, currentChatRoomId)
        setLastSavedMessageCount(messages.length)
      } catch (error) {
        console.error("❌ Error saving messages:", error)
      } finally {
        savingRef.current = false
      }
    }

    if (messages.length > 0 && !isLoading) {
      saveNewMessages()
    }
  }, [messages, lastSavedMessageCount, isLoading, roomType, chatData.isInitialized, currentChatRoomId, sessionId])

  const handleSuggestedQuestionClick = (question: string) => {
    if (isLoading) return
    setInput(question)
    setTimeout(() => document.querySelector("form")?.requestSubmit(), 100)
  }

  const handleChatRoomSelect = (chatRoomId: string) => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
    window.location.href = `/saju-chat/${roomType}?roomId=${chatRoomId}`
  }

  const handleNewChat = () => {
    // This will be handled by the sidebar component
  }

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
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

  const suggestedQuestions = useMemo(
    () => generateSuggestedQuestions(stableConcerns, roomType),
    [stableConcerns, roomType],
  )

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

  if (!stableSaju) {
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
          calculatedDaeun={chatData.calculatedDaeun}
          sessionId={sessionId}
          roomType={roomType}
          currentChatRoomId={currentChatRoomId}
          onChatRoomSelect={handleChatRoomSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-96 p-0">
          <Sidebar
            saju={stableSaju}
            name={name}
            gender={gender}
            birthInfo={chatData.stableBirthInfo}
            calculatedDaeun={chatData.calculatedDaeun}
            sessionId={sessionId}
            roomType={roomType}
            currentChatRoomId={currentChatRoomId}
            onChatRoomSelect={handleChatRoomSelect}
            onNewChat={handleNewChat}
          />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area - Flexible width */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Messages Container */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 space-y-8 pb-40">
            {messages.map((message, index) => (
              <div key={message.id || index}>
                {message.role === "assistant" ? (
                  <div className="space-y-4">
                    <div className="text-foreground text-lg leading-relaxed prose prose-lg max-w-none break-words [&>p]:mb-4 [&>h1]:text-xl [&>h2]:text-lg [&>h3]:text-lg [&>ul]:mb-4 [&>li]:mb-2 [&>ul]:pl-4 [&>li]:text-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                    {index === 0 && (
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <SajuDiagram
                          saju={stableSaju}
                          name={name}
                          gender={gender}
                          variant="card"
                          {...chatData.stableBirthInfo}
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
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-md text-base leading-relaxed">
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

        {/* Input Area - Fixed at bottom */}
        <div className="border-t bg-white p-4">
          {showScrollButton && (
            <Button
              onClick={scrollToBottom}
              variant="outline"
              size="sm"
              className="absolute right-8 bottom-32 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow z-10"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}

          <div className="space-y-3">
            {!isLoading && messages.length >= 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full whitespace-nowrap bg-gray-100 border-gray-200 text-sm px-4 py-2 min-w-fit"
                    onClick={() => handleSuggestedQuestionClick(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="무엇이든 물어보세요"
                  className="h-12 rounded-full pl-5 pr-16 bg-gray-100 border-gray-200 focus:ring-gray-900 text-base"
                  disabled={isLoading}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-12 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 mb-2" align="end">
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      <span className="mr-3 text-base">💕</span>궁합 보기
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      <span className="mr-3 text-base">👥</span>다른 사람 사주 봐주기
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 rounded-full shrink-0 bg-gray-900 hover:bg-gray-800"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
