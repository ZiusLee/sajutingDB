"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MessageCircle, LogOut, Plus, Star, Eye, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { getUserSajuProfiles } from "@/lib/saju-session-service"
import { ElementDisplay } from "@/components/element-display"
import { calculateElementsFromSaju } from "@/lib/element-utils"
import { getDefaultSajuSession, getSajuProfileBySessionId, setDefaultSajuSession } from "@/lib/saju-session-service"
import BirthDateFormClient from "@/components/birth-date-form-client"

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
    yearAnimal?: string
  }
}

export default function MyPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [sajuProfiles, setSajuProfiles] = useState<SajuProfile[]>([])
  const [showAllProfiles, setShowAllProfiles] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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
      // Sort by creation date (newest first)
      const sortedProfiles = profiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setSajuProfiles(sortedProfiles)

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
          } else if (sortedProfiles.length > 0) {
            // If no default is set, use the first profile as default
            setDefaultProfile(sortedProfiles[0])
            const calculatedElements = calculateElementsFromSaju(
              sortedProfiles[0].saju.yearStem,
              sortedProfiles[0].saju.yearBranch,
              sortedProfiles[0].saju.monthStem,
              sortedProfiles[0].saju.monthBranch,
              sortedProfiles[0].saju.dayStem,
              sortedProfiles[0].saju.dayBranch,
              sortedProfiles[0].saju.hourStem,
              sortedProfiles[0].saju.hourBranch,
            )
            setElements(calculatedElements)
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

  // Set as main saju
  const handleSetAsMain = async (profile: SajuProfile) => {
    if (!authUserId) return

    try {
      const success = await setDefaultSajuSession(authUserId, profile.id)
      if (success) {
        setDefaultProfile(profile)

        // Calculate elements for the new default profile
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

        toast({
          title: "메인 사주 설정 완료",
          description: `${profile.name}님의 사주가 메인 사주로 설정되었습니다.`,
        })
      } else {
        toast({
          title: "설정 실패",
          description: "메인 사주 설정에 실패했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting main saju:", error)
      toast({
        title: "오류 발생",
        description: "메인 사주 설정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

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

  // Navigate to chat with AI using main saju
  const handleChatWithAI = () => {
    const profileToUse = defaultProfile || (sajuProfiles.length > 0 ? sajuProfiles[0] : null)

    if (profileToUse) {
      try {
        console.log("Using profile for chat:", profileToUse)

        // 사주 데이터 준비 - 모든 필드 포함
        const sajuData = {
          saju: {
            yearStem: profileToUse.saju.yearStem,
            yearBranch: profileToUse.saju.yearBranch,
            monthStem: profileToUse.saju.monthStem,
            monthBranch: profileToUse.saju.monthBranch,
            dayStem: profileToUse.saju.dayStem,
            dayBranch: profileToUse.saju.dayBranch,
            hourStem: profileToUse.saju.hourStem,
            hourBranch: profileToUse.saju.hourBranch,
            yearStemHanja: profileToUse.saju.yearStemHanja || "",
            yearBranchHanja: profileToUse.saju.yearBranchHanja || "",
            monthStemHanja: profileToUse.saju.monthStemHanja || "",
            monthBranchHanja: profileToUse.saju.monthBranchHanja || "",
            dayStemHanja: profileToUse.saju.dayStemHanja || "",
            dayBranchHanja: profileToUse.saju.dayBranchHanja || "",
            hourStemHanja: profileToUse.saju.hourStemHanja || "",
            hourBranchHanja: profileToUse.saju.hourBranchHanja || "",
            elements: profileToUse.saju.elements || elements,
            dayMaster: profileToUse.saju.dayMaster || profileToUse.saju.dayStem,
            dayMasterHanja: profileToUse.saju.dayMasterHanja || "",
            yearStemSibseong: profileToUse.saju.yearStemSibseong || "",
            monthStemSibseong: profileToUse.saju.monthStemSibseong || "",
            dayStemSibseong: profileToUse.saju.dayStemSibseong || "",
            hourStemSibseong: profileToUse.saju.hourStemSibseong || "",
            yearBranchSibseong: profileToUse.saju.yearBranchSibseong || "",
            monthBranchSibseong: profileToUse.saju.monthBranchSibseong || "",
            dayBranchSibseong: profileToUse.saju.dayBranchSibseong || "",
            hourBranchSibseong: profileToUse.saju.hourBranchSibseong || "",
            yearAnimal: profileToUse.saju.yearAnimal || "",
          },
          name: profileToUse.name,
          gender: profileToUse.gender,
          year: profileToUse.birthYear,
          month: profileToUse.birthMonth,
          day: profileToUse.birthDay,
          hour: profileToUse.birthHour,
          minute: profileToUse.birthMinute,
          lunarYear: profileToUse.lunarYear || profileToUse.birthYear,
          lunarMonth: profileToUse.lunarMonth || profileToUse.birthMonth,
          lunarDay: profileToUse.lunarDay || profileToUse.birthDay,
          timeUnknown: profileToUse.timeUnknown,
          interpretation: "", // 기본값
          sessionId: profileToUse.id, // 세션 ID 추가
          birthInfo: {
            solarYear: Number.parseInt(profileToUse.birthYear),
            solarMonth: Number.parseInt(profileToUse.birthMonth),
            solarDay: Number.parseInt(profileToUse.birthDay),
            solarHour: Number.parseInt(profileToUse.birthHour) || 0,
            solarMinute: Number.parseInt(profileToUse.birthMinute) || 0,
            lunarYear: Number.parseInt(profileToUse.lunarYear || profileToUse.birthYear),
            lunarMonth: Number.parseInt(profileToUse.lunarMonth || profileToUse.birthMonth),
            lunarDay: Number.parseInt(profileToUse.lunarDay || profileToUse.birthDay),
            timeUnknown: profileToUse.timeUnknown,
          },
        }

        console.log("Prepared saju data for chat:", sajuData)

        // 로컬 스토리지에 사주 데이터 저장
        localStorage.setItem("current_saju", JSON.stringify(sajuData))

        // 세션 스토리지에 출처 표시 (더 명확하게)
        sessionStorage.setItem("from_mypage", "true")
        console.log("Set from_mypage flag to true")

        // 약간의 지연 후 이동
        setTimeout(() => {
          window.location.href = "/saju-chat/sajuping"
        }, 100)
      } catch (error) {
        console.error("Error preparing chat data:", error)
        toast({
          title: "오류 발생",
          description: "채팅 준비 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "사주 정보 필요",
        description: "AI와 상담하기 위해서는 먼저 사주 정보가 필요합니다.",
        variant: "destructive",
      })
      router.push("/")
    }
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

  // Get avatar based on gender
  const getAvatarContent = (gender: string) => {
    return gender === "male" ? "👨" : "👩"
  }

  // Get profiles to display (first 3 or all if showAll is true)
  const profilesToShow = showAllProfiles ? sajuProfiles : sajuProfiles.slice(0, 3)
  const hasMoreProfiles = sajuProfiles.length > 3

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto pb-20">
      {/* 상단 로그아웃 버튼 */}
      <div className="flex justify-between items-center pt-4 px-4">
        <h1 className="text-xl font-bold">내 사주</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
      </div>

      {/* 메인 사주 프로필 */}
      {defaultProfile && (
        <div className="px-4 pt-4 pb-6">
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center mb-3">
              <Avatar className="h-16 w-16 mr-4">
                <AvatarFallback className="text-2xl bg-yellow-200 dark:bg-yellow-800">
                  {getAvatarContent(defaultProfile.gender)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center">
                  <h2 className="text-lg font-bold mr-2">{defaultProfile.name}</h2>
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 ml-1">메인</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {defaultProfile.gender === "male" ? "남성" : "여성"} • {defaultProfile.birthYear}.
                  {defaultProfile.birthMonth}.{defaultProfile.birthDay}
                </p>
                <div className="mt-2">
                  <ElementDisplay elements={elements} maxSlots={12} />
                </div>
              </div>
            </div>

            <Button onClick={handleChatWithAI} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
              <MessageCircle className="h-4 w-4 mr-2" />
              대표 사주로 사주핑과 대화하기
            </Button>
          </div>
        </div>
      )}

      {/* 등록된 사주 정보 섹션 */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">등록된 사주 정보 ({sajuProfiles.length}명)</h3>
          {hasMoreProfiles && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllProfiles(!showAllProfiles)}
              className="text-blue-600"
            >
              {showAllProfiles ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  더보기
                </>
              )}
            </Button>
          )}
        </div>

        {sajuProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Calendar className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-muted-foreground mb-4">아직 등록된 사주가 없습니다.</p>
            <p className="text-sm text-muted-foreground">아래 버튼을 눌러 첫 번째 사주를 등록해보세요.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {profilesToShow.map((profile) => {
              const isMainProfile = defaultProfile?.id === profile.id
              const profileElements = calculateElementsFromSaju(
                profile.saju.yearStem,
                profile.saju.yearBranch,
                profile.saju.monthStem,
                profile.saju.monthBranch,
                profile.saju.dayStem,
                profile.saju.dayBranch,
                profile.saju.hourStem,
                profile.saju.hourBranch,
              )

              return (
                <div
                  key={profile.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${
                    isMainProfile
                      ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-start">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarFallback className="bg-primary/10">{getAvatarContent(profile.gender)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <h4 className="font-semibold truncate mr-2">{profile.name}</h4>
                        {isMainProfile && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {profile.gender === "male" ? "남성" : "여성"} • {profile.birthYear}.{profile.birthMonth}.
                        {profile.birthDay}
                        {profile.timeUnknown ? " (시간미상)" : ` ${profile.birthHour}:${profile.birthMinute}`}
                      </p>

                      <div className="text-xs text-muted-foreground mb-2">
                        {profile.saju.yearStem}
                        {profile.saju.yearBranch} {profile.saju.monthStem}
                        {profile.saju.monthBranch} {profile.saju.dayStem}
                        {profile.saju.dayBranch} {profile.saju.hourStem}
                        {profile.saju.hourBranch}
                        {profile.saju.yearAnimal && (
                          <span className="ml-2 text-yellow-500 dark:text-yellow-400">{profile.saju.yearAnimal}</span>
                        )}
                      </div>

                      <div className="mb-3">
                        <ElementDisplay elements={profileElements} maxSlots={8} />
                      </div>

                      <div className="flex gap-2">
                        {!isMainProfile && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetAsMain(profile)}
                            className="text-xs"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            메인으로 설정
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(profile)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          상세보기
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Plus className="h-5 w-5 mr-2" />새 사주 정보 추가하기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 사주 정보 입력</DialogTitle>
            </DialogHeader>
            <BirthDateFormClient />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
