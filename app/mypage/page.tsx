"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { MessageCircle, Plus, Star, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { getUserSajuProfiles } from "@/lib/saju-session-service"
import { ElementDisplay } from "@/components/element-display"
import { calculateElementsFromSaju } from "@/lib/element-utils"
import { getDefaultSajuSession, getSajuProfileBySessionId, setDefaultSajuSession } from "@/lib/saju-session-service"
import BirthDateFormClient from "@/components/birth-date-form-client"
import type { Saju } from "@/lib/saju" // Import Saju type
import { calculateDaeunInfo } from "@/lib/daeun-calculator"

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
  saju: Saju // Use the imported Saju type
  daeun?: any // To store calculated Daeun info
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
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)

  // Load user data function
  const loadUserData = async () => {
    try {
      setIsLoading(true)

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData?.session) {
        router.push("/login?returnUrl=/mypage")
        return
      }

      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const userId = userData.user.id
        setAuthUserId(userId)
        setUserName(userData.user.user_metadata?.name || userData.user.email?.split("@")[0] || "사용자")
        setUserEmail(userData.user.email || "")

        console.log("Current user:", userData.user.email, "ID:", userId)
      }

      console.log("Calling getUserSajuProfiles...")
      const { profiles } = await getUserSajuProfiles()
      console.log("Raw profiles from getUserSajuProfiles:", profiles)
      console.log("Number of profiles:", profiles.length)

      // 강화된 중복 제거 및 유효성 검사
      const seenIds = new Set()
      const validProfiles = profiles.filter((profile) => {
        // 기본 유효성 검사
        if (!profile || !profile.id || !profile.name) {
          console.warn("Invalid profile found:", profile)
          return false
        }

        // 중복 검사
        if (seenIds.has(profile.id)) {
          console.warn("Duplicate profile ID found:", profile.id)
          return false
        }

        seenIds.add(profile.id)
        return true
      })

      console.log("Valid unique profiles after filtering:", validProfiles.length)
      console.log(
        "Profile IDs:",
        validProfiles.map((p) => p.id),
      )

      const sortedProfiles = validProfiles.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      setSajuProfiles(sortedProfiles)

      if (userData.user) {
        const userId = userData.user.id
        try {
          const defaultSession = await getDefaultSajuSession(userId)
          if (defaultSession) {
            const profile = (await getSajuProfileBySessionId(defaultSession.id)) as SajuProfile | null
            if (profile) {
              setDefaultProfile(profile)
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

  useEffect(() => {
    loadUserData()
  }, [router, supabase])

  const handleSetAsMain = async (profile: SajuProfile) => {
    if (!authUserId) return
    try {
      const success = await setDefaultSajuSession(authUserId, profile.id)
      if (success) {
        setDefaultProfile(profile)
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

  const handleChatWithAI = async () => {
    const profileToUse = defaultProfile || (sajuProfiles.length > 0 ? sajuProfiles[0] : null)

    if (profileToUse) {
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from("saju_sessions")
          .select(`id, name, gender, saju, daeun`)
          .eq("id", profileToUse.id)
          .single()

        if (sessionError) throw new Error("사주 데이터를 가져오는데 실패했습니다.")

        let dbSaju = (sessionData?.saju as Saju) || {}
        let dbDaeun = sessionData?.daeun

        // 사주 데이터 완성도 체크 및 재계산
        const isSajuIncomplete =
          !dbSaju ||
          !dbSaju.yearStem ||
          !dbSaju.yearBranch ||
          !dbSaju.monthStem ||
          !dbSaju.monthBranch ||
          !dbSaju.dayStem ||
          !dbSaju.dayBranch ||
          !dbSaju.hourStem ||
          !dbSaju.hourBranch ||
          !dbSaju.yearStemSibseong ||
          !dbSaju.monthStemSibseong ||
          !dbSaju.dayBranchSibseong ||
          !dbSaju.hourBranchSibseong ||
          !dbSaju.elements

        if (isSajuIncomplete) {
          console.log("사주 데이터가 불완전하여 재계산 중...")

          try {
            // calculateSaju 함수 import 필요
            const { calculateSaju } = await import("@/lib/saju")

            const recalculatedSaju = calculateSaju(
              Number.parseInt(profileToUse.lunarYear || profileToUse.birthYear),
              Number.parseInt(profileToUse.lunarMonth || profileToUse.birthMonth),
              Number.parseInt(profileToUse.lunarDay || profileToUse.birthDay),
              profileToUse.timeUnknown ? 12 : Number.parseInt(profileToUse.birthHour),
              profileToUse.timeUnknown ? 0 : Number.parseInt(profileToUse.birthMinute),
              Number.parseInt(profileToUse.birthYear),
              Number.parseInt(profileToUse.birthMonth),
              Number.parseInt(profileToUse.birthDay),
              profileToUse.gender,
              profileToUse.name,
              profileToUse.timeUnknown,
              false, // isLeapMonth
              undefined, // apiMonthStem
              undefined, // apiMonthBranch
              "동경135도", // timeStandard
            )

            console.log("재계산된 사주 데이터:", recalculatedSaju)

            // DB에 재계산된 사주 데이터 저장
            const { error: updateSajuError } = await supabase
              .from("saju_sessions")
              .update({ saju: recalculatedSaju })
              .eq("id", profileToUse.id)

            if (updateSajuError) {
              console.error("사주 데이터 저장 실패:", updateSajuError)
              toast({ title: "사주 데이터 저장 실패", variant: "destructive" })
            } else {
              console.log("사주 데이터 저장 성공")
              dbSaju = recalculatedSaju
            }
          } catch (sajuError) {
            console.error("사주 재계산 실패:", sajuError)
            toast({ title: "사주 재계산 실패", variant: "destructive" })
          }
        }

        // 대운 데이터 체크 및 계산
        if (!dbDaeun || !dbDaeun.pillars || !Array.isArray(dbDaeun.pillars) || dbDaeun.pillars.length === 0) {
          console.log("대운 데이터가 없거나 유효하지 않아 계산 중...")
          try {
            const normalizedGender =
              profileToUse.gender.toLowerCase() === "male" ||
              profileToUse.gender === "남성" ||
              profileToUse.gender === "남자"
                ? "male"
                : "female"

            // Ensure saju object for calculateDaeunInfo has the minimally required fields
            const sajuForDaeunCalc: Pick<Saju, "yearStem" | "monthStem" | "monthBranch"> = {
              yearStem: dbSaju.yearStem || profileToUse.saju.yearStem,
              monthStem: dbSaju.monthStem || profileToUse.saju.monthStem,
              monthBranch: dbSaju.monthBranch || profileToUse.saju.monthBranch,
            }

            const daeunData = calculateDaeunInfo(
              sajuForDaeunCalc,
              Number.parseInt(profileToUse.birthYear),
              Number.parseInt(profileToUse.birthMonth),
              Number.parseInt(profileToUse.birthDay),
              normalizedGender,
              profileToUse.timeUnknown ? undefined : Number.parseInt(profileToUse.birthHour),
              profileToUse.timeUnknown ? undefined : Number.parseInt(profileToUse.birthMinute),
              profileToUse.timeUnknown,
            )
            console.log("계산된 대운 데이터:", daeunData)

            const { error: updateError } = await supabase
              .from("saju_sessions")
              .update({ daeun: daeunData })
              .eq("id", profileToUse.id)

            if (updateError) {
              console.error("대운 데이터 저장 실패:", updateError)
              toast({ title: "대운 데이터 저장 실패", variant: "destructive" })
            } else {
              console.log("대운 데이터 저장 성공")
              dbDaeun = daeunData
            }
          } catch (daeunError) {
            console.error("대운 계산 실패:", daeunError)
            toast({ title: "대운 계산 실패", variant: "destructive" })
          }
        }

        const finalSajuData = {
          sessionId: profileToUse.id, // 세션 ID 추가
          saju: {
            ...dbSaju,
            daeun: dbDaeun,
            elements: dbSaju.elements || profileToUse.saju.elements || elements,
            dayMaster: dbSaju.dayMaster || profileToUse.saju.dayStem,
            dayMasterHanja: dbSaju.dayMasterHanja || "",
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
          interpretation: "",
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

        localStorage.setItem("current_saju", JSON.stringify(finalSajuData))
        sessionStorage.setItem("from_mypage", "true")

        // Use router.push instead of window.location.href for better navigation
        router.push("/saju-chat/sajuping")
      } catch (error) {
        console.error("Error preparing chat data:", error)
        toast({ title: "오류 발생", description: "채팅 준비 중 오류가 발생했습니다.", variant: "destructive" })
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast({ title: "로그아웃 성공", description: "성공적으로 로그아웃되었습니다." })
      router.push("/")
    } catch (error) {
      console.error("로그아웃 오류:", error)
      toast({ title: "로그아웃 오류", variant: "destructive" })
    }
  }

  const handleNewSajuSuccess = async (sessionId: string) => {
    try {
      setIsDialogOpen(false)
      setRecentlyAddedId(sessionId)
      await loadUserData()
      toast({ title: "사주 정보 추가 완료", description: "새로운 사주 정보가 성공적으로 추가되었습니다." })
      setTimeout(() => {
        setRecentlyAddedId(null)
      }, 3000)
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({ title: "데이터 새로고침 오류", variant: "destructive" })
    }
  }

  const getAvatarContent = (gender: string) => (gender === "male" ? "👨" : "👩")
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
                  <ElementDisplay elements={elements} maxSlots={12} displayMode="text" />
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

      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            등록된 사주 정보 ({sajuProfiles.length}명)
            {process.env.NODE_ENV === "development" && (
              <span className="text-xs text-gray-500 ml-2">
                (디버그: {sajuProfiles.map((p) => p.id.slice(0, 8)).join(", ")})
              </span>
            )}
          </h3>
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
                  className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${isMainProfile ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10" : "border-gray-200 dark:border-gray-700"}`}
                >
                  <div className="flex items-start">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarFallback className="bg-primary/10">{getAvatarContent(profile.gender)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <h4 className="font-semibold truncate mr-2">{profile.name}</h4>
                        {isMainProfile && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                        {recentlyAddedId === profile.id && (
                          <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full ml-1 animate-pulse">
                            NEW
                          </span>
                        )}
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
                      </div>
                      <div className="mb-3">
                        <ElementDisplay elements={profileElements} maxSlots={8} displayMode="text" />
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
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />새 사주 정보 추가하기
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 사주 정보 입력</DialogTitle>
            </DialogHeader>
            <BirthDateFormClient onSuccess={handleNewSajuSuccess} redirectAfterSave={false} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
