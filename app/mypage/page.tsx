"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, LogOut, Eye, LinkIcon, RefreshCw, Bug } from "lucide-react"
import { getSupabase } from "@/lib/supabase-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import ManualDataLink from "@/components/manual-data-link"
import {
  getUserSajuProfiles,
  findAndLinkSessions,
  linkSessionToUser,
  debugCheckSessions,
} from "@/lib/saju-session-service"

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
  timeUnknown: boolean
  createdAt: string
  birthInfoId?: string
  saju: {
    yearStem: string
    yearBranch: string
    monthStem: string
    monthBranch: string
    dayStem: string
    dayBranch: string
    hourStem: string
    hourBranch: string
  }
}

export default function MyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [sajuProfiles, setSajuProfiles] = useState<SajuProfile[]>([])
  const [showDataLink, setShowDataLink] = useState(false)
  const [isLinking, setIsLinking] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [directLinkId, setDirectLinkId] = useState("")
  const supabase = getSupabase()

  // Load user data function
  const loadUserData = async () => {
    try {
      setIsLoading(true)

      // Check if user is authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData?.session) {
        router.push("/login?returnUrl=/mypage")
        return
      }

      // Get user info
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const userId = userData.user.id
        setAuthUserId(userId)
        setUserName(userData.user.user_metadata?.name || userData.user.email?.split("@")[0] || "사용자")
        setUserEmail(userData.user.email || "")

        // Debug check sessions directly
        await debugCheckSessions(userId)
      }

      // Get all saju profiles
      const { profiles } = await getUserSajuProfiles()
      setSajuProfiles(profiles)
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "데이터 로딩 오류",
        description: "사용자 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    loadUserData()
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

  // Force refresh profiles
  const handleForceRefresh = async () => {
    toast({
      title: "새로고침 중...",
      description: "프로필 데이터를 다시 불러오고 있습니다.",
    })
    await loadUserData()
  }

  // View profile details
  const handleViewDetails = (profile: SajuProfile) => {
    // Use the birthInfoId if available, otherwise fall back to the session ID
    const uuid = profile.birthInfoId || profile.id
    router.push(`/result?uuid=${uuid}`)
  }

  // Find and link all sessions
  const handleFindAndLinkSessions = async () => {
    try {
      setIsLinking(true)
      toast({
        title: "세션 연결 중...",
        description: "모든 관련 세션을 찾아 연결하고 있습니다.",
      })

      const { success, linkedCount } = await findAndLinkSessions()

      if (success) {
        toast({
          title: "세션 연결 완료",
          description: `${linkedCount}개의 세션이 성공적으로 연결되었습니다.`,
        })

        // Always reload data after linking attempt
        await loadUserData()
      } else {
        throw new Error("세션 연결에 실패했습니다.")
      }
    } catch (error) {
      console.error("Error finding and linking sessions:", error)
      toast({
        title: "세션 연결 오류",
        description: "세션을 연결하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLinking(false)
    }
  }

  // Debug function to check database directly
  const handleDebug = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        toast({
          title: "인증 오류",
          description: "로그인된 사용자를 찾을 수 없습니다.",
          variant: "destructive",
        })
        return
      }

      const authUserId = userData.user.id

      // Direct query to check all saju_sessions
      const { data: allSessions, error: allSessionsError } = await supabase.from("saju_sessions").select("*").limit(50)

      // Query to check sessions with this auth_user_id
      const { data: userSessions, error: userSessionsError } = await supabase
        .from("saju_sessions")
        .select("*")
        .eq("auth_user_id", authUserId)

      // Get the most recent session
      const { data: recentSession, error: recentSessionError } = await supabase
        .from("saju_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      // Check if the user's own ID exists as a session
      const { data: selfSession, error: selfSessionError } = await supabase
        .from("saju_sessions")
        .select("*")
        .eq("id", authUserId)
        .single()

      // Compile debug info
      const debugData = {
        authUserId,
        allSessionsCount: allSessions?.length || 0,
        userSessionsCount: userSessions?.length || 0,
        allSessionsError: allSessionsError?.message,
        userSessionsError: userSessionsError?.message,
        recentSession,
        recentSessionError: recentSessionError?.message,
        selfSession: selfSession || "Not found",
        selfSessionError: selfSessionError?.message,
        localStorage: {
          user_id: localStorage.getItem("user_id"),
          user_authenticated: localStorage.getItem("user_authenticated"),
          user_name: localStorage.getItem("user_name"),
          user_email: localStorage.getItem("user_email"),
        },
      }

      setDebugInfo(debugData)
      console.log("Debug info:", debugData)

      toast({
        title: "디버그 정보 수집 완료",
        description: "콘솔에서 디버그 정보를 확인하세요.",
      })
    } catch (error) {
      console.error("Debug error:", error)
      toast({
        title: "디버그 오류",
        description: "디버그 정보를 수집하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // Handle direct session linking
  const handleDirectLink = async () => {
    if (!directLinkId || directLinkId.trim() === "") {
      toast({
        title: "세션 ID 필요",
        description: "연결할 세션 ID를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "세션 연결 중...",
        description: `세션 ID ${directLinkId}를 연결하고 있습니다.`,
      })

      const success = await linkSessionToUser(directLinkId)

      if (success) {
        toast({
          title: "세션 연결 완료",
          description: `세션 ID ${directLinkId}가 성공적으로 연결되었습니다.`,
        })
        setDirectLinkId("")
        await loadUserData()
      } else {
        throw new Error("세션 연결에 실패했습니다.")
      }
    } catch (error) {
      console.error("Error linking session:", error)
      toast({
        title: "세션 연결 오류",
        description: "세션을 연결하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // Fix specific session
  const handleFixSession = async () => {
    try {
      // Get the most recent session ID from localStorage or debug info
      const sessionId =
        localStorage.getItem("user_id") || debugInfo?.recentSession?.id || "91c5a3de-3665-411b-852e-9a82204b0341" // Fallback to the ID from logs

      if (!sessionId) {
        toast({
          title: "세션 ID 없음",
          description: "수정할 세션 ID를 찾을 수 없습니다.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "세션 수정 중...",
        description: `세션 ID ${sessionId}를 수정하고 있습니다.`,
      })

      const success = await linkSessionToUser(sessionId)

      if (success) {
        toast({
          title: "세션 수정 완료",
          description: `세션 ID ${sessionId}가 성공적으로 수정되었습니다.`,
        })
        await loadUserData()
      } else {
        throw new Error("세션 수정에 실패했습니다.")
      }
    } catch (error) {
      console.error("Error fixing session:", error)
      toast({
        title: "세션 수정 오류",
        description: "세션을 수정하는 중 오류가 발생했습니다.",
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
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleDebug} title="디버그">
            <Bug className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleForceRefresh} title="새로고침">
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
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
              {authUserId && <p className="text-xs text-gray-400 mt-1">ID: {authUserId}</p>}
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      {debugInfo && (
        <Card className="mb-8 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-sm">디버그 정보</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-2">
              <div>
                <strong>Auth User ID:</strong> {debugInfo.authUserId}
              </div>
              <div>
                <strong>Total Sessions:</strong> {debugInfo.allSessionsCount}
              </div>
              <div>
                <strong>User Sessions:</strong> {debugInfo.userSessionsCount}
              </div>
              <div>
                <strong>LocalStorage User ID:</strong> {debugInfo.localStorage.user_id || "없음"}
              </div>
              {debugInfo.recentSession && (
                <div>
                  <strong>최근 세션:</strong> ID: {debugInfo.recentSession.id}, Auth User ID:{" "}
                  {debugInfo.recentSession.auth_user_id || "없음"}
                </div>
              )}
              <Button size="sm" onClick={handleFixSession} className="mt-2">
                최근 세션 연결 수정
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 데이터 연결 버튼 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" onClick={() => setShowDataLink(!showDataLink)} className="gap-2">
            <LinkIcon className="h-4 w-4" />
            {showDataLink ? "데이터 연결 숨기기" : "데이터 수동 연결"}
          </Button>

          <Button variant="outline" onClick={handleFindAndLinkSessions} disabled={isLinking} className="gap-2">
            {isLinking ? (
              <>
                <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full"></div>
                연결 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                모든 세션 자동 연결
              </>
            )}
          </Button>
        </div>

        {showDataLink && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">세션 ID로 직접 연결</CardTitle>
              <CardDescription>특정 세션 ID를 알고 있다면 직접 입력하여 연결할 수 있습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="세션 ID 입력"
                  value={directLinkId}
                  onChange={(e) => setDirectLinkId(e.target.value)}
                />
                <Button onClick={handleDirectLink}>연결</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showDataLink && (
          <ManualDataLink
            onSuccess={() => {
              setShowDataLink(false)
              loadUserData()
            }}
          />
        )}
      </div>

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="profiles" className="mb-8">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="profiles">내 사주 프로필</TabsTrigger>
        </TabsList>

        {/* 내 사주 프로필 탭 */}
        <TabsContent value="profiles">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sajuProfiles.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">내 사주 프로필</h2>
                <p className="text-sm text-gray-500">{sajuProfiles.length}개의 프로필</p>
              </div>
              <div className="grid gap-4">
                {sajuProfiles.map((profile) => (
                  <Card key={profile.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-medium leading-none flex items-center gap-2">
                          {profile.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {profile.saju.yearStem}
                          {profile.saju.yearBranch} {profile.saju.monthStem}
                          {profile.saju.monthBranch} {profile.saju.dayStem}
                          {profile.saju.dayBranch} {profile.saju.hourStem}
                          {profile.saju.hourBranch}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="font-normal">
                        {profile.gender === "male" ? "남성" : "여성"}
                      </Badge>
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(profile)}
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
                <p className="text-gray-500 dark:text-gray-400 mb-4">이 계정에 연결된 사주 프로필이 없습니다.</p>
                <div className="flex flex-col gap-4">
                  <Button onClick={() => router.push("/")}>새 사주 프로필 생성하기</Button>
                  <Button variant="outline" onClick={handleFindAndLinkSessions} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    기존 데이터 자동으로 찾기
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
