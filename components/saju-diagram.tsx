"use client"

import type { Saju } from "@/lib/saju"
import { InfoIcon, ChevronDown, Heart, ChevronUp } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Plus, X } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getUserSajuProfiles, getDefaultSajuSession, getSajuProfileBySessionId } from "@/lib/saju-session-service"
import { toast } from "@/components/ui/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CitySearch } from "@/components/city-search"
import { DEFAULT_CITY_ID } from "@/lib/city-timezone-data"

interface SajuDiagramProps {
  saju: Saju
  timeUnknown?: boolean
  size?: "sm" | "md" | "lg"
  name?: string
  gender?: string
  solarYear?: string | number
  solarMonth?: string | number
  solarDay?: string | number
  hour?: string | number
  minute?: string | number
  lunarYear?: string | number
  lunarMonth?: string | number
  lunarDay?: string | number
  location?: string
  variant?: "chat" | "sidebar" | "card"
  onProfileUpdate?: (profile: any) => void
}

export default function SajuDiagram({
  saju,
  timeUnknown = false,
  size = "md",
  name = "",
  gender = "",
  solarYear = "",
  solarMonth = "",
  solarDay = "",
  hour = "",
  minute = "",
  lunarYear = "",
  lunarMonth = "",
  lunarDay = "",
  location,
  variant = "chat",
  onProfileUpdate,
}: SajuDiagramProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Theme-aware element colors for backgrounds
  const elementColors = {
    wood: isDark ? "bg-green-600" : "bg-green-500", // 목 - 녹색
    fire: isDark ? "bg-orange-600" : "bg-red-500", // 화 - 다크에서는 오렌지, 라이트에서는 빨간색
    earth: isDark ? "bg-amber-700" : "bg-yellow-500", // 토 - 다크에서는 앰버, 라이트에서는 노란색
    metal: isDark ? "bg-slate-500" : "bg-gray-400", // 금 - 회색
    water: isDark ? "bg-blue-600" : "bg-blue-500", // 수 - 파란색
    unknown: isDark ? "bg-gray-600" : "bg-gray-300",
  }

  // Theme-aware text colors for sidebar
  const elementTextColors = {
    wood: isDark ? "text-green-400" : "text-green-600", // 목 - 녹색
    fire: isDark ? "text-orange-400" : "text-red-600", // 화 - 다크에서는 오렌지, 라이트에서는 빨간색
    earth: isDark ? "text-amber-400" : "text-yellow-600", // 토 - 다크에서는 앰버, 라이트에서는 노란색
    metal: isDark ? "text-slate-400" : "text-gray-600", // 금 - 회색
    water: isDark ? "text-blue-400" : "text-blue-600", // 수 - 파란색
    unknown: isDark ? "text-gray-400" : "text-gray-400",
  }

  // 간의 오행 매핑
  const stemElements = {
    갑: "wood",
    을: "wood",
    병: "fire",
    정: "fire",
    무: "earth",
    기: "earth",
    경: "metal",
    신: "metal",
    임: "water",
    계: "water",
  }

  // 지의 오행 매핑
  const branchElements = {
    자: "water",
    축: "earth",
    인: "wood",
    묘: "wood",
    진: "earth",
    사: "fire",
    오: "fire",
    미: "earth",
    신: "metal",
    유: "metal",
    술: "earth",
    해: "water",
  }

  // 십이지지 동물 이름
  const branchAnimals = {
    자: "쥐",
    축: "소",
    인: "호랑이",
    묘: "토끼",
    진: "용",
    사: "뱀",
    오: "말",
    미: "양",
    신: "원숭이",
    유: "닭",
    술: "개",
    해: "돼지",
  }

  // 천간 색상 이름
  const stemColorNames = {
    갑: "푸른",
    을: "푸른",
    병: "붉은",
    정: "붉은",
    무: "황색",
    기: "황색",
    경: "하얀",
    신: "하얀",
    임: "검은",
    계: "검은",
  }

  // 오행 이름
  const elementNames = {
    wood: "목(木)",
    fire: "화(火)",
    earth: "토(土)",
    metal: "금(金)",
    water: "수(水)",
  }

  // Add profile management state and logic for sidebar variant
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [sajuProfiles, setSajuProfiles] = useState<any[]>([])
  const [defaultProfile, setDefaultProfileState] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [profileCollapsed, setProfileCollapsed] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    gender: "female",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "",
    birthMinute: "",
    timeUnknown: false,
    birthCityId: DEFAULT_CITY_ID,
  })
  const supabase = createClientComponentClient()

  // Load user saju profiles
  const loadSajuProfiles = async () => {
    if (variant !== "sidebar") return

    try {
      setIsLoading(true)
      const { profiles } = await getUserSajuProfiles()
      const sortedProfiles = profiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setSajuProfiles(sortedProfiles)

      // Get default profile
      const { data: userData } = await supabase.auth.getUser()
      if (userData.user) {
        const userId = userData.user.id
        const defaultSession = await getDefaultSajuSession(userId)
        if (defaultSession) {
          const profile = await getSajuProfileBySessionId(defaultSession.id)
          setDefaultProfileState(profile)
        } else if (sortedProfiles.length > 0) {
          setDefaultProfileState(sortedProfiles[0])
        }
      }
    } catch (error) {
      console.error("Error loading saju profiles:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProfile = (profile: any) => {
    setEditingProfile(profile)
    setEditForm({
      name: profile.name || "",
      gender: profile.gender || "female",
      birthYear: profile.birthYear || "",
      birthMonth: profile.birthMonth || "",
      birthDay: profile.birthDay || "",
      birthHour: profile.birthHour || "",
      birthMinute: profile.birthMinute || "",
      timeUnknown: profile.timeUnknown || false,
      birthCityId: profile.birthCityId || DEFAULT_CITY_ID,
    })
  }

  const handleUpdateProfile = async () => {
    if (!editingProfile) return

    try {
      const birthDateChanged =
        editForm.birthYear !== editingProfile.birthYear ||
        editForm.birthMonth !== editingProfile.birthMonth ||
        editForm.birthDay !== editingProfile.birthDay ||
        editForm.birthHour !== editingProfile.birthHour ||
        editForm.birthMinute !== editingProfile.birthMinute ||
        editForm.timeUnknown !== editingProfile.timeUnknown ||
        editForm.birthCityId !== editingProfile.birthCityId

      let updatedSaju = editingProfile.saju
      let updatedDaeun = editingProfile.daeun

      if (birthDateChanged) {
        const { solarToLunar } = await import("@/lib/lunar-calendar")
        const { calculateSaju } = await import("@/lib/saju")
        const { calculateDaeunInfo } = await import("@/lib/daeun-calculator")
        const { getCityById } = await import("@/lib/city-timezone-data")

        // 음력 날짜 계산
        const lunarDate = solarToLunar(
          Number.parseInt(editForm.birthYear),
          Number.parseInt(editForm.birthMonth),
          Number.parseInt(editForm.birthDay),
        )

        // 시간 기준 가져오기
        const cityData = getCityById(editForm.birthCityId)
        const timeStandard = cityData?.timeStandard || "동경135도"

        // 사주 재계산
        updatedSaju = calculateSaju(
          lunarDate.year.toString(),
          lunarDate.month.toString(),
          lunarDate.day.toString(),
          editForm.timeUnknown ? 0 : Number.parseInt(editForm.birthHour || "0"),
          editForm.timeUnknown ? 0 : Number.parseInt(editForm.birthMinute || "0"),
          Number.parseInt(editForm.birthYear),
          Number.parseInt(editForm.birthMonth),
          Number.parseInt(editForm.birthDay),
          editForm.gender,
          editForm.name,
          editForm.timeUnknown,
          lunarDate.isLeapMonth,
          lunarDate.monthStem,
          lunarDate.monthBranch,
          timeStandard,
        )

        // 대운 재계산
        updatedDaeun = calculateDaeunInfo(
          {
            yearStem: updatedSaju.yearStem,
            monthStem: updatedSaju.monthStem,
            monthBranch: updatedSaju.monthBranch,
          },
          Number.parseInt(editForm.birthYear),
          Number.parseInt(editForm.birthMonth),
          Number.parseInt(editForm.birthDay),
          editForm.gender,
          editForm.timeUnknown ? undefined : Number.parseInt(editForm.birthHour || "0"),
          editForm.timeUnknown ? undefined : Number.parseInt(editForm.birthMinute || "0"),
          editForm.timeUnknown,
        )
      }

      const response = await fetch("/api/save-saju-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: editingProfile.id,
          sajuData: updatedSaju,
          daeunData: updatedDaeun,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update saju data")
      }

      const { error } = await supabase
        .from("saju_sessions")
        .update({
          name: editForm.name,
          gender: editForm.gender,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProfile.id)

      if (error) throw error

      if (birthDateChanged) {
        const birthInfoResponse = await fetch("/api/birth-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingProfile.birthInfoId,
            user_id: editingProfile.id,
            solar_year: Number.parseInt(editForm.birthYear),
            solar_month: Number.parseInt(editForm.birthMonth),
            solar_day: Number.parseInt(editForm.birthDay),
            solar_hour: editForm.timeUnknown ? null : Number.parseInt(editForm.birthHour || "0"),
            solar_minute: editForm.timeUnknown ? null : Number.parseInt(editForm.birthMinute || "0"),
            time_unknown: editForm.timeUnknown,
            birth_city_id: editForm.birthCityId,
          }),
        })

        if (!birthInfoResponse.ok) {
          console.error("Failed to update birth_info")
        }
      }

      const updatedProfile = {
        ...editingProfile,
        name: editForm.name,
        gender: editForm.gender,
        birthYear: editForm.birthYear,
        birthMonth: editForm.birthMonth,
        birthDay: editForm.birthDay,
        birthHour: editForm.birthHour,
        birthMinute: editForm.birthMinute,
        timeUnknown: editForm.timeUnknown,
        birthCityId: editForm.birthCityId,
        saju: updatedSaju,
        daeun: updatedDaeun,
      }

      setSajuProfiles((prevProfiles) =>
        prevProfiles.map((profile) => (profile.id === editingProfile.id ? updatedProfile : profile)),
      )

      // defaultProfile이 편집된 프로필과 같다면 업데이트
      if (defaultProfile && defaultProfile.id === editingProfile.id) {
        setDefaultProfileState(updatedProfile)
      }

      if (onProfileUpdate && saju && editingProfile.id === editingProfile.id) {
        onProfileUpdate(updatedProfile)
      }

      toast({
        title: "프로필 수정 완료",
        description: birthDateChanged
          ? `${editForm.name}님의 프로필이 수정되고 사주가 재계산되었습니다.`
          : `${editForm.name}님의 프로필이 수정되었습니다.`,
      })

      setEditingProfile(null)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "오류 발생",
        description: "프로필 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // Handle compatibility check
  const handleCompatibilityCheck = async (profile: any) => {
    if (!defaultProfile) {
      toast({
        title: "오류",
        description: "대표 프로필이 설정되지 않았습니다.",
        variant: "destructive",
      })
      return
    }

    try {
      // 궁합 분석 요청 메시지 생성
      const compatibilityMessage = `안녕하세요! 두 사주의 궁합을 분석해주세요.

**첫 번째 사주 (대표 프로필):**
- 이름: ${defaultProfile.name}
- 성별: ${defaultProfile.gender === "male" ? "남성" : "여성"}
- 생년월일: ${defaultProfile.birthYear}년 ${defaultProfile.birthMonth}월 ${defaultProfile.birthDay}일 (양력)
- 생시: ${defaultProfile.timeUnknown ? "시간 모름" : `${defaultProfile.birthHour}시 ${defaultProfile.birthMinute}분`}
- 출생지: ${defaultProfile.location || "서울특별시"}
- 사주: ${defaultProfile.saju?.yearStem}${defaultProfile.saju?.yearBranch}년 ${defaultProfile.saju?.monthStem}${defaultProfile.saju?.monthBranch}월 ${defaultProfile.saju?.dayStem}${defaultProfile.saju?.dayBranch}일 ${defaultProfile.timeUnknown ? "??시" : `${defaultProfile.saju?.hourStem}${defaultProfile.saju?.hourBranch}시`}

**두 번째 사주:**
- 이름: ${profile.name}
- 성별: ${profile.gender === "male" ? "남성" : "여성"}
- 생년월일: ${profile.birthYear}년 ${profile.birthMonth}월 ${profile.birthDay}일 (양력)
- 생시: ${profile.timeUnknown ? "시간 모름" : `${profile.birthHour}시 ${profile.birthMinute}분`}
- 출생지: ${profile.location || "서울특별시"}
- 사주: ${profile.saju?.yearStem}${profile.saju?.yearBranch}년 ${profile.saju?.monthStem}${profile.saju?.monthBranch}월 ${profile.saju?.dayStem}${profile.saju?.dayBranch}일 ${profile.timeUnknown ? "??시" : `${profile.saju?.hourStem}${profile.saju?.hourBranch}시`}

이 두 사주의 궁합을 자세히 분석해주세요. 특히 다음 사항들을 포함해서 설명해주세요:
1. 전체적인 궁합 점수와 평가
2. 성격적 궁합
3. 연애/결혼 궁합
4. 사업/협력 관계 궁합
5. 서로 보완할 수 있는 부분
6. 주의해야 할 점들
7. 궁합을 더 좋게 만들 수 있는 방법`

      // 궁합 메시지를 sessionStorage에 저장하고 채팅 페이지로 이동
      sessionStorage.setItem("pending_compatibility_message", compatibilityMessage)

      // 일반 채팅방으로 이동 (궁합 전용 방이 아닌)
      window.location.href = "/saju-chat/general"

      toast({
        title: "궁합 분석 시작",
        description: `${defaultProfile.name}님과 ${profile.name}님의 궁합을 분석합니다.`,
      })
    } catch (error) {
      console.error("Error starting compatibility check:", error)
      toast({
        title: "오류 발생",
        description: "궁합 분석 시작 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // Load profiles when dialog opens
  useEffect(() => {
    if (isProfileDialogOpen && variant === "sidebar") {
      loadSajuProfiles()
    }
  }, [isProfileDialogOpen, variant])

  useEffect(() => {
    if (variant === "sidebar") {
      loadSajuProfiles()
    }
  }, [variant])

  useEffect(() => {
    if (variant === "sidebar") {
      localStorage.setItem("saju_profile_collapsed", profileCollapsed.toString())
    }
  }, [profileCollapsed, variant])

  const getAvatarContent = (gender: string) => (gender === "male" ? "👨" : "👩")

  // Fixed formatTime function to properly handle time display
  const formatTime = (h: string | number, m: string | number) => {
    // Handle the case where timeUnknown is true
    if (timeUnknown) {
      return "시간 모름"
    }

    // Convert to numbers and validate
    const hourNum = typeof h === "string" ? Number.parseInt(h, 10) : h
    const minuteNum = typeof m === "string" ? Number.parseInt(m, 10) : m

    // Check if we have valid numbers
    if (isNaN(hourNum) || isNaN(minuteNum)) {
      return "시간 정보 없음"
    }

    // Format with leading zeros
    return `${hourNum.toString().padStart(2, "0")}시 ${minuteNum.toString().padStart(2, "0")}분`
  }

  // 색상 가져오기 함수들
  const getStemColor = (stem: string, isText = false) => {
    if (stem === "?" || !stem) return isText ? elementTextColors.unknown : elementColors.unknown
    const element = stemElements[stem as keyof typeof stemElements] || "unknown"
    return isText ? elementTextColors[element] : elementColors[element]
  }

  const getBranchColor = (branch: string, isText = false) => {
    if (branch === "?" || !branch) return isText ? elementTextColors.unknown : elementColors.unknown
    const element = branchElements[branch as keyof typeof branchElements] || "unknown"
    return isText ? elementTextColors[element] : elementColors[element]
  }

  // 일주 정보 가져오기
  const getDayMasterInfo = () => {
    if (saju.dayStem === "?" || saju.dayBranch === "?") return { colorName: "", animalName: "", element: "", ilju: "" }

    const colorName = stemColorNames[saju.dayStem as keyof typeof stemColorNames] || ""
    const animalName = branchAnimals[saju.dayBranch as keyof typeof branchAnimals] || ""
    const element = stemElements[saju.dayStem as keyof typeof stemElements] || ""
    const elementName = elementNames[element as keyof typeof elementNames] || ""
    const ilju = `${saju.dayStem}${saju.dayBranch}`

    return { colorName, animalName, element, elementName, ilju }
  }

  const dayMasterInfo = getDayMasterInfo()
  const displayName = name || saju.name || "사용자"

  // Card layout for mobile chat
  if (variant === "card") {
    return (
      <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-foreground">
            {displayName}님의 사주: {dayMasterInfo.ilju}일주
          </h3>
        </div>

        {/* 4-pillar grid */}
        <div className="space-y-3">
          {/* Headers */}
          <div className="grid grid-cols-4 gap-2 text-center text-sm text-muted-foreground mb-2">
            <div>시주</div>
            <div>일주</div>
            <div>월주</div>
            <div>년주</div>
          </div>

          {/* Stems */}
          <div className="grid grid-cols-4 gap-2">
            <div
              className={`${timeUnknown ? elementColors.unknown : getStemColor(saju.hourStem)} text-white rounded-lg p-3 text-center shadow-sm`}
            >
              <div className="text-xl font-bold">{timeUnknown ? "?" : saju.hourStem}</div>
              <div className="text-xs">{timeUnknown ? "" : saju.hourStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.dayStem)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.dayStem}</div>
              <div className="text-xs">{saju.dayStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.monthStem)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.monthStem}</div>
              <div className="text-xs">{saju.monthStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.yearStem)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.yearStem}</div>
              <div className="text-xs">{saju.yearStemHanja}</div>
            </div>
          </div>

          {/* Sibseong for stems - increased height */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">
              {timeUnknown ? "" : saju.hourStemSibseong}
            </div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">
              {saju.dayStemSibseong || "본원"}
            </div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.monthStemSibseong}</div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.yearStemSibseong}</div>
          </div>

          {/* Branches */}
          <div className="grid grid-cols-4 gap-2">
            <div
              className={`${timeUnknown ? elementColors.unknown : getBranchColor(saju.hourBranch)} text-white rounded-lg p-3 text-center shadow-sm`}
            >
              <div className="text-xl font-bold">{timeUnknown ? "?" : saju.hourBranch}</div>
              <div className="text-xs">{timeUnknown ? "" : saju.hourBranchHanja}</div>
            </div>
            <div className={`${getBranchColor(saju.dayBranch)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.dayBranch}</div>
              <div className="text-xs">{saju.dayBranchHanja}</div>
            </div>
            <div className={`${getBranchColor(saju.monthBranch)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.monthBranch}</div>
              <div className="text-xs">{saju.monthBranchHanja}</div>
            </div>
            <div className={`${getBranchColor(saju.yearBranch)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.yearBranch}</div>
              <div className="text-xs">{saju.yearBranchHanja}</div>
            </div>
          </div>

          {/* Sibseong for branches - increased height */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">
              {timeUnknown ? "" : saju.hourBranchSibseong}
            </div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.dayBranchSibseong}</div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.monthBranchSibseong}</div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.yearBranchSibseong}</div>
          </div>
        </div>
      </div>
    )
  }

  // Sidebar compact layout with text colors
  if (variant === "sidebar") {
    return (
      <div className="p-2 space-y-3">
        <Collapsible open={!profileCollapsed} onOpenChange={(open) => setProfileCollapsed(!open)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-2 hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs">👤</span>
                </div>
                <span className="text-sm font-medium">사주프로필</span>
              </div>
              {profileCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-2">
            {/* Profile Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {displayName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{displayName}의 사주 ⭐</h3>
                  <p className="text-xs text-red-500">
                    {dayMasterInfo.ilju}일주 ({dayMasterInfo.elementName}) {dayMasterInfo.colorName}
                    {dayMasterInfo.animalName}
                  </p>
                </div>
              </div>

              {/* Birth Info */}
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-start gap-2">
                  <span>생일</span>
                  <span>
                    {defaultProfile?.birthYear || solarYear || ""}. {defaultProfile?.birthMonth || solarMonth || ""}.{" "}
                    {defaultProfile?.birthDay || solarDay || ""}(양력)
                  </span>
                </div>
                <div className="flex justify-start gap-2">
                  <span>생시</span>
                  <span>
                    {(defaultProfile?.timeUnknown ?? timeUnknown)
                      ? "시간 모름"
                      : `${String((defaultProfile?.birthHour ?? hour) || "00").padStart(2, "0")}시 ${String((defaultProfile?.birthMinute ?? minute) || "00").padStart(2, "0")}분`}
                    , {defaultProfile?.location || location || "서울특별시"}
                  </span>
                </div>
                <div className="flex justify-start gap-2">
                  <span>성별</span>
                  <span>
                    {(defaultProfile?.gender || gender) === "male"
                      ? "남성"
                      : (defaultProfile?.gender || gender) === "female"
                        ? "여성"
                        : "미상"}
                  </span>
                </div>
              </div>
            </div>

            {/* Saju Chart Header */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium">사주팔자 상세</span>
              <InfoIcon className="w-3 h-3 text-muted-foreground" />
            </div>

            {/* Compact 4-pillar chart with text colors */}
            <div className="space-y-1">
              {/* Headers */}
              <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
                <div>시주</div>
                <div>일주</div>
                <div>월주</div>
                <div>년주</div>
              </div>

              {/* Stems with text colors */}
              <div className="grid grid-cols-4 gap-1">
                <div
                  className={`${timeUnknown ? "text-muted-foreground" : getStemColor(saju.hourStem, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{timeUnknown ? "?" : saju.hourStem}</div>
                  <div className="text-xs text-muted-foreground">{timeUnknown ? "" : saju.hourStemHanja}</div>
                </div>
                <div
                  className={`${getStemColor(saju.dayStem, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{saju.dayStem}</div>
                  <div className="text-xs text-muted-foreground">{saju.dayStemHanja}</div>
                </div>
                <div
                  className={`${getStemColor(saju.monthStem, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{saju.monthStem}</div>
                  <div className="text-xs text-muted-foreground">{saju.monthStemHanja}</div>
                </div>
                <div
                  className={`${getStemColor(saju.yearStem, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{saju.yearStem}</div>
                  <div className="text-xs text-muted-foreground">{saju.yearStemHanja}</div>
                </div>
              </div>

              {/* Sibseong for stems */}
              <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {timeUnknown ? "" : saju.hourStemSibseong}
                </div>
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {saju.dayStemSibseong || "본원"}
                </div>
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {saju.monthStemSibseong}
                </div>
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {saju.yearStemSibseong}
                </div>
              </div>

              {/* Branches with text colors */}
              <div className="grid grid-cols-4 gap-1">
                <div
                  className={`${timeUnknown ? "text-muted-foreground" : getBranchColor(saju.hourBranch, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{timeUnknown ? "?" : saju.hourBranch}</div>
                  <div className="text-xs text-muted-foreground">{timeUnknown ? "" : saju.hourBranchHanja}</div>
                </div>
                <div
                  className={`${getBranchColor(saju.dayBranch, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{saju.dayBranch}</div>
                  <div className="text-xs text-muted-foreground">{saju.dayBranchHanja}</div>
                </div>
                <div
                  className={`${getBranchColor(saju.monthBranch, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{saju.monthBranch}</div>
                  <div className="text-xs text-muted-foreground">{saju.monthBranchHanja}</div>
                </div>
                <div
                  className={`${getBranchColor(saju.yearBranch, true)} bg-muted rounded p-1 text-center font-bold border`}
                >
                  <div className="text-xs font-bold">{saju.yearBranch}</div>
                  <div className="text-xs text-muted-foreground">{saju.yearBranchHanja}</div>
                </div>
              </div>

              {/* Sibseong for branches */}
              <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {timeUnknown ? "" : saju.hourBranchSibseong}
                </div>
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {saju.dayBranchSibseong}
                </div>
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {saju.monthBranchSibseong}
                </div>
                <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
                  {saju.yearBranchSibseong}
                </div>
              </div>
            </div>

            {/* Add profile management button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 bg-transparent text-xs h-8"
              onClick={() => setIsProfileDialogOpen(true)}
            >
              등록된 사주 정보 보기
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Profile Management Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>프로필 관리</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsProfileDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[600px]">
              {/* Main Profile Section */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded bg-muted" />
                  대표 프로필
                </div>

                {defaultProfile && (
                  <div className="bg-muted rounded-lg p-3 md:p-6 space-y-3 md:space-y-4">
                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-lg bg-red-400 flex items-center justify-center text-white text-lg md:text-2xl font-bold">
                      {defaultProfile.name?.charAt(0) || "?"}
                    </div>

                    <div>
                      <h3 className="text-base md:text-lg font-bold">{defaultProfile.name}의 사주</h3>
                      <p className="text-sm text-red-500">
                        {defaultProfile.saju?.dayStem}
                        {defaultProfile.saju?.dayBranch}일주
                      </p>
                    </div>

                    <div className="space-y-1 md:space-y-2 text-sm">
                      <div>
                        생일: {defaultProfile.birthYear || ""}.{defaultProfile.birthMonth || ""}.
                        {defaultProfile.birthDay || ""}(양력)
                      </div>
                      <div>
                        생시:{" "}
                        {defaultProfile.timeUnknown
                          ? "시간 모름"
                          : `${String(defaultProfile.birthHour || "00").padStart(2, "0")}:${String(defaultProfile.birthMinute || "00").padStart(2, "0")}`}
                        , {defaultProfile.location || "서울특별시"}
                      </div>
                      <div>성별: {defaultProfile.gender === "male" ? "남성" : "여성"}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditProfile(defaultProfile)}>
                        프로필 편집
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profiles List Section */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded bg-muted" />
                    등록된 프로필
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    프로필 추가
                  </Button>
                </div>

                <div className="space-y-3 max-h-[300px] md:max-h-[500px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    sajuProfiles.map((profile, index) => {
                      const isMain = defaultProfile?.id === profile.id
                      const colors = [
                        "bg-red-400",
                        "bg-orange-400",
                        "bg-blue-400",
                        "bg-purple-400",
                        "bg-green-400",
                        "bg-pink-400",
                        "bg-indigo-400",
                      ]
                      const bgColor = colors[index % colors.length]

                      return (
                        <div
                          key={profile.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <div
                            className={`w-10 h-10 rounded ${bgColor} flex items-center justify-center text-white font-bold`}
                          >
                            {profile.name?.charAt(0) || "?"}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {isMain && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">대표</span>
                              )}
                              <span className="font-medium truncate">{profile.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {profile.gender === "male" ? "남성" : "여성"} • {profile.birthYear || ""}.
                              {profile.birthMonth || ""}.{profile.birthDay || ""}(양력)
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditProfile(profile)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCompatibilityCheck(profile)}
                              title="궁합보기"
                            >
                              <Heart className="h-4 w-4 text-pink-500" />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>프로필 편집</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">이름</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label>성별</Label>
                <RadioGroup
                  value={editForm.gender}
                  onValueChange={(value) => setEditForm({ ...editForm, gender: value })}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="edit-female" />
                    <Label htmlFor="edit-female">여성</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="edit-male" />
                    <Label htmlFor="edit-male">남성</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-year">년</Label>
                  <Input
                    id="edit-year"
                    value={editForm.birthYear}
                    onChange={(e) => setEditForm({ ...editForm, birthYear: e.target.value })}
                    placeholder="1998"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-month">월</Label>
                  <Input
                    id="edit-month"
                    value={editForm.birthMonth}
                    onChange={(e) => setEditForm({ ...editForm, birthMonth: e.target.value })}
                    placeholder="04"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-day">일</Label>
                  <Input
                    id="edit-day"
                    value={editForm.birthDay}
                    onChange={(e) => setEditForm({ ...editForm, birthDay: e.target.value })}
                    placeholder="07"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>태어난 시간</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-timeUnknown"
                      checked={editForm.timeUnknown}
                      onChange={(e) => setEditForm({ ...editForm, timeUnknown: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-timeUnknown" className="text-sm">
                      시간 모름
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={editForm.birthHour}
                    onChange={(e) => setEditForm({ ...editForm, birthHour: e.target.value })}
                    placeholder="시"
                    disabled={editForm.timeUnknown}
                  />
                  <Input
                    value={editForm.birthMinute}
                    onChange={(e) => setEditForm({ ...editForm, birthMinute: e.target.value })}
                    placeholder="분"
                    disabled={editForm.timeUnknown}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>태어난 도시</Label>
                <CitySearch
                  value={editForm.birthCityId}
                  onChange={(value) => setEditForm({ ...editForm, birthCityId: value })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingProfile(null)} className="flex-1">
                  취소
                </Button>
                <Button onClick={handleUpdateProfile} className="flex-1">
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Original chat layout with background colors and improved design
  return (
    <div className="space-y-4">
      {/* Profile section */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg shadow-sm">
        <div className="w-16 h-16 rounded-xl bg-red-400 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
          {displayName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{displayName}의 사주</h2>
            <span className="text-muted-foreground">⭐</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  <InfoIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">사주란?</p>
                  <p>사주는 태어난 년, 월, 일, 시의 천간과 지지를 나타내는 8개의 글자로 구성됩니다.</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {dayMasterInfo.ilju && (
            <p className="text-red-500 font-medium">
              {dayMasterInfo.ilju}일주 ({dayMasterInfo.elementName}) {dayMasterInfo.colorName}
              {dayMasterInfo.animalName}
            </p>
          )}
        </div>
      </div>

      {/* Birth info - Fixed time display */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">생일</span>
          <span>
            {defaultProfile?.birthYear || ""}. {defaultProfile?.birthMonth || ""}. {defaultProfile?.birthDay || ""}
            (양력)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">생시</span>
          <span>
            {defaultProfile?.timeUnknown
              ? "시간 모름"
              : `${String(defaultProfile?.birthHour || "00").padStart(2, "0")}시 ${String(defaultProfile?.birthMinute || "00").padStart(2, "0")}분`}
            , {defaultProfile?.location || "서울특별시"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">성별</span>
          <span>
            {defaultProfile?.gender === "male" ? "남성" : defaultProfile?.gender === "female" ? "여성" : "미상"}
          </span>
        </div>
      </div>

      {/* Saju chart header */}
      <div className="flex items-center gap-2">
        <h3 className="font-medium">사주팔자 상세</h3>
        <InfoIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* 4-pillar chart with background colors and shadows */}
      <div className="grid grid-cols-4 gap-3">
        {/* Headers */}
        <div className="text-center text-sm text-muted-foreground">시주</div>
        <div className="text-center text-sm text-muted-foreground">일주</div>
        <div className="text-center text-sm text-muted-foreground">월주</div>
        <div className="text-center text-sm text-muted-foreground">년주</div>

        {/* Stems with background colors */}
        <div
          className={`${timeUnknown ? elementColors.unknown : getStemColor(saju.hourStem)} text-white rounded-lg p-4 text-center shadow-md`}
        >
          <div className="text-2xl font-bold">{timeUnknown ? "?" : saju.hourStem}</div>
          <div className="text-sm">{timeUnknown ? "" : saju.hourStemHanja}</div>
        </div>
        <div className={`${getStemColor(saju.dayStem)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.dayStem}</div>
          <div className="text-sm">{saju.dayStemHanja}</div>
        </div>
        <div className={`${getStemColor(saju.monthStem)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.monthStem}</div>
          <div className="text-sm">{saju.monthStemHanja}</div>
        </div>
        <div className={`${getStemColor(saju.yearStem)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.yearStem}</div>
          <div className="text-sm">{saju.yearStemHanja}</div>
        </div>

        {/* Sibseong for stems - increased height */}
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {timeUnknown ? "" : saju.hourStemSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.dayStemSibseong || "본원"}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.monthStemSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.yearStemSibseong}
        </div>

        {/* Branches with background colors */}
        <div
          className={`${timeUnknown ? elementColors.unknown : getBranchColor(saju.hourBranch)} text-white rounded-lg p-4 text-center shadow-md`}
        >
          <div className="text-2xl font-bold">{timeUnknown ? "?" : saju.hourBranch}</div>
          <div className="text-sm">{timeUnknown ? "" : saju.hourBranchHanja}</div>
        </div>
        <div className={`${getBranchColor(saju.dayBranch)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.dayBranch}</div>
          <div className="text-sm">{saju.dayBranchHanja}</div>
        </div>
        <div className={`${getBranchColor(saju.monthBranch)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.monthBranch}</div>
          <div className="text-sm">{saju.monthBranchHanja}</div>
        </div>
        <div className={`${getBranchColor(saju.yearBranch)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.yearBranch}</div>
          <div className="text-sm">{saju.yearBranchHanja}</div>
        </div>

        {/* Sibseong for branches - increased height */}
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {timeUnknown ? "" : saju.hourBranchSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.dayBranchSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.monthBranchSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.yearBranchSibseong}
        </div>
      </div>
    </div>
  )
}

// Add named export
export { SajuDiagram }
