"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import ReactMarkdown from "react-markdown"
import {
  getInitialMessageByRoomType,
  getRoomTitle,
  generateChatSessionKey,
  initialSuggestedQuestionsByType,
} from "@/lib/chat-utils"
import { useHideHeaderAndFooter } from "@/hooks/use-hide-header-and-footer"

interface SajuChatProps {
  saju: any
  name: string
  gender: string
  initialInterpretation: string
  roomType: string
  onBack: () => void
  isLoggedIn: boolean
  sessionKey?: string
}

export default function SajuChat({
  saju,
  name,
  gender,
  initialInterpretation,
  roomType,
  onBack,
  isLoggedIn,
  sessionKey,
}: SajuChatProps) {
  // 상단 헤더 숨기기
  useHideHeaderAndFooter()

  // 상태 관리
  const router = useRouter()
  const [questionCount, setQuestionCount] = useState(0)
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true)

  // Chat context
  const { activeChatSession, setActiveChatSession, saveChatSession, getChatSession } = useChat()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general,
  )
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isHtmlResponse, setIsHtmlResponse] = useState(false)
  const [lastMessageTime, setLastMessageTime] = useState<Date>(new Date())
  const [lastMessageId, setLastMessageId] = useState<string>("")

  // 새로운 상태 추가: 질문 생성 여부를 추적
  const [shouldGenerateQuestions, setShouldGenerateQuestions] = useState(true)

  // Get saved chat session or create initial messages
  const savedSession = activeChatSession || getChatSession(sessionKey)
  const initialMessages = savedSession?.messages || [
    {
      id: "welcome",
      role: "assistant",
      content: getInitialMessageByRoomType(name, roomType),
    },
  ]

  // AI SDK의 useChat 훅 사용
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useAIChat({
    api: "/api/saju-chat",
    initialMessages,
    body: {
      saju,
      name,
      gender,
      initialInterpretation,
      roomType,
      currentYear: 2025,
      yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
    },
    onFinish: (message) => {
      // 마지막 메시지 시간 업데이트
      const newTime = new Date()
      setLastMessageTime(newTime)

      // 마지막 메시지 ID 업데이트 (무한 루프 방지)
      setLastMessageId(message.id)

      // 채팅 데이터 저장 - 완료된 메시지를 포함하여 저장
      const updatedMessages = messages && Array.isArray(messages) ? [...messages, message] : [message]

      // 현재 채팅방 유형에 맞는 세션 키 생성
      const currentSessionKey = sessionKey || generateChatSessionKey(name, saju, roomType)

      // Save to context with the correct session key
      const sessionData = {
        saju,
        name,
        gender,
        interpretation: initialInterpretation,
        roomType,
        messages: updatedMessages,
        lastMessageTime: newTime.toISOString(),
      }

      saveChatSession(currentSessionKey, sessionData)
      setActiveChatSession(sessionData)

      // 메시지가 완료되면 질문 생성 허용
      setShouldGenerateQuestions(true)
    },
    onError: (error) => {
      console.error("Chat error:", error)

      // Check if the error message includes an HTML response
      if (error.message && error.message.includes("DOCTYPE html")) {
        setIsHtmlResponse(true)
      }

      // 오류 메시지를 채팅에 추가
      const errorMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "죄송합니다. 응답을 생성하는 중에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      }

      // 오류 메시지를 채팅에 추가
      const updatedMessages = messages && Array.isArray(messages) ? [...messages, errorMessage] : [errorMessage]

      // 세션 저장
      const sessionData = {
        saju,
        name,
        gender,
        interpretation: initialInterpretation,
        roomType,
        messages: updatedMessages,
        lastMessageTime: new Date().toISOString(),
      }

      saveChatSession(sessionKey, sessionData)
      setActiveChatSession(sessionData)

      // 오류 발생 시에도 질문 생성 허용
      setShouldGenerateQuestions(true)
    },
  })

  // 원래의 handleSubmit 함수 저장
  const originalHandleSubmit = handleSubmit

  // handleSubmit 함수 오버라이드
  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 질문 카운트 증가
    const newQuestionCount = questionCount + 1
    setQuestionCount(newQuestionCount)

    // 사용자가 질문을 제출하면 질문 생성 플래그를 false로 설정
    setShouldGenerateQuestions(false)

    // 원래의 handleSubmit 함수 호출
    originalHandleSubmit(e)
  }

  // 뒤로가기 핸들러 - 채팅 데이터 저장 후 뒤로가기
  const handleBackWithSave = () => {
    // 채팅 데이터 저장
    const sessionData = {
      saju,
      name,
      gender,
      interpretation: initialInterpretation,
      roomType,
      messages,
      lastMessageTime: new Date().toISOString(),
    }

    saveChatSession(sessionKey, sessionData)

    // 뒤로가기 실행
    window.history.back()
  }

  // 예상 질문 클릭 핸들러
  const handleQuestionClick = useCallback(
    (question: string) => {
      setInput(question)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    },
    [setInput],
  )

  // 새로운 예상 질문 생성 함수
  const generateNewSuggestedQuestions = useCallback(async () => {
    // 메시지가 최소 2개 이상일 때만 API 호출 (초기 메시지 + 최소 1개의 대화)
    if ((messages && messages.length < 2) || !shouldGenerateQuestions) return

    setIsGeneratingQuestions(true)
    console.log("Generating new suggested questions...")

    // 최근 메시지 5개 추출
    const recentMessages = messages.slice(-5)

    try {
      const response = await fetch("/api/suggested-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: document.cookie,
        },
        body: JSON.stringify({
          messages: recentMessages,
          saju,
          roomType,
          currentYear: 2025,
          yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
          creative: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Failed to generate suggested questions:", errorText)
        throw new Error(`Failed to generate suggested questions: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("API response for suggested questions:", data)

      if (data.suggestedQuestions && Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
        console.log("Setting new suggested questions:", data.suggestedQuestions)
        setSuggestedQuestions(data.suggestedQuestions.slice(0, 2))
        setApiError(null) // Clear any previous API error
      } else {
        console.warn("No suggested questions returned from API")
        setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
        setApiError(null) // Clear any previous API error
      }
    } catch (error: any) {
      console.error("Error generating suggested questions:", error)
      setApiError(error.message || "Failed to generate suggested questions") // Set API error message
      setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
    } finally {
      setIsGeneratingQuestions(false)
      setShouldGenerateQuestions(false)
    }
  }, [messages, saju, roomType, shouldGenerateQuestions])

  // 메시지가 변경될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const chatContainer = chatContainerRef.current
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messages])

  // 컴포넌트가 마운트되면 입력 필드에 포커스
  useEffect(() => {
    if (inputRef.current && !isInitialized) {
      inputRef.current.focus()
      setIsInitialized(true)
    }
  }, [isInitialized])

  // 메시지가 변경될 때마다 새로운 추천 질문 생성
  // 마지막 메시지가 assistant인 경우에만 새 질문 생성 (중복 호출 방지)
  useEffect(() => {
    // 메시지가 있고, 마지막 메시지가 assistant이고, 생성 중이 아니고, 생성이 허용된 경우에만 실행
    if (messages && messages.length > 0 && !isGeneratingQuestions && shouldGenerateQuestions) {
      const lastMessage = messages[messages.length - 1]

      // assistant 메시지이고 welcome 메시지가 아닌 경우에만 새 질문 생성
      if (lastMessage && lastMessage.role === "assistant" && lastMessage.id !== "welcome") {
        console.log("Triggering new question generation after assistant message")

        // 디바운스 처리로 연속 호출 방지
        const timer = setTimeout(() => {
          generateNewSuggestedQuestions()
        }, 500)

        return () => clearTimeout(timer)
      }
    }
  }, [messages, isGeneratingQuestions, generateNewSuggestedQuestions, shouldGenerateQuestions])

  // Extract 오행 (five elements) and 일주 (day pillar) data from saju
  const extractSajuInfo = () => {
    if (!saju) return { fiveElements: [], dayPillar: "" }

    // Extract five elements (오행)
    const fiveElements = [
      { type: "wood", count: countElementOccurrences(saju, "wood") },
      { type: "fire", count: countElementOccurrences(saju, "fire") },
      { type: "earth", count: countElementOccurrences(saju, "earth") },
      { type: "metal", count: countElementOccurrences(saju, "metal") },
      { type: "water", count: countElementOccurrences(saju, "water") },
    ]

    // Extract day pillar (일주)
    const dayPillar = saju.dayStem && saju.dayBranch ? `${saju.dayStem}${saju.dayBranch}` : ""

    // Extract day pillar hanja (한자)
    const dayPillarHanja = saju.dayStemHanja && saju.dayBranchHanja ? `${saju.dayStemHanja}${saju.dayBranchHanja}` : ""

    return { fiveElements, dayPillar, dayPillarHanja }
  }

  // Helper function to count element occurrences in saju
  const countElementOccurrences = (saju: any, elementType: string) => {
    let count = 0

    // 사주 객체에 elements 속성이 있으면 직접 사용
    if (saju.elements && saju.elements[elementType] !== undefined) {
      return saju.elements[elementType]
    }

    // 천간(Stems)의 오행 확인
    const stemElements: Record<string, string> = {
      갑: "wood",
      을: "wood",
      병: "fire",
      정: "fire",
      무: "earth",
      기: "earth",
      경: "metal",
      신: "metal",
      임: "water",
      계: "water",
    }

    // 지지(Branches)의 오행 확인
    const branchElements: Record<string, string> = {
      자: "water",
      축: "earth",
      인: "wood",
      묘: "wood",
      진: "earth",
      사: "fire",
      오: "fire",
      미: "earth",
      신: "metal",
      유: "metal",
      술: "earth",
      해: "water",
    }

    // 천간 오행 계산
    if (saju.yearStem && stemElements[saju.yearStem] === elementType) count++
    if (saju.monthStem && stemElements[saju.monthStem] === elementType) count++
    if (saju.dayStem && stemElements[saju.dayStem] === elementType) count++
    if (saju.hourStem && stemElements[saju.hourStem] === elementType) count++

    // 지지 오행 계산
    if (saju.yearBranch && branchElements[saju.yearBranch] === elementType) count++
    if (saju.monthBranch && branchElements[saju.monthBranch] === elementType) count++
    if (saju.dayBranch && branchElements[saju.dayBranch] === elementType) count++
    if (saju.hourBranch && branchElements[saju.hourBranch] === elementType) count++

    return count
  }

  const { fiveElements, dayPillar, dayPillarHanja } = extractSajuInfo()

  // Get Korean names for elements
  const getElementKoreanName = (type: string) => {
    switch (type) {
      case "wood":
        return "목(木)"
      case "fire":
        return "화(火)"
      case "earth":
        return "토(土)"
      case "metal":
        return "금(金)"
      case "water":
        return "수(水)"
      default:
        return type
    }
  }

  // Get color for elements
  const getElementColor = (type: string) => {
    switch (type) {
      case "wood":
        return "bg-green-500"
      case "fire":
        return "bg-red-500"
      case "earth":
        return "bg-yellow-500"
      case "metal":
        return "bg-gray-400"
      case "water":
        return "bg-blue-500"
      default:
        return "bg-gray-300"
    }
  }

  // Function to generate a unique chat session key
  const getWelcomeMessage = (roomType: string, name: string) => {
    return getInitialMessageByRoomType(name, roomType)
  }

  // In the useEffect where the chat session is initialized, add session identification
  useEffect(() => {
    if (saju && name && roomType) {
      // 채팅방 유형별로 고유한 세션 키 생성
      const currentSessionKey = sessionKey || generateChatSessionKey(name, saju, roomType)

      console.log("Current session key:", currentSessionKey) // 디버깅용

      // 기존 세션 확인
      const existingSession = getChatSession(currentSessionKey)

      if (existingSession && existingSession.messages && existingSession.messages.length > 0) {
        console.log("Using existing session for:", roomType) // 디버깅용
        // 기존 세션 사용
        setActiveChatSession(existingSession)
      } else {
        console.log("Creating new session for:", roomType) // 디버깅용
        // 새 세션 생성
        const welcomeMessage = {
          id: "welcome",
          role: "assistant",
          content: getWelcomeMessage(roomType, name),
        }

        const newSession = {
          saju,
          name,
          gender,
          interpretation: initialInterpretation,
          roomType,
          messages: [welcomeMessage],
          lastMessageTime: new Date().toISOString(),
        }

        // 세션 저장 및 활성화
        saveChatSession(currentSessionKey, newSession)
        setActiveChatSession(newSession)

        // Set initial suggested questions based on room type
        setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
      }
    }
  }, [
    saju,
    name,
    gender,
    initialInterpretation,
    roomType,
    sessionKey,
    setActiveChatSession,
    saveChatSession,
    getChatSession,
  ])

  // 컴포넌트 마운트 시 디버깅 로그 추가
  useEffect(() => {
    console.log("Component mounted with roomType:", roomType)
    console.log("Session key:", sessionKey)
    console.log("User name:", name) // Debug log
    console.log("User gender:", gender) // Debug log

    // 로컬 스토리지의 모든 세션 확인
    if (typeof window !== "undefined") {
      try {
        const allSessions = JSON.parse(localStorage.getItem("saju_chat_sessions") || "{}")
        console.log("All available sessions:", Object.keys(allSessions))
      } catch (e) {
        console.error("Error parsing sessions:", e)
      }
    }
  }, [roomType, sessionKey, name, gender])

  return (
    <Card className="w-full border-0 sm:border relative z-10 hide-parent-header">
      <CardHeader className="px-2 py-2 sm:px-4 sm:py-3 border-b flex flex-row items-center justify-between">
        <Button variant="ghost" size="icon" onClick={handleBackWithSave} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-lg">{getRoomTitle(roomType)}</CardTitle>
        <div className="w-8"></div>
        {/* 균형을 위한 빈 공간 */}
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col h-[calc(100vh-120px)] relative">
          {/* 메시지 영역 - 하단 패딩 추가하여 입력 필드에 가려지지 않도록 함 */}
          <div className="flex-1 overflow-y-auto pb-[130px]" ref={chatContainerRef}>
            {/* 사주 정보 카드 */}
            <div className="p-3 sm:p-4 pb-0">
              <div className="flex flex-col sm:flex-row gap-4 items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {/* Saju Diagram */}
                <div className="w-full sm:w-1/2 flex justify-center">
                  <SajuDiagram saju={saju} size="sm" />
                </div>

                {/* Five Elements and Day Pillar */}
                <div className="w-full sm:w-1/2 space-y-3">
                  <div>
                    <h3 className="text-sm font-medium mb-2">일주 (Day Pillar)</h3>
                    <div className="text-xl font-bold text-center p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                      {dayPillar ? (
                        <>
                          {dayPillar} <span className="text-sm font-normal">({dayPillarHanja})</span>
                        </>
                      ) : (
                        "정보 없음"
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">오행 분포 (Five Elements)</h3>
                    <div className="space-y-2">
                      {fiveElements.map((element) => (
                        <div key={element.type} className="flex items-center gap-2">
                          <div className="w-20 text-sm">{getElementKoreanName(element.type)}</div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full ${getElementColor(element.type)}`}
                              style={{ width: `${Math.min(100, element.count * 10)}%` }}
                            ></div>
                          </div>
                          <div className="w-6 text-sm text-right">{element.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 메시지 표시 영역 */}
            <div className="px-3 sm:px-4 py-2 space-y-4">
              {messages &&
                messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-100 dark:bg-gray-800 rounded-bl-none"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {isHtmlResponse ? (
                          "죄송합니다. 응답을 생성하는 중에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
                        ) : (
                          <ReactMarkdown remarkRehypeOptions={{ allowDangerousHtml: true }}>
                            {message.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] sm:max-w-[70%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 rounded-bl-none">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 입력 필드 영역 - 고정 위치 설정 */}
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pb-safe">
            {/* Suggested Questions */}
            {apiError && (
              <div className="text-red-500 text-sm text-center mt-2">
                Error generating suggested questions: {apiError}
              </div>
            )}
            <div className="px-3 sm:px-4 pt-2 pb-1 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">추천 질문:</p>
                <Button variant="ghost" size="icon" onClick={() => setShowSuggestedQuestions(!showSuggestedQuestions)}>
                  {showSuggestedQuestions ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
              </div>
              <div className={`flex flex-wrap gap-2 ${showSuggestedQuestions ? "" : "hidden"}`}>
                {suggestedQuestions && suggestedQuestions.length > 0 ? (
                  suggestedQuestions.map((question, index) => (
                    <button
                      key={`suggested-${index}-${question.substring(0, 10)}`}
                      onClick={() => handleQuestionClick(question)}
                      className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full px-3 py-1.5 text-left"
                    >
                      {question}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">추천 질문이 없습니다</span>
                )}
                {isGeneratingQuestions && (
                  <div className="text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 flex items-center">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                    질문 생성 중...
                  </div>
                )}
              </div>
            </div>

            {/* 입력 폼 */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 chat-input-area">
              <form onSubmit={customHandleSubmit} className="flex space-x-2">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-3 py-1.5 flex-1 border border-gray-200 dark:border-gray-700">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder="사주에 대해 질문하세요..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-base"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </div>
              </form>
              <p className="text-xs text-center text-gray-500 mt-1">
                사주 채팅은 정확한 정보를 제공하기 위해 노력합니다.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
