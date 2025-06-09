"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useRouter } from "@/next/navigation"
import { useChat } from "@/contexts/chat-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Loader2, Send, ChevronDown, RefreshCw, Menu, User, Mic, ChevronUp } from "lucide-react"
import { useChat as useAIChat } from "ai/react"
import SajuDiagram from "@/components/saju-diagram"
import ReactMarkdown from "react-markdown"
import { MessageFeedbackButtons } from "@/components/message-feedback-buttons"

const useHideHeaderAndFooter = () => {
  useEffect(() => {
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")
    const body = document.body

    if (header) {
      header.style.display = "none"
    }

    if (footer) {
      footer.style.display = "none"
    }

    body.style.overflow = "hidden"

    return () => {
      if (header) {
        header.style.display = ""
      }
      if (footer) {
        footer.style.display = ""
      }
      body.style.overflow = ""
    }
  }, [])
}

const useForceDarkTheme = () => {
  useEffect(() => {
    document.documentElement.classList.add("dark")

    return () => {
      const savedTheme = localStorage.getItem("theme")
      if (savedTheme !== "dark") {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])
}

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOffline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}

const useMobileKeyboard = () => {
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      const originalContent = viewport.getAttribute("content")
      viewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
      )

      // 모바일에서 키보드가 올라올 때 처리
      const handleResize = () => {
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty("--vh", `${vh}px`)
      }

      window.addEventListener("resize", handleResize)
      handleResize()

      return () => {
        if (originalContent) {
          viewport.setAttribute("content", originalContent)
        }
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [])
}

interface BirthInfo {
  solarYear: number
  solarMonth: number
  solarDay: number
  solarHour?: number
  solarMinute?: number
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  timeUnknown?: boolean
  birthCityId?: string
  timeStandard?: string
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
  birthInfo?: BirthInfo
}

const pingCharacters = [
  {
    id: "sajuping",
    name: "사주핑",
    emoji: "🔮",
    description: "사주와 운세 전문",
    roomType: "sajuping",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: "taroping",
    name: "타로핑",
    emoji: "🃏",
    description: "타로카드 리딩 전문",
    roomType: "tarot",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
  },
]

const initialSuggestedQuestionsByType: Record<string, string[]> = {
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

function formatTodayDate() {
  const today = new Date()
  return `${today.getMonth() + 1}/${today.getDate()}`
}

function formatBirthInfo(birthInfo?: BirthInfo): string {
  if (!birthInfo) return ""

  const { solarYear, solarMonth, solarDay, solarHour, solarMinute, timeUnknown } = birthInfo

  let dateStr = `${solarYear}년 ${solarMonth}월 ${solarDay}일`

  if (!timeUnknown && solarHour !== undefined && solarMinute !== undefined) {
    dateStr += ` ${solarHour.toString().padStart(2, "0")}시 ${solarMinute.toString().padStart(2, "0")}분`
  } else if (timeUnknown) {
    dateStr += " (시간 미상)"
  }

  return dateStr
}

const getInitialMessageByRoomType = (name: string, roomType: string, birthInfo?: BirthInfo): string => {
  const currentYear = 2025
  const today = formatTodayDate()
  const userName = name || "사용자"
  const birthDateStr = formatBirthInfo(birthInfo)

  switch (roomType) {
    case "sajuping":
      return `안녕하세요, ${userName}님! 저는 사주핑이에요! 🔮✨

${userName}님의 사주를 바탕으로 인생의 모든 영역에 대해 상담해드릴게요. 

📅 **${userName}님의 생년월일:** ${birthDateStr}

💫 **상담 가능한 영역:**
• 직업운 & 적성 분석
• 연애운 & 결혼운 
• 건강운 & 체질 분석
• 재물운 & 투자 운세
• 성격 & 기질 분석
• 인생의 큰 흐름과 조언

${currentYear}년 을사년(乙巳年), 푸른 뱀의 해에 ${userName}님이 궁금한 모든 것을 물어보세요! 

아래 추천 질문을 눌러보시거나, 직접 궁금한 점을 말씀해주세요 😊`

    case "tarot":
      return `안녕하세요, ${userName}님! 저는 타로핑이에요! 🃏✨

신비로운 타로카드의 세계로 여러분을 안내해드릴게요!

📅 **${userName}님의 생년월일:** ${birthDateStr}

🔮 **타로 리딩 서비스:**
• 오늘의 운세 타로
• 연애운 타로 리딩
• 직업운 타로 상담
• 중요한 결정 도움
• 미래 전망 타로
• 관계 상담 타로

${currentYear}년 을사년, 푸른 뱀의 해에 타로카드가 ${userName}님에게 전하는 메시지를 들어보세요! 

어떤 것이 궁금하신가요? 🌟`

    default:
      return `안녕하세요, ${userName}님! 무엇을 도와드릴까요?

📅 **생년월일:** ${birthDateStr}`
  }
}

const generateSajupingInitialMessages = (name: string, saju: any, birthInfo?: BirthInfo): any[] => {
  const userName = name || "사용자"
  const birthDateStr = formatBirthInfo(birthInfo)

  const yearStem = saju?.yearStem || "?"
  const yearBranch = saju?.yearBranch || "?"
  const monthStem = saju?.monthStem || "?"
  const monthBranch = saju?.monthBranch || "?"
  const dayStem = saju?.dayStem || "?"
  const dayBranch = saju?.dayBranch || "?"
  const hourStem = saju?.hourStem || ""
  const hourBranch = saju?.hourBranch || ""
  const dayMaster = saju?.dayMaster || "?"

  const yearStemSibseong = saju?.yearStemSibseong || "?"
  const yearBranchSibseong = saju?.yearBranchSibseong || "?"
  const monthStemSibseong = saju?.monthStemSibseong || "?"
  const monthBranchSibseong = saju?.monthBranchSibseong || "?"
  const dayStemSibseong = saju?.dayStemSibseong || "?"
  const dayBranchSibseong = saju?.dayBranchSibseong || "?"
  const hourStemSibseong = saju?.hourStemSibseong || "?"
  const hourBranchSibseong = saju?.hourBranchSibseong || "?"

  const yearAnimal = saju?.yearAnimal || "?"
  const elements = saju?.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

  const stemElements: Record<string, string> = {
    갑: "목",
    을: "목",
    병: "화",
    정: "화",
    무: "토",
    기: "토",
    경: "금",
    신: "금",
    임: "수",
    계: "수",
  }

  const dayElement = saju?.dayStem ? stemElements[saju.dayStem] || "?" : "?"
  const dayPillar = dayStem && dayBranch ? `${dayStem}${dayBranch}` : "?"

  const firstMessage = {
    id: "saju-analysis",
    role: "assistant" as const,
    content: `안녕하세요, ${userName}님! 저는 사주핑이에요! 🔮✨

${userName}님의 사주를 분석해보니 정말 흥미로운 특징들이 보이네요!

📅 **${userName}님의 생년월일:** ${birthDateStr}

🌟 **${userName}님의 사주 정보:**
- 년주: ${yearStem}${yearBranch} (십성: ${yearStemSibseong}, ${yearBranchSibseong})
- 월주: ${monthStem}${monthBranch} (십성: ${monthStemSibseong}, ${monthBranchSibseong})
- 일주: ${dayStem}${dayBranch} (일간: ${dayMaster}) (십성: ${dayStemSibseong}, ${dayBranchSibseong})
- 시주: ${hourStem || ""}${hourBranch || ""} ${hourStem ? `(십성: ${hourStemSibseong}, ${hourBranchSibseong})` : "(시간 미상)"}
- 띠: ${yearAnimal}
- 오행 분포: 목(${elements?.wood || 0}), 화(${elements?.fire || 0}), 토(${elements?.earth || 0}), 금(${elements?.metal || 0}), 수(${elements?.water || 0})

🌟 **${userName}님의 사주 해석:**

1. **인생의 큰 흐름과 중심 에너지** 💫
${userName}님은 ${dayElement}의 기운을 가진 ${dayPillar}일주로, ${getLifeThemeDescription(dayStem, dayBranch, dayElement)}

2. **성격과 기질** 🌱
${getPersonalityDescription(dayStem, dayBranch, elements)}

${userName}님만의 독특한 에너지와 잠재력이 느껴져요! 더 자세한 사항이 궁금하시면 편하게 물어보세요! ✨`,
  }

  const secondMessage = {
    id: "consultation-start",
    role: "assistant" as const,
    content: `오늘은 어떤 것이 궁금하세요? 😊`,
  }

  return [firstMessage, secondMessage]
}

const getLifeThemeDescription = (dayStem: string, dayBranch: string, dayElement: string): string => {
  switch (dayElement) {
    case "목":
      return "어린 시절부터 성장과 발전을 추구하는 성향이 강했을 것입니다. 청년기에는 새로운 아이디어와 도전을 통해 자신의 길을 개척하고, 중년기에는 자신만의 영역에서 안정적인 성장을 이루게 됩니다."
    case "화":
      return "타고난 열정과 에너지로 어린 시절부터 주변 사람들의 관심을 받았을 것입니다. 청년기에는 자신의 열정을 표현하고 다양한 경험을 통해 자신을 발견하는 시간을 가지게 됩니다."
    case "토":
      return "어린 시절부터 안정과 조화를 중요시하는 성향이 강했을 것입니다. 청년기에는 기초를 탄탄히 다지는 데 집중하고, 중년기에는 자신의 영역에서 안정적인 위치를 확보하게 됩니다."
    case "금":
      return "어린 시절부터 정확하고 원칙적인 성향이 강했을 것입니다. 청년기에는 자신의 가치관과 원칙을 확립하고, 중년기에는 이를 바탕으로 자신만의 영역에서 권위와 존경을 얻게 됩니다."
    case "수":
      return "어린 시절부터 깊은 사고와 통찰력을 가진 성향이 강했을 것입니다. 청년기에는 다양한 지식과 경험을 통해 자신만의 지혜를 쌓고, 중년기에는 이를 바탕으로 깊이 있는 통찰력을 발휘하게 됩니다."
    default:
      return "독특한 에너지와 잠재력을 가지고 있으며, 삶의 여정에서 자신만의 특별한 길을 걷게 될 것입니다."
  }
}

const getPersonalityDescription = (dayStem: string, dayBranch: string, elements: any): string => {
  switch (dayStem) {
    case "갑":
    case "을":
      return "목(木)의 기운이 강한 당신은 성장과 발전을 추구하는 성향이 있습니다. 새로운 아이디어와 가능성을 발견하는 데 탁월하며, 창의적인 사고방식으로 문제를 해결합니다."
    case "병":
    case "정":
      return "화(火)의 기운이 강한 당신은 열정적이고 활동적인 성향이 있습니다. 자신의 생각과 감정을 표현하는 데 능숙하며, 다른 사람들에게 영감을 주는 능력이 있습니다."
    case "무":
    case "기":
      return "토(土)의 기운이 강한 당신은 안정적이고 신뢰할 수 있는 성향이 있습니다. 실용적이고 현실적인 접근 방식으로 문제를 해결하며, 다른 사람들을 돌보고 지원하는 데 능숙합니다."
    case "경":
    case "신":
      return "금(金)의 기운이 강한 당신은 정확하고 원칙적인 성향이 있습니다. 분석적이고 논리적인 사고방식으로 문제를 해결하며, 효율성과 정확성을 중요시합니다."
    case "임":
    case "계":
      return "수(水)의 기운이 강한 당신은 지혜롭고 적응력이 뛰어난 성향이 있습니다. 깊이 있는 사고와 통찰력으로 문제를 해결하며, 변화하는 상황에 유연하게 대응합니다."
    default:
      return "독특한 성향과 기질을 가지고 있으며, 자신만의 방식으로 세상을 바라보고 해석합니다."
  }
}

function generateChatSessionKey(name: string, saju: any, roomType: string) {
  const birthYear = saju.year || ""
  const birthMonth = saju.month || ""
  const birthDay = saju.day || ""
  const birthHour = saju.hour || ""
  const gender = saju.gender || ""

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
  birthInfo,
}: SajuChatProps) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [isNewUser, setIsNewUser] = useState(true)
  const [messageIds, setMessageIds] = useState<Record<string, string>>({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [databaseSessionId, setDatabaseSessionId] = useState<string | null>(null)
  const [sessionInitialized, setSessionInitialized] = useState(false)

  const getExistingSessionId = useCallback(async () => {
    if (sessionInitialized || databaseSessionId) {
      return
    }

    try {
      setSessionInitialized(true)

      const storedSajuData = localStorage.getItem("tempSajuData")

      if (storedSajuData) {
        const sajuData = JSON.parse(storedSajuData)
        if (sajuData.sessionId) {
          setDatabaseSessionId(sajuData.sessionId)
          return
        }
      }

      const response = await fetch("/api/saju-sessions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()

        if (data.sessions && data.sessions.length > 0) {
          const recentSession = data.sessions[0]
          setDatabaseSessionId(recentSession.id)

          const storedData = JSON.parse(localStorage.getItem("tempSajuData") || "{}")
          storedData.sessionId = recentSession.id
          localStorage.setItem("tempSajuData", JSON.stringify(storedData))
          return
        }
      }
    } catch (error) {
      console.error("Error getting existing session ID:", error)
    }
  }, [sessionInitialized, databaseSessionId, roomType])

  useEffect(() => {
    if (!sessionInitialized && !databaseSessionId) {
      getExistingSessionId()
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isDropdownOpen])

  const saveMessagesToDatabase = useCallback(
    async (messages: any[], sessionId: string) => {
      if (!sessionId) {
        return
      }

      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            messages: messages,
            roomType,
            sajuData: {
              name,
              gender,
              saju,
              birthInfo,
            },
          }),
        })

        if (response.ok) {
          const data = await response.json()

          if (data.messageIds && data.messageIds.length > 0) {
            setTimeout(() => {
              const newMessageIds: Record<string, string> = {}
              const savableMessages = messages.filter((_, index) => index >= 2)
              savableMessages.forEach((msg, index) => {
                if (data.messageIds[index]) {
                  newMessageIds[msg.id] = data.messageIds[index]
                }
              })
              setMessageIds((prev) => ({ ...prev, ...newMessageIds }))
            }, 0)
          }
        }
      } catch (error) {
        console.error("Error saving messages to database:", error)
      }
    },
    [roomType, name, gender, saju, birthInfo],
  )

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollToBottom(!isNearBottom)
    }
  }, [])

  const scrollToBottomSmooth = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [])

  useHideHeaderAndFooter()
  useForceDarkTheme()
  useMobileKeyboard()
  const isOnline = useNetworkStatus()

  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [loginPromptMessage, setLoginPromptMessage] = useState("")
  const [questionCount, setQuestionCount] = useState(0)
  const [hasShownLoginPrompt, setHasShownLoginPrompt] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const { activeChatSession, setActiveChatSession, saveChatSession, getChatSession } = useChat()

  const handleLogin = () => {
    router.push("/login?returnUrl=" + encodeURIComponent(window.location.pathname))
  }

  const handleCloseLoginPrompt = () => {
    setShowLoginPrompt(false)
  }

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
  const [showSajuInfo, setShowSajuInfo] = useState(false)
  const [streamingError, setStreamingError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const currentCharacter = pingCharacters.find((char) => char.roomType === roomType) || pingCharacters[0]

  const handleCharacterChange = (newCharacter: (typeof pingCharacters)[0]) => {
    if (newCharacter.roomType === roomType) return

    try {
      const currentSajuData = {
        saju,
        name,
        gender,
        interpretation: initialInterpretation,
        birthInfo,
      }
      localStorage.setItem("current_saju", JSON.stringify(currentSajuData))

      router.push(`/saju-chat/${newCharacter.roomType}`)
    } catch (error) {
      console.error("Error changing character:", error)
    }
  }

  const checkResponseQuality = useCallback((content: string) => {
    if (content.length < 100) {
      return {
        isGoodQuality: false,
        reason: "응답이 너무 짧습니다.",
      }
    }

    if (
      content.endsWith("...") ||
      content.endsWith("…") ||
      content.endsWith(",") ||
      content.endsWith("하지만") ||
      content.endsWith("그러나") ||
      content.endsWith("따라서")
    ) {
      return {
        isGoodQuality: false,
        reason: "응답이 완전하지 않습니다.",
      }
    }

    return { isGoodQuality: true }
  }, [])

  const savedSession = activeChatSession || getChatSession(sessionKey)

  useEffect(() => {
    const hasExistingSession = savedSession?.messages && savedSession.messages.length > 0
    setIsNewUser(!hasExistingSession)
  }, [savedSession])

  let initialMessages: any[] = []
  if (savedSession?.messages) {
    initialMessages = savedSession.messages
  } else if (roomType === "sajuping") {
    try {
      initialMessages = generateSajupingInitialMessages(name, saju, birthInfo)
    } catch (error) {
      console.error("Error generating sajuping initial messages:", error)
      initialMessages = [
        {
          id: "welcome",
          role: "assistant" as const,
          content: getInitialMessageByRoomType(name, roomType, birthInfo),
        },
      ]
    }
  } else {
    initialMessages = [
      {
        id: "welcome",
        role: "assistant" as const,
        content: getInitialMessageByRoomType(name, roomType, birthInfo),
      },
    ]
  }

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, error, reload, append } = useAIChat({
    api: "/api/saju-chat",
    initialMessages,
    body: {
      saju,
      name,
      gender,
      initialInterpretation,
      roomType,
      userId,
      currentYear: 2025,
      yearDescription: "을사년(乙巳年), 푸른 뱀의 해",
      birthInfo,
    },
    onFinish: (message) => {
      const qualityCheck = checkResponseQuality(message.content)

      if (!qualityCheck.isGoodQuality && retryCount < 2) {
        setRetryCount((prev) => prev + 1)

        setTimeout(() => {
          reload()
        }, 1000)

        return
      }

      const updatedMessages = [...messages, message]

      if (databaseSessionId) {
        saveMessagesToDatabase(updatedMessages, databaseSessionId)
      }

      const newTime = new Date()
      setLastMessageTime(newTime)
      setLastMessageId(message.id)

      const currentSessionKey = sessionKey || generateChatSessionKey(name, saju, roomType)

      const sessionData = {
        saju,
        name,
        gender,
        interpretation: initialInterpretation,
        roomType,
        messages: updatedMessages,
        lastMessageTime: newTime.toISOString(),
        birthInfo,
      }

      try {
        saveChatSession(currentSessionKey, sessionData)
        setActiveChatSession(sessionData)
      } catch (saveError) {
        console.error("Error saving chat session:", saveError)
      }

      setShouldGenerateQuestions(true)
      setStreamingError(null)
      setRetryCount(0)
    },
    onError: (error) => {
      console.error("Chat error:", error)

      let errorMessage = "응답 생성 중 오류가 발생했습니다."

      if (error.message) {
        errorMessage = error.message

        if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요."
        } else if (error.message.includes("timeout")) {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요."
        } else if (error.message.includes("model")) {
          errorMessage = "AI 모델 로딩 중 오류가 발생했습니다. 다시 시도해주세요."
        } else if (error.message.includes("parse") || error.message.includes("JSON")) {
          errorMessage = "응답 처리 중 오류가 발생했습니다. 다시 시도해주세요."
        }
      }

      setStreamingError(errorMessage)
      setShouldGenerateQuestions(true)
    },
    onResponse: (response) => {
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current?.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth",
          })
        }, 100)
      }

      setStreamingError(null)
    },
    options: {
      timeout: 60000,
    },
  })

  const handleRetry = useCallback(() => {
    if (retryCount >= 3) {
      setStreamingError("여러 번 재시도했으나 계속 오류가 발생합니다. 잠시 후 다시 시도해주세요.")
      return
    }

    setIsRetrying(true)
    setStreamingError(null)
    setRetryCount((prev) => prev + 1)

    try {
      const lastUserMessageIndex = [...messages].reverse().findIndex((msg) => msg.role === "user")

      if (lastUserMessageIndex !== -1) {
        const lastUserMessage = [...messages].reverse()[lastUserMessageIndex]

        append({
          role: "user",
          content: lastUserMessage.content,
        })
      } else {
        reload()
      }
    } catch (error) {
      console.error("Error in retry handler:", error)
      setStreamingError("재시도 중 오류가 발생했습니다. 페이지를 새로고침해주세요.")
    } finally {
      setIsRetrying(false)
    }
  }, [messages, append, reload, retryCount])

  const originalHandleSubmit = handleSubmit

  const customHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!isOnline) {
      setStreamingError("인터넷 연결이 없습니다. 연결 상태를 확인한 후 다시 시도해주세요.")
      return
    }

    if (!input.trim()) {
      return
    }

    const newQuestionCount = questionCount + 1
    setQuestionCount(newQuestionCount)

    const shouldShowLoginPrompt = newQuestionCount >= 5 && !isLoggedIn && !hasShownLoginPrompt

    if (shouldShowLoginPrompt) {
      setLoginPromptMessage("5개의 질문을 모두 사용하셨습니다. 로그인하시면 무제한으로 질문하실 수 있습니다.")
      setShowLoginPrompt(true)
      setHasShownLoginPrompt(true)
    }

    setShouldGenerateQuestions(false)
    setStreamingError(null)
    setRetryCount(0)

    saveUserMessage(input)
    originalHandleSubmit(e)
  }

  const handleBackWithSave = () => {
    try {
      try {
        const sessionData = {
          saju,
          name,
          gender,
          interpretation: initialInterpretation,
          roomType,
          messages,
          lastMessageTime: new Date().toISOString(),
          birthInfo,
        }
        saveChatSession(sessionKey, sessionData)
      } catch (saveError) {
        console.error("채팅 세션 저장 중 오류:", saveError)
      }

      try {
        localStorage.setItem(
          "last_chat_saju_data",
          JSON.stringify({
            saju,
            name,
            gender,
            interpretation: initialInterpretation,
            birthInfo,
          }),
        )
      } catch (storageError) {
        console.error("사주 데이터 저장 중 오류:", storageError)
      }

      onBack()
    } catch (error) {
      console.error("뒤로가기 처리 중 오류:", error)
      onBack()
    }
  }

  const handleSuggestedQuestionClick = (question: string) => {
    if (isLoading) return

    setInput(question)
    setTimeout(() => {
      const form = document.querySelector("form")
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  const generateSuggestedQuestions = useCallback(async () => {
    if (!shouldGenerateQuestions || isGeneratingQuestions || messages.length < 2) {
      return
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") {
      return
    }

    setIsGeneratingQuestions(true)
    setShouldGenerateQuestions(false)

    try {
      const defaultQuestions = initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general

      const response = await fetch("/api/suggested-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.slice(-6),
          roomType,
          saju,
          name,
          currentContext: lastMessage.content.slice(0, 500),
          birthInfo,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setSuggestedQuestions(data.questions.filter((q) => q.length > 5 && q.length < 50))
        } else {
          setSuggestedQuestions(defaultQuestions)
        }
      } else {
        setSuggestedQuestions(defaultQuestions)
      }
    } catch (error) {
      console.error("추천 질문 생성 오류:", error)
      setSuggestedQuestions(initialSuggestedQuestionsByType[roomType] || initialSuggestedQuestionsByType.general)
    } finally {
      setIsGeneratingQuestions(false)
    }
  }, [messages.length, roomType, shouldGenerateQuestions, isGeneratingQuestions, birthInfo])

  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      !isGeneratingQuestions &&
      shouldGenerateQuestions
    ) {
      const timer = setTimeout(() => {
        generateSuggestedQuestions()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [messages, isGeneratingQuestions, shouldGenerateQuestions, generateSuggestedQuestions, roomType])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    if (chatContainerRef.current && !isNewUser) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200

      if (isNearBottom) {
        setTimeout(() => {
          scrollToBottom()
        }, 100)
      }
    }
  }, [messages, isNewUser])

  useEffect(() => {
    if (!isInitialized) {
      setTimeout(() => {
        if (!isNewUser) {
          scrollToBottom()
        }
        setIsInitialized(true)
      }, 100)
    }
  }, [isInitialized, isNewUser])

  useEffect(() => {
    if (!isOnline) {
      setStreamingError("인터넷 연결이 끊어졌습니다. 연결 상태를 확인해주세요.")
    } else if (streamingError?.includes("인터넷 연결")) {
      setStreamingError(null)
    }
  }, [isOnline, streamingError])

  const saveUserMessage = useCallback(
    async (userMessage: string) => {
      if (!databaseSessionId) {
        return
      }

      const userMessageObj = {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content: userMessage,
      }

      const updatedMessages = [...messages, userMessageObj]

      await saveMessagesToDatabase(updatedMessages, databaseSessionId)

      const currentSessionKey = sessionKey || generateChatSessionKey(name, saju, roomType)
      const sessionData = {
        saju,
        name,
        gender,
        interpretation: initialInterpretation,
        roomType,
        messages: updatedMessages,
        lastMessageTime: new Date().toISOString(),
        birthInfo,
      }

      try {
        saveChatSession(currentSessionKey, sessionData)
        setActiveChatSession(sessionData)
      } catch (saveError) {
        console.error("Error saving user message to session:", saveError)
      }
    },
    [
      databaseSessionId,
      messages,
      saveMessagesToDatabase,
      sessionKey,
      name,
      saju,
      roomType,
      gender,
      initialInterpretation,
      saveChatSession,
      setActiveChatSession,
      birthInfo,
    ],
  )

  return (
    <div
      className="fixed inset-0 flex flex-col bg-gray-900 text-white overflow-hidden"
      style={{ height: "calc(var(--vh, 1vh) * 100)" }}
    >
      {/* ChatGPT 스타일 헤더 */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleBackWithSave} className="p-1 text-gray-300 hover:text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-100 hover:text-white"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-xl">{currentCharacter.emoji}</span>
              <h1 className="text-lg font-medium hidden sm:block">{currentCharacter.name}</h1>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </Button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="py-2">
                  {pingCharacters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => {
                        handleCharacterChange(character)
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-700 transition-colors duration-150 ${
                        character.roomType === roomType ? "bg-gray-700" : ""
                      }`}
                    >
                      <span className="text-xl">{character.emoji}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${character.color}`}>{character.name}</div>
                        <div className="text-sm text-gray-400">{character.description}</div>
                      </div>
                      {character.roomType === roomType && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSajuInfo(!showSajuInfo)}
            className="p-1 text-gray-300 hover:text-white"
            title={showSajuInfo ? "사주 정보 숨기기" : "사주 정보 보기"}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 사주 정보 카드 */}
      {showSajuInfo && (
        <div className="flex-shrink-0 bg-gradient-to-b from-gray-800 to-gray-900 border-b border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-medium text-white">{name || "사용자"}님의 사주 정보</h3>
              {birthInfo && <span className="text-sm text-gray-400">({formatBirthInfo(birthInfo)})</span>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSajuInfo(false)}
              className="p-1 text-gray-400 hover:text-white"
              title="사주 정보 접기"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </div>

          <div className="p-4">
            <div className="max-w-3xl mx-auto">
              <SajuDiagram saju={saju} name={name} />
            </div>
          </div>
        </div>
      )}

      {/* 채팅 영역 */}
      <div
        className="flex-1 overflow-y-auto pb-[140px] sm:pb-[120px]"
        ref={chatContainerRef}
        style={{
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="min-h-full flex flex-col">
          <div className="flex-1 px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6">
            <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
              {messages.map((message, index) => (
                <div key={message.id || index} className="space-y-4 group">
                  {index === 0 && message.role === "assistant" && !showSajuInfo && (
                    <div className="mb-6 p-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-purple-400" />
                          <h3 className="text-lg font-medium text-white">{name || "사용자"}님의 사주</h3>
                          {birthInfo && <span className="text-sm text-gray-400">({formatBirthInfo(birthInfo)})</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSajuInfo(true)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="사주 정보 상단에 고정"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </Button>
                      </div>
                      <SajuDiagram saju={saju} name={name} />
                    </div>
                  )}

                  {message.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-blue-600 rounded-2xl px-3 py-2.5 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]">
                        <p className="text-white text-sm sm:text-base leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-medium">{currentCharacter.emoji}</span>
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="prose prose-sm max-w-none prose-invert">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="text-gray-100 leading-relaxed mb-3 last:mb-0 text-sm md:text-base">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-white">{children}</strong>
                              ),
                              em: ({ children }) => <em className="italic text-gray-300">{children}</em>,
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-1 mb-3 text-gray-100 text-sm md:text-base">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-1 mb-3 text-gray-100 text-sm md:text-base">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => <li className="text-gray-100">{children}</li>,
                              h1: ({ children }) => (
                                <h1 className="text-lg md:text-xl font-bold mb-3 text-white">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base md:text-lg font-semibold mb-2 text-white">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm md:text-base font-semibold mb-2 text-white">{children}</h3>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 mb-3">
                                  {children}
                                </blockquote>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-800 px-1 py-0.5 rounded text-xs md:text-sm font-mono text-gray-200">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        <div className="mt-3">
                          <MessageFeedbackButtons
                            messageId={messageIds[message.id] || message.id}
                            messageContent={message.content}
                            sessionId={databaseSessionId}
                            onRetry={() => {
                              const lastUserMessageIndex = [...messages]
                                .reverse()
                                .findIndex((msg) => msg.role === "user")
                              if (lastUserMessageIndex !== -1) {
                                const lastUserMessage = [...messages].reverse()[lastUserMessageIndex]
                                append({
                                  role: "user",
                                  content: lastUserMessage.content,
                                })
                              }
                            }}
                            onFeedback={async (messageId: string, feedback: "like" | "dislike") => {
                              try {
                                const response = await fetch("/api/message-feedback", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    messageId,
                                    feedback,
                                    sessionId: databaseSessionId,
                                  }),
                                })

                                if (!response.ok) {
                                  console.error("Failed to save feedback")
                                }
                              } catch (error) {
                                console.error("Error saving feedback:", error)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-2 md:space-x-3">
                  <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs md:text-sm font-medium">{currentCharacter.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
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
                </div>
              )}

              {streamingError && (
                <div className="flex items-start space-x-2 md:space-x-3">
                  <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs md:text-sm font-medium">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg">
                      <p className="text-sm mb-2">{streamingError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="text-red-300 border-red-600 hover:bg-red-800/50"
                      >
                        {isRetrying ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            재시도 중...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1" />
                            다시 시도
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {showScrollToBottom && (
            <div className="fixed bottom-28 sm:bottom-32 right-3 sm:right-4 z-20">
              <Button
                onClick={scrollToBottomSmooth}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-700/90 hover:bg-gray-600/90 border border-gray-600/50 shadow-lg backdrop-blur-md transition-all duration-200"
                size="sm"
              >
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </Button>
            </div>
          )}

          {suggestedQuestions.length > 0 && !isLoading && (
            <div className="flex-shrink-0 px-2 sm:px-3 md:px-4 py-2 sm:py-3 bg-transparent">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestionClick(question)}
                      className="text-xs sm:text-sm bg-gray-700/80 border-gray-600 text-gray-200 hover:bg-gray-600 rounded-full px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 backdrop-blur-sm"
                      disabled={isLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-shrink-0 px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 bg-transparent fixed bottom-0 left-0 right-0 z-10 safe-area-inset-bottom">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={customHandleSubmit} className="relative">
                <div className="flex items-center bg-gray-700/90 backdrop-blur-md rounded-2xl sm:rounded-3xl px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-4 shadow-lg border border-gray-600/50">
                  <div className="flex items-center mr-2 sm:mr-3">
                    {pingCharacters.map((character) => (
                      <Button
                        key={character.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCharacterChange(character)}
                        className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
                          character.roomType === roomType
                            ? `${character.bgColor} ${character.borderColor} border text-white`
                            : "text-gray-400 hover:text-gray-200 hover:bg-gray-600/50"
                        }`}
                        disabled={isLoading}
                        title={character.name}
                      >
                        <span className="text-base sm:text-lg">{character.emoji}</span>
                      </Button>
                    ))}
                  </div>

                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    placeholder={
                      !isOnline ? "인터넷 연결을 확인해주세요" : isLoading ? "답변을 기다리는 중..." : "Ask anything"
                    }
                    className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder-gray-400 text-base min-w-0"
                    disabled={isLoading || !isOnline}
                    style={{
                      fontSize: "16px",
                    }}
                  />

                  <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-3 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-200 rounded-full"
                      disabled={isLoading}
                    >
                      <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>

                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim() || !isOnline}
                      className="bg-white hover:bg-gray-100 text-black rounded-full p-2 sm:p-2.5 shadow-md transition-all duration-200 flex-shrink-0"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <LoginPromptDialog
        isOpen={showLoginPrompt}
        onClose={handleCloseLoginPrompt}
        onLogin={handleLogin}
        message={loginPromptMessage}
      />
    </div>
  )
}
