import {
  saveBirthInfo,
  saveSajuInfo,
  saveElements,
  saveInterpretation,
  saveBetaApplication,
  saveCompatibilityAnalysis,
} from "./db-service"
import { supabase, getSupabase } from "./supabase-client"
import { v4 as uuidv4 } from "uuid"

// 상대방 정보 인터페이스 정의
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
}

// 로컬 스토리지에서 사주 데이터를 가져와 데이터베이스에 저장하는 함수
export async function syncLocalStorageToDatabase(authUserId?: string | null): Promise<string | null> {
  try {
    // 로컬 스토리지에서 데이터 가져오기
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.log("No saju data found in localStorage")
      return null
    }

    const sajuData = JSON.parse(tempSajuData)

    // 이미 userId가 있으면 그대로 반환
    if (sajuData.userId) {
      console.log("User ID already exists:", sajuData.userId)

      // 로그인된 사용자인 경우 auth_user_id 연결 시도
      if (authUserId) {
        try {
          console.log("Attempting to link existing user ID to auth user ID:", sajuData.userId, authUserId)
          const supabaseClient = getSupabase()
          const { data, error } = await supabaseClient
            .from("saju_sessions")
            .update({ auth_user_id: authUserId })
            .eq("id", sajuData.userId)
            .select()

          if (error) {
            console.error("Error linking user ID to auth user ID:", error)
          } else {
            console.log("Successfully linked user ID to auth user ID:", data)
          }
        } catch (authError) {
          console.error("Error updating auth_user_id:", authError)
        }
      } else {
        console.log("No auth user ID provided, skipping auth_user_id update")
      }

      return sajuData.userId
    }

    // 익명 사용자 ID 생성
    const userId = uuidv4()
    console.log("Generated new user ID:", userId)

    // API 라우트를 통해 데이터 저장
    try {
      console.log("Saving user data to database with user ID:", userId, "auth user ID:", authUserId || "none")
      const response = await fetch("/api/save-user-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          authUserId, // 로그인된 사용자 ID 포함
          ...sajuData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("Successfully saved data to database:", result)

      // 사용자 ID를 localStorage에 저장
      sajuData.userId = userId
      localStorage.setItem("tempSajuData", JSON.stringify(sajuData))

      return userId
    } catch (apiError) {
      console.error("Error calling save-user-data API:", apiError)

      // API 호출 실패 시 직접 Supabase 호출 시도
      try {
        console.log("Attempting direct Supabase insertion for user:", userId)
        const supabaseClient = getSupabase()
        const { data, error } = await supabaseClient
          .from("saju_sessions")
          .insert({
            id: userId,
            name: sajuData.name || "Anonymous User",
            gender: sajuData.gender || "unknown",
            relationship_status: sajuData.relationshipStatus || "unknown",
            auth_user_id: authUserId, // Include auth_user_id if available
          })
          .select()

        if (error) {
          console.error("Error with direct Supabase insertion:", error)
          return null
        }

        console.log("Successfully inserted user directly with Supabase:", data)
        return userId
      } catch (supabaseError) {
        console.error("Error with direct Supabase call:", supabaseError)
        return null
      }
    }
  } catch (error) {
    console.error("Error syncing data to database:", error)
    return null
  }
}

// 사용자 ID가 생성된 후 나머지 데이터를 저장하는 함수
async function saveRemainingData(userId: string, sajuData: any) {
  // Save birth info
  if (sajuData.year && sajuData.month && sajuData.day) {
    try {
      const birthInfoId = await saveBirthInfo({
        userId,
        solarYear: Number(sajuData.year),
        solarMonth: Number(sajuData.month),
        solarDay: Number(sajuData.day),
        solarHour: sajuData.hour !== undefined ? Number(sajuData.hour) : null,
        solarMinute: sajuData.minute !== undefined ? Number(sajuData.minute) : null,
        lunarYear: Number(sajuData.lunarYear || sajuData.year),
        lunarMonth: Number(sajuData.lunarMonth || sajuData.month),
        lunarDay: Number(sajuData.lunarDay || sajuData.day),
        isLeapMonth: Boolean(sajuData.isLeapMonth),
        timeUnknown: sajuData.hour === undefined || sajuData.hour === null,
      })
      console.log("Birth info saved with ID:", birthInfoId)
    } catch (error) {
      console.error("Error saving birth info:", error)
    }
  }

  // Save saju info
  let sajuId = null
  if (sajuData.yearStem && sajuData.yearBranch) {
    try {
      sajuId = await saveSajuInfo({
        userId,
        yearStem: sajuData.yearStem,
        yearBranch: sajuData.yearBranch,
        yearStemHanja: sajuData.yearStemHanja || "",
        yearBranchHanja: sajuData.yearBranchHanja || "",
        monthStem: sajuData.monthStem,
        monthBranch: sajuData.monthBranch,
        monthStemHanja: sajuData.monthStemHanja || "",
        monthBranchHanja: sajuData.monthBranchHanja || "",
        dayStem: sajuData.dayStem,
        dayBranch: sajuData.dayBranch,
        dayStemHanja: sajuData.dayStemHanja || "",
        dayBranchHanja: sajuData.dayBranchHanja || "",
        hourStem: sajuData.hourStem || "?",
        hourBranch: sajuData.hourBranch || "?",
        hourStemHanja: sajuData.hourStemHanja || "",
        hourBranchHanja: sajuData.hourBranchHanja || "",
        dayMaster: sajuData.dayMaster || sajuData.dayStem,
        dayMasterHanja: sajuData.dayMasterHanja || "",
        yearAnimal: sajuData.yearAnimal || "",
      })
      console.log("Saju info saved with ID:", sajuId)
    } catch (error) {
      console.error("Error saving saju info:", error)
    }
  }

  // Save elements
  if (sajuId && sajuData.elements) {
    try {
      const elementsId = await saveElements({
        sajuId,
        wood: sajuData.elements.wood || 0,
        fire: sajuData.elements.fire || 0,
        earth: sajuData.elements.earth || 0,
        metal: sajuData.elements.metal || 0,
        water: sajuData.elements.water || 0,
      })
      console.log("Elements saved with ID:", elementsId)
    } catch (error) {
      console.error("Error saving elements:", error)
    }
  }

  // Save interpretation
  if (sajuData.sajuInterpretation) {
    try {
      const interpretationId = await saveInterpretation({
        userId,
        basicInterpretation: sajuData.sajuInterpretation,
        modelUsed: sajuData.model || "unknown",
        responseTime: sajuData.responseTime || "unknown",
      })
      console.log("Interpretation saved with ID:", interpretationId)
    } catch (error) {
      console.error("Error saving interpretation:", error)
    }
  }

  // Save compatibility analyses if available
  if (sajuData.compatibilityAnalyses && Array.isArray(sajuData.compatibilityAnalyses)) {
    for (const analysis of sajuData.compatibilityAnalyses) {
      try {
        const analysisId = await saveCompatibilityAnalysis({
          userId,
          partnerName: analysis.partnerName || "Unknown Partner",
          partnerGender: analysis.partnerGender || "unknown",
          partnerBirthYear: Number(analysis.partnerBirthYear) || 0,
          partnerBirthMonth: Number(analysis.partnerBirthMonth) || 0,
          partnerBirthDay: Number(analysis.partnerBirthDay) || 0,
          partnerBirthHour: analysis.partnerBirthHour !== undefined ? Number(analysis.partnerBirthHour) : null,
          partnerBirthMinute: analysis.partnerBirthMinute !== undefined ? Number(analysis.partnerBirthMinute) : null,
          partnerTimeUnknown: Boolean(analysis.partnerTimeUnknown),
          relationshipStatus: analysis.relationshipStatus || "unknown",
          compatibilityScore: Number(analysis.compatibilityScore) || 0,
          analysisText: analysis.analysisText || "",
          modelUsed: analysis.modelUsed || "unknown",
          responseTime: analysis.responseTime || "unknown",
        })
        console.log("Compatibility analysis saved with ID:", analysisId)
      } catch (error) {
        console.error("Error saving compatibility analysis:", error)
      }
    }
  }
}

/**
 * Save beta application data
 */
export async function saveBetaApplicationData(userId: string, selectedServices: string[]): Promise<boolean> {
  try {
    console.log("Saving beta application for user ID:", userId, "with services:", selectedServices)

    // Try direct insertion to test database access
    const { data: directInsertData, error: directInsertError } = await supabase
      .from("beta_applications")
      .insert({
        user_id: userId,
        selected_services: selectedServices,
        status: "pending",
      })
      .select("id")

    if (directInsertError) {
      console.error("Direct beta application insertion error:", directInsertError)

      // 직접 삽입이 실패한 경우 기존 방식으로 시도
      await saveBetaApplication({
        userId,
        selectedServices,
      })
    } else {
      console.log("Beta application saved successfully:", directInsertData)
    }

    return true
  } catch (error) {
    console.error("Error saving beta application data:", error)
    return false
  }
}

/**
 * Add compatibility analysis to localStorage
 */
export function addCompatibilityAnalysisToLocalStorage(analysis: {
  partnerName: string
  partnerGender: string
  partnerBirthYear: number
  partnerBirthMonth: number
  partnerBirthDay: number
  partnerBirthHour?: number
  partnerBirthMinute?: number
  partnerTimeUnknown: boolean
  relationshipStatus: string
  compatibilityScore: number
  analysisText: string
  modelUsed: string
  responseTime: string
}): boolean {
  try {
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.error("No saju data found in localStorage")
      return false
    }

    const sajuData = JSON.parse(tempSajuData)

    // Initialize compatibilityAnalyses array if it doesn't exist
    if (!sajuData.compatibilityAnalyses) {
      sajuData.compatibilityAnalyses = []
    }

    // Add new analysis
    sajuData.compatibilityAnalyses.push(analysis)

    // Save back to localStorage
    localStorage.setItem("tempSajuData", JSON.stringify(sajuData))
    return true
  } catch (error) {
    console.error("Error adding compatibility analysis to localStorage:", error)
    return false
  }
}

// 궁합 분석 결과를 localStorage에 저장하는 함수
export function saveCompatibilityResultToLocalStorage(data: {
  userInfo: {
    name: string
    gender: string
    saju: any
  }
  partnerInfo: {
    name: string
    gender: string
    year: number
    month: number
    day: number
    hour: number | null
    minute: number | null
    timeUnknown: boolean
  }
  result: string
  partnerSaju?: any
  model?: string
  timestamp?: number
  compatibilityScore?: number
}) {
  try {
    // 기존 데이터 가져오기
    const existingDataStr = localStorage.getItem("compatibility_results")
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : []

    // 새 데이터 추가
    const newData = {
      ...data,
      timestamp: data.timestamp || Date.now(),
    }

    // 최대 10개까지만 저장 (오래된 것부터 삭제)
    if (existingData.length >= 10) {
      existingData.shift()
    }

    existingData.push(newData)

    // 저장
    localStorage.setItem("compatibility_results", JSON.stringify(existingData))

    // Supabase에도 저장
    saveCompatibilityToSupabase(data)

    return true
  } catch (error) {
    console.error("Error saving compatibility result to localStorage:", error)
    return false
  }
}

/**
 * 궁합 분석 결과를 Supabase에 저장하는 함수
 */
export async function saveCompatibilityToSupabase(data: {
  userInfo: {
    name: string
    gender: string
    saju: any
  }
  partnerInfo: {
    name: string
    gender: string
    year: number
    month: number
    day: number
    hour: number | null
    minute: number | null
    timeUnknown: boolean
  }
  result: string
  partnerSaju?: any
  model?: string
  timestamp?: number
  compatibilityScore?: number
}) {
  try {
    // 사용자 ID 가져오기 (localStorage에서)
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.error("No saju data found in localStorage")
      return false
    }

    const sajuData = JSON.parse(tempSajuData)
    const userId = sajuData.userId

    if (!userId) {
      console.error("No user ID found in localStorage")
      // 사용자 ID가 없는 경우 먼저 사용자 데이터 저장 시도
      const newUserId = await syncLocalStorageToDatabase()
      if (!newUserId) {
        console.error("Failed to create user ID")
        return false
      }
    }

    // 궁합 점수 계산 (없는 경우 기본값 70)
    const compatibilityScore = data.compatibilityScore || 70

    // Supabase에 저장
    try {
      // 서버 API 라우트를 통해 데이터 저장
      const response = await fetch("/api/save-compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: sajuData.userId,
          partnerName: data.partnerInfo.name,
          partnerGender: data.partnerInfo.gender,
          partnerBirthYear: data.partnerInfo.year,
          partnerBirthMonth: data.partnerInfo.month,
          partnerBirthDay: data.partnerInfo.day,
          partnerBirthHour: data.partnerInfo.hour,
          partnerBirthMinute: data.partnerInfo.minute,
          partnerTimeUnknown: data.partnerInfo.timeUnknown,
          relationshipStatus: sajuData.relationshipStatus || "unknown",
          compatibilityScore: compatibilityScore,
          analysisText: data.result,
          modelUsed: data.model || "unknown",
          responseTime: "client-side",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("Successfully saved compatibility analysis to Supabase:", result)
      return true
    } catch (apiError) {
      console.error("Error calling save-compatibility API:", apiError)

      // API 호출 실패 시 직접 Supabase 호출 시도
      try {
        const { data: analysisData, error: analysisError } = await supabase
          .from("compatibility_analysis")
          .insert({
            user_id: sajuData.userId,
            partner_name: data.partnerInfo.name,
            partner_gender: data.partnerInfo.gender,
            partner_birth_year: data.partnerInfo.year,
            partner_birth_month: data.partnerInfo.month,
            partner_birth_day: data.partnerInfo.day,
            partner_birth_hour: data.partnerInfo.hour,
            partner_birth_minute: data.partnerInfo.minute,
            partner_time_unknown: data.partnerInfo.timeUnknown,
            relationship_status: sajuData.relationshipStatus || "unknown",
            compatibility_score: compatibilityScore,
            analysis_text: data.result,
            model_used: data.model || "unknown",
            response_time: "client-side",
          })
          .select("id")

        if (analysisError) {
          console.error("Error saving compatibility analysis directly to Supabase:", analysisError)
          return false
        }

        console.log("Successfully saved compatibility analysis directly to Supabase:", analysisData)
        return true
      } catch (supabaseError) {
        console.error("Error with direct Supabase call:", supabaseError)
        return false
      }
    }
  } catch (error) {
    console.error("Error saving compatibility to Supabase:", error)
    return false
  }
}

/**
 * 상대방 정보를 localStorage에 저장하는 함수
 */
export function savePartnerInfo(partner: PartnerInfo): string {
  try {
    // 기존 데이터 가져오기
    const existingDataStr = localStorage.getItem("saved_partners")
    const existingData: PartnerInfo[] = existingDataStr ? JSON.parse(existingDataStr) : []

    // 고유 ID 생성
    const partnerId = partner.id || `partner_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // 새 데이터 생성
    const newPartner: PartnerInfo = {
      ...partner,
      id: partnerId,
      createdAt: Date.now(),
    }

    // 이미 존재하는 파트너인지 확인 (ID로 확인)
    const existingIndex = existingData.findIndex((p) => p.id === partnerId)

    if (existingIndex >= 0) {
      // 기존 데이터 업데이트
      existingData[existingIndex] = newPartner
    } else {
      // 새 데이터 추가
      existingData.push(newPartner)
    }

    // 최대 20개까지만 저장 (오래된 것부터 삭제)
    const sortedData = existingData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    const limitedData = sortedData.slice(0, 20)

    // 저장
    localStorage.setItem("saved_partners", JSON.stringify(limitedData))

    // Supabase에도 저장 시도 (비동기로 처리)
    savePartnerToSupabase(newPartner).catch((err) => console.error("Failed to save partner to Supabase:", err))

    console.log(`상대방 정보 저장 성공: ${partner.name}`)
    return partnerId
  } catch (error) {
    console.error("Error saving partner info to localStorage:", error)
    return ""
  }
}

/**
 * 상대방 정보를 Supabase에 저장하는 함수
 */
export async function savePartnerToSupabase(partner: PartnerInfo): Promise<boolean> {
  try {
    // 사용자 ID 가져오기 (localStorage에서)
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.error("No saju data found in localStorage")
      return false
    }

    const sajuData = JSON.parse(tempSajuData)
    const userId = sajuData.userId

    if (!userId) {
      console.error("No user ID found in localStorage")
      return false
    }

    // 상대방 정보를 Supabase에 저장하기 위해 compatibility_analysis 테이블 사용
    // 실제 궁합 분석 없이 상대방 정보만 저장
    try {
      // 서버 API 라우트를 통해 데��터 저장
      const response = await fetch("/api/save-compatibility", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          partnerName: partner.name,
          partnerGender: partner.gender,
          partnerBirthYear: partner.year,
          partnerBirthMonth: partner.month,
          partnerBirthDay: partner.day,
          partnerBirthHour: partner.hour,
          partnerBirthMinute: partner.minute,
          partnerTimeUnknown: partner.timeUnknown,
          relationshipStatus: partner.relationshipStatus || "unknown",
          compatibilityScore: 0, // 분석 없이 저장하는 경우 0으로 설정
          analysisText: "상대방 정보만 저장됨 (궁합 분석 없음)",
          modelUsed: "none",
          responseTime: "client-side",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log("Successfully saved partner info to Supabase:", result)
      return true
    } catch (apiError) {
      console.error("Error calling save-compatibility API for partner info:", apiError)
      return false
    }
  } catch (error) {
    console.error("Error saving partner to Supabase:", error)
    return false
  }
}

/**
 * 저장된 상대방 정보 목록을 가져오는 함수
 */
export function getSavedPartners(): PartnerInfo[] {
  try {
    const savedPartnersStr = localStorage.getItem("saved_partners")
    if (!savedPartnersStr) return []

    const savedPartners: PartnerInfo[] = JSON.parse(savedPartnersStr)
    // 최신순으로 정렬
    return savedPartners.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  } catch (error) {
    console.error("Error getting saved partners from localStorage:", error)
    return []
  }
}

/**
 * 특정 상대방 정보를 삭제하는 함수
 */
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
