"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { BirthInfo } from "@/types/birth-date"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { useMobileKeyboard } from "@/hooks/use-mobile-keyboard"

import { SidebarProvider, Sidebar as UISidebar, SidebarContent, SidebarTrigger } from "@/components/ui/sidebar"

interface SajuChatProps {
  saju: any
  birthInfo?: BirthInfo
  concerns?: string[]
  user: any
  roomType: string
  persistedChatRoomId?: string
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

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function SajuChat({ saju, birthInfo, concerns, user, roomType, persistedChatRoomId }: SajuChatProps) {
  const router = useRouter()
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const savingRef = useRef(false)
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [transitionMessages, setTransitionMessages] = useState<any[] | null>(null)
  const isPersistingRef = useRef(false)
  const scrollPositionRef = useRef<number>(0)
  const [showNewChatMessage, setShowNewChatMessage] = useState(false)
  const [sessionId, setSessionId] = useState(generateUUID())
  const [handleChatRoomSelect, setHandleChatRoomSelect] = useState(() => () => {})
  const [handleNewChat, setHandleNewChat] = useState(() => () => {})

  useEffect(() => {
    if (persistedChatRoomId?.startsWith("temp-") || !persistedChatRoomId) {
      setShowNewChatMessage(true)
      const timer = setTimeout(() => {
        setShowNewChatMessage(false)
      }, 5000) // Show for 5 seconds
      return () => clearTimeout(timer)
    }
  }, [persistedChatRoomId])

  useEffect(() => {
    if (typeof window !== "undefined") {
      ;(window as any).toggleSajuChatSidebar = () => {
        // This will be handled by the SidebarTrigger component
        const triggerButton = document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement
        if (triggerButton) {
          triggerButton.click()
        }
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).toggleSajuChatSidebar
      }
    }
  }, [])

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen bg-gray-50">
        <UISidebar side="left" variant="sidebar" collapsible="offcanvas">
          <SidebarContent>
            <Sidebar
              saju={saju}
              name={user?.name || ""}
              gender={user?.gender || ""}
              birthInfo={birthInfo}
              sessionId={sessionId}
              roomType={roomType}
              currentChatRoomId={persistedChatRoomId}
              onChatRoomSelect={handleChatRoomSelect}
              onNewChat={handleNewChat}
            />
          </SidebarContent>
        </UISidebar>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with hamburger menu */}
          <div className="flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-lg font-semibold">
                {roomType === "sajuping" ? "사주핑" : roomType === "tarot" ? "타로" : "일반상담"}
              </h1>
            </div>

            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로가기
            </Button>
          </div>

          {showNewChatMessage && (
            <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💬 새로운 대화입니다. 첫 메시지를 보내면 대화가 자동으로 저장됩니다.
              </p>
            </div>
          )}

          {/* Chat Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ paddingBottom: isKeyboardOpen ? `${keyboardHeight + 20}px` : "20px" }}
          >
            {/* ... existing chat messages code ... */}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t">{/* ... existing input code ... */}</div>
        </div>
      </div>
    </SidebarProvider>
  )
}
