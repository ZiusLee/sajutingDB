import { supabase } from "./supabase-client"
import { v4 as uuidv4 } from "uuid"

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

export async function syncLocalStorageToDatabase(authUserId: string | null = null): Promise<string | null> {
  try {
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.log("No temp saju data found in localStorage")
      return null
    }

    const data = JSON.parse(tempSajuData)
    console.log("Syncing data to database:", data)

    // Generate a new session ID
    const sessionId = uuidv4()

    // Extract saju data from the structure
    const sajuData = data.saju || data
    const daeunData = data.daeun
    const birthInfo = data.birthInfo || sajuData.birthInfo

    // Prepare saju session data (without birth date fields)
    const sessionData = {
      id: sessionId,
      name: data.name || "Unknown",
      gender: data.gender || "unknown",
      relationship_status: data.relationshipStatus || "solo",
      is_beta_applicant: false,
      auth_user_id: authUserId,
      // Store only saju data without daeun
      saju: JSON.stringify({
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
      }),
      // Store daeun data separately
      daeun: daeunData ? JSON.stringify(daeunData) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert saju session
    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert(sessionData)
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      throw new Error("Failed to create saju session")
    }

    console.log("Created saju session:", session.id)

    // Prepare birth info data
    const solarData = birthInfo?.solar || birthInfo
    const lunarData = birthInfo?.lunar || birthInfo

    const birthInfoData = {
      user_id: session.id,
      solar_year: solarData?.year || data.year || new Date().getFullYear(),
      solar_month: solarData?.month || data.month || 1,
      solar_day: solarData?.day || data.day || 1,
      solar_hour: solarData?.hour || data.hour || 12,
      solar_minute: solarData?.minute || data.minute || 0,
      lunar_year: lunarData?.year || data.lunarYear || solarData?.year || data.year || new Date().getFullYear(),
      lunar_month: lunarData?.month || data.lunarMonth || solarData?.month || data.month || 1,
      lunar_day: lunarData?.day || data.lunarDay || solarData?.day || data.day || 1,
      is_leap_month: lunarData?.isLeapMonth || data.isLeapMonth || false,
      time_unknown: birthInfo?.timeUnknown || data.timeUnknown || false,
      birth_city_id: birthInfo?.birthCityId || data.birthCityId || "seoul",
      time_standard: birthInfo?.timeStandard || data.timeStandard || "동경135도",
      created_at: new Date().toISOString(),
    }

    // Insert birth info
    const { error: birthInfoError } = await supabase.from("birth_info").insert(birthInfoData)

    if (birthInfoError) {
      console.error("Error creating birth info:", birthInfoError)
      // Clean up the session if birth info creation fails
      await supabase.from("saju_sessions").delete().eq("id", session.id)
      throw new Error("Failed to create birth info")
    }

    console.log("Created birth info for session:", session.id)

    // Prepare saju info data
    const sajuInfoData = {
      user_id: session.id,
      year_stem: sajuData.yearStem || "",
      year_branch: sajuData.yearBranch || "",
      year_stem_hanja: sajuData.yearStemHanja || "",
      year_branch_hanja: sajuData.yearBranchHanja || "",
      month_stem: sajuData.monthStem || "",
      month_branch: sajuData.monthBranch || "",
      month_stem_hanja: sajuData.monthStemHanja || "",
      month_branch_hanja: sajuData.monthBranchHanja || "",
      day_stem: sajuData.dayStem || "",
      day_branch: sajuData.dayBranch || "",
      day_stem_hanja: sajuData.dayStemHanja || "",
      day_branch_hanja: sajuData.dayBranchHanja || "",
      hour_stem: sajuData.hourStem || "",
      hour_branch: sajuData.hourBranch || "",
      hour_stem_hanja: sajuData.hourStemHanja || "",
      hour_branch_hanja: sajuData.hourBranchHanja || "",
      day_master: sajuData.dayMaster || "",
      day_master_hanja: sajuData.dayMasterHanja || "",
      year_animal: sajuData.yearAnimal || "",
      created_at: new Date().toISOString(),
    }

    // Insert saju info and get the ID for elements table
    const { data: sajuInfoResult, error: sajuInfoError } = await supabase
      .from("saju_info")
      .insert(sajuInfoData)
      .select("id")
      .single()

    if (sajuInfoError) {
      console.error("Error creating saju info:", sajuInfoError)
      // Clean up session and birth info if saju_info fails
      await supabase.from("birth_info").delete().eq("user_id", session.id)
      await supabase.from("saju_sessions").delete().eq("id", session.id)
      throw new Error("Failed to create saju info")
    }

    console.log("Created saju info for session:", session.id)

    // Save elements if available - use saju_info.id as saju_id
    if (sajuData.elements && sajuInfoResult) {
      const elementsData = {
        saju_id: sajuInfoResult.id, // Use saju_info.id, not session.id
        wood: sajuData.elements.wood || 0,
        fire: sajuData.elements.fire || 0,
        earth: sajuData.elements.earth || 0,
        metal: sajuData.elements.metal || 0,
        water: sajuData.elements.water || 0,
        created_at: new Date().toISOString(),
      }

      const { error: elementsError } = await supabase.from("elements").insert(elementsData)

      if (elementsError) {
        console.error("Error creating elements:", elementsError)
        // Don't fail the whole process if elements fails
      } else {
        console.log("Created elements for saju_info:", sajuInfoResult.id)
      }
    }

    // Clear localStorage after successful sync
    localStorage.removeItem("tempSajuData")

    return session.id
  } catch (error) {
    console.error("Error syncing localStorage to database:", error)
    throw error
  }
}

export async function loadSajuDataFromDatabase(userId: string) {
  try {
    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .select(`
        *,
        birth_info(*),
        saju_info(*),
        elements(*)
      `)
      .eq("id", userId)
      .single()

    if (sessionError || !session) {
      console.error("Error loading saju session:", sessionError)
      return null
    }

    const birthInfo = session.birth_info?.[0]
    const sajuInfo = session.saju_info?.[0]
    const elements = session.elements?.[0]
    const sajuJsonb = session.saju ? JSON.parse(session.saju) : {}
    const daeunData = session.daeun ? JSON.parse(session.daeun) : null

    const sajuData = {
      name: session.name,
      gender: session.gender,
      relationshipStatus: session.relationship_status,
      year: birthInfo?.solar_year,
      month: birthInfo?.solar_month,
      day: birthInfo?.solar_day,
      hour: birthInfo?.solar_hour,
      minute: birthInfo?.solar_minute,
      timeUnknown: birthInfo?.time_unknown,
      timeStandard: birthInfo?.time_standard,
      birthCityId: birthInfo?.birth_city_id,
      lunarYear: birthInfo?.lunar_year,
      lunarMonth: birthInfo?.lunar_month,
      lunarDay: birthInfo?.lunar_day,
      isLeapMonth: birthInfo?.is_leap_month,
      saju: {
        yearStem: sajuInfo?.year_stem || sajuJsonb.yearStem,
        yearBranch: sajuInfo?.year_branch || sajuJsonb.yearBranch,
        yearStemHanja: sajuInfo?.year_stem_hanja || sajuJsonb.yearStemHanja,
        yearBranchHanja: sajuInfo?.year_branch_hanja || sajuJsonb.yearBranchHanja,
        monthStem: sajuInfo?.month_stem || sajuJsonb.monthStem,
        monthBranch: sajuInfo?.month_branch || sajuJsonb.monthBranch,
        monthStemHanja: sajuInfo?.month_stem_hanja || sajuJsonb.monthStemHanja,
        monthBranchHanja: sajuInfo?.month_branch_hanja || sajuJsonb.monthBranchHanja,
        dayStem: sajuInfo?.day_stem || sajuJsonb.dayStem,
        dayBranch: sajuInfo?.day_branch || sajuJsonb.dayBranch,
        dayStemHanja: sajuInfo?.day_stem_hanja || sajuJsonb.dayStemHanja,
        dayBranchHanja: sajuInfo?.day_branch_hanja || sajuJsonb.dayBranchHanja,
        hourStem: sajuInfo?.hour_stem || sajuJsonb.hourStem,
        hourBranch: sajuInfo?.hour_branch || sajuJsonb.hourBranch,
        hourStemHanja: sajuInfo?.hour_stem_hanja || sajuJsonb.hourStemHanja,
        hourBranchHanja: sajuInfo?.hour_branch_hanja || sajuJsonb.hourBranchHanja,
        dayMaster: sajuInfo?.day_master || sajuJsonb.dayMaster,
        dayMasterHanja: sajuInfo?.day_master_hanja || sajuJsonb.dayMasterHanja,
        yearAnimal: sajuInfo?.year_animal || sajuJsonb.yearAnimal,
        elements: elements
          ? {
              wood: elements.wood,
              fire: elements.fire,
              earth: elements.earth,
              metal: elements.metal,
              water: elements.water,
            }
          : sajuJsonb.elements,
        yearStemSibseong: sajuJsonb.yearStemSibseong,
        monthStemSibseong: sajuJsonb.monthStemSibseong,
        dayStemSibseong: sajuJsonb.dayStemSibseong,
        hourStemSibseong: sajuJsonb.hourStemSibseong,
        yearBranchSibseong: sajuJsonb.yearBranchSibseong,
        monthBranchSibseong: sajuJsonb.monthBranchSibseong,
        dayBranchSibseong: sajuJsonb.dayBranchSibseong,
        hourBranchSibseong: sajuJsonb.hourBranchSibseong,
      },
      daeun: daeunData,
      interpretation: session.interpretation || "",
    }

    return sajuData
  } catch (error) {
    console.error("Error loading saju data from database:", error)
    return null
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
