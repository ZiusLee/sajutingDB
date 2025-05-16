"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ArrowLeft, Grid3X3, BookmarkIcon, UserIcon, Users } from "lucide-react"
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

interface User {
  id: string
  email: string
  created_at: string
  user_metadata?: {
    name?: string
  }
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
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
  const [currentUserProfile, setCurrentUserProfile] = useState<SajuProfile | null>(null)
  const [isCurrentUser, setIsCurrentUser] = useState(false)

  // 사용자 데이터 로드
  const loadUserData = async () => {
    try {
      setIsLoading(true)

      // 현재 로그인한 사용자 확인
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      // 현재 사용자의 프로필인지 확인
      if (currentUser && currentUser.id === userId) {
        setIsCurrentUser(true)
      }

      // API를 통해 사용자 정보 가져오기
      const response = await fetch(`/api/users?id=${userId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API Response:", data) // 디버깅용 로그

      // API 응답 구조 확인 및 사용자 정보 추출
      if (!data || !data.users || data.users.length === 0) {
        throw new Error("User not found")
      }

      const user = data.users[0]

      // 사용자 메타데이터 설정 (undefined 체크 추가)
      const metadata = user.user_metadata || {}
      setUserName(metadata.name || (user.email ? user.email.split("@")[0] : "사용자"))
      setUserEmail(user.email || "")

      // 사용자의 사주 세션 가져오기
      const { data: sessionData, error: sessionError } = await supabase
        .from("saju_sessions")
        .select("*")
        .eq("auth_user_id", userId)

      if (sessionError) {
        throw sessionError
      }

      // 사주 프로필 가져오기
      const profiles: SajuProfile[] = []
      for (const session of sessionData || []) {
        try {
          const profile = await getSajuProfileBySessionId(session.id)
          if (profile) {
            profiles.push(profile)
          }
        } catch (error) {
          console.error(`Error loading profile for session ${session.id}:`, error)
        }
      }
      setSajuProfiles(profiles)

      // 메인 사주 프로필 가져오기
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

      // 현재 로그인한 사용자의 메인 사주 프로필 가져오기
      if (currentUser) {
        try {
          const currentUserDefaultSession = await getDefaultSajuSession(currentUser.id)
          if (currentUserDefaultSession) {
            const profile = await getSajuProfileBySessionId(currentUserDefaultSession.id)
            if (profile) {
              setCurrentUserProfile(profile)
            }
          }
        } catch (error) {
          console.error("Error loading current user profile:", error)
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

  // 페이지 로드 시 데이터 가져오기
  useEffect(() => {
    loadUserData()
  }, [userId])

  // 사주 상세 보기
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

  // 궁합 보기
  const handleCheckCompatibility = () => {
    if (!currentUserProfile) {
      toast({
        title: "메인 사주 필요",
        description: "궁합을 확인하려면 먼저 메인 사주를 설정해야 합니다.",
        variant: "destructive",
      })
      return
    }

    if (!defaultProfile) {
      toast({
        title: "상대방 메인 사주 없음",
        description: "상대방의 메인 사주가 설정되어 있지 않습니다.",
        variant: "destructive",
      })
      return
    }

    // 현재 사용자의 사주 데이터
    const userSajuData = {
      name: currentUserProfile.name,
      gender: currentUserProfile.gender,
      saju: {
        yearStem: currentUserProfile.saju.yearStem,
        yearBranch: currentUserProfile.saju.yearBranch,
        monthStem: currentUserProfile.saju.monthStem,
        monthBranch: currentUserProfile.saju.monthBranch,
        dayStem: currentUserProfile.saju.dayStem,
        dayBranch: currentUserProfile.saju.dayBranch,
        hourStem: currentUserProfile.saju.hourStem,
        hourBranch: currentUserProfile.saju.hourBranch,
      },
    }

    // 상대방의 사주 데이터
    const partnerData = {
      name: defaultProfile.name,
      gender: defaultProfile.gender,
      year: Number.parseInt(defaultProfile.birthYear),
      month: Number.parseInt(defaultProfile.birthMonth),
      day: Number.parseInt(defaultProfile.birthDay),
      hour: defaultProfile.timeUnknown ? null : Number.parseInt(defaultProfile.birthHour),
      minute: defaultProfile.timeUnknown ? null : Number.parseInt(defaultProfile.birthMinute),
      timeUnknown: defaultProfile.timeUnknown,
    }

    // 데이터를 URL 파라미터로 인코딩
    const encodedUserSaju = encodeURIComponent(JSON.stringify(userSajuData))
    const encodedPartnerData = encodeURIComponent(JSON.stringify(partnerData))

    // 궁합 분석 페이지로 이동
    router.push(`/compatibility?user=${encodedUserSaju}&partner=${encodedPartnerData}`)
  }

  return (
    <div className="container mx-auto pb-20">
      {/* 프로필 헤더 섹션 */}
      <div className="px-4 pt-6 pb-4 border-b">
        <div className="flex items-start">
          {/* 뒤로가기 버튼 */}
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2 -ml-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* 프로필 이미지 */}
          <Avatar className="h-20 w-20 mr-5">
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* 프로필 정보 */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">{userName}</h1>

              {/* 궁합 보기 버튼 - 자신의 프로필이 아닐 때만 표시 */}
              {!isCurrentUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckCompatibility}
                  className="ml-2"
                  disabled={!currentUserProfile || !defaultProfile}
                >
                  <Users className="h-4 w-4 mr-1" />
                  궁합보기
                </Button>
              )}
            </div>
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
                <div className="text-xs text-muted-foreground">메인 사주가 설정되지 않았습니다.</div>
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
      </div>

      {/* 하이라이트 섹션 */}
      <div className="py-4 px-2 overflow-x-auto whitespace-nowrap border-b">
        <div className="inline-flex space-x-4 px-2">
          {[...Array(Math.min(3, sajuProfiles.length))].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mb-1 bg-primary/10">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xs">{sajuProfiles[index]?.name || "사주"}</span>
            </div>
          ))}
          {sajuProfiles.length === 0 && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center mb-1">
                <UserIcon className="h-8 w-8 text-gray-400" />
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
              <UserIcon className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-muted-foreground mb-4">등록된 사주가 없습니다.</p>
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

      <BottomNavBar />
    </div>
  )
}
