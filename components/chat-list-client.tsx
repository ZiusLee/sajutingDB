"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  MessageCircle,
  Calendar,
  Briefcase,
  Heart,
  Activity,
  TrendingUp,
  BellRing,
  Sparkles,
  Brain,
  Compass,
  Lightbulb,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

// 사용자의 사주에 맞는 맞춤 채팅방 제목 생성
function getPersonalizedRoomTitle(saju: any, gender: string): string {
  // 사주 데이터를 분석하여 맞춤 제목 생성
  // ��: 오행 분포, 일주, 성별 등을 고려

  // 간단한 예시: 오행 분포에 따라 다른 제목 반환
  if (saju?.elements) {
    const maxElement = Object.entries(saju.elements).reduce(
      (max, [element, count]) => (count > max.count ? { element, count } : max),
      { element: "", count: 0 },
    ).element

    switch (maxElement.element) {
      case "wood":
        return "자기 계발 맞춤 상담"
      case "fire":
        return "열정 찾기 맞춤 상담"
      case "earth":
        return "안정 찾기 맞춤 상담"
      case "metal":
        return "목표 달성 맞춤 상담"
      case "water":
        return "지혜 찾기 맞춤 상담"
      default:
        return "맞춤 상담"
    }
  }

  // 기본값
  return gender === "male" ? "남성 맞춤 상담" : "여성 맞춤 상담"
}

// 사용자의 사주에 맞는 맞춤 아이콘 생성
function getPersonalizedRoomIcon(dominantElement: string): React.ReactNode {
  switch (dominantElement) {
    case "wood":
      return <Lightbulb className="h-5 w-5" />
    case "fire":
      return <Sparkles className="h-5 w-5" />
    case "earth":
      return <Compass className="h-5 w-5" />
    case "metal":
      return <TrendingUp className="h-5 w-5" />
    case "water":
      return <Brain className="h-5 w-5" />
    default:
      return <MessageCircle className="h-5 w-5" />
  }
}

// 사용자의 사주에 맞는 맞춤 색상 생성
function getPersonalizedColor(dominantElement: string): string {
  switch (dominantElement) {
    case "wood":
      return "bg-green-600"
    case "fire":
      return "bg-red-500"
    case "earth":
      return "bg-yellow-600"
    case "metal":
      return "bg-gray-400"
    case "water":
      return "bg-blue-600"
    default:
      return "bg-primary"
  }
}

// 시간 포맷팅 함수
function formatTime(date: Date) {
  const now = new Date()
  const isToday =
    date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

  if (isToday) {
    return format(date, "HH:mm")
  } else {
    return format(date, "M월 d일", { locale: ko })
  }
}

// 오늘 날짜 포맷팅 함수
function formatTodayDate() {
  const today = new Date()
  return format(today, "M/d")
}

// 채팅방 데이터 타입 정의
interface ChatRoom {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  lastMessage: string
  time: Date
  unread: boolean
  color: string
}

// 사주 데이터 타입 정의
interface ChatData {
  saju: any
  name: string
  gender: string
  interpretation: string
  returnPath: string
}

// localStorage에서 채팅 데이터 불러오는 함수
const loadChatDataFromLocalStorage = (name: string, saju: any) => {
  try {
    const chatSessionsStr = localStorage.getItem("saju_chat_sessions")
    if (!chatSessionsStr) return {}

    const allChatSessions = JSON.parse(chatSessionsStr)

    // Create a unique identifier for this user
    const userIdentifier = `${name}_${saju.year}${saju.month}${saju.day}`

    // Filter chat sessions to only include those belonging to this user
    const userChatSessions = Object.entries(allChatSessions)
      .filter(([key]) => key.includes(`chat_${userIdentifier}`))
      .reduce((acc, [key, value]) => {
        // Extract room type from key (format: chat_useridentifier_roomtype)
        const parts = key.split("_")
        const roomType = parts[parts.length - 1]
        acc[roomType] = value
        return acc
      }, {})

    return userChatSessions
  } catch (error) {
    console.error("Error loading chat data from localStorage:", error)
    return {}
  }
}

export default function ChatListClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [chatData, setChatData] = useState<ChatData | null>(null)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [lockedRoomClicked, setLockedRoomClicked] = useState(false)

  // Get today's date in M/d format
  const todayDate = formatTodayDate()

  // 데이터 로딩 - 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    // 이미 데이터가 로드되었다면 다시 로드하지 않음
    if (chatData !== null) {
      return
    }

    try {
      setIsLoading(true)

      const sajuParam = searchParams.get("saju")
      const name = searchParams.get("name") || ""
      const gender = searchParams.get("gender") || ""
      const interpretation = searchParams.get("interpretation") || ""
      const returnPath = searchParams.get("returnPath") || "/"

      console.log("Received parameters:", { name, gender }) // Debug log

      if (!sajuParam) {
        setError("사주 정보가 없습니다.")
        setIsLoading(false)
        return
      }

      try {
        const saju = JSON.parse(sajuParam)
        const data = { saju, name, gender, interpretation, returnPath }

        // 상태 업데이트는 한 번에 처리
        setChatData(data)

        // 채팅방 데이터 생성
        const userName = name || "사용자"

        // 오행 정보 가져오기
        const elements = saju.elements || {}
        const dominantElement = Object.entries(elements).reduce(
          (max, [element, count]) => (count > max.count ? { element, count } : max),
          { element: "", count: 0 },
        ).element

        // localStorage에서 저장된 채팅 데이터 불러오기 - Updated to be user-specific
        const savedChatData = loadChatDataFromLocalStorage(name, saju)

        // 기본 채팅방 데이터
        const basicRooms: ChatRoom[] = [
          {
            id: "daily-fortune",
            title: "오늘의 운세",
            description: "오늘의 운세를 봅니다",
            icon: <Calendar className="h-5 w-5" />,
            lastMessage:
              savedChatData["daily-fortune"]?.messages?.length > 1
                ? savedChatData["daily-fortune"].messages[
                    savedChatData["daily-fortune"].messages.length - 1
                  ].content.substring(0, 30) + "..."
                : `오늘(${todayDate})의 운세를 보시겠습니까?`,
            time: savedChatData["daily-fortune"]?.lastMessageTime
              ? new Date(savedChatData["daily-fortune"].lastMessageTime)
              : new Date(Date.now() - 1000 * 60 * 15), // 15분 전
            unread: savedChatData["daily-fortune"]?.messages?.length > 0,
            color: "bg-blue-500",
          },
          {
            id: "love",
            title: "애정운",
            description: "연애, 인연, 만남에 관한 상담",
            icon: <Heart className="h-5 w-5" />,
            lastMessage:
              savedChatData.love?.messages?.length > 1
                ? savedChatData.love.messages[savedChatData.love.messages.length - 1].content.substring(0, 30) + "..."
                : "당신의 인연에 대해 알려드릴게요",
            time: savedChatData.love?.lastMessageTime
              ? new Date(savedChatData.love.lastMessageTime)
              : new Date(Date.now() - 1000 * 60 * 5), // 5분 전
            unread: savedChatData.love?.messages?.length > 0,
            color: "bg-pink-500",
          },
          {
            id: "career",
            title: "직업운",
            description: "직업, 취업, 이직, 승진 등에 관한 상담",
            icon: <Briefcase className="h-5 w-5" />,
            lastMessage:
              savedChatData.career?.messages?.length > 1
                ? savedChatData.career.messages[savedChatData.career.messages.length - 1].content.substring(0, 30) +
                  "..."
                : `${userName}님에게 맞는 직업을 알려드릴게요!`,
            time: savedChatData.career?.lastMessageTime
              ? new Date(savedChatData.career.lastMessageTime)
              : new Date(Date.now() - 1000 * 60 * 30), // 30분 전
            unread: savedChatData.career?.messages?.length > 0,
            color: "bg-indigo-500",
          },
          {
            id: "health",
            title: "건강운",
            description: "건강, 체질, 주의해야 할 질병에 관한 상담",
            icon: <Activity className="h-5 w-5" />,
            lastMessage:
              savedChatData.health?.messages?.length > 1
                ? savedChatData.health.messages[savedChatData.health.messages.length - 1].content.substring(0, 30) +
                  "..."
                : "건강 관리에 대한 조언을 드립니다",
            time: savedChatData.health?.lastMessageTime
              ? new Date(savedChatData.health.lastMessageTime)
              : new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
            unread: savedChatData.health?.messages?.length > 0,
            color: "bg-green-500",
          },
          {
            id: "compatibility",
            title: "속궁합 풀이",
            description: "상대방과의 속궁합을 알아보는 상담",
            icon: <Heart className="h-5 w-5" />,
            lastMessage: "곧 열릴 예정입니다! 기대해 주세요.",
            time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
            unread: false,
            color: "bg-gray-500", // 잠긴 방은 회색으로 표시
          },
          {
            id: "business",
            title: "사업운",
            description: "사업, 재테크, 투자에 관한 상담",
            icon: <TrendingUp className="h-5 w-5" />,
            lastMessage:
              savedChatData.business?.messages?.length > 1
                ? savedChatData.business.messages[savedChatData.business.messages.length - 1].content.substring(0, 30) +
                  "..."
                : "사업 성공의 비결을 알려드리겠습니다!",
            time: savedChatData.business?.lastMessageTime
              ? new Date(savedChatData.business.lastMessageTime)
              : new Date(Date.now() - 1000 * 60 * 60 * 3), // 3시간 전
            unread: savedChatData.business?.messages?.length > 0,
            color: "bg-emerald-500",
          },
          {
            id: "marriage",
            title: "결혼운",
            description: "결혼, 부부관계, 가정에 관한 상담",
            icon: <BellRing className="h-5 w-5" />,
            lastMessage:
              savedChatData.marriage?.messages?.length > 1
                ? savedChatData.marriage.messages[savedChatData.marriage.messages.length - 1].content.substring(0, 30) +
                  "..."
                : "결혼 생활의 행복을 위한 조언",
            time: savedChatData.marriage?.lastMessageTime
              ? new Date(savedChatData.marriage.lastMessageTime)
              : new Date(Date.now() - 1000 * 60 * 60 * 4), // 4시간 전
            unread: savedChatData.marriage?.messages?.length > 0,
            color: "bg-purple-500",
          },
          {
            id: "yearly",
            title: "올해운 상담",
            description: "2025년 을사년 운세에 관한 상담",
            icon: <Calendar className="h-5 w-5" />,
            lastMessage:
              savedChatData.yearly?.messages?.length > 1
                ? savedChatData.yearly.messages[savedChatData.yearly.messages.length - 1].content.substring(0, 30) +
                  "..."
                : "2025년 을사년 운세를 알려드립니다",
            time: savedChatData.yearly?.lastMessageTime
              ? new Date(savedChatData.yearly.lastMessageTime)
              : new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
            unread: savedChatData.yearly?.messages?.length > 0,
            color: "bg-amber-500",
          },
          {
            id: "general",
            title: "종합 운세 상담",
            description: "나의 사주팔자에 대해 자유롭게 대화하기",
            icon: <MessageCircle className="h-5 w-5" />,
            lastMessage:
              savedChatData.general?.messages?.length > 1
                ? savedChatData.general.messages[savedChatData.general.messages.length - 1].content.substring(0, 30) +
                  "..."
                : `${userName}님의 사주에 대해 무엇이든 물어보세요!`,
            time: savedChatData.general?.lastMessageTime ? new Date(savedChatData.general.lastMessageTime) : new Date(),
            unread: false,
            color: "bg-blue-500",
          },
        ]

        // 사용자의 사주에 맞는 맞춤 채팅방 추가
        const personalizedRoom: ChatRoom = {
          id: "personalized",
          title: "고민상담",
          description: "당신의 사주에 맞는 맞춤 상담",
          icon: getPersonalizedRoomIcon(dominantElement),
          lastMessage:
            savedChatData.personalized?.messages?.length > 1
              ? savedChatData.personalized.messages[savedChatData.personalized.messages.length - 1].content.substring(
                  0,
                  30,
                ) + "..."
              : `${userName}님만을 위한 맞춤 상담을 시작하세요`,
          time: savedChatData.personalized?.lastMessageTime
            ? new Date(savedChatData.personalized.lastMessageTime)
            : new Date(Date.now() - 1000 * 60 * 60 * 6), // 6시간 전
          unread: false,
          color: getPersonalizedColor(dominantElement),
        }

        // 맞춤 채팅방을 목록 맨 위에 추가 (중복 제거)
        setChatRooms([personalizedRoom, ...basicRooms])
      } catch (parseError) {
        console.error("Error parsing saju data:", parseError)
        setError("사주 데이터 형식이 올바르지 않습니다.")
      }
    } catch (error) {
      console.error("Error loading chat data:", error)
      setError("데이터를 불러오는 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, todayDate])

  // 채팅방 선택 핸들러
  const handleChatRoomSelect = (roomType: string) => {
    if (!chatData) return

    // 잠긴 방인 경우 클릭 카운트 증가 API 호출
    if (roomType === "compatibility") {
      if (!lockedRoomClicked) {
        // 중복 클릭 방지
        setLockedRoomClicked(true)

        // 클릭 카운트 증가 API 호출
        fetch("/api/feature-interest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ featureType: "compatibility" }),
        }).catch((error) => {
          console.error("Error logging feature interest:", error)
        })
      }
      return
    }

    // Create a session identifier for this specific user
    const sessionIdentifier = `${chatData.name}_${chatData.saju.year}${chatData.saju.month}${chatData.saju.day}_${chatData.gender}`

    // 채팅 페이지로 이동하면서 선택한 채팅방 유형 전달
    try {
      // Store the current saju data in localStorage
      localStorage.setItem(
        "current_saju",
        JSON.stringify({
          saju: chatData.saju,
          name: chatData.name,
          gender: chatData.gender,
          interpretation: chatData.interpretation,
          sessionId: sessionIdentifier,
        }),
      )

      // Navigate to the saju-chat page with just the roomType parameter
      router.push(`/saju-chat/${roomType}`)
    } catch (e) {
      console.error("Error during navigation:", e)
      setError(e instanceof Error ? e.message : "페이지 이동 중 오류가 발생했습니다.")
    }
  }

  // 뒤로가기 핸들러
  const handleBack = () => {
    // 사주 데이터가 있으면 결과 페이지로 이동
    if (chatData?.saju) {
      // 결과 페이지에 필요한 데이터를 쿼리 파라미터로 전달
      const sajuParam = encodeURIComponent(JSON.stringify(chatData.saju))
      const nameParam = chatData.name ? encodeURIComponent(chatData.name) : ""
      const genderParam = chatData.gender ? encodeURIComponent(chatData.gender) : ""

      // 결과 페이지로 이동
      router.push(`/result?saju=${sajuParam}&name=${nameParam}&gender=${genderParam}`)
    } else if (chatData?.returnPath) {
      // 기존 returnPath가 있으면 그 경로로 이동 (fallback)
      router.push(chatData.returnPath)
    } else {
      // 모든 데이터가 없는 경우 홈페이지로 이동 (최후의 fallback)
      router.push("/")
    }
  }

  // 로그인 페이지로 이동
  const goToLogin = () => {
    router.push("/login") // 로그인 페이지 경로에 맞게 수정
  }

  // 경고 무시하고 계속 진행
  const continueWithoutLogin = () => {
    setShowLoginDialog(false)
    if (chatData?.returnPath) {
      router.push(chatData.returnPath)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-medium">사주 채팅</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {chatData?.name || "사용자"}님 {chatData?.saju?.dayStem || ""}
          {chatData?.saju?.dayBranch || ""} 일주 {chatData?.gender === "male" ? "남성" : "여성"}
        </div>
      </div>

      {/* 채팅방 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1 text-red-500">{error}</div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {chatRooms.map((room) => (
            <div
              key={room.id}
              className={`flex items-center p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                room.id === "compatibility" ? "opacity-80" : ""
              }`}
              onClick={() => handleChatRoomSelect(room.id)}
            >
              <Avatar className="h-12 w-12 mr-3">
                <AvatarFallback className={`${room.color} text-white`}>{room.icon}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium truncate">
                    {room.title}
                    {room.id === "compatibility" && (
                      <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">{formatTime(room.time)}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {room.id === "compatibility" ? (
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      {room.lastMessage}
                    </span>
                  ) : (
                    room.lastMessage
                  )}
                </p>
              </div>

              {room.unread && (
                <div className="ml-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                  N
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 로그인 경고 다이얼로그 */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데이터 저장 안내</DialogTitle>
            <DialogDescription>
              이 페이지를 나가면 지금까지의 사주 데이터가 저장되지 않을 수 있습니다. 데이터를 안전하게 저장하려면
              로그인이 필요합니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={continueWithoutLogin}>
              계속 진행하기
            </Button>
            <Button onClick={goToLogin}>로그인하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
