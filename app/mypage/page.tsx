"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, LogOut, Eye, LinkIcon, RefreshCw, Bug, Star, StarOff } from "lucide-react"
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
  setDefaultSajuSession,
  getDefaultSajuSession,
  getSajuProfileBySessionId,
} from "@/lib/saju-session-service"
import DaeunDiagram from "@/components/daeun-diagram"
import type { Saju } from "@/lib/saju"

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
  lunarYear?: string
  lunarMonth?: string
  lunarDay?: string
  isDefault?: boolean
  saju: {
    yearStem: string
    yearBranch: string
    monthStem: string
    monthBranch: string
    dayStem: string
    dayBranch: string
    hourStem: string
    hourBranch: string
    yearStemSibseong?: string
    monthStemSibseong?: string
    dayStemSibseong?: string
    hourStemSibseong?: string
    yearBranchSibseong?: string
    monthBranchSibseong?: string
    dayBranchSibseong?: string
    hourBranchSibseong?: string
    yearStemHanja?: string
    yearBranchHanja?: string
    monthStemHanja?: string
    monthBranchHanja?: string
    dayStemHanja?: string
    dayBranchHanja?: string
    hourStemHanja?: string
    hourBranchHanja?: string
    elements?: {
      wood: number
      fire: number
      earth: number
      metal: number
      water: number
    }
    dayMaster?: string
    dayMasterHanja?: string
    daeunAge?: number
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
  const [defaultProfile, setDefaultProfile] = useState<SajuProfile | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const supabase = getSupabase()

  // Load user data function - useCallback으로 감싸서 안정적인 참조 유지
  const loadUserData = useCallback(async () => {
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

      // Get default profile
      if (userData.user?.id) {
        const defaultSession = await getDefaultSajuSession(userData.user.id)
        if (defaultSession) {
          const defaultProfileData = await getSajuProfileBySessionId(defaultSession.id)
          if (defaultProfileData) {
            setDefaultProfile(defaultProfileData)
          }
        } else if (profiles.length > 0) {
          // If no default is set but profiles exist, use the first one
          setDefaultProfile(profiles[0])
        }
      }
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
  }, [router, supabase]) // 의존성 배열에서 authUserId 제거

  // 대운세수 업데이트 이벤트 처리 함수
  const handleDaeunAgeUpdate = useCallback(
    async (event: CustomEvent) => {
      const { sajuId, daeunAge } = event.detail || {}
      console.log(`Received daeunAgeUpdated event: sajuId=${sajuId}, daeunAge=${daeunAge}`)

      // 프로필 데이터 다시 로드
      await loadUserData()

      toast({
        title: "대운세수 업데이트",
        description: "대운세수가 성공적으로 업데이트되었습니다.",
      })
    },
    [loadUserData, toast],
  )

  // Load data on mount and set up event listener
  useEffect(() => {
    loadUserData()

    // 대운세수 업데이트 이벤트 리스너 추가 (한 번만)
    window.addEventListener("daeunAgeUpdated", handleDaeunAgeUpdate as EventListener)

    return () => {
      window.removeEventListener("daeunAgeUpdated", handleDaeunAgeUpdate as EventListener)
    }
  }, [loadUserData, handleDaeunAgeUpdate]) // 의존성 배열에 안정적인 함수 참조만 포함

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

  // View profile details - 이미 로드된 데이터를 사용하여 상세 페이지로 이동
  const handleViewDetails = (profile: SajuProfile) => {
    // 이미 로드된 데이터를 URL 파라미터로 인코딩하여 전달
    const sajuData = {
      // 사주 정보
      yearStem: profile.saju.yearStem,
      yearBranch: profile.saju.yearBranch,
      monthStem: profile.saju.monthStem,
      monthBranch: profile.saju.monthBranch,
      dayStem: profile.saju.dayStem,
      dayBranch: profile.saju.dayBranch,
      hourStem: profile.saju.hourStem,
      hourBranch: profile.saju.hourBranch,

      // 십성 정보
      yearStemSibseong: profile.saju.yearStemSibseong || "",
      monthStemSibseong: profile.saju.monthStemSibseong || "",
      dayStemSibseong: profile.saju.dayStemSibseong || "",
      hourStemSibseong: profile.saju.hourStemSibseong || "",
      yearBranchSibseong: profile.saju.yearBranchSibseong || "",
      monthBranchSibseong: profile.saju.monthBranchSibseong || "",
      dayBranchSibseong: profile.saju.dayBranchSibseong || "",
      hourBranchSibseong: profile.saju.hourBranchSibseong || "",

      // 한자 정보
      yearStemHanja: profile.saju.yearStemHanja || "",
      yearBranchHanja: profile.saju.yearBranchHanja || "",
      monthStemHanja: profile.saju.monthStemHanja || "",
      monthBranchHanja: profile.saju.monthBranchHanja || "",
      dayStemHanja: profile.saju.dayStemHanja || "",
      dayBranchHanja: profile.saju.dayBranchHanja || "",
      hourStemHanja: profile.saju.hourStemHanja || "",
      hourBranchHanja: profile.saju.hourBranchHanja || "",

      // 오행 정보
      elements: profile.saju.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },

      // 일주 정보
      dayMaster: profile.saju.dayMaster || profile.saju.dayStem,
      dayMasterHanja: profile.saju.dayMasterHanja || "",

      // 대운세수 정보 - 로컬 스토리지에서 최신 값 확인
      daeunAge: (() => {
        try {
          // 로컬 스토리지에서 최신 대운세수 확인
          const savedDaeunAge = localStorage.getItem(`daeun_age_${profile.id}`)
          if (savedDaeunAge) {
            const parsedAge = Number.parseInt(savedDaeunAge, 10)
            if (!isNaN(parsedAge) && parsedAge > 0) {
              console.log("Using saved daeun age for result page:", parsedAge)
              return parsedAge
            }
          }
        } catch (e) {
          console.error("Error reading daeun age from localStorage:", e)
        }
        // 저장된 값이 없으면 프로필의 대운세수 사용
        return profile.saju.daeunAge
      })(),

      // 양력 정보
      year: profile.birthYear,
      month: profile.birthMonth,
      day: profile.birthDay,
      hour: profile.birthHour,
      minute: profile.birthMinute,

      // 음력 정보 (있을 경우에만)
      lunarYear: profile.lunarYear || profile.birthYear, // 음력 정보가 없으면 양력 정보로 대체
      lunarMonth: profile.lunarMonth || profile.birthMonth,
      lunarDay: profile.lunarDay || profile.birthDay,

      // 시간 미상 여부
      timeUnknown: profile.timeUnknown,

      // 프로필 ID 추가 (결과 페이지에서 대운세수 업데이트 시 필요)
      profileId: profile.id,
    }

    // URL 파라미터로 데이터 전달
    const encodedSaju = encodeURIComponent(JSON.stringify(sajuData))
    router.push(`/result?saju=${encodedSaju}&name=${encodeURIComponent(profile.name)}&gender=${profile.gender}`)
  }

  // Navigate to result page when clicking on a profile card
  const handleProfileClick = (profile: SajuProfile) => {
    handleViewDetails(profile)
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

  // 대표 사주 설정
  const handleSetDefaultProfile = async (profile: SajuProfile) => {
    if (!authUserId) return

    try {
      toast({
        title: "대표 사주 설정 중...",
        description: "대표 사주를 설정하고 있습니다.",
      })

      const success = await setDefaultSajuSession(authUserId, profile.id)

      if (success) {
        // Update local state
        setSajuProfiles((prev) =>
          prev.map((p) => ({
            ...p,
            isDefault: p.id === profile.id,
          })),
        )
        setDefaultProfile(profile)

        toast({
          title: "대표 사주 설정 완료",
          description: `${profile.name}님의 사주가 대표 사주로 설정되었습니다.`,
        })
      } else {
        throw new Error("대표 사주 설정에 실패했습니다.")
      }
    } catch (error) {
      console.error("Error setting default profile:", error)
      toast({
        title: "대표 사주 설정 오류",
        description: "대표 사주를 설정하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 연도 선택 핸들러
  const handleYearSelect = (year: number) => {
    setSelectedYear(year)
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

      {/* 대표 사주 운세 정보 */}
      {defaultProfile && (
        <Card className="mb-8 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>대표 사주 운세 정보</span>
            </CardTitle>
            <CardDescription>
              {defaultProfile.name}님의 {defaultProfile.birthYear}년 {defaultProfile.birthMonth}월{" "}
              {defaultProfile.birthDay}일 사주
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 대운 다이어그램 */}
              <DaeunDiagram
                saju={defaultProfile.saju as Saju}
                gender={defaultProfile.gender}
                solarYear={defaultProfile.birthYear}
                solarMonth={defaultProfile.birthMonth}
                solarDay={defaultProfile.birthDay}
                hour={defaultProfile.birthHour}
                minute={defaultProfile.birthMinute}
                timeUnknown={defaultProfile.timeUnknown}
                sajuId={defaultProfile.id}
              />

              <div className="flex justify-center mt-4">
                <Button onClick={() => handleViewDetails(defaultProfile)} className="gap-2">
                  <Eye className="h-4 w-4" />
                  상세 운세 보기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <Card
                    key={profile.id}
                    className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
                      profile.isDefault ? "border-primary/50 bg-primary/5" : ""
                    }`}
                    onClick={() => handleProfileClick(profile)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-sm font-medium leading-none flex items-center gap-2">
                          {profile.name}
                          {profile.isDefault && <Star className="h-4 w-4 text-yellow-500" />}
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
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetails(profile)
                          }}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          상세 보기
                        </Button>
                        <Button
                          variant={profile.isDefault ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefaultProfile(profile)
                          }}
                          className="gap-1"
                        >
                          {profile.isDefault ? (
                            <>
                              <Star className="h-4 w-4" />
                              대표 사주
                            </>
                          ) : (
                            <>
                              <StarOff className="h-4 w-4" />
                              대표로 설정
                            </>
                          )}
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
