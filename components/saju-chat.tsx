"use client"
import { useState, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Send, ArrowLeft, MoreHorizontal, ThumbsUp, ThumbsDown, Copy, RefreshCw } from "lucide-react"
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
import { getSessionMessages } from "@/lib/message-service"

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

export default function SajuChat({
  saju,
  name,
  gender,
  roomType,
  onBack,
  sessionKey,
  birthInfo,
  concerns,
}: SajuChatProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const [calculatedDaeun, setCalculatedDaeun] = useState<any>(null)
  const [stableBirthInfo, setStableBirthInfo] = useState<any>(null)
  const [initialMessages, setInitialMessages] = useState<any[]>([])
  const [aiChatBody, setAiChatBody] = useState<any>({})

  useEffect(() => {
    const initializeChatData = async () => {
      if (!saju) {
        return
      }

      const stableBirthInfo = birthInfo ? { ...birthInfo } : null

      const compressedSajuObject =
        saju && stableBirthInfo
          ? compressSaju(
              saju,
              stableBirthInfo.solarYear?.toString(),
              stableBirthInfo.solarMonth?.toString(),
              stableBirthInfo.solarDay?.toString(),
              stableBirthInfo.solarHour?.toString(),
              stableBirthInfo.solarMinute?.toString(),
              stableBirthInfo.timeUnknown,
            )
          : saju

      let calculatedDaeun = null
      if (saju?.yearStem && stableBirthInfo?.solarYear && gender) {
        try {
          calculatedDaeun = calculateDaeunInfo(
            { yearStem: saju.yearStem, monthStem: saju.monthStem, monthBranch: saju.monthBranch },
            stableBirthInfo.solarYear,
            stableBirthInfo.solarMonth,
            stableBirthInfo.solarDay,
            gender,
            stableBirthInfo.solarHour,
            stableBirthInfo.solarMinute,
            stableBirthInfo.timeUnknown,
          )
        } catch (error) {
          console.error("대운 계산 오류:", error)
        }
      }

      // Load past messages for this session
      let pastMessages: any[] = []
      try {
        // Get session ID from localStorage if available
        const savedSaju = localStorage.getItem("current_saju")
        let sessionId = null

        if (savedSaju) {
          const parsedSaju = JSON.parse(savedSaju)
          sessionId = parsedSaju.sessionId
        }

        if (sessionId) {
          console.log("Loading past messages for session:", sessionId)
          const messages = await getSessionMessages(sessionId)

          // Convert database messages to chat format
          pastMessages = messages
            .filter((msg) => msg.role === "user" || msg.role === "assistant")
            .sort((a, b) => a.messageOrder - b.messageOrder)
            .map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.createdAt,
            }))

          console.log("Loaded past messages:", pastMessages.length)
        }
      } catch (error) {
        console.error("Error loading past messages:", error)
      }

      // Create initial messages - only add welcome if no past messages exist
      const initialMessages =
        pastMessages.length > 0
          ? pastMessages
          : [{ id: "welcome", role: "assistant" as const, content: getInitialMessage(name, roomType) }]

      const aiChatBody = {
        name,
        gender,
        roomType,
        userId: user?.id || null,
        currentYear: 2025,
        yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
        birthInfo: stableBirthInfo,
        compressedSaju: compressedSajuObject,
        daeun: calculatedDaeun,
      }

      setCalculatedDaeun(calculatedDaeun)
      setStableBirthInfo(stableBirthInfo)
      setInitialMessages(initialMessages)
      setAiChatBody(aiChatBody)
    }

    initializeChatData()
  }, [saju, name, gender, roomType, birthInfo, user?.id])

  // Get sessionId for chat persistence
  const getSessionId = () => {
    try {
      const savedSaju = localStorage.getItem("current_saju")
      if (savedSaju) {
        const parsedSaju = JSON.parse(savedSaju)
        return parsedSaju.sessionId || `${sessionKey}-${roomType}`
      }
    } catch (error) {
      console.error("Error getting session ID:", error)
    }
    return `${sessionKey}-${roomType}`
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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

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
      <div className="flex-1 flex flex-col relative">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
            {messages.map((message, index) => (
              <div key={message.id || index}>
                {message.role === "assistant" ? (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-lg shrink-0" />
                    <div className="flex-1 space-y-4">
                      <div className="text-foreground text-base leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                      {index === 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => {
                            navigator.clipboard.writeText(message.content)
                            toast.success("메시지가 복사되었습니다.")
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => reload()}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl rounded-br-md max-w-md">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-lg shrink-0" />
                <div className="flex items-center gap-2 pt-2">
                  <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full [animation-delay:-0.3s]"></div>
                  <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full [animation-delay:-0.15s]"></div>
                  <div className="animate-bounce h-2 w-2 bg-muted-foreground rounded-full"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-white/80 backdrop-blur-sm border-t">
          <div className="max-w-4xl mx-auto">
            {!isLoading && messages.length >= 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full whitespace-nowrap bg-gray-100 border-gray-200"
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
                  className="h-12 rounded-full pl-5 pr-12 bg-gray-100 border-gray-200 focus:ring-gray-900"
                  disabled={isLoading}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-12 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 mb-2" align="end">
                    <Button variant="ghost" className="w-full justify-start">
                      <span className="mr-3 text-base">💕</span>궁합 보기
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
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
