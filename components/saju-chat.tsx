"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import ReactMarkdown from "react-markdown"

// useHideHeader 훅을 확장하여 footer도 함께 숨기도록 수정
const useHideHeaderAndFooter = () => {
  useEffect(() => {
    // 상위 헤더와 푸터 요소 찾기 및 숨기기
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")

    if (header) {
      header.style.display = "none"
    }

    if (footer) {
      footer.style.display = "none"
    }

    // 컴포넌트 언마운트 시 원래대로 복원
    return () => {
      if (header) {
        header.style.display = ""
      }
      if (footer) {
        footer.style.display = ""
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
}

// 초기 예상 질문 목록 (채팅방 유형별)
const initialSuggestedQuestionsByType: Record<string, string[]> = {
  general: [
    "2025년 을사년에 제 운세는 어떤가요?",
    "제 사주의 장점과 단점을 알려주세요.",
    "제 사주에서 가장 강한 기운은 무엇인가요?",
  ],
  career: [
    "제게 가장 잘 맞는 직업은 무엇인가요?",
    "2025년 을사년에 이직하기 좋은 시기는 언제인가요?",
    "푸른 뱀의 해에 승진 가능성이 높은 시기는 언제인가요?",
  ],
  love: [
    "2025년 을사년에 제 연애운은 어떤가요?",
    "푸른 뱀의 해에 좋은 인연을 만날 시기는 언제인가요?",
    "제 사주에 맞는 이상적인 짝은 어떤 사람인가요?",
  ],
  health: [
    "제 사주에서 주의해야 할 건강 문제는 무엇인가요?",
    "2025년 을사년에 특별히 건강관리가 필요한 부분이 있나요?",
    "제 체질에 맞는 운동은 무엇인가요?",
  ],
  yearly: [
    "2025년 을사년에 특별히 주의해야 할 시기가 있나요?",
    "을사년에 가장 운이 좋은 달은 언제인가요?",
    "푸른 뱀의 해에 중요한 결정을 내리기 좋은 시기는 언제인가요?",
  ],
  business: [
    "2025년 을사년에 사업 시작하기 좋은 시기는 언제인가요?",
    "푸른 뱀의 해에 투자하기 좋은 분야는 무엇인가요?",
    "을사년에 재물운을 높이는 방법이 있을까요?",
  ],
  marriage: [
    "2025년 을사년에 결혼하기 좋은 시기는 언제인가요?",
    "제 사주에 맞는 배우자는 어떤 사람인가요?",
    "푸른 뱀의 해에 결혼 생활에서 주의해야 할 점이 있나요?",
  ],
  personalized: [
    "요즘 제 고민이 있는데 어떻게 해결하면 좋을까요?",
    "인간관계에 어려움을 겪고 있는데 제 사주가 원인일까요?",
    "미래에 대한 불안감이 있는데 어떻게 극복할 수 있을까요?",
  ],
  "daily-fortune": [
    `오늘(${formatTodayDate()})의 운세를 보시겠습니까?`,
    "오늘 하루를 어떻게 보내는 것이 좋을까요?",
    "오늘 저에게 행운을 가져다 줄 요소는 무엇인가요?",
  ],
}

// Function to format today's date in M/d format
function formatTodayDate() {
  const today = new Date()
  return `${today.getMonth() + 1}/${today.getDate()}`
}

// 채팅방 유형별 초기 메시지
const getInitialMessageByRoomType = (name: string, roomType: string): string => {
  // 올해는 2025년 을사년으로 고정
  const currentYear = 2025
  const today = formatTodayDate()
  const userName = name || "사용자"

  switch (roomType) {
    case "career":
      return `안녕하세요, ${userName}님! 직업운에 대한 사주 상담을 시작해볼게요.

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해입니다. 취업, 이직, 승진, 직장 생활 등 직업과 관련된 질문을 해주시면 사주를 바탕으로 답변해드릴게요. 어떤 직업이 잘 맞는지, 언제 이직하면 좋을지 등 구체적인 질문을 해보세요.`

    case "personalized":
      return `안녕하세요, ${userName}님! 고민상담을 시작하겠습니다.

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해입니다. ${userName}님의 고민이 무엇인지 말씀해주시면, 사주를 바탕으로 해결책을 제시해드리겠습니다. 인간관계, 직장, 심리적 고민 등 어떤 것이든 편하게 말씀해주세요.`

    case "love":
      return `안녕하세요, ${userName}님! 애정운에 대한 사주 상담을 시작할게요.

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해인데요. 연애, 만남, 인연 등 애정 관계에 대해 궁금한 점이 있으시면 사주를 바탕으로 답변해드릴게요. 언제 좋은 인연을 만날지, 어떤 유형의 사람과 잘 맞는지 등 구체적인 질문을 해보세요.`

    case "health":
      return `안녕하세요, ${userName}님! 건강운에 대한 사주 상담을 시작해볼게요.

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해입니다. 체질, 건강 관리, 주의해야 할 질병 등 건강과 관련된 질문을 해주면 사주를 바탕으로 답변해드릴게요. 어떤 부분에 주의해야 하는지, 어떤 운동이나 식습관이 좋을지 등 구체적인 질문을 해보세요.`

    case "yearly":
      return `안녕하세요, ${userName}님! ${currentYear}년 을사년(乙巳年) 운세에 대한 상담을 시작합니다. 

${currentYear}년은 푸른 뱀의 해로, 음(陰)의 목(木) 기운과 뱀의 지혜로운 에너지가 함께합니다. 올해의 전반적인 운세, 중요한 시기, 주의해야 할 점 등 올해 운세와 관련된 질문을 해주시면 사주를 바탕으로 답변해드리겠습니다. 어떤 달에 특별히 주의해야 하는지, 언제 중요한 결정을 내리면 좋을지 등 구체적인 질문을 해보세요.`

    case "daily-fortune":
      return `안녕하세요, ${userName}님! 사주를 기반으로 오늘(${today})의 운세를 알려드리는 AI입니다. 오늘 하루는 어떤 운이 따를까요? 🍀`

    case "general":
    default:
      return `안녕하세요, ${userName}님! 사주팔자를 기반으로 인생의 중요한 시기와 방향성에 대해 상담해드리는 AI 상담사입니다. 

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해입니다. 음(陰)의 목(木) 기운과 뱀의 지혜로운 에너지가 함께하는 해로, 결혼 시기, 성공 시기, 연애 시기, 일이 풀리는 시기 등 구체적인 질문을 해주시면 사주를 바탕으로 답변해드리겠습니다. ${currentYear}년 을사년의 운세와 앞으로의 인생 흐름에 대해 궁금한 점이 있으시면 무엇이든 물어보세요!`
  }
}

// 채팅방 유형별 제목
const getRoomTitle = (roomType: string): string => {
  switch (roomType) {
    case "career":
      return "직업운"
    case "love":
      return "애정운"
    case "health":
      return "건강운"
    case "yearly":
      return "올해운 상담"
    case "business":
      return "사업운"
    case "marriage":
      return "결혼운"
    case "personalized":
      return "고민상담"
    case "daily-fortune":
      return "오늘의 운세"
    case "general":
    default:
      return "사주 채팅 상담"
  }
}

// 채팅방 유형별 상담사 이름
const getConsultantName = (roomType: string): string => {
  switch (roomType) {
    case "career":
      return "직업 상담사"
    case "love":
      return "연애 상담사"
    case "health":
      return "건강 상담사"
    case "yearly":
      return "AI 상담사"
    case "business":
      return "사업 상담사"
    case "marriage":
      return "결혼 상담사"
    case "personalized":
      return "고민 상담사"
    case "daily-fortune":
      return "AI 운세봇"
    case "general":
    default:
      return "AI 상담사"
  }
}

// Function to generate a unique chat session key
const generateChatSessionKey = (name: string, saju: any, roomType: string) => {
  // 사주 데이터에서 고유 식별자로 사용할 핵심 정보만 추출
  const birthYear = saju.year || ""
  const birthMonth = saju.month || ""
  const birthDay = saju.day || ""
  const birthHour = saju.hour || ""
  const gender = saju.gender || ""

  // 채팅방 유형을 명확하게 포함하여 세션 키 생성
  return `chat_${name}_${birthYear}${birthMonth}${birthDay}${birthHour}_${gender}_${roomType}`
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
}: SajuChatProps) {
  // 상단 헤더 숨기기
  useHideHeaderAndFooter()

  // 로그인 관련 상태
  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState("")
  const [questionCount, setQuestionCount] = useState(0)
  const [hasShownLoginPrompt, setHasShownLoginPrompt] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Chat context
  const { activeChatSession, setActiveChatSession, saveChatSession, getChatSession } = useChat()

  // 로그인 페이지로 이동
  const handleLogin = () => {
    router.push("/login?returnUrl=" + encodeURIComponent(window.location.pathname))
  }

  // 로그인 프롬프트 닫기
  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false)
  }

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }

    fetchUser()
  }, [supabase])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general,
  )
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [lastMessageTime, setLastMessageTime] = useState<Date>(new Date())
  const [lastMessageId, setLastMessageId] = useState<string>("")
  const [shouldGenerateQuestions, setShouldGenerateQuestions] = useState(true)
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true)
  const [showSajuInfo, setShowSajuInfo] = useState(false)

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
      userId, // 사용자 ID 전달
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
      const updatedMessages = [...messages, message]

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

      // 오류 발생 시 사용자에게 알림
      const errorMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "죄송합니다. 응답을 생성하는 중에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      }

      // 오류 메시지를 채팅에 추가
      const updatedMessages = [...messages, errorMessage]

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

    // 모바일에서 키보드 닫기
    if (inputRef.current) {
      inputRef.current.blur()
    }

    // Show login prompt after 5 questions if not already shown
    const shouldShowLoginPrompt = newQuestionCount >= 5 && !isLoggedIn && !hasShownLoginPrompt

    if (shouldShowLoginPrompt) {
      setLoginPromptMessage("5개의 질문을 모두 사용하셨습니다. 로그인하시면 무제한으로 질문하실 수 있습니다.")
      setShowLoginPrompt(true)
      setHasShownLoginPrompt(true)
    }

    // 사용자가 질문을 제출하면 질문 생성 플래그를 false로 설정
    setShouldGenerateQuestions(false)

    // 원래의 handleSubmit 함수 호출
    originalHandleSubmit(e)
  }

  // 뒤로가기 핸들러 - 채팅 데이터 저장 후 뒤로가기
  const handleBackWithSave = () => {
    // If not logged in and hasn't shown prompt yet, show login prompt
    if (!isLoggedIn && !hasShownLoginPrompt && questionCount > 0) {
      setLoginPromptMessage("채팅 내역을 저장하려면 로그인이 필요합니다. 로그인하시겠습니까?")
      setShowLoginPrompt(true)
      setHasShownLoginPrompt(true)
    } else {
      // Otherwise, just go back
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

      // 채팅 리스트로 이동 - 필요한 모든 파라미터 포함
      if (saju) {
        const sajuParam = encodeURIComponent(JSON.stringify(saju))
        const nameParam = encodeURIComponent(name || "")
        const genderParam = encodeURIComponent(gender || "")
        const interpretationParam = encodeURIComponent(initialInterpretation || "")

        // 채팅 리스트 페이지로 이동하면서 필요한 모든 파라미터 전달
        router.push(
          `/chat-list?saju=${sajuParam}&name=${nameParam}&gender=${genderParam}&interpretation=${interpretationParam}`,
        )
      } else {
        // 사주 데이터가 없는 경우 (비정상적인 상황)
        router.push("/")
      }
    }
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
    if (messages.length < 2 || !shouldGenerateQuestions) return

    setIsGeneratingQuestions(true)

    try {
      // 최근 메시지 3개만 사용 (텍스트 유지)
      const recentMessages = messages.slice(-3)

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
          // 창의적인 질문 생성을 위한 플래그 추가
          creative: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate suggested questions: ${response.status}`)
      }

      const data = await response.json()

      if (data.suggestedQuestions && Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0) {
        // 새로운 질문으로 상태 업데이트
        setSuggestedQuestions(data.suggestedQuestions.slice(0, 2))
      } else {
        console.warn("No suggested questions received, using default questions")
        // 기본 질문으로 폴백
        setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
      }
    } catch (error) {
      console.error("Error generating suggested questions:", error)
      // 오류 발생 시 채팅방 유형에 맞는 기본 질문 세트 사용
      setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
    } finally {
      setIsGeneratingQuestions(false)
      // 질문 생성 후 플래그를 false로 설정하여 중복 생성 방지
      setShouldGenerateQuestions(false)
    }
  }, [messages, saju, roomType, shouldGenerateQuestions])

  // 메시지가 변경될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current && !isLoading) {
      // 약간의 지연을 두고 스크롤 실행 (모바일에서 더 안정적)
      setTimeout(() => {
        const chatContainer = chatContainerRef.current
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      }, 100)
    }
  }, [messages, isLoading])

  // 컴포넌트가 마운트되면 입력 필드에 포커스
  useEffect(() => {
    if (inputRef.current && !isInitialized) {
      inputRef.current.focus()
      setIsInitialized(true)
    }
  }, [isInitialized])

  // 메시지가 변경될 때마다 새로운 추천 질문 생성
  useEffect(() => {
    if (messages.length > 0 && !isGeneratingQuestions && shouldGenerateQuestions) {
      const lastMessage = messages[messages.length - 1]

      // assistant 메시지이고 welcome 메시지가 아닌 경우에만 새 질문 생성
      if (lastMessage.role === "assistant" && lastMessage.id !== "welcome") {
        // 디바운스 처리로 연속 호출 방지
        const timer = setTimeout(() => {
          generateNewSuggestedQuestions()
        }, 500)

        return () => clearTimeout(timer)
      }
    }
  }, [messages, isGeneratingQuestions, generateNewSuggestedQuestions, shouldGenerateQuestions])

  // Extract 오행 (five elements) data from saju
  const extractFiveElements = () => {
    if (!saju) return []

    // Helper function to count element occurrences in saju
    const countElementOccurrences = (elementType: string) => {
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

    return [
      { type: "wood", count: countElementOccurrences("wood") },
      { type: "fire", count: countElementOccurrences("fire") },
      { type: "earth", count: countElementOccurrences("earth") },
      { type: "metal", count: countElementOccurrences("metal") },
      { type: "water", count: countElementOccurrences("water") },
    ]
  }

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

  // Extract day pillar
  const getDayPillar = () => {
    if (!saju) return { dayPillar: "", dayPillarHanja: "" }

    const dayPillar = saju.dayStem && saju.dayBranch ? `${saju.dayStem}${saju.dayBranch}` : ""
    const dayPillarHanja = saju.dayStemHanja && saju.dayBranchHanja ? `${saju.dayStemHanja}${saju.dayBranchHanja}` : ""

    return { dayPillar, dayPillarHanja }
  }

  const fiveElements = extractFiveElements()
  const { dayPillar, dayPillarHanja } = getDayPillar()

  const loginPromptDialog = (
    <LoginPromptDialog isOpen={showLoginPrompt} onClose={handleCloseLoginPrompt} message={loginPromptMessage} />
  )

  return (
    <Card className="w-full border-0 sm:border relative z-10 hide-parent-header">
      <CardHeader className="px-2 py-2 sm:px-4 sm:py-3 border-b flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-950 z-10">
        <Button variant="ghost" size="icon" onClick={handleBackWithSave} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-lg">{getRoomTitle(roomType)}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setShowSajuInfo(!showSajuInfo)}>
          사주도표
          {showSajuInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col h-[calc(100vh-56px)]">
          {/* Collapsible Saju Info */}
          {showSajuInfo && (
            <div className="p-3 border-b animate-in fade-in slide-in-from-top duration-300">
              <div className="flex flex-col sm:flex-row gap-4 items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                              style={{ width: `${Math.min(100, element.count * 12.5)}%` }}
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
          )}

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto pb-[140px] sm:pb-[160px]"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="p-3 sm:p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 dark:bg-gray-800 rounded-bl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-lg p-3 bg-gray-100 dark:bg-gray-800 rounded-bl-none">
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

          {/* Input Area - Fixed at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-10">
            {/* Suggested Questions */}
            <div className="px-3 sm:px-4 pt-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">추천 질문:</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSuggestedQuestions(!showSuggestedQuestions)}
                  className="h-6 w-6"
                >
                  {showSuggestedQuestions ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </Button>
              </div>

              {showSuggestedQuestions && (
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={`suggested-${index}`}
                      onClick={() => handleQuestionClick(question)}
                      className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full px-3 py-1.5 text-left"
                      disabled={isLoading}
                    >
                      {question}
                    </button>
                  ))}
                  {isGeneratingQuestions && (
                    <div className="text-sm bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5 flex items-center">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      생성 중...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="px-3 py-2 pb-safe">
              <form onSubmit={customHandleSubmit} className="flex space-x-2">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-full px-4 py-2 flex-1 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white ml-2 h-8 w-8 flex items-center justify-center"
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </CardContent>
      {loginPromptDialog}
    </Card>
  )
}
