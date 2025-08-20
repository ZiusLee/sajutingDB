import { supabase } from "./supabase-client"

export interface PartnerInfo {
  id?: string
  name: string
  gender: string
  year: number
  month: number
  day: number
  hour: number | null
  minute: number | null
  timeUnknown: boolean
  relationshipStatus?: string
  createdAt?: number
  saju?: any
}

export async function syncLocalStorageToDatabase(authUserId?: string | null): Promise<string | null> {
  try {
    console.log("Starting data sync to database...")

    // Get stored saju data from localStorage
    const storedData = localStorage.getItem("tempSajuData")
    if (!storedData) {
      console.log("No temp saju data found in localStorage")
      return null
    }

    const sajuData = JSON.parse(storedData)
    console.log("Saju data from localStorage:", sajuData)

    // Use provided authUserId or get from current session
    let userId = authUserId
    if (!userId) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      userId = session?.user?.id || null
    }

    console.log("Auth user ID:", userId)

    // 현재 사용자 ID를 사주 데이터에 추가
    if (userId) {
      sajuData.userId = userId
      sajuData.authUserId = userId
      localStorage.setItem("tempSajuData", JSON.stringify(sajuData))
    }

    // Prepare time data for database storage
    const timeData = {
      solar_hour: sajuData.timeUnknown ? null : sajuData.hour,
      solar_minute: sajuData.timeUnknown ? null : sajuData.minute,
      time_unknown: sajuData.timeUnknown || false,
    }

    console.log("Storing saju data with time info:", {
      parsedHour: sajuData.hour,
      parsedMinute: sajuData.minute,
      timeUnknown: sajuData.timeUnknown,
    })

    // Create a new saju session
    const sessionData = {
      name: sajuData.name,
      gender: sajuData.gender,
      auth_user_id: userId, // This can be null for anonymous users
      is_default: true, // 첫 번째 세션이므로 기본값으로 설정
      saju: {
        yearStem: sajuData.yearStem,
        yearBranch: sajuData.yearBranch,
        yearStemHanja: sajuData.yearStemHanja,
        yearBranchHanja: sajuData.yearBranchHanja,
        monthStem: sajuData.monthStem,
        monthBranch: sajuData.monthBranch,
        monthStemHanja: sajuData.monthStemHanja,
        monthBranchHanja: sajuData.monthBranchHanja,
        dayStem: sajuData.dayStem,
        dayBranch: sajuData.dayBranch,
        dayStemHanja: sajuData.dayStemHanja,
        dayBranchHanja: sajuData.dayBranchHanja,
        hourStem: sajuData.hourStem,
        hourBranch: sajuData.hourBranch,
        hourStemHanja: sajuData.hourStemHanja,
        hourBranchHanja: sajuData.hourBranchHanja,
        dayMaster: sajuData.dayMaster,
        dayMasterHanja: sajuData.dayMasterHanja,
        yearAnimal: sajuData.yearAnimal,
        elements: sajuData.elements,
        yearStemSibseong: sajuData.yearStemSibseong,
        monthStemSibseong: sajuData.monthStemSibseong,
        dayStemSibseong: sajuData.dayStemSibseong,
        hourStemSibseong: sajuData.hourStemSibseong,
        yearBranchSibseong: sajuData.yearBranchSibseong,
        monthBranchSibseong: sajuData.monthBranchSibseong,
        dayBranchSibseong: sajuData.dayBranchSibseong,
        hourBranchSibseong: sajuData.hourBranchSibseong,
      },
      daeun: sajuData.daeun || null,
    }

    console.log("Creating saju session with data:", sessionData)

    const { data: sessionResult, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert(sessionData)
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      return null
    }

    const sessionId = sessionResult.id
    console.log("Created saju session:", sessionId)

    // Insert birth info into database
    const birthInfoData = {
      user_id: sessionId, // Use session ID as user_id
      solar_year: sajuData.year,
      solar_month: sajuData.month,
      solar_day: sajuData.day,
      ...timeData,
      lunar_year: sajuData.lunarYear,
      lunar_month: sajuData.lunarMonth,
      lunar_day: sajuData.lunarDay,
      is_leap_month: sajuData.isLeapMonth || false,
    }

    const { data: birthInfo, error: birthError } = await supabase
      .from("birth_info")
      .insert(birthInfoData)
      .select("id")
      .single()

    if (birthError) {
      console.error("Error inserting birth info:", birthError)
      return null
    }

    console.log("Birth info inserted successfully:", birthInfo.id)

    // Insert saju info into database
    const sajuInfoData = {
      user_id: sessionId,
      year_stem: sajuData.yearStem,
      year_branch: sajuData.yearBranch,
      year_stem_hanja: sajuData.yearStemHanja,
      year_branch_hanja: sajuData.yearBranchHanja,
      month_stem: sajuData.monthStem,
      month_branch: sajuData.monthBranch,
      month_stem_hanja: sajuData.monthStemHanja,
      month_branch_hanja: sajuData.monthBranchHanja,
      day_stem: sajuData.dayStem,
      day_branch: sajuData.dayBranch,
      day_stem_hanja: sajuData.dayStemHanja,
      day_branch_hanja: sajuData.dayBranchHanja,
      hour_stem: sajuData.hourStem,
      hour_branch: sajuData.hourBranch,
      hour_stem_hanja: sajuData.hourStemHanja,
      hour_branch_hanja: sajuData.hourBranchHanja,
      day_master: sajuData.dayMaster,
      day_master_hanja: sajuData.dayMasterHanja,
      year_animal: sajuData.yearAnimal,
    }

    const { data: sajuInfo, error: sajuError } = await supabase
      .from("saju_info")
      .insert(sajuInfoData)
      .select("id")
      .single()

    if (sajuError) {
      console.error("Error inserting saju info:", sajuError)
      return null
    }

    console.log("Saju info inserted successfully:", sajuInfo.id)

    // Insert elements into database
    if (sajuData.elements) {
      const elementsData = {
        saju_id: sajuInfo.id,
        wood: sajuData.elements.wood || 0,
        fire: sajuData.elements.fire || 0,
        earth: sajuData.elements.earth || 0,
        metal: sajuData.elements.metal || 0,
        water: sajuData.elements.water || 0,
      }

      const { error: elementsError } = await supabase.from("elements").insert(elementsData)

      if (elementsError) {
        console.error("Error inserting elements:", elementsError)
      } else {
        console.log("Elements inserted successfully")
      }
    }

    // Insert interpretation if available
    if (sajuData.interpretation) {
      const interpretationData = {
        user_id: sessionId,
        basic_interpretation: sajuData.interpretation,
        model_used: "local",
        response_time: "0ms",
      }

      const { error: interpretationError } = await supabase.from("interpretations").insert(interpretationData)

      if (interpretationError) {
        console.error("Error inserting interpretation:", interpretationError)
      } else {
        console.log("Interpretation inserted successfully")
      }
    }

    // 동기화 완료 후 current_saju에도 사용자 정보 업데이트
    const currentSaju = localStorage.getItem("current_saju")
    if (currentSaju && userId) {
      try {
        const parsedCurrentSaju = JSON.parse(currentSaju)
        parsedCurrentSaju.userId = userId
        parsedCurrentSaju.authUserId = userId
        parsedCurrentSaju.sessionId = sessionId
        localStorage.setItem("current_saju", JSON.stringify(parsedCurrentSaju))
      } catch (error) {
        console.error("Error updating current_saju with user info:", error)
      }
    }

    console.log("Data sync completed successfully")
    return sessionId
  } catch (error) {
    console.error("Error in syncLocalStorageToDatabase:", error)
    return null
  }
}

export async function getUserSajuData(userId: string) {
  try {
    const { data, error } = await supabase
      .from("birth_info")
      .select(`
        *,
        daeun_cycles (*)
      `)
      .eq("auth_user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user saju data:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in getUserSajuData:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export function savePartnerInfo(partner: PartnerInfo): string {
  try {
    const existingDataStr = localStorage.getItem("saved_partners")
    const existingData: PartnerInfo[] = existingDataStr ? JSON.parse(existingDataStr) : []

    const partnerId = partner.id || `partner_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const newPartner: PartnerInfo = {
      ...partner,
      id: partnerId,
      createdAt: Date.now(),
      saju: partner.saju || null,
    }

    const existingIndex = existingData.findIndex((p) => p.id === partnerId)

    if (existingIndex >= 0) {
      existingData[existingIndex] = newPartner
    } else {
      existingData.push(newPartner)
    }

    const sortedData = existingData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    const limitedData = sortedData.slice(0, 20)

    localStorage.setItem("saved_partners", JSON.stringify(limitedData))

    console.log(`상대방 정보 저장 성공: ${partner.name}`)
    return partnerId
  } catch (error) {
    console.error("Error saving partner info to localStorage:", error)
    return ""
  }
}

export function getSavedPartners(): PartnerInfo[] {
  try {
    const savedPartnersStr = localStorage.getItem("saved_partners")
    if (!savedPartnersStr) return []

    const savedPartners: PartnerInfo[] = JSON.parse(savedPartnersStr)
    return savedPartners.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  } catch (error) {
    console.error("Error getting saved partners from localStorage:", error)
    return []
  }
}

export function deletePartnerInfo(partnerId: string): boolean {
  try {
    const savedPartnersStr = localStorage.getItem("saved_partners")
    if (!savedPartnersStr) return false

    const savedPartners: PartnerInfo[] = JSON.parse(savedPartnersStr)
    const filteredPartners = savedPartners.filter((p) => p.id !== partnerId)

    localStorage.setItem("saved_partners", JSON.stringify(filteredPartners))
    return true
  } catch (error) {
    console.error("Error deleting partner info from localStorage:", error)
    return false
  }
}

export async function clearTempData() {
  try {
    localStorage.removeItem("tempSajuData")
    console.log("Cleared temp saju data from localStorage")
  } catch (error) {
    console.error("Error clearing temp data:", error)
  }
}

export async function updateSessionWithAuthUser(sessionId: string, authUserId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("saju_sessions").update({ auth_user_id: authUserId }).eq("id", sessionId)

    if (error) {
      console.error("Error updating session with auth user:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateSessionWithAuthUser:", error)
    return false
  }
}
