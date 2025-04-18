"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Clock, LogOut } from "lucide-react"
import SajuDiagram from "@/components/saju-diagram"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getSajuProfiles, getChatHistory } from "@/lib/user-data-transfer"

// 채팅 내역 타입 정의
interface ChatSession {
  roomType: string
  lastMessage: string
  lastMessageTime: string
  messages: any[]
  saju: any
  name: string
}

// 사주 정보 타입 정의
interface SajuProfile {
  id: string
  name: string
  gender: string
  birthYear: string
  birthMonth: string
  birthDay: string
  birthHour: string
  birthMinute: string
  saju: any
  createdAt: string
}

export default function MyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [sajuProfiles, setSajuProfiles] = useState<SajuProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<SajuProfile | null>(null)
  const supabase = createClientComponentClient()

  // 로그인 상태 확인 및 데이터 로드
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase session first
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          setIsAuthenticated(true)

          // Get user data
          const { data: userData } = await supabase.auth.getUser()
          if (userData?.user) {
            // Get user name from localStorage or user metadata
            const name =
              localStorage.getItem("user_name") ||
              userData.user.user_metadata?.name ||
              userData.user.email?.split("@")[0] ||
              "사용자"

            const email = userData.user.email || ""

            setUserName(name)
            setUserEmail(email)

            // Ensure localStorage is updated
            localStorage.setItem("user_authenticated", "true")
            localStorage.setItem("user_id", userData.user.id)
            if (!localStorage.getItem("user_name")) {
              localStorage.setItem("user_name", name)
            }
            if (!localStorage.getItem("user_email") && email) {
              localStorage.setItem("user_email", email)
            }

            return true
          }
        } else {
          // Fallback to localStorage check
          const isAuth = localStorage.getItem("user_authenticated") === "true"
          setIsAuthenticated(isAuth)

          if (isAuth) {
            // User info from localStorage
            const name = localStorage.getItem("user_name") || "사용자"
            const email = localStorage.getItem("user_email") || ""
            setUserName(name)
            setUserEmail(email)
            return true
          }
        }

        // Not authenticated
        setIsAuthenticated(false)
        router.push("/login?returnUrl=/mypage")
        return false
      } catch (error) {
        console.error("Authentication check error:", error)
        setIsAuthenticated(false)
        router.push("/login?returnUrl=/mypage")
        return false
      }
    }

    const loadUserData = async () => {
      try {
        // Load saju profiles using the utility function
        const profiles = await getSajuProfiles()
        setSajuProfiles(profiles)

        // Set the first profile as selected if available
        if (profiles && profiles.length > 0) {
          setSelectedProfile(profiles[0])
        }

        // Load chat history using the utility function
        const sessions = await getChatHistory()
        setChatSessions(sessions)
      } catch (error) {
        console.error("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const init = async () => {
      const authResult = await checkAuth()
      if (authResult) {
        await loadUserData()
      }
    }

    init()
  }, [router, supabase])

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()

      // Clear localStorage
      localStorage.removeItem("user_token")
      localStorage.removeItem("user_authenticated")
      localStorage.removeItem("user_id")
      localStorage.removeItem("user_name")
      localStorage.removeItem("user_email")

      router.push("/")
    } catch (error) {
      console.error("로그아웃 오류:", error)
    }
  }

  // 채팅방 유형별 한글 이름
  const getRoomTypeName = (roomType: string): string => {
    switch (roomType) {
      case "career":
        return "직업운 상담"
      case "love":
        return "애정운 상담"
      case "health":
        return "건강운 상담"
      case "yearly":
        return "올해운 상담"
      case "business":
        return "사업운 상담"
      case "marriage":
        return "결혼운 상담"
      case "personalized":
        return "맞춤 상담"
      case "general":
        return "일반 상담"
      default:
        return "사주 상담"
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch (e) {
      return "날짜 정보 없음"
    }
  }

  // 프로필 선택 처리
  const handleProfileSelect = (profile: SajuProfile) => {
    setSelectedProfile(profile)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 pb-20">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">마이페이지</h1>
      </div>

      {/* 사용자 프로필 카드 */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="text-gray-500 dark:text-gray-400">{userEmail}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 사주 프로필 선택 및 표시 */}
      {sajuProfiles.length > 0 ? (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">내 사주 프로필</h2>
            {sajuProfiles.length > 1 && (
              <div className="flex gap-2">
                {sajuProfiles.map((profile, index) => (
                  <Button
                    key={index}
                    variant={selectedProfile?.id === profile.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleProfileSelect(profile)}
                  >
                    {profile.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {selectedProfile && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{selectedProfile.name}님의 사주</CardTitle>
                  <Badge variant="outline" className="font-normal">
                    {selectedProfile.gender === "male" ? "남성" : "여성"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {selectedProfile.birthYear}년 {selectedProfile.birthMonth}월 {selectedProfile.birthDay}일
                  {selectedProfile.birthHour && (
                    <>
                      <Clock className="h-3 w-3 ml-2" />
                      {selectedProfile.birthHour}시 {selectedProfile.birthMinute || "00"}분
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-4">
                  {selectedProfile.saju && <SajuDiagram saju={selectedProfile.saju} size="lg" />}
                </div>

                <Separator className="my-4" />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/chat-list?saju=${encodeURIComponent(JSON.stringify(selectedProfile.saju))}&name=${encodeURIComponent(selectedProfile.name)}&gender=${selectedProfile.gender}`,
                      )
                    }
                  >
                    상담 시작하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">저장된 사주 프로필이 없습니다.</p>
            <Button onClick={() => router.push("/")}>사주 프로필 생성하기</Button>
          </CardContent>
        </Card>
      )}

      {/* 채팅 내역 */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">최근 상담 내역</h2>
        <div className="grid gap-4">
          {chatSessions.length > 0 ? (
            chatSessions.slice(0, 3).map((session, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="font-normal">
                      {getRoomTypeName(session.roomType)}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(session.lastMessageTime)}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2">{session.name}님의 상담</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{session.lastMessage}</p>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/chat?saju=${encodeURIComponent(JSON.stringify(session.saju))}&name=${encodeURIComponent(session.name)}&roomType=${session.roomType}`}
                    >
                      <Button size="sm">상담 계속하기</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">아직 채팅 내역이 없습니다.</p>
                <Button onClick={() => router.push("/chat-list")}>상담 시작하기</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {chatSessions.length > 3 && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => router.push("/chat-list")}>
              모든 상담 내역 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
