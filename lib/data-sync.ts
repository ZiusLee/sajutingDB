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

    // 사주 세션 데이터 저장
    const { data: sessionData, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert({
        name: sajuData.name,
        gender: sajuData.gender,
        birth_year: sajuData.year,
        birth_month: sajuData.month,
        birth_day: sajuData.day,
        birth_hour: sajuData.timeUnknown ? null : sajuData.hour,
        birth_minute: sajuData.timeUnknown ? null : sajuData.minute,
        time_unknown: sajuData.timeUnknown,
        lunar_year: sajuData.lunarYear,
        lunar_month: sajuData.lunarMonth,
        lunar_day: sajuData.lunarDay,
        is_leap_month: sajuData.isLeapMonth,
        year_stem: sajuData.yearStem,
        year_branch: sajuData.yearBranch,
        month_stem: sajuData.monthStem,
        month_branch: sajuData.monthBranch,
        day_stem: sajuData.dayStem,
        day_branch: sajuData.dayBranch,
        hour_stem: sajuData.hourStem,
        hour_branch: sajuData.hourBranch,
        day_master: sajuData.dayMaster,
        elements: sajuData.elements,
        interpretation: sajuData.interpretation,
        auth_user_id: authUserId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (sessionError) {
      console.error("Error saving saju session:", sessionError)
      return null
    }

    console.log("Successfully saved saju session:", sessionData.id)

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
