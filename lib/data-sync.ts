import { getSupabase } from "./supabase-client"

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
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.log("No saju data found in localStorage")
      return null
    }

    const sajuData = JSON.parse(tempSajuData)
    const supabase = getSupabase()

    // First, create the saju_sessions record with only the fields that belong to it
    const { data: sessionData, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert({
        name: sajuData.name,
        gender: sajuData.gender,
        relationship_status: sajuData.relationshipStatus || "solo",
        is_beta_applicant: false,
        auth_user_id: authUserId,
        saju: {
          yearStem: sajuData.yearStem,
          yearBranch: sajuData.yearBranch,
          yearStemHanja: sajuData.yearStemHanja,
          yearBranchHanja: sajuData.yearBranchHanja,
          monthStem: sajuData.monthStem,
          monthBranch: sajuData.monthBranchHanja,
          monthStemHanja: sajuData.monthStemHanja,
          monthBranchHanja: sajuData.monthBranchHanja,
          dayStem: sajuData.dayStem,
          dayBranch: sajuData.dayBranchHanja,
          dayStemHanja: sajuData.dayStemHanja,
          dayBranchHanja: sajuData.dayBranchHanja,
          hourStem: sajuData.hourStem,
          hourBranch: sajuData.hourBranchHanja,
          hourStemHanja: sajuData.hourStemHanja,
          hourBranchHanja: sajuData.hourBranchHanja,
          dayMaster: sajuData.dayMaster,
          dayMasterHanja: sajuData.dayMasterHanja,
          yearAnimal: sajuData.yearAnimal,
          elements: sajuData.elements,
          interpretation: sajuData.interpretation,
          yearStemSibseong: sajuData.yearStemSibseong,
          monthStemSibseong: sajuData.monthStemSibseong,
          dayStemSibseong: sajuData.dayStemSibseong,
          hourStemSibseong: sajuData.hourStemSibseong,
          yearBranchSibseong: sajuData.yearBranchSibseong,
          monthBranchSibseong: sajuData.monthBranchSibseong,
          dayBranchSibseong: sajuData.dayBranchSibseong,
          hourBranchSibseong: sajuData.hourBranchSibseong,
          daeun: sajuData.daeun,
        },
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error saving saju session:", sessionError)
      return null
    }

    console.log("Successfully saved saju session:", sessionData.id)

    // Now create the birth_info record with the session ID
    const { data: birthInfoData, error: birthInfoError } = await supabase
      .from("birth_info")
      .insert({
        user_id: sessionData.id,
        solar_year: sajuData.year,
        solar_month: sajuData.month,
        solar_day: sajuData.day,
        solar_hour: sajuData.timeUnknown ? null : sajuData.hour,
        solar_minute: sajuData.timeUnknown ? null : sajuData.minute,
        lunar_year: sajuData.lunarYear,
        lunar_month: sajuData.lunarMonth,
        lunar_day: sajuData.lunarDay,
        is_leap_month: sajuData.isLeapMonth,
        time_unknown: sajuData.timeUnknown,
        birth_city_id: sajuData.birthCityId || "seoul",
        time_standard: sajuData.timeStandard || "동경135도",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (birthInfoError) {
      console.error("Error saving birth info:", birthInfoError)
      // Clean up the session if birth info creation fails
      await supabase.from("saju_sessions").delete().eq("id", sessionData.id)
      return null
    }

    console.log("Successfully saved birth info:", birthInfoData.id)

    // Create saju_info record for compatibility with existing queries
    const { data: sajuInfoData, error: sajuInfoError } = await supabase
      .from("saju_info")
      .insert({
        user_id: sessionData.id,
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
      })
      .select()
      .single()

    if (sajuInfoError) {
      console.error("Error saving saju info:", sajuInfoError)
      // Don't fail the entire operation if this fails, as it's for compatibility
    } else {
      console.log("Successfully saved saju info:", sajuInfoData.id)
    }

    // localStorage에서 임시 데이터 제거
    localStorage.removeItem("tempSajuData")

    return sessionData.id
  } catch (error) {
    console.error("Error syncing data to database:", error)
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
