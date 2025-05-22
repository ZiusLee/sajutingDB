"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Grid3X3, MessageCircle, Calendar, BookmarkIcon, UserIcon, LogOut, Settings } from "lucide-react"
import { getUserSajuProfiles } from "@/lib/saju-session-service"
import { BottomNavBar } from "@/components/bottom-nav-bar"
import { ElementDisplay } from "@/components/element-display"
import { calculateElementsFromSaju } from "@/lib/element-utils"
import { getDefaultSajuSession, getSajuProfileBySessionId } from "@/lib/saju-session-service"

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
  }
}

export default function MyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [sajuProfiles, setSajuProfiles] = useState<SajuProfile[]>([])
  const [activeTab, setActiveTab] = useState("posts")
  const supabase = createClientComponentClient()
  const [defaultProfile, setDefaultProfile] = useState<SajuProfile | null>(null)
  const [elements, setElements] = useState<Record<string, number>>({
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  })

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
      }

      // Get all saju profiles
      const { profiles } = await getUserSajuProfiles()
      setSajuProfiles(profiles)

      // 메인 사주 프로필 가져오기
      if (userData.user) {
        const userId = userData.user.id
        try {
          const defaultSession = await getDefaultSajuSession(userId)
          if (defaultSession) {
            const profile = await getSajuProfileBySessionId(defaultSession.id)
            if (profile) {
              setDefaultProfile(profile)

              // 오행 계산
              const calculatedElements = calculateElementsFromSaju(
                profile.saju.yearStem,
                profile.saju.yearBranch,
                profile.saju.monthStem,
                profile.saju.monthBranch,
                profile.saju.dayStem,
                profile.saju.dayBranch,
                profile.saju.hourStem,
                profile.saju.hourBranch,
              )

              setElements(calculatedElements)
            }
          }
        } catch (error) {
          console.error("Error loading default profile:", error)
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
  }

  // Load data on mount
  useEffect(() => {
    loadUserData()
  }, [router, supabase])

  // View profile details
  const handleViewDetails = (profile: SajuProfile) => {
    const sajuData = {
      yearStem: profile.saju.yearStem,
      yearBranch: profile.saju.yearBranch,
      monthStem: profile.saju.monthStem,
      monthBranch: profile.saju.monthBranch,
      dayStem: profile.saju.dayStem,
      dayBranch: profile.saju.dayBranch,
      hourStem: profile.saju.hourStem,
      hourBranch: profile.saju.hourBranch,
      yearStemSibseong: profile.saju.yearStemSibseong || "",
      monthStemSibseong: profile.saju.monthStemSibseong || "",
      dayStemSibseong: profile.saju.dayStemSibseong || "",
      hourStemSibseong: profile.saju.hourStemSibseong || "",
      yearBranchSibseong: profile.saju.yearBranchSibseong || "",
      monthBranchSibseong: profile.saju.monthBranchSibseong || "",
      dayBranchSibseong: profile.saju.dayBranchSibseong || "",
      hourBranchSibseong: profile.saju.hourBranchSibseong || "",
      yearStemHanja: profile.saju.yearStemHanja || "",
      yearBranchHanja: profile.saju.yearBranchHanja || "",
      monthStemHanja: profile.saju.monthStemHanja || "",
      monthBranchHanja: profile.saju.monthBranchHanja || "",
      dayStemHanja: profile.saju.dayStemHanja || "",
      dayBranchHanja: profile.saju.dayBranchHanja || "",
      hourStemHanja: profile.saju.hourStemHanja || "",
      hourBranchHanja: profile.saju.hourBranchHanja || "",
      elements: profile.saju.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
      dayMaster: profile.saju.dayMaster || profile.saju.dayStem,
      dayMasterHanja: profile.saju.dayMasterHanja || "",
      year: profile.birthYear,
      month: profile.birthMonth,
      day: profile.birthDay,
      hour: profile.birthHour,
      minute: profile.birthMinute,
      lunarYear: profile.lunarYear || profile.birthYear,
      lunarMonth: profile.lunarMonth || profile.birthMonth,
      lunarDay: profile.lunarDay || profile.birthDay,
      timeUnknown: profile.timeUnknown,
    }

    const encodedSaju = encodeURIComponent(JSON.stringify(sajuData))
    router.push(`/result?saju=${encodedSaju}&name=${encodeURIComponent(profile.name)}&gender=${profile.gender}`)
  }

  // Navigate to chat with AI
  const handleChatWithAI = () => {
    // 메인 사주가 있으면 메인 사주 사용, 없으면 첫 번째 사주 사용
    const profileToUse = defaultProfile || (sajuProfiles.length > 0 ? sajuProfiles[0] : null)

    if (profileToUse) {
      // 사주 데이터 준비
      const sajuData = {
        yearStem: profileToUse.saju.yearStem,
        yearBranch: profileToUse.saju.yearBranch,
        monthStem: profileToUse.saju.monthStem,
        monthBranch: profileToUse.saju.monthBranch,
        dayStem: profileToUse.saju.dayStem,
        dayBranch: profileToUse.saju.dayBranch,
        hourStem: profileToUse.saju.hourStem,
        hourBranch: profileToUse.saju.hourBranch,
        elements: profileToUse.saju.elements || elements,
        year: profileToUse.birthYear,
        month: profileToUse.birthMonth,
        day: profileToUse.birthDay,
        hour: profileToUse.birthHour,
        minute: profileToUse.birthMinute,
        timeUnknown: profileToUse.timeUnknown,
      }

      // 사주 데이터를 URL 파라미터로 인코딩
      const encodedSaju = encodeURIComponent(JSON.stringify(sajuData))

      // 채팅 리스트 페이지로 이동
      router.push(
        `/chat-list?saju=${encodedSaju}&name=${encodeURIComponent(profileToUse.name)}&gender=${
          profileToUse.gender
        }&returnPath=/mypage`,
      )
    } else {
      toast({
        title: "사주 정보 필요",
        description: "AI와 상담하기 위해서는 먼저 사주 정보가 필요합니다.",
        variant: "destructive",
      })
      router.push("/")
    }
  }

  // Navigate to edit saju page
  const handleEditSaju = () => {
    router.push("/edit-saju")
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "로그아웃 성공",
        description: "성공적으로 로그아웃되었습니다.",
      })
      router.push("/")
    } catch (error) {
      console.error("로그아웃 오류:", error)
      toast({
        title: "로그아웃 오류",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto pb-20">
      {/* 상단 로그아웃 버튼 */}
      <div className="flex justify-end pt-4 px-4">
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>

      {/* 프로필 헤더 섹션 */}
      <div className="px-4 pt-2 pb-4 border-b">
        <div className="flex items-start">
          {/* 프로필 이미지 */}
          <Avatar className="h-20 w-20 mr-5">
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* 프로필 정보 */}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{userName}</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>

            {/* 오행 표시 */}
            <div className="mt-3 mb-2">
              {defaultProfile ? (
                <>
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-medium mr-2">메인 사주 오행</span>
                    <span className="text-xs text-muted-foreground">({defaultProfile.name})</span>
                  </div>
                  <ElementDisplay elements={elements} maxSlots={12} />
                </>
              ) : (
                <div className="text-xs text-muted-foreground">메인 사주를 설정하면 오행 정보가 표시됩니다.</div>
              )}
            </div>

            {/* 통계 정보 */}
            <div className="flex mt-3 space-x-4">
              <div className="text-center">
                <div className="font-bold">{sajuProfiles.length}</div>
                <div className="text-xs text-muted-foreground">사주</div>
              </div>
              <div className="text-center">
                <div className="font-bold">0</div>
                <div className="text-xs text-muted-foreground">상담</div>
              </div>
              <div className="text-center">
                <div className="font-bold">0</div>
                <div className="text-xs text-muted-foreground">저장</div>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex mt-4 gap-2">
          <Button variant="outline" className="flex-1" onClick={handleEditSaju}>
            <Settings className="h-4 w-4 mr-2" />
            프로필 편집
          </Button>
          <Button variant="default" className="flex-1" onClick={handleChatWithAI}>
            <MessageCircle className="h-4 w-4 mr-2" />
            AI 상담하기
          </Button>
        </div>
      </div>

      {/* 하이라이트 섹션 */}
      <div className="py-4 px-2 overflow-x-auto whitespace-nowrap border-b">
        <div className="inline-flex space-x-4 px-2">
          {[...Array(Math.min(3, sajuProfiles.length))].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mb-1 bg-primary/10">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs">{sajuProfiles[index]?.name || "사주"}</span>
            </div>
          ))}
          {sajuProfiles.length === 0 && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center mb-1">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">사주 없음</span>
            </div>
          )}
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-transparent h-12 border-b rounded-none">
          <TabsTrigger
            value="posts"
            className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none data-[state=active]:shadow-none"
          >
            <Grid3X3 className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none data-[state=active]:shadow-none"
          >
            <BookmarkIcon className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger
            value="tagged"
            className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:rounded-none data-[state=active]:shadow-none"
          >
            <UserIcon className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>

        {/* 사주 그리드 */}
        <TabsContent value="posts" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : sajuProfiles.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {sajuProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="aspect-square relative cursor-pointer"
                  onClick={() => handleViewDetails(profile)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 hover:opacity-90">
                    <div className="text-center px-1">
                      <div className="text-xs font-semibold mb-1 truncate w-full">{profile.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {profile.saju.yearStem}
                        {profile.saju.yearBranch} {profile.saju.monthStem}
                        {profile.saju.monthBranch}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {profile.saju.dayStem}
                        {profile.saju.dayBranch} {profile.saju.hourStem}
                        {profile.saju.hourBranch}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-muted-foreground mb-4">아직 등록된 사주가 없습니다.</p>
              <Button onClick={() => router.push("/")}>사주 입력하기</Button>
            </div>
          )}
        </TabsContent>

        {/* 저장된 항목 */}
        <TabsContent value="saved" className="mt-0">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <BookmarkIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-muted-foreground">저장된 항목이 없습니다.</p>
          </div>
        </TabsContent>

        {/* 태그된 항목 */}
        <TabsContent value="tagged" className="mt-0">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-muted-foreground">태그된 항목이 없습니다.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* 하단 네비게이션 바 */}
      <BottomNavBar />
    </div>
  )
}
