"use client"

import type { Saju } from "@/lib/saju"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { getUserSajuProfiles, getDefaultSajuSession, getSajuProfileBySessionId } from "@/lib/saju-session-service"
import { toast } from "@/components/ui/use-toast"
import { DEFAULT_CITY_ID } from "@/lib/city-timezone-data"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

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
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [defaultProfile, setDefaultProfileState] = useState<any>(null)
  const activeSaju = variant === "sidebar" && defaultProfile?.saju ? defaultProfile.saju : saju

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

  const elementNames = {
    wood: "목(木)",
    fire: "화(火)",
    earth: "토(土)",
    metal: "금(金)",
    water: "수(水)",
  }

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
  // const stemElements = {
  //   갑: "wood",
  //   을: "wood",
  //   병: "fire",
  //   정: "fire",
  //   무: "earth",
  //   기: "earth",
  //   경: "metal",
  //   신: "metal",
  //   임: "water",
  //   계: "water",
  // }

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
  // const branchAnimals = {
  //   자: "쥐",
  //   축: "소",
  //   인: "호랑이",
  //   묘: "토끼",
  //   진: "용",
  //   사: "뱀",
  //   오: "말",
  //   미: "양",
  //   신: "원숭이",
  //   유: "닭",
  //   술: "개",
  //   해: "돼지",
  // }

  // 천간 색상 이름
  // const stemColorNames = {
  //   갑: "푸른",
  //   을: "푸른",
  //   병: "붉은",
  //   정: "붉은",
  //   무: "황색",
  //   기: "황색",
  //   경: "하얀",
  //   신: "하얀",
  //   임: "검은",
  //   계: "검은",
  // }

  // 오행 이름
  // const elementNames = {
  //   wood: "목(木)",
  //   fire: "화(火)",
  //   earth: "토(土)",
  //   metal: "금(金)",
  //   water: "수(水)",
  // }

  // Add profile management state and logic for sidebar variant
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isAddProfileDialogOpen, setIsAddProfileDialogOpen] = useState(false)
  const [sajuProfiles, setSajuProfiles] = useState<any[]>([])
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
    console.log("[v0] handleEditProfile - profile data:", profile)
    console.log("[v0] handleEditProfile - profile.gender:", profile.gender)

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

    console.log("[v0] handleEditProfile - editForm after setting:", {
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
      console.log("[v0] handleUpdateProfile - editForm at start:", editForm)
      console.log("[v0] handleUpdateProfile - editForm.gender:", editForm.gender)
      console.log("[v0] handleUpdateProfile - typeof editForm.gender:", typeof editForm.gender)

      // Validate required fields
      const requiredFields = ["name", "birthYear", "birthMonth", "birthDay"]
      for (const field of requiredFields) {
        if (!editForm[field]) {
          throw new Error(`${field} is required`)
        }
      }

      console.log("[v0] handleUpdateProfile - after validation, editForm:", editForm)

      // Validate numeric fields
      const numericFields = ["birthYear", "birthMonth", "birthDay"]
      if (!editForm.timeUnknown) {
        numericFields.push("birthHour", "birthMinute")
      }

      for (const field of numericFields) {
        const value = Number.parseInt(editForm[field])
        if (isNaN(value)) {
          throw new Error(`${field} must be a valid number`)
        }
      }

      console.log("[v0] handleUpdateProfile - after numeric validation, gender:", editForm.gender)

      // Ensure gender is a valid string
      const validGender = editForm.gender && typeof editForm.gender === "string" ? editForm.gender : "female"
      console.log("[v0] handleUpdateProfile - validGender:", validGender)

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
      let lunarDate: any = null // Declare lunarDate variable

      if (birthDateChanged) {
        const birthYear = Number.parseInt(editForm.birthYear)
        const birthMonth = Number.parseInt(editForm.birthMonth)
        const birthDay = Number.parseInt(editForm.birthDay)
        const birthHour = editForm.timeUnknown ? 12 : Number.parseInt(editForm.birthHour)
        const birthMinute = editForm.timeUnknown ? 0 : Number.parseInt(editForm.birthMinute)

        // 유효성 검사
        if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
          throw new Error("생년월일 정보가 올바르지 않습니다.")
        }

        if (!editForm.timeUnknown && (isNaN(birthHour) || isNaN(birthMinute))) {
          throw new Error("시간 정보가 올바르지 않습니다.")
        }

        const { solarToLunar } = await import("@/lib/lunar-calendar")
        const { calculateSaju } = await import("@/lib/saju")
        const { calculateDaeunInfo } = await import("@/lib/daeun-calculator")
        const { getCityById } = await import("@/lib/city-timezone-data")

        // 음력 날짜 계산
        lunarDate = solarToLunar(birthYear, birthMonth, birthDay)

        // 도시 정보 가져오기
        const cityInfo = getCityById(editForm.birthCityId)

        updatedSaju = calculateSaju(
          lunarDate.year, // lunarYear
          lunarDate.month, // lunarMonth
          lunarDate.day, // lunarDay
          birthHour, // hour
          birthMinute, // minute
          birthYear, // solarYear
          birthMonth, // solarMonth
          birthDay, // solarDay
          validGender, // 검증된 gender 사용
          editForm.name, // name
          editForm.timeUnknown, // timeUnknown
          lunarDate.isLeapMonth || false, // isLeapMonth
          undefined, // apiMonthStem
          undefined, // apiMonthBranch
          cityInfo?.timeStandard || "동경135도", // timeStandard
        )

        // 새로운 대운 계산
        updatedDaeun = calculateDaeunInfo(
          updatedSaju,
          lunarDate.year,
          lunarDate.month,
          lunarDate.day,
          validGender,
          editForm.timeUnknown ? undefined : birthHour,
          editForm.timeUnknown ? undefined : birthMinute,
          editForm.timeUnknown,
        )
      }

      const finalGender = editForm.gender && typeof editForm.gender === "string" ? editForm.gender : "male"

      // 데이터베이스 업데이트
      const { error: updateError } = await supabase
        .from("saju_sessions")
        .update({
          name: editForm.name,
          gender: finalGender, // 검증된 gender 사용
          saju: updatedSaju,
          daeun: updatedDaeun,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProfile.id)

      if (updateError) {
        console.error("[v0] Error updating saju_sessions:", updateError)
        throw updateError
      }

      console.log("[v0] editingProfile:", editingProfile)
      console.log("[v0] editingProfile.auth_user_id:", editingProfile?.auth_user_id)
      console.log("[v0] editingProfile.id:", editingProfile?.id)

      // Update birth_info table separately
      if (editForm.birthCityId) {
        const userId = editingProfile?.id
        console.log("[v0] Using saju_sessions.id for birth_info update:", userId)

        if (!userId) {
          throw new Error("Cannot update birth_info: saju_sessions ID is undefined")
        }

        const { error: birthInfoError } = await supabase
          .from("birth_info")
          .update({
            birth_city_id: editForm.birthCityId,
            solar_year: Number.parseInt(editForm.birthYear),
            solar_month: Number.parseInt(editForm.birthMonth),
            solar_day: Number.parseInt(editForm.birthDay),
            solar_hour: editForm.timeUnknown ? 12 : Number.parseInt(editForm.birthHour),
            solar_minute: editForm.timeUnknown ? 0 : Number.parseInt(editForm.birthMinute),
            lunar_year: lunarDate.year,
            lunar_month: lunarDate.month,
            lunar_day: lunarDate.day,
            time_unknown: editForm.timeUnknown,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)

        if (birthInfoError) {
          console.error("[v0] Error updating birth_info:", birthInfoError)
          throw birthInfoError
        }
      }

      if (birthDateChanged && updatedSaju) {
        const userId = editingProfile?.id

        if (!userId) {
          throw new Error("Cannot update saju_info: saju_sessions ID is undefined")
        }

        // Check if saju_info record exists
        const { data: existingSajuInfo, error: checkError } = await supabase
          .from("saju_info")
          .select("id")
          .eq("user_id", userId)
          .single()

        const sajuInfoData = {
          user_id: userId,
          year_stem: updatedSaju.yearStem,
          year_branch: updatedSaju.yearBranch,
          year_stem_hanja: updatedSaju.yearStemHanja,
          year_branch_hanja: updatedSaju.yearBranchHanja,
          month_stem: updatedSaju.monthStem,
          month_branch: updatedSaju.monthBranch,
          month_stem_hanja: updatedSaju.monthStemHanja,
          month_branch_hanja: updatedSaju.monthBranchHanja,
          day_stem: updatedSaju.dayStem,
          day_branch: updatedSaju.dayBranch,
          day_stem_hanja: updatedSaju.dayStemHanja,
          day_branch_hanja: updatedSaju.dayBranchHanja,
          hour_stem: updatedSaju.hourStem,
          hour_branch: updatedSaju.hourBranch,
          hour_stem_hanja: updatedSaju.hourStemHanja,
          hour_branch_hanja: updatedSaju.hourBranchHanja,
          day_master: updatedSaju.dayMaster,
          day_master_hanja: updatedSaju.dayMasterHanja,
          year_animal: updatedSaju.yearAnimal,
          year_stem_sibseong: updatedSaju.yearStemSibseong,
          month_stem_sibseong: updatedSaju.monthStemSibseong,
          day_stem_sibseong: updatedSaju.dayStemSibseong,
          hour_stem_sibseong: updatedSaju.hourStemSibseong,
          year_branch_sibseong: updatedSaju.yearBranchSibseong,
          month_branch_sibseong: updatedSaju.monthBranchSibseong,
          day_branch_sibseong: updatedSaju.dayBranchSibseong,
          hour_branch_sibseong: updatedSaju.hourBranchSibseong,
          updated_at: new Date().toISOString(),
        }

        let sajuInfoId: string

        if (existingSajuInfo) {
          // Update existing saju_info
          const { error: sajuInfoUpdateError } = await supabase
            .from("saju_info")
            .update(sajuInfoData)
            .eq("id", existingSajuInfo.id)

          if (sajuInfoUpdateError) {
            console.error("[v0] Error updating saju_info:", sajuInfoUpdateError)
            throw sajuInfoUpdateError
          }
          sajuInfoId = existingSajuInfo.id
        } else {
          // Create new saju_info
          const { data: newSajuInfo, error: sajuInfoCreateError } = await supabase
            .from("saju_info")
            .insert({ ...sajuInfoData, created_at: new Date().toISOString() })
            .select("id")
            .single()

          if (sajuInfoCreateError) {
            console.error("[v0] Error creating saju_info:", sajuInfoCreateError)
            throw sajuInfoCreateError
          }
          sajuInfoId = newSajuInfo.id
        }

        // Update or create elements record
        if (updatedSaju.elements && sajuInfoId) {
          const { data: existingElements, error: elementsCheckError } = await supabase
            .from("elements")
            .select("id")
            .eq("saju_id", sajuInfoId)
            .single()

          const elementsData = {
            saju_id: sajuInfoId,
            wood: updatedSaju.elements.wood || 0,
            fire: updatedSaju.elements.fire || 0,
            earth: updatedSaju.elements.earth || 0,
            metal: updatedSaju.elements.metal || 0,
            water: updatedSaju.elements.water || 0,
            updated_at: new Date().toISOString(),
          }

          if (existingElements) {
            // Update existing elements
            const { error: elementsUpdateError } = await supabase
              .from("elements")
              .update(elementsData)
              .eq("id", existingElements.id)

            if (elementsUpdateError) {
              console.error("[v0] Error updating elements:", elementsUpdateError)
            }
          } else {
            // Create new elements
            const { error: elementsCreateError } = await supabase
              .from("elements")
              .insert({ ...elementsData, created_at: new Date().toISOString() })

            if (elementsCreateError) {
              console.error("[v0] Error creating elements:", elementsCreateError)
            }
          }
        }
      }

      toast({
        title: "프로필 수정 완료",
        description: "프로필이 성공적으로 수정되었습니다.",
      })

      // 편집 모드 종료
      setEditingProfile(null)

      // 프로필 목록 새로고침
      await loadSajuProfiles()

      // 부모 컴포넌트에 변경사항 알림
      if (onProfileUpdate) {
        const updatedProfile = {
          ...editingProfile,
          name: editForm.name,
          gender: finalGender, // 검증된 gender 사용
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
        onProfileUpdate(updatedProfile)
      }

      if (variant === "sidebar") {
        // 약간의 지연 후 강제 새로고침을 통해 모든 컴포넌트가 최신 데이터를 반영하도록 함
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "프로필 수정 실패",
        description: error instanceof Error ? error.message : "프로필 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // Handle compatibility check
  // const handleCompatibilityCheck = async (profile: any) => {
  //   if (!defaultProfile) {
  //     toast({
  //       title: "오류",
  //       description: "대표 프로필이 설정되지 않았습니다.",
  //       variant: "destructive",
  //     })
  //     return
  //   }

  //   try {
  //     const compatibilityMessage = `${profile.name}와의 궁합을 알려줘`

  //     // 궁합 메시지를 sessionStorage에 저장하고 채팅 페이지로 이동
  //     sessionStorage.setItem("pending_compatibility_message", compatibilityMessage)

  //     sessionStorage.setItem("compatibility_profile", JSON.stringify(profile))
  //     sessionStorage.setItem("compatibility_default_profile", JSON.stringify(defaultProfile))

  //     // 일반 채팅방으로 이동 (궁합 전용 방이 아닌)
  //     window.location.href = "/saju-chat/general"

  //     toast({
  //       title: "궁합 분석 시작",
  //       description: `${defaultProfile.name}님과 ${profile.name}님의 궁합을 분석합니다.`,
  //     })
  //   } catch (error) {
  //     console.error("Error starting compatibility check:", error)
  //     toast({
  //       title: "오류 발생",
  //       description: "궁합 분석 시작 중 오류가 발생했습니다.",
  //       variant: "destructive",
  //     })
  //   }
  // }

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
      const compatibilityMessage = `${profile.name}와의 궁합을 알려줘`

      sessionStorage.setItem("pending_compatibility_message", compatibilityMessage)
      sessionStorage.setItem("compatibility_profile", JSON.stringify(profile))
      sessionStorage.setItem("compatibility_default_profile", JSON.stringify(defaultProfile))

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
  const getDayMasterInfo = (sajuData: any) => {
    if (sajuData.dayStem === "?" || sajuData.dayBranch === "?")
      return { colorName: "", animalName: "", element: "", ilju: "" }

    const colorName = stemColorNames[sajuData.dayStem as keyof typeof stemColorNames] || ""
    const animalName = branchAnimals[sajuData.dayBranch as keyof typeof branchAnimals] || ""
    const element = stemElements[sajuData.dayStem as keyof typeof stemElements] || ""
    const elementName = elementNames[element as keyof typeof elementNames] || ""
    const ilju = `${sajuData.dayStem}${sajuData.dayBranch}`

    return { colorName, animalName, element, elementName, ilju }
  }

  const handleNewProfileSuccess = async (sessionId: string) => {
    try {
      setIsAddProfileDialogOpen(false)
      await loadSajuProfiles() // 프로필 목록 새로고침
      toast({
        title: "프로필 추가 완료",
        description: "새로운 사주 프로필이 성공적으로 추가되었습니다.",
      })

      // 부모 컴포넌트에 변경사항 알림
      if (onProfileUpdate) {
        onProfileUpdate({ sessionId })
      }
    } catch (error) {
      console.error("Error refreshing profiles:", error)
      toast({
        title: "데이터 새로고침 오류",
        description: "프로필 목록을 새로고침하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const dayMasterInfo = getDayMasterInfo(activeSaju)
  const displayName = name || activeSaju.name || "사용자"

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
        </div>
      </div>
    )
  }

  // Additional code for other variants can be added here

  return <div>{/* Placeholder for other variants */}</div>
}
