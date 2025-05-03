"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
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

// 네트워크 상태 모니터링 훅
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
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
  general: ["2025년 운세는 어떤가요?", "제 사주의 장단점은?", "가장 강한 기운은 무엇인가요?"],
  career: ["저에게 맞는 직업은 무엇인가요?", "이직하기 좋은 시기는 언제인가요?", "승진 가능성이 높은 때는 언제인가요?"],
  career_fortune: ["제 적성에 맞는 직업 분야는?", "올해 커리어 전환에 좋은 시기는?", "직장 내 인간관계 개선 방법은?"],
  love: ["올해 연애운은 어떤가요?", "좋은 인연 만날 시기는?", "이상적인 짝은 어떤 사람인가요?"],
  love_fortune: ["제게 맞는 연애 스타일은?", "데이트 성공 확률을 높이는 방법은?", "현재 관계를 발전시키려면?"],
  health: ["주의할 건강 문제는?", "건강관리가 필요한 부분은?", "제 체질에 맞는 운동은?"],
  yearly: ["올해 주의할 시기는?", "운이 좋은 달은 언제인가요?", "중요한 결정에 좋은 시기는?"],
  business: ["사업 시작 좋은 시기는?", "투자하기 좋은 분야는?", "재물운을 높이는 방법은?"],
  marriage: ["결혼 좋은 시기는?", "제게 맞는 배우자는?", "결혼생활 주의점은?"],
  marriage_fortune: ["결혼 준비 체크리스트는?", "예비 배우자와 꼭 해야 할 대화는?", "결혼 자금 계획은 어떻게?"],
  personalized: ["고민 해결 방법은?", "인간관계 개선 방법은?", "미래 불안감 극복법은?"],
  "daily-fortune": [`오늘(${formatTodayDate()}) 운세는?`, "오늘 하루 보내는 팁은?", "오늘의 행운 요소는?"],
  fitness: ["제 체질에 맞는 운동은?", "효과적인 운동 루틴은?", "운동 시 주의할 점은?"],
  diet: ["제 체질에 맞는 식단은?", "체중 관리에 좋은 음식은?", "식이요법 추천해주세요"],
  cheerup: ["요즘 의욕이 없어요", "자신감을 높이는 방법은?", "스트레스 해소법 알려주세요"],
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
      return `안녕하세요, ${userName}님! 직업 상담사 커리어쌤입니다. 💼

${currentYear}년 을사년(乙巳年)의 직업운에 대해 상담해 드릴게요. 취업, 이직, 승진, 직장 생활 등 직업과 관련된 질문을 해주시면 사주를 바탕으로 답변해드릴게요. 어떤 직업이 잘 맞는지, 언제 이직하면 좋을지 등 구체적인 질문을 해보세요!`

    case "career_fortune":
      return `안녕하세요, ${userName}님! 커리어 코치입니다. 🚀

${userName}님의 사주를 분석해보니 특별한 직업적 재능이 보이네요. ${currentYear}년 을사년(乙巳年)에는 어떤 커리어 목표를 가지고 계신가요? 적성에 맞는 직업 분야, 승진 전략, 이직 시기 등 구체적인 질문을 해주시면 사주를 바탕으로 맞춤형 조언을 드리겠습니다.`

    case "personalized":
      return `안녕하세요, ${userName}님! 고민 상담사 마음쌤입니다. 💭

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해입니다. ${userName}님의 고민이 무엇인지 말씀해주시면, 사주를 바탕으로 해결책을 제시해드리겠습니다. 인간관계, 직장, 심리적 고민 등 어떤 것이든 편하게 말씀해주세요. 함께 해결책을 찾아보아요.`

    case "love":
      return `안녕하세요, ${userName}님! 연애 상담사 러브쌤입니다. 💕

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해인데요. 연애, 만남, 인연 등 애정 관계에 대해 궁금한 점이 있으시면 사주를 바탕으로 답변해드릴게요. 언제 좋은 인연을 만날지, 어떤 유형의 사람과 잘 맞는지 등 구체적인 질문을 해보세요. 당신의 사랑을 응원합니다!`

    case "love_fortune":
      return `안녕하세요, ${userName}님! 연애 전문 상담사입니다. ❤️

${userName}님의 사주를 보니 특별한 인연의 기운이 느껴지네요. ${currentYear}년 을사년(乙巳年)에는 어떤 사랑의 변화가 있을지 궁금하신가요? 데이트 코스 추천부터 관계 개선 방법까지, 사주를 바탕으로 실질적인 연애 조언을 드리겠습니다. 어떤 부분이 궁금하신가요?`

    case "health":
      return `안녕하세요, ${userName}님! 건강 상담사 헬스쌤입니다. 🌿

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해입니다. 체질, 건강 관리, 주의해야 할 질병 등 건강과 관련된 질문을 해주면 사주를 바탕으로 답변해드릴게요. 어떤 부분에 주의해야 하는지, 어떤 운동이나 식습관이 좋을지 등 구체적인 질문을 해보세요. 건강한 한 해를 보내시길 바랍니다!`

    case "yearly":
      return `안녕하세요, ${userName}님! 연간 운세 상담사 이어쌤입니다. 📅

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해로, 음(陰)의 목(木) 기운과 뱀의 지혜로운 에너지가 함께합니다. 올해의 전반적인 운세, 중요한 시기, 주의해야 할 점 등 올해 운세와 관련된 질문을 해주시면 사주를 바탕으로 답변해드리겠습니다. 어떤 달에 특별히 주의해야 하는지, 언제 중요한 결정을 내리면 좋을지 등 구체적인 질문을 해보세요.`

    case "daily-fortune":
      return `안녕하세요, ${userName}님! 일일 운세 봇 데일리쌤입니다. 🍀

사주를 기반으로 오늘(${today})의 운세를 알려드립니다. 오늘 하루는 어떤 운이 따를까요? 궁금한 점이 있으시면 편하게 물어보세요! 오늘 하루도 행운이 가득하길 바랍니다.`

    case "business":
      return `안녕하세요, ${userName}님! 사업 상담사 비즈쌤입니다. 💼

${currentYear}년 을사년(乙巳年)의 사업 운세와 재물운에 대해 상담해 드리겠습니다. 사업 시작 시기, 투자, 재테크 등에 관한 질문이 있으시면 사주를 바탕으로 답변해 드리겠습니다. 어떤 분야에 투자하면 좋을지, 사업 파트너는 어떤 사람이 좋을지 등 구체적인 질문을 해보세요. 성공적인 사업을 응원합니다!`

    case "marriage":
      return `안녕하세요, ${userName}님! 결혼 상담사 웨딩쌤입니다. 💍

${currentYear}년 을사년(乙巳年)의 결혼운과 가정운에 대해 상담해 드리겠습니다. 결혼 시기, 배우자 선택, 부부 관계 등에 관한 질문이 있으시면 사주를 바탕으로 답변해 드리겠습니다. 언제 결혼하면 좋을지, 어떤 사람과 결혼생활이 행복할지 등 구체적인 질문을 해보세요. 행복한 결혼을 응원합니다!`

    case "marriage_fortune":
      return `안녕하세요, ${userName}님! 결혼 전문 상담가입니다. 👰🤵

${userName}님의 사주를 보니 인연의 기운이 특별하게 흐르고 있네요. ${currentYear}년 을사년(乙巳年)에 결혼을 계획 중이신가요? 아니면 미래의 결혼에 대해 궁금하신가요? 결혼 적기부터 예비 배우자와의 관계 조화, 결혼 준비 체크리스트까지 실질적인 조언을 드리겠습니다. 무엇이 궁금하신가요?`

    case "fitness":
      return `안녕하세요, ${userName}님! 운동코치 치코쌤입니다! 💪

${userName}님의 사주와 체질에 맞는 운동 방법과 루틴을 알려드릴게요. 체중 관리, 근력 향상, 유연성 개선 등 어떤 목표가 있으신가요? 사주를 바탕으로 가장 효과적인 운동법을 제안해 드리겠습니다. 오늘부터 함께 건강한 몸을 만들어봐요! 화이팅!`

    case "diet":
      return `안녕하세요, ${userName}님! 식단코치 단식쌤입니다! 🥗

${userName}님의 사주와 체질에 맞는 맞춤 식단과 영양 조언을 해드릴게요. 건강한 식습관, 체중 관리, 에너지 증진 등 어떤 목표가 있으신가요? 사주를 바탕으로 가장 효과적인 식단을 제안해 드리겠습니다. 오늘부터 함께 건강한 식습관을 만들어봐요! 맛있게 먹으면서 건강해지는 비결을 알려드릴게요!`

    case "cheerup":
      return `안냥하세요, ${userName}님! 응원냥이 치즈예요! 😺

힘든 일이 있으신가요? 기운이 없으신가요? 치즈가 ${userName}님의 사주를 보고 딱 맞는 응원과 위로를 해드릴게요! 어떤 고민이 있든 함께 나누면 절반으로 줄어든다냥! 오늘 하루도 파이팅이에요! 무슨 일이 있었는지 치즈에게 털어놓아보세요~ 치즈가 항상 응원할게요옹!`

    case "general":
    default:
      return `안녕하세요, ${userName}님! 사주 종합 상담사 사주쌤입니다. 🔮

${currentYear}년은 을사년(乙巳年), 푸른 뱀의 해입니다. 음(陰)의 목(木) 기운과 뱀의 지혜로운 에너지가 함께하는 해로, 결혼 시기, 성공 시기, 연애 시기, 일이 풀리는 시기 등 구체적인 질문을 해주시면 사주를 바탕으로 답변해드리겠습니다. ${currentYear}년 을사년의 운세와 앞으로의 인생 흐름에 대해 궁금한 점이 있으시면 무엇이든 물어보세요! 함께 좋은 길을 찾아보아요.`
  }
}

// 채팅방 유형별 제목
function getRoomTitle(roomType: string): string {
  switch (roomType) {
    case "general":
      return "종합 운세 상담"
    case "career":
      return "직업/진로 상담"
    case "career_fortune":
      return "커리어 코칭"
    case "love":
      return "애정운 상담"
    case "love_fortune":
      return "연애 코칭"
    case "health":
      return "건강 상담"
    case "yearly":
      return "올해운 상담"
    case "business":
      return "사업운 상담"
    case "marriage":
      return "결혼운 상담"
    case "marriage_fortune":
      return "결혼 준비 상담"
    case "personalized":
      return "맞춤 고민 상담"
    case "daily-fortune":
      return "오늘의 운세"
    case "fitness":
      return "운동코치 치코쌤"
    case "diet":
      return "식단코치 단식쌤"
    case "cheerup":
      return "응원냥이 치즈"
    default:
      return "사주 상담"
  }
}

// 채팅방 유형별 상담사 이름
const getConsultantName = (roomType: string): string => {
  switch (roomType) {
    case "career":
      return "커리어쌤"
    case "career_fortune":
      return "커리어 코치"
    case "love":
      return "러브쌤"
    case "love_fortune":
      return "연애 코치"
    case "health":
      return "헬스쌤"
    case "yearly":
      return "이어쌤"
    case "business":
      return "비즈쌤"
    case "marriage":
      return "웨딩쌤"
    case "marriage_fortune":
      return "결혼 코치"
    case "personalized":
      return "마음쌤"
    case "daily-fortune":
      return "데일리쌤"
    case "fitness":
      return "치코쌤"
    case "diet":
      return "단식쌤"
    case "cheerup":
      return "치즈"
    case "general":
    default:
      return "사주쌤"
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

// Add a function to get model badge text based on room type
const getModelBadgeText = (roomType: string): string | null => {
  switch (roomType) {
    case "career":
      return "전문 직업 상담 모델"
    case "marriage":
      return "전문 결혼 상담 모델"
    case "health":
      return "전문 건강 상담 모델"
    default:
      return null
  }
}

// Update the getInitialMessage function to include initial messages for the new room types
function getInitialMessage(roomType: string): string {
  switch (roomType) {
    case "general":
      return "안녕하세요! 사주와 관련된 질문이 있으신가요?"
    case "career":
      return "안녕하세요! 직업이나 진로에 관한 상담을 도와드릴게요."
    case "marriage":
      return "안녕하세요! 결혼이나 연애에 관한 상담을 도와드릴게요."
    case "health":
      return "안녕하세요! 건강에 관한 상담을 도와드릴게요."
    case "business":
      return "안녕하세요! 사업이나 재테크에 관한 상담을 도와드릴게요."
    case "fitness":
      return "안녕하세요! 운동코치 치코쌤입니다. 운동과 피트니스에 관한 상담을 도와드릴게요. 어떤 운동 목표가 있으신가요?"
    case "diet":
      return "안녕하세요! 식단코치 단식쌤입니다. 건강한 식단과 영양에 관한 상담을 도와드릴게요. 어떤 식단 목표가 있으신가요?"
    case "cheerup":
      return "안녕하냥! 응원냥이 치즈예요! 오늘 힘든 일이 있었나요? 무슨 일이든 털어놓으세요, 제가 응원해드릴게요!"
    default:
      return "안녕하세요! 무엇을 도와드릴까요?"
  }
}

// Update the getSpecializedModelBadge function to include badges for the new room types
function getSpecializedModelBadge(roomType: string): React.ReactNode {
  const specializedRoomTypes = ["career", "marriage", "health", "business", "fitness", "diet", "cheerup"]

  if (!specializedRoomTypes.includes(roomType)) {
    return null
  }

  let badgeText = ""
  let badgeColor = ""

  switch (roomType) {
    case "career":
      badgeText = "직업 특화 모델"
      badgeColor = "bg-blue-500"
      break
    case "marriage":
      badgeText = "연애 특화 모델"
      badgeColor = "bg-pink-500"
      break
    case "health":
      badgeText = "건강 특화 모델"
      badgeColor = "bg-green-500"
      break
    case "business":
      badgeText = "사업 특화 모델"
      badgeColor = "bg-amber-500"
      break
    case "fitness":
      badgeText = "운동 특화 모델"
      badgeColor = "bg-purple-500"
      break
    case "diet":
      badgeText = "식단 특화 모델"
      badgeColor = "bg-emerald-500"
      break
    case "cheerup":
      badgeText = "응원 특화 모델"
      badgeColor = "bg-rose-500"
      break
  }

  return <span className={`${badgeColor} text-white text-xs px-2 py-1 rounded-full ml-2`}>{badgeText}</span>
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

  // 네트워크 상태 모니터링
  const isOnline = useNetworkStatus()

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
  const [streamingError, setStreamingError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

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
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, error, reload, append } = useAIChat({
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

      // 오류 상태 초기화
      setStreamingError(null)
    },
    onError: (error) => {
      console.error("Chat error:", error)

      // 오류 상태 설정
      setStreamingError(error.message || "응답 생성 중 오류가 발생했습니다.")

      // 네트워크 오류인 경우 특별 처리
      if (error.message?.includes("network") || error.message?.includes("fetch")) {
        setStreamingError("네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.")
      }

      // 오류 발생 시에도 질문 생성 허용
      setShouldGenerateQuestions(true)
    },
    onResponse: (response) => {
      // 응답이 시작되면 스크롤을 아래로 이동
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
          })
        }, 100)
      }

      // 오류 상태 초기화
      setStreamingError(null)
    },
  })

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    setIsRetrying(true)

    // 마지막 사용자 메시지 찾기
    const lastUserMessageIndex = [...messages].reverse().findIndex((msg) => msg.role === "user")

    if (lastUserMessageIndex !== -1) {
      const lastUserMessage = [...messages].reverse()[lastUserMessageIndex]

      // 마지막 응답 제거 (오류가 있는 경우)
      const messagesToKeep = messages.slice(0, messages.length - lastUserMessageIndex)

      // 동일한 질문으로 다시 시도
      append({
        role: "user",
        content: lastUserMessage.content,
      })
    } else {
      // 사용자 메시지가 없는 경우 그냥 재시도
      reload()
    }

    setIsRetrying(false)
    setStreamingError(null)
  }, [messages, append, reload])

  // 원래의 handleSubmit 함수 저장
  const originalHandleSubmit = handleSubmit

  // handleSubmit 함수 오버라이드
  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 네트워크 연결 확인
    if (!isOnline) {
      setStreamingError("인터넷 연결이 없습니다. 연결 상태를 확인한 후 다시 시도해주세요.")
      return
    }

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

    // 오류 상태 초기화
    setStreamingError(null)

    // 원래의 handleSubmit 함수 호출
    originalHandleSubmit(e)
  }

  // 뒤로가기 핸들러 - 채팅 데이터 저장 후 뒤로가기
  const handleBackWithSave = () => {
    try {
      // 채팅 데이터 저장 (오류가 발생해도 계속 진행)
      try {
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
      } catch (saveError) {
        console.error("채팅 세션 저장 중 오류:", saveError)
      }

      // 채팅 리스트에서 사용할 사주 정보를 localStorage에 저장
      try {
        localStorage.setItem(
          "last_chat_saju_data",
          JSON.stringify({
            saju,
            name,
            gender,
            interpretation: initialInterpretation,
            timestamp: new Date().getTime(),
          }),
        )
      } catch (storageError) {
        console.error("사주 데이터 저장 중 오류:", storageError)
      }

      // 채팅 리스트 페이지로 이동
      window.location.href = "/chat-list"
    } catch (error) {
      console.error("뒤로가기 처리 중 오류:", error)
      // 오류가 발생해도 기본 경로로 이동
      window.location.href = "/"
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
    if (messagesEndRef.current && chatContainerRef.current) {
      // 약간의 지연을 두고 스크롤 실행 (모바일에서 더 안정적)
      const timer = setTimeout(() => {
        const chatContainer = chatContainerRef.current
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      }, 100)

      return () => clearTimeout(timer)
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
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{getRoomTitle(roomType)}</CardTitle>
          {getModelBadgeText(roomType) && (
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
              {getModelBadgeText(roomType)}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowSajuInfo(!showSajuInfo)}>
          사주도표
          {showSajuInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex flex-col h-[calc(100vh-56px)]">
          {/* 네트워크 상태 알림 */}
          {!isOnline && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-2 text-sm text-center">
              인터넷 연결이 끊겼습니다. 연결 상태를 확인해주세요.
            </div>
          )}

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

              {/* 오류 메시지 및 재시도 버튼 */}
              {streamingError && (
                <div className="flex justify-center my-4">
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg p-3 text-sm flex flex-col items-center max-w-[85%]">
                    <p>{streamingError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="mt-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      다시 시도
                    </Button>
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
                    disabled={isLoading || !input.trim() || !isOnline}
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
