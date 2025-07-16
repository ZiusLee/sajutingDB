import { createClient } from "@/lib/supabase-client"

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

export async function syncLocalStorageToDatabase() {
  try {
    console.log("Starting data sync to database...")

    // Get stored saju data from localStorage
    const storedData = localStorage.getItem("sajuData")
    if (!storedData) {
      console.log("No saju data found in localStorage")
      return { success: false, error: "No data to sync" }
    }

    const sajuData = JSON.parse(storedData)
    console.log("Saju data from localStorage:", sajuData)

    // Get session ID from localStorage
    const sessionId = localStorage.getItem("sessionId")
    if (!sessionId) {
      console.log("No session ID found in local storage.")
      return { success: false, error: "No session ID" }
    }

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log("Failed to get user ID when saving saju data")
      return { success: false, error: "User not authenticated" }
    }

    console.log("User authenticated:", user.id)

    // Prepare time data for database storage
    const timeData = {
      solar_hour: sajuData.timeUnknown ? null : sajuData.hour,
      solar_minute: sajuData.timeUnknown ? null : sajuData.minute,
      time_unknown: sajuData.timeUnknown || false,
    }

    console.log("Storing saju data with time info:", {
      originalInput: sajuData.originalTimeInput,
      parsedHour: sajuData.hour,
      parsedMinute: sajuData.minute,
      timeUnknown: sajuData.timeUnknown,
    })

    // Insert birth info into database
    const birthInfoData = {
      auth_user_id: user.id,
      name: sajuData.name,
      gender: sajuData.gender,
      relationship_status: sajuData.relationshipStatus,
      solar_year: sajuData.year,
      solar_month: sajuData.month,
      solar_day: sajuData.day,
      ...timeData,
      time_standard: sajuData.timeStandard || "동경135도",
      birth_city_id: sajuData.birthCityId,
      lunar_year: sajuData.lunarYear,
      lunar_month: sajuData.lunarMonth,
      lunar_day: sajuData.lunarDay,
      is_leap_month: sajuData.isLeapMonth || false,
      year_stem: sajuData.yearStem,
      year_branch: sajuData.yearBranch,
      month_stem: sajuData.monthStem,
      month_branch: sajuData.monthBranch,
      day_stem: sajuData.dayStem,
      day_branch: sajuData.dayBranch,
      hour_stem: sajuData.hourStem,
      hour_branch: sajuData.hourBranch,
      day_master: sajuData.dayMaster,
      year_animal: sajuData.yearAnimal,
      elements_wood: sajuData.elements?.wood || 0,
      elements_fire: sajuData.elements?.fire || 0,
      elements_earth: sajuData.elements?.earth || 0,
      elements_metal: sajuData.elements?.metal || 0,
      elements_water: sajuData.elements?.water || 0,
      interpretation: sajuData.interpretation,
      session_id: sessionId,
    }

    console.log("Inserting birth info with time data:", {
      solar_hour: birthInfoData.solar_hour,
      solar_minute: birthInfoData.solar_minute,
      time_unknown: birthInfoData.time_unknown,
    })

    const { data: birthInfo, error: birthError } = await supabase
      .from("birth_info")
      .insert(birthInfoData)
      .select()
      .single()

    if (birthError) {
      console.error("Error inserting birth info:", birthError)
      return { success: false, error: birthError.message }
    }

    console.log("Birth info inserted successfully:", birthInfo.id)

    // Store daeun data if available
    if (sajuData.daeun && sajuData.daeun.pillars) {
      const daeunData = sajuData.daeun.pillars.map((pillar: any, index: number) => ({
        birth_info_id: birthInfo.id,
        cycle_number: index + 1,
        period: pillar.period,
        ages: pillar.ages,
        start_date: pillar.start,
        stem: pillar.stem,
        branch: pillar.branch,
        start_age: pillar.startAge,
        end_age: pillar.endAge,
      }))

      const { error: daeunError } = await supabase.from("daeun_cycles").insert(daeunData)

      if (daeunError) {
        console.error("Error inserting daeun data:", daeunError)
        return { success: false, error: daeunError.message }
      }

      console.log("Daeun data inserted successfully")
    }

    // Clear localStorage after successful sync
    localStorage.removeItem("sajuData")
    localStorage.removeItem("sessionId")

    console.log("Data sync completed successfully")
    return { success: true, birthInfoId: birthInfo.id }
  } catch (error) {
    console.error("Error in syncLocalStorageToDatabase:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getUserSajuData(userId: string) {
  try {
    const supabase = createClient()

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
    const supabase = createClient()
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
