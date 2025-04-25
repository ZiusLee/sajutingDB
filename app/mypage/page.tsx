"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, LogOut, Star, Eye, Link } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getAllUserProfiles, getChatHistory, setDefaultUserProfile } from "@/lib/user-data-transfer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import ManualDataLink from "@/components/manual-data-link"

// 채팅 내역 타입 정의
interface ChatSession {
  id: string
  roomType: string
  lastMessage: string
  lastMessageTime: string
  messages: any[]
  saju: any
  name: string
  gender: string
}

// 사주 정보 타입 정의
interface UserProfile {
  id: string
  name: string
  gender: string
  birthYear: string
  birthMonth: string
  birthDay: string
  birthHour: string
  birthMinute: string
  lunarYear: string
  lunarMonth: string
  lunarDay: string
  timeUnknown: boolean
  isDefault: boolean
  createdAt: string
  saju: any
}

export default function MyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("profiles")
  const [showDataLink, setShowDataLink] = useState(false)
  // Replace the existing supabase client with the server component client
  const supabase = createClientComponentClient()

  // 로그인 상태 확인 및 데이터 로드
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase session first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("세션 확인 오류:", sessionError)
          throw sessionError // 세션 확인 실패 시 오류 발생
        }

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
        setIsLoading(true)
        // Get the current user ID
        const userId = localStorage.getItem("user_id")
        const authId = localStorage.getItem("supabase.auth.token")

        console.log("Loading user data with user ID:", userId)
        console.log("Auth ID from localStorage:", authId)

        // Try to load profiles with both IDs to ensure we get all data
        let profiles = await getAllUserProfiles()

        // If no profiles found, try to fetch directly from Supabase
        if (profiles.length === 0) {
          console.log("No profiles found in localStorage, fetching from Supabase...")

          // Fetch profiles directly from Supabase
          const supabase = createClientComponentClient()
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session && session.user) {
            console.log("Fetching profiles for auth user:", session.user.id)

            // First try to find users with matching auth_user_id
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select(`
                *,
                birth_info(*),
                saju_info(*)
              `)
              .eq("auth_user_id", session.user.id)

            if (userError) {
              console.error("Error fetching user data from Supabase:", userError)
              throw userError
            }

            if (userData && userData.length > 0) {
              console.log(`Found ${userData.length} users with matching auth_user_id`)

              // Convert Supabase data to profile format
              profiles = userData.map((user) => {
                const birthInfo = user.birth_info?.[0] || {}
                const sajuInfo = user.saju_info?.[0] || {}

                return {
                  id: user.id,
                  name: user.name || "Unknown",
                  gender: user.gender || "unknown",
                  birthYear: birthInfo.solar_year?.toString() || "",
                  birthMonth: birthInfo.solar_month?.toString().padStart(2, "0") || "",
                  birthDay: birthInfo.solar_day?.toString().padStart(2, "0") || "",
                  birthHour: birthInfo.solar_hour?.toString().padStart(2, "0") || "00",
                  birthMinute: birthInfo.solar_minute?.toString().padStart(2, "0") || "00",
                  lunarYear: birthInfo.lunar_year?.toString() || "",
                  lunarMonth: birthInfo.lunar_month?.toString().padStart(2, "0") || "",
                  lunarDay: birthInfo.lunar_day?.toString().padStart(2, "0") || "",
                  timeUnknown: birthInfo.time_unknown || false,
                  isDefault: user.is_default || false,
                  createdAt: user.created_at || new Date().toISOString(),
                  saju: {
                    yearStem: sajuInfo.year_stem || "",
                    yearBranch: sajuInfo.year_branch || "",
                    monthStem: sajuInfo.month_stem || "",
                    monthBranch: sajuInfo.month_branch || "",
                    dayStem: sajuInfo.day_stem || "",
                    dayBranch: sajuInfo.day_branch || "",
                    hourStem: sajuInfo.hour_stem || "",
                    hourBranch: sajuInfo.hour_branch || "",
                    year: birthInfo.solar_year || "",
                    month: birthInfo.solar_month || "",
                    day: birthInfo.solar_day || "",
                    hour: birthInfo.solar_hour || "",
                    minute: birthInfo.solar_minute || "",
                    lunarYear: birthInfo.lunar_year || "",
                    lunarMonth: birthInfo.lunar_month || "",
                    lunarDay: birthInfo.lunar_day || "",
                  },
                }
              })

              // Set the first profile as default if none is marked
              if (profiles.length > 0) {
                profiles[0].isDefault = true
              }
            }
          }
        }

        setUserProfiles(profiles)
        console.log("Loaded profiles:", profiles)

        // Set default profile
        const defaultProfile = profiles.find((p) => p.isDefault) || profiles[0]
        if (defaultProfile) {
          setSelectedProfile(defaultProfile)
        }

        // Show data link component if no profiles found
        if (profiles.length === 0) {
          setShowDataLink(true)
        }

        // Load chat history
        const sessions = await getChatHistory()
        setChatSessions(sessions)
      } catch (error) {
        console.error("Error loading user data:", error)
        toast({
          title: "데이터 로딩 오류",
          description: `사용자 데이터를 불러오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
          variant: "destructive",
        })
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
  }, [router, supabase, toast])

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
        return "사주 상담"
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
  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfile(profile)
  }

  // 기본 프로필로 설정
  const handleSetDefaultProfile = async (profile: UserProfile) => {
    try {
      const success = await setDefaultUserProfile(profile.id)
      if (success) {
        // 프로필 목록 업데이트
        const updatedProfiles = userProfiles.map((p) => ({
          ...p,
          isDefault: p.id === profile.id,
        }))
        setUserProfiles(updatedProfiles)
        toast({
          title: "기본 프로필 설정 완료",
          description: `${profile.name}님의 사주가 기본 프로필로 설정되었습니다.`,
        })
      } else {
        toast({
          title: "기본 프로필 설정 실패",
          description: "프로필 설정 중 오류가 발생했습니다. 다시 시도해주세요.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting default profile:", error)
      toast({
        title: "기본 프로필 설정 실패",
        description: "프로필 설정 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    }
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

      {/* 데이터 연결 컴포넌트 */}
      {showDataLink && (
        <div className="mb-8">
          <Button variant="outline" onClick={() => setShowDataLink(!showDataLink)} className="mb-4 gap-2">
            <Link className="h-4 w-4" />
            {showDataLink ? "데이터 연결 숨기기" : "데이터 수동 연결"}
          </Button>
          {showDataLink && <ManualDataLink />}
        </div>
      )}

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="profiles">내 사주 프로필</TabsTrigger>
        </TabsList>

        {/* 내 사주 프로필 탭 */}
        <TabsContent value="profiles">
          {isLoading ? (
            <div className="flex items-center justify-center">Loading...</div>
          ) : userProfiles.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">내 사주 프로필</h2>
              </div>
              <div className="grid gap-4">
                {userProfiles
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // 최신순 정렬
                  .map((profile) => (
                    <Card key={profile.id} className="overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium leading-none">{profile.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            {profile.gender === "male" ? "남성" : "여성"}
                          </Badge>
                          {profile.isDefault && (
                            <Badge variant="secondary" className="font-normal">
                              기본 프로필
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {profile.birthYear}년 {profile.birthMonth}월 {profile.birthDay}일
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {profile.timeUnknown ? "시간 미상" : `${profile.birthHour}:${profile.birthMinute}`}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            생성일: {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
                          </div>
                        </div>
                      </CardContent>
                      <CardContent>
                        <div className="flex justify-end space-x-2">
                          {!profile.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSetDefaultProfile(profile)}
                              className="gap-1"
                            >
                              <Star className="h-4 w-4" />
                              기본 프로필로 설정
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/result?uuid=${profile.id}`)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            상세 보기
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">저장된 사주 프로필이 없습니다.</p>
                <div className="flex flex-col gap-4">
                  <Button onClick={() => router.push("/")}>사주 프로필 생성하기</Button>
                  <Button variant="outline" onClick={() => setShowDataLink(true)} className="gap-2">
                    <Link className="h-4 w-4" />
                    기존 데이터 연결하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
