import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import { getSupabase } from "./supabase-client"

/**
 * Get all saju profiles for the current authenticated user
 */
export async function getUserSajuProfiles() {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return { profiles: [], authUserId: null }
    }

    const authUserId = userData.user.id
    console.log("Looking for profiles with auth_user_id:", authUserId)

    const { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select(`
        id,
        name,
        gender,
        email,
        created_at,
        auth_user_id,
        is_default,
        saju,
        daeun
      `)
      .eq("auth_user_id", authUserId)

    if (sessionsError) {
      console.error("Error fetching saju sessions:", sessionsError)
      return { profiles: [], authUserId }
    }

    if (!sessions || sessions.length === 0) {
      return { profiles: [], authUserId }
    }

    const profiles = await Promise.all(
      sessions.map(async (session) => {
        const sajuData = session.saju || {}
        const daeunData = session.daeun || {}
        const birthInfo = sajuData.birthInfo || {}
        const solarBirth = birthInfo.solar || {}
        const lunarBirth = birthInfo.lunar || {}

        // Check if we need to recalculate daeun
        let shouldUpdateDB = false
        let finalDaeunData = daeunData

        if (
          !daeunData.daeun ||
          !daeunData.daeun.pillars ||
          (daeunData.daeun.pillars &&
            daeunData.daeun.pillars.length > 0 &&
            daeunData.daeun.pillars.every((p: any) => p.stem === "갑" && p.branch === "자"))
        ) {
          if (
            sajuData.yearStem &&
            sajuData.monthStem &&
            sajuData.monthBranch &&
            solarBirth.year &&
            solarBirth.month &&
            solarBirth.day
          ) {
            try {
              const calculatedDaeun = calculateDaeunInfo(
                {
                  yearStem: sajuData.yearStem,
                  monthStem: sajuData.monthStem,
                  monthBranch: sajuData.monthBranch,
                },
                solarBirth.year,
                solarBirth.month,
                solarBirth.day,
                session.gender || "female",
                birthInfo.timeUnknown ? undefined : solarBirth.hour,
                birthInfo.timeUnknown ? undefined : solarBirth.minute,
                birthInfo.timeUnknown || false,
              )
              
              finalDaeunData = {
                daeun: calculatedDaeun,
                interpretation: sajuData.interpretation || daeunData.interpretation || ""
              }
              shouldUpdateDB = true
            } catch (error) {
              console.error(`Error calculating daeun for session ${session.id}:`, error)
            }
          }
        }

        // Update database with daeun if needed
        if (shouldUpdateDB && finalDaeunData) {
          supabase
            .from("saju_sessions")
            .update({ daeun: finalDaeunData })
            .eq("id", session.id)
            .then(({ error }) => {
              if (error) {
                console.error(`Error updating daeun for session ${session.id}:`, error)
              }
            })
        }

        return {
          id: session.id,
          name: session.name || "무명",
          gender: session.gender || "unknown",
          birthYear: solarBirth.year?.toString() || "N/A",
          birthMonth: solarBirth.month?.toString().padStart(2, "0") || "N/A",
          birthDay: solarBirth.day?.toString().padStart(2, "0") || "N/A",
          birthHour: solarBirth.hour?.toString().padStart(2, "0") || "N/A",
          birthMinute: solarBirth.minute?.toString().padStart(2, "0") || "N/A",
          lunarYear: lunarBirth.year?.toString() || "N/A",
          lunarMonth: lunarBirth.month?.toString().padStart(2, "0") || "N/A",
          lunarDay: lunarBirth.day?.toString().padStart(2, "0") || "N/A",
          timeUnknown: birthInfo.timeUnknown || false,
          createdAt: session.created_at || new Date().toISOString(),
          birthInfoId: session.id, // Use session id as birth info id
          isDefault: session.is_default || false,
          saju: {
            yearStem: sajuData.yearStem || "N/A",
            yearBranch: sajuData.yearBranch || "N/A",
            monthStem: sajuData.monthStem || "N/A",
            monthBranch: sajuData.monthBranch || "N/A",
            dayStem: sajuData.dayStem || "N/A",
            dayBranch: sajuData.dayBranch || "N/A",
            hourStem: sajuData.hourStem || "N/A",
            hourBranch: sajuData.hourBranch || "N/A",
            yearStemSibseong: sajuData.yearStemSibseong || "",
            monthStemSibseong: sajuData.monthStemSibseong || "",
            dayStemSibseong: sajuData.dayStemSibseong || "",
            hourStemSibseong: sajuData.hourStemSibseong || "",
            yearBranchSibseong: sajuData.yearBranchSibseong || "",
            monthBranchSibseong: sajuData.monthBranchSibseong || "",
            dayBranchSibseong: sajuData.dayBranchSibseong || "",
            hourBranchSibseong: sajuData.hourBranchSibseong || "",
            daeun: finalDaeunData.daeun || finalDaeunData, // Handle both structures
          },
        }
      }),
    )

    return { profiles, authUserId }
  } catch (error) {
    console.error("Error in getUserSajuProfiles:", error)
    return { profiles: [], authUserId: null }
  }
}

/**
 * Link a session to the current authenticated user
 */
export async function linkSessionToUser(sessionId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return false
    }

    const authUserId = userData.user.id

    const { data: session, error: checkError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id")
      .eq("id", sessionId)
      .single()

    if (checkError) {
      console.error(`Session ${sessionId} not found:`, checkError)
      return false
    }

    if (session.auth_user_id === authUserId) {
      return true
    }

    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ auth_user_id: authUserId })
      .eq("id", sessionId)

    if (updateError) {
      console.error("Error linking session:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in linkSessionToUser:", error)
    return false
  }
}

/**
 * Find and link all sessions that might belong to the current user
 */
export async function findAndLinkSessions(): Promise<{ success: boolean; linkedCount: number }> {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      return { success: false, linkedCount: 0 }
    }

    const authUserId = userData.user.id
    const userEmail = userData.user.email
    const userName = userData.user.user_metadata?.name
    let linkedCount = 0

    // Strategy 1: Check localStorage
    const localStorageSessionId = localStorage.getItem("user_id")
    if (localStorageSessionId) {
      const success = await linkSessionIfUnlinked(localStorageSessionId, authUserId)
      if (success) linkedCount++
    }

    // Strategy 2: Check if there's a session with matching email
    if (userEmail) {
      const { data: emailSessions, error: emailError } = await supabase
        .from("saju_sessions")
        .select("id, auth_user_id")
        .eq("email", userEmail)

      if (!emailError && emailSessions && emailSessions.length > 0) {
        for (const session of emailSessions) {
          if (session.auth_user_id !== authUserId) {
            const success = await linkSessionToUser(session.id)
            if (success) linkedCount++
          }
        }
      }
    }

    // Strategy 3: Check if there's a session with matching name
    if (userName) {
      const { data: nameSessions, error: nameError } = await supabase
        .from("saju_sessions")
        .select("id, auth_user_id")
        .eq("name", userName)

      if (!nameError && nameSessions && nameSessions.length > 0) {
        for (const session of nameSessions) {
          if (session.auth_user_id !== authUserId) {
            const success = await linkSessionToUser(session.id)
            if (success) linkedCount++
          }
        }
      }
    }

    return { success: true, linkedCount }
  } catch (error) {
    console.error("Error in findAndLinkSessions:", error)
    return { success: false, linkedCount: 0 }
  }
}

/**
 * Helper function to link a session if it's not already linked
 */
async function linkSessionIfUnlinked(sessionId: string, authUserId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()

    const { data: session, error: checkError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id")
      .eq("id", sessionId)
      .single()

    if (checkError) {
      return false
    }

    if (session.auth_user_id === authUserId) {
      return false
    }

    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ auth_user_id: authUserId })
      .eq("id", sessionId)

    if (updateError) {
      return false
    }

    return true
  } catch (error) {
    console.error(`Error in linkSessionIfUnlinked for session ${sessionId}:`, error)
    return false
  }
}

/**
 * Get saju data by UUID
 */
export async function getSajuDataByUuid(uuid: string) {
  try {
    const supabase = createClientComponentClient()

    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .select("*")
      .eq("id", uuid)
      .single()

    if (sessionError || !session) {
      return null
    }

    const sajuData = session.saju || {}
    const birthInfo = sajuData.birthInfo || {}
    const solarBirth = birthInfo.solar || {}
    const lunarBirth = birthInfo.lunar || {}

    const userData = {
      id: session.id,
      name: session.name || "무명",
      gender: session.gender || "unknown",
      createdAt: session.created_at || new Date().toISOString(),
    }

    const processedSajuData = {
      yearStem: sajuData.yearStem || "",
      yearBranch: sajuData.yearBranch || "",
      monthStem: sajuData.monthStem || "",
      monthBranch: sajuData.monthBranch || "",
      dayStem: sajuData.dayStem || "",
      dayBranch: sajuData.dayBranch || "",
      hourStem: sajuData.hourStem || "",
      hourBranch: sajuData.hourBranch || "",
      year: solarBirth.year?.toString() || "",
      month: solarBirth.month?.toString() || "",
      day: solarBirth.day?.toString() || "",
      hour: solarBirth.hour?.toString() || "",
      minute: solarBirth.minute?.toString() || "",
      lunarYear: lunarBirth.year?.toString() || "",
      lunarMonth: lunarBirth.month?.toString() || "",
      lunarDay: lunarBirth.day?.toString() || "",
    }

    return { userData, sajuData: processedSajuData }
  } catch (error) {
    console.error("Error in getSajuDataByUuid:", error)
    return null
  }
}

/**
 * Debug function to directly check the database for sessions
 */
export async function debugCheckSessions(authUserId: string) {
  try {
    const supabase = createClientComponentClient()

    const { data: sessions, error } = await supabase
      .from("saju_sessions")
      .select("id, name, auth_user_id")
      .eq("auth_user_id", authUserId)

    if (error) {
      console.error("Error checking sessions:", error)
      return { success: false, sessions: [] }
    }

    return { success: true, sessions }
  } catch (error) {
    console.error("Error in debugCheckSessions:", error)
    return { success: false, sessions: [] }
  }
}

/**
 * Get all saju sessions for a user
 */
export async function getUserSajuSessions(authUserId: string): Promise<any[]> {
  try {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("saju_sessions")
      .select("*")
      .eq("auth_user_id", authUserId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching saju sessions:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserSajuSessions:", error)
    return []
  }
}

/**
 * Set a saju session as the default for a user
 */
export async function setDefaultSajuSession(authUserId: string, sessionId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()

    const { error: resetError } = await supabase
      .from("saju_sessions")
      .update({ is_default: false })
      .eq("auth_user_id", authUserId)

    if (resetError) {
      console.error("Error resetting default sessions:", resetError)
      return false
    }

    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ is_default: true })
      .eq("id", sessionId)
      .eq("auth_user_id", authUserId)

    if (updateError) {
      console.error("Error setting default session:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in setDefaultSajuSession:", error)
    return false
  }
}

/**
 * Get the default saju session for a user
 */
export async function getDefaultSajuSession(authUserId: string): Promise<any | null> {
  try {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("saju_sessions")
      .select("*")
      .eq("auth_user_id", authUserId)
      .eq("is_default", true)
      .single()

    if (error) {
      console.error("Error getting default saju session:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getDefaultSajuSession:", error)
    return null
  }
}

/**
 * Get a saju profile by session ID with daeun calculation
 */
export async function getSajuProfileBySessionId(sessionId: string): Promise<any | null> {
  try {
    const supabase = createClientComponentClient()

    const { data, error } = await supabase
      .from("saju_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (error) {
      console.error("Error getting saju profile by session ID:", error)
      return null
    }

    const sajuData = data?.saju || {}
    const daeunData = data?.daeun || {}
    const birthInfo = sajuData.birthInfo || {}
    const solarBirth = birthInfo.solar || {}
    const lunarBirth = birthInfo.lunar || {}

    // Check if we need to recalculate daeun
    let finalDaeunData = daeunData

    if (
      !daeunData.daeun ||
      !daeunData.daeun.pillars ||
      (daeunData.daeun.pillars &&
        daeunData.daeun.pillars.length > 0 &&
        daeunData.daeun.pillars.every((p: any) => p.stem === "갑" && p.branch === "자"))
    ) {
      if (
        sajuData.yearStem &&
        sajuData.monthStem &&
        sajuData.monthBranch &&
        solarBirth.year &&
        solarBirth.month &&
        solarBirth.day
      ) {
        try {
          const calculatedDaeun = calculateDaeunInfo(
            {
              yearStem: sajuData.yearStem,
              monthStem: sajuData.monthStem,
              monthBranch: sajuData.monthBranch,
            },
            solarBirth.year,
            solarBirth.month,
            solarBirth.day,
            data.gender || "female",
            birthInfo.timeUnknown ? undefined : solarBirth.hour,
            birthInfo.timeUnknown ? undefined : solarBirth.minute,
            birthInfo.timeUnknown || false,
          )

          finalDaeunData = {
            daeun: calculatedDaeun,
            interpretation: sajuData.interpretation || daeunData.interpretation || ""
          }

          // Update database with daeun
          supabase
            .from("saju_sessions")
            .update({ daeun: finalDaeunData })
            .eq("id", sessionId)
            .then(({ error }) => {
              if (error) {
                console.error(`Error updating daeun for session ${sessionId}:`, error)
              }
            })
        } catch (error) {
          console.error(`Error calculating daeun for session ${sessionId}:`, error)
        }
      }
    }

    return {
      id: data.id,
      name: data.name || "Unknown",
      gender: data.gender || "unknown",
      birthYear: solarBirth.year?.toString() || "",
      birthMonth: solarBirth.month?.toString().padStart(2, "0") || "",
      birthDay: solarBirth.day?.toString().padStart(2, "0") || "",
      birthHour: solarBirth.hour?.toString().padStart(2, "0") || "00",
      birthMinute: solarBirth.minute?.toString().padStart(2, "0") || "00",
      lunarYear: lunarBirth.year?.toString() || "",
      lunarMonth: lunarBirth.month?.toString().padStart(2, "0") || "",
      lunarDay: lunarBirth.day?.toString().padStart(2, "0") || "",
      timeUnknown: birthInfo.timeUnknown || false,
      createdAt: data.created_at || new Date().toISOString(),
      saju: {
        yearStem: sajuData.yearStem || "",
        yearBranch: sajuData.yearBranch || "",
        monthStem: sajuData.monthStem || "",
        monthBranch: sajuData.monthBranch || "",
        dayStem: sajuData.dayStem || "",
        dayBranch: sajuData.dayBranch || "",
        hourStem: sajuData.hourStem || "",
        hourBranch: sajuData.hourBranch || "",
        yearStemHanja: sajuData.yearStemHanja || "",
        yearBranchHanja: sajuData.yearBranchHanja || "",
        monthStemHanja: sajuData.monthStemHanja || "",
        monthBranchHanja: sajuData.monthBranchHanja || "",
        dayStemHanja: sajuData.dayStemHanja || "",
        dayBranchHanja: sajuData.dayBranchHanja || "",
        hourStemHanja: sajuData.hourStemHanja || "",
        hourBranchHanja: sajuData.hourBranchHanja || "",
        dayMaster: sajuData.dayMaster || "",
        dayMasterHanja: sajuData.dayMasterHanja || "",
        yearStemSibseong: sajuData.yearStemSibseong || "",
        monthStemSibseong: sajuData.monthStemSibseong || "",
        dayStemSibseong: sajuData.dayStemSibseong || "비견",
        hourStemSibseong: sajuData.hourStemSibseong || "",
        yearBranchSibseong: sajuData.yearBranchSibseong || "",
        monthBranchSibseong: sajuData.monthBranchSibseong || "",
        dayBranchSibseong: sajuData.dayBranchSibseong || "",
        hourBranchSibseong: sajuData.hourBranchSibseong || "",
        elements: sajuData.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
        daeun: finalDaeunData.daeun || finalDaeunData,
      },
    }
  } catch (error) {
    console.error("Error in getSajuProfileBySessionId:", error)
    return null
  }
}

export interface SajuSessionData {
  name: string
  gender: string
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour?: number
  birth_minute?: number
  time_unknown: boolean
  birth_city_id: string
  time_standard: string
  lunar_year: number
  lunar_month: number
  lunar_day: number
  is_leap_month: boolean
  year_stem: string
  year_branch: string
  month_stem: string
  month_branch: string
  day_stem: string
  day_branch: string
  hour_stem: string
  hour_branch: string
  day_master: string
  year_animal: string
  elements: any
  relationship_status: string
}

interface BirthInfo {
  name: string
  birth_date: string
  birth_time: string
  gender: "male" | "female"
  birth_place: string
  is_lunar: boolean
}

export async function saveSajuSession(birthInfo: BirthInfo): Promise<string> {
  const supabase = getSupabase()

  try {
    // Parse the birth_date to extract year, month, day
    const birthDate = new Date(birthInfo.birth_date)
    const year = birthDate.getFullYear()
    const month = birthDate.getMonth() + 1 // getMonth() returns 0-11
    const day = birthDate.getDate()

    // Parse birth_time to extract hour and minute
    let hour = 12 // default to noon
    let minute = 0

    if (birthInfo.birth_time && birthInfo.birth_time !== "") {
      // Handle different time formats
      if (birthInfo.birth_time.includes("-")) {
        // Handle range format like "23:00-01:00" - take the start time
        const startTime = birthInfo.birth_time.split("-")[0]
        const timeParts = startTime.split(":")
        hour = Number.parseInt(timeParts[0], 10)
        minute = timeParts[1] ? Number.parseInt(timeParts[1], 10) : 0
      } else if (birthInfo.birth_time.includes(":")) {
        // Handle HH:MM format
        const timeParts = birthInfo.birth_time.split(":")
        hour = Number.parseInt(timeParts[0], 10)
        minute = Number.parseInt(timeParts[1], 10)
      } else {
        // Handle HHMM format
        if (birthInfo.birth_time.length === 4) {
          hour = Number.parseInt(birthInfo.birth_time.substring(0, 2), 10)
          minute = Number.parseInt(birthInfo.birth_time.substring(2), 10)
        } else if (birthInfo.birth_time.length <= 2) {
          hour = Number.parseInt(birthInfo.birth_time, 10)
          minute = 0
        }
      }
    }

    // Create the session with the correct nested structure
    const sessionData = {
      name: birthInfo.name,
      gender: birthInfo.gender,
      saju: {
        birthInfo: {
          solar: {
            year: year,
            month: month,
            day: day,
            hour: hour,
            minute: minute
          },
          lunar: {
            year: year, // This should be calculated properly
            month: month, // This should be calculated properly
            day: day, // This should be calculated properly
            isLeapMonth: false
          },
          birthCityId: birthInfo.birth_place,
          timeUnknown: false,
          timeStandard: "동경135도"
        }
      },
      created_at: new Date().toISOString(),
    }

    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert(sessionData)
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      throw new Error("Failed to create saju session")
    }

    return session.id
  } catch (error) {
    console.error("Error in saveSajuSession:", error)
    throw error
  }
}

export async function getSajuSession(sessionId: string) {
  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from("saju_sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (error) {
      console.error("Error fetching saju session:", error)
      throw new Error("Failed to fetch saju session")
    }

    return data
  } catch (error) {
    console.error("Error in getSajuSession:", error)
    throw error
  }
}
