"use client"
import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, ArrowLeft, MoreHorizontal } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import type { BirthInfo } from "@/types/birth-info"
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
}: SajuChatProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false)
  const isSidebarOpen = externalSidebarOpen ?? internalSidebarOpen
  const setSidebarOpen = externalSidebarToggle ? () => externalSidebarToggle() : setInternalSidebarOpen
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false) // To prevent race conditions while saving
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0)

  const [calculatedDaeun, setCalculatedDaeun] = useState<any>(null)
  const [stableBirthInfo, setStableBirthInfo] = useState<any>(null)
  const [initialMessages, setInitialMessages] = useState<any[]>([])
  const [aiChatBody, setAiChatBody] = useState<any>({})
  const [isInitialized, setIsInitialized] = useState(false) // Flag to prevent re-initialization

  useEffect(() => {
    const initializeChatData = async () => {
      if (!saju) {
        return
      }

      const stableBirthInfoData = birthInfo ? { ...birthInfo } : null

      const compressedSajuObject =
        saju && stableBirthInfoData
          ? compressSaju(
              saju,
              stableBirthInfoData.solarYear?.toString(),
              stableBirthInfoData.solarMonth?.toString(),
              stableBirthInfoData.solarDay?.toString(),
              stableBirthInfoData.solarHour?.toString(),
              stableBirthInfoData.solarMinute?.toString(),
              stableBirthInfoData.timeUnknown,
            )
          : saju

      let calculatedDaeunData = null
      if (saju?.yearStem && stableBirthInfoData?.solarYear && gender) {
        try {
          calculatedDaeunData = calculateDaeunInfo(
            { yearStem: saju.yearStem, monthStem: saju.monthStem, monthBranch: saju.monthBranch },
            stableBirthInfoData.solarYear,
            stableBirthInfoData.solarMonth,
            stableBirthInfoData.solarDay,
            gender,
            stableBirthInfoData.solarHour,
            stableBirthInfoData.solarMinute,
            stableBirthInfoData.timeUnknown,
          )
        } catch (error) {
          console.error("대운 계산 오류:", error)
        }
      }

      let pastMessages: any[] = []
      try {
        const savedSaju = localStorage.getItem("current_saju")
        let sessionId = null

        if (savedSaju) {
          const parsedSaju = JSON.parse(savedSaju)
          sessionId = parsedSaju.sessionId
        }

        if (sessionId) {
          const messages = await getSessionMessages(sessionId)
          pastMessages = messages
            .filter((msg) => msg.role === "user" || msg.role === "assistant")
            .sort((a, b) => a.messageOrder - b.messageOrder)
            .map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt,
            }))
          setLastSavedMessageCount(pastMessages.length)
        }
      } catch (error) {
        console.error("Error loading past messages:", error)
      }

      const initialChatMessages =
        pastMessages.length > 0
          ? pastMessages
          : [{ id: generateUUID(), role: "assistant" as const, content: getInitialMessage(name, roomType) }]

      const chatBody = {
        name,
        gender,
        roomType,
        userId: user?.id || null,
        currentYear: 2025,
        yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
        birthInfo: stableBirthInfoData,
        compressedSaju: compressedSajuObject,
        daeun: calculatedDaeunData,
      }

      setCalculatedDaeun(calculatedDaeunData)
      setStableBirthInfo(stableBirthInfoData)
      setInitialMessages(initialChatMessages)
      setAiChatBody(chatBody)
      setIsInitialized(true) // Mark as initialized
    }

    if (!isInitialized) {
      initializeChatData()
    }
  }, [saju, name, gender, roomType, birthInfo, user?.id, isInitialized])

  // Get sessionId for chat persistence
  const getSessionId = () => {
    try {
      const savedSaju = localStorage.getItem("current_saju")
      if (savedSaju) {
        const parsedSaju = JSON.parse(savedSaju)
        // Use the actual sessionId from the stored data
        if (parsedSaju.sessionId) {
          return parsedSaju.sessionId
        }
      }

      // Fallback to user_id from localStorage if available
      const userId = localStorage.getItem("user_id")
      if (userId) {
        return userId
      }
    } catch (error) {
      console.error("Error getting session ID:", error)
    }

    // Last resort fallback - but this should rarely be used now
    return `fallback-${Date.now()}`
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, reload } = useAIChat({
    api: "/api/saju-chat",
    id: getSessionId(),
    initialMessages,
    body: aiChatBody,
    onError: (error) => {
      console.error("채팅 오류:", error)
      toast.error("오류가 발생했습니다. 다시 시도해주세요.")
    },
  })

  // Save messages to database when new messages are added
  useEffect(() => {
    const saveNewMessages = async () => {
      if (savingRef.current || messages.length <= lastSavedMessageCount) {
        return
      }

      savingRef.current = true
      const sessionId = getSessionId()
      const newMessages = messages.slice(lastSavedMessageCount)

      const messagesToSave = newMessages.map((msg, index) => ({
        id: generateUUID(),
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt || new Date().toISOString(),
        messageOrder: lastSavedMessageCount + index,
      }))

      try {
        await saveMessages(sessionId, messagesToSave, roomType)
        setLastSavedMessageCount(messages.length)
      } catch (error) {
        console.error("Error saving messages:", error)
      } finally {
        savingRef.current = false
      }
    }

    if (isInitialized && messages.length > 0 && !isLoading) {
      saveNewMessages()
    }
  }, [messages, lastSavedMessageCount, isLoading, roomType, isInitialized])

  const handleSuggestedQuestionClick = (question: string) => {
    if (isLoading) return
    setInput(question)
    setTimeout(() => document.querySelector("form")?.requestSubmit(), 100)
  }

  const suggestedQuestions = useMemo(() => generateSuggestedQuestions(concerns, roomType), [concerns, roomType])

  const renderSidebarContent = () => (
    <div className="p-4 space-y-6 overflow-y-auto h-full bg-gray-50">
      <SajuDiagram saju={saju} name={name} gender={gender} variant="sidebar" {...stableBirthInfo} />
      {calculatedDaeun && (
        <DaeunDiagram daeun={calculatedDaeun.pillars || []} birthInfo={stableBirthInfo} name={name} gender={gender} />
      )}
    </div>
  )

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          채팅을 불러오는 중...
        </div>
      </div>
    )
  }

  if (!saju) {
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
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-96 bg-gray-50 border-r flex-col">{renderSidebarContent()}</div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-96 p-0 bg-gray-50">
          {renderSidebarContent()}
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-0 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-40 sm:pb-32">
            {messages.map((message, index) => (
              <div key={message.id || index}>
                {message.role === "assistant" ? (
                  <div className="flex items-start gap-3 sm:gap-3 px-2 sm:px-0">
                    <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-gray-900 flex items-center justify-center text-lg sm:text-lg shrink-0 mt-1" />
                    <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                      <div className="text-foreground text-lg leading-relaxed sm:leading-relaxed prose prose-lg max-w-none break-words [&>p]:mb-4 sm:[&>p]:mb-4 [&>h1]:text-xl sm:[&>h1]:text-xl [&>h2]:text-lg sm:[&>h2]:text-lg [&>h3]:text-lg [&>ul]:mb-4 sm:[&>ul]:mb-4 [&>li]:mb-2 sm:[&>li]:mb-2 [&>ul]:pl-4 [&>li]:text-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                      {index === 0 && (
                        <div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-2">
                          <SajuDiagram saju={saju} name={name} gender={gender} variant="card" {...stableBirthInfo} />
                          {calculatedDaeun && (
                            <DaeunDiagram
                              daeun={calculatedDaeun.pillars || []}
                              birthInfo={stableBirthInfo}
                              name={name}
                              gender={gender}
                            />
                          )}
                        </div>
                      )}
                      <MessageFeedbackButtons
                        messageId={message.id || `temp-${index}`}
                        messageContent={message.content}
                        sessionId={getSessionId()}
                        onRetry={() => reload()}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end px-2 sm:px-0">
                    <div className="bg-gray-900 text-white px-4 py-3 sm:px-4 sm:py-2 rounded-2xl rounded-br-md max-w-[80%] sm:max-w-md text-base sm:text-base leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 sm:gap-3 px-2 sm:px-0">
                <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-lg bg-gray-900 flex items-center justify-center text-lg sm:text-lg shrink-0 mt-1" />
                <div className="flex items-center gap-2 sm:gap-2 pt-2">
                  <div className="animate-bounce h-2 w-2 sm:h-2 sm:w-2 bg-muted-foreground rounded-full [animation-delay:-0.3s]"></div>
                  <div className="animate-bounce h-2 w-2 sm:h-2 sm:w-2 bg-muted-foreground rounded-full [animation-delay:-0.15s]"></div>
                  <div className="animate-bounce h-2 w-2 sm:h-2 sm:w-2 bg-muted-foreground rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-2 sm:p-4 bg-white/95 backdrop-blur-sm border-t lg:relative lg:bottom-auto">
          <div className="max-w-4xl mx-auto space-y-2 sm:space-y-0">
            {!isLoading && messages.length >= 1 && (
              <div className="flex gap-2 sm:gap-2 overflow-x-auto pb-3 sm:pb-3 scrollbar-hide px-0">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full whitespace-nowrap bg-gray-100 border-gray-200 text-sm px-4 py-2.5 sm:text-sm sm:px-4 sm:py-2 min-w-fit h-10 sm:h-auto leading-tight"
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
                  className="h-12 sm:h-12 rounded-full pl-5 pr-20 sm:pl-5 sm:pr-12 bg-gray-100 border-gray-200 focus:ring-gray-900 text-base"
                  disabled={isLoading}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-8 sm:right-12 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-10 sm:w-10 rounded-full"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
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
                className="h-9 w-9 sm:h-12 sm:w-12 rounded-full shrink-0 bg-gray-900 hover:bg-gray-800"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
