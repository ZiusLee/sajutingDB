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
        birth_info (
          id,
          solar_year,
          solar_month,
          solar_day,
          solar_hour,
          solar_minute,
          lunar_year,
          lunar_month,
          lunar_day,
          time_unknown
        ),
        saju_info (
          id,
          year_stem,
          year_branch,
          month_stem,
          month_branch,
          day_stem,
          day_branch,
          hour_stem,
          hour_branch
        )
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
        const birthInfo = session.birth_info && session.birth_info.length > 0 ? session.birth_info[0] : null
        const sajuInfo = session.saju_info && session.saju_info.length > 0 ? session.saju_info[0] : null
        const sajuJsonb = session.saju || {}

        let daeunData = sajuJsonb.daeun
        let shouldUpdateDB = false

        if (
          !daeunData ||
          !daeunData.pillars ||
          (daeunData.pillars &&
            daeunData.pillars.length > 0 &&
            daeunData.pillars.every((p: any) => p.stem === "갑" && p.branch === "자"))
        ) {
          if (
            (sajuInfo?.year_stem || sajuJsonb.yearStem) &&
            (sajuInfo?.month_stem || sajuJsonb.monthStem) &&
            (sajuInfo?.month_branch || sajuJsonb.monthBranch) &&
            birthInfo?.solar_year &&
            birthInfo?.solar_month &&
            birthInfo?.solar_day
          ) {
            try {
              daeunData = calculateDaeunInfo(
                {
                  yearStem: sajuInfo?.year_stem || sajuJsonb.yearStem,
                  monthStem: sajuInfo?.month_stem || sajuJsonb.monthStem,
                  monthBranch: sajuInfo?.month_branch || sajuJsonb.monthBranch,
                },
                birthInfo.solar_year,
                birthInfo.solar_month,
                birthInfo.solar_day,
                session.gender || "female",
                birthInfo.time_unknown ? undefined : birthInfo.solar_hour,
                birthInfo.time_unknown ? undefined : birthInfo.solar_minute,
                birthInfo.time_unknown || false,
              )
              shouldUpdateDB = true
            } catch (error) {
              console.error(`Error calculating daeun for session ${session.id}:`, error)
            }
          }
        }

        if (shouldUpdateDB && daeunData) {
          const updatedSajuJsonb = { ...sajuJsonb, daeun: daeunData }
          supabase
            .from("saju_sessions")
            .update({ saju: updatedSajuJsonb })
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
          birthYear: birthInfo?.solar_year?.toString() || "N/A",
          birthMonth: birthInfo?.solar_month?.toString().padStart(2, "0") || "N/A",
          birthDay: birthInfo?.solar_day?.toString().padStart(2, "0") || "N/A",
          birthHour: birthInfo?.solar_hour?.toString().padStart(2, "0") || "N/A",
          birthMinute: birthInfo?.solar_minute?.toString().padStart(2, "0") || "N/A",
          lunarYear: birthInfo?.lunar_year?.toString() || "N/A",
          lunarMonth: birthInfo?.lunar_month?.toString().padStart(2, "0") || "N/A",
          lunarDay: birthInfo?.lunar_day?.toString() || "N/A",
          timeUnknown: birthInfo?.time_unknown || false,
          createdAt: session.created_at || new Date().toISOString(),
          birthInfoId: birthInfo?.id || null,
          isDefault: session.is_default || false,
          saju: {
            yearStem: sajuInfo?.year_stem || sajuJsonb.yearStem || "N/A",
            yearBranch: sajuInfo?.year_branch || sajuJsonb.yearBranch || "N/A",
            monthStem: sajuInfo?.month_stem || sajuJsonb.monthStem || "N/A",
            monthBranch: sajuInfo?.month_branch || sajuJsonb.monthBranch || "N/A",
            dayStem: sajuInfo?.day_stem || sajuJsonb.dayStem || "N/A",
            dayBranch: sajuInfo?.day_branch || sajuJsonb.dayBranch || "N/A",
            hourStem: sajuInfo?.hour_stem || sajuJsonb.hourStem || "N/A",
            hourBranch: sajuInfo?.hour_branch || sajuJsonb.hourBranch || "N/A",
            yearStemSibseong: sajuJsonb.yearStemSibseong || "",
            monthStemSibseong: sajuJsonb.monthStemSibseong || "",
            dayStemSibseong: sajuJsonb.dayStemSibseong || "",
            hourStemSibseong: sajuJsonb.hourStemSibseong || "",
            yearBranchSibseong: sajuJsonb.yearBranchSibseong || "",
            monthBranchSibseong: sajuJsonb.monthBranchSibseong || "",
            dayBranchSibseong: sajuJsonb.dayBranchSibseong || "",
            hourBranchSibseong: sajuJsonb.hourBranchSibseong || "",
            daeun: daeunData,
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
      .select(`
        *,
        birth_info(*),
        saju_info(*)
      `)
      .eq("id", uuid)
      .single()

    if (sessionError) {
      const { data: birthInfo, error: birthError } = await supabase
        .from("birth_info")
        .select(`
          *,
          saju_sessions(*),
          saju_info!inner(*)
        `)
        .eq("id", uuid)
        .single()

      if (birthError || !birthInfo) {
        return null
      }

      const userData = {
        id: birthInfo.saju_sessions?.id || "",
        name: birthInfo.saju_sessions?.name || "무명",
        gender: birthInfo.saju_sessions?.gender || "unknown",
        createdAt: birthInfo.created_at || new Date().toISOString(),
      }

      const sajuInfo = birthInfo.saju_info?.[0] || {}

      const sajuData = {
        yearStem: sajuInfo.year_stem || "",
        yearBranch: sajuInfo.year_branch || "",
        monthStem: sajuInfo.month_stem || "",
        monthBranch: sajuInfo.month_branch || "",
        dayStem: sajuInfo.day_stem || "",
        dayBranch: sajuInfo.day_branch || "",
        hourStem: sajuInfo.hour_stem || "",
        hourBranch: sajuInfo.hour_branch || "",
        year: birthInfo.solar_year?.toString() || "",
        month: birthInfo.solar_month?.toString() || "",
        day: birthInfo.solar_day?.toString() || "",
        hour: birthInfo.solar_hour?.toString() || "",
        minute: birthInfo.solar_minute?.toString() || "",
        lunarYear: birthInfo.lunar_year?.toString() || "",
        lunarMonth: birthInfo.lunar_month?.toString() || "",
        lunarDay: birthInfo.lunar_day?.toString() || "",
      }

      return { userData, sajuData }
    }

    if (!session) {
      return null
    }

    const birthInfo = session.birth_info?.[0] || {}
    const sajuInfo = session.saju_info?.[0] || {}

    const userData = {
      id: session.id,
      name: session.name || "무명",
      gender: session.gender || "unknown",
      createdAt: session.created_at || new Date().toISOString(),
    }

    const sajuData = {
      yearStem: sajuInfo.year_stem || "",
      yearBranch: sajuInfo.year_branch || "",
      monthStem: sajuInfo.month_stem || "",
      monthBranch: sajuInfo.month_branch || "",
      dayStem: sajuInfo.day_stem || "",
      dayBranch: sajuInfo.day_branch || "",
      hourStem: sajuInfo.hour_stem || "",
      hourBranch: sajuInfo.hour_branch || "",
      year: birthInfo.solar_year?.toString() || "",
      month: birthInfo.solar_month?.toString() || "",
      day: birthInfo.solar_day?.toString() || "",
      hour: birthInfo.solar_hour?.toString() || "",
      minute: birthInfo.solar_minute?.toString() || "",
      lunarYear: birthInfo.lunar_year?.toString() || "",
      lunarMonth: birthInfo.lunar_month?.toString() || "",
      lunarDay: birthInfo.lunar_day?.toString() || "",
    }

    return { userData, sajuData }
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
      .select(`
        id,
        name,
        gender,
        created_at,
        saju,
        birth_info (
          id,
          solar_year,
          solar_month,
          solar_day,
          solar_hour,
          solar_minute,
          lunar_year,
          lunar_month,
          lunar_day,
          time_unknown
        ),
        saju_info (
          year_stem,
          year_branch,
          month_stem,
          month_branch,
          day_stem,
          day_branch,
          hour_stem,
          hour_branch,
          year_stem_hanja,
          year_branch_hanja,
          month_stem_hanja,
          month_branch_hanja,
          day_stem_hanja,
          day_branch_hanja,
          hour_stem_hanja,
          hour_branch_hanja,
          day_master,
          day_master_hanja
        )
      `)
      .eq("id", sessionId)
      .single()

    if (error) {
      console.error("Error getting saju profile by session ID:", error)
      return null
    }

    const birthInfo = data?.birth_info?.[0] || {}
    const sajuInfo = data?.saju_info?.[0] || {}
    const sajuJsonb = data?.saju || {}

    let daeunData = sajuJsonb.daeun

    if (
      !daeunData ||
      !daeunData.pillars ||
      (daeunData.pillars &&
        daeunData.pillars.length > 0 &&
        daeunData.pillars.every((p: any) => p.stem === "갑" && p.branch === "자"))
    ) {
      if (
        (sajuInfo?.year_stem || sajuJsonb.yearStem) &&
        (sajuInfo?.month_stem || sajuJsonb.monthStem) &&
        (sajuInfo?.month_branch || sajuJsonb.monthBranch) &&
        birthInfo?.solar_year &&
        birthInfo?.solar_month &&
        birthInfo?.solar_day
      ) {
        try {
          daeunData = calculateDaeunInfo(
            {
              yearStem: sajuInfo?.year_stem || sajuJsonb.yearStem,
              monthStem: sajuInfo?.month_stem || sajuJsonb.monthStem,
              monthBranch: sajuInfo?.month_branch || sajuJsonb.monthBranch,
            },
            birthInfo.solar_year,
            birthInfo.solar_month,
            birthInfo.solar_day,
            data.gender || "female",
            birthInfo.time_unknown ? undefined : birthInfo.solar_hour,
            birthInfo.time_unknown ? undefined : birthInfo.solar_minute,
            birthInfo.time_unknown || false,
          )

          const updatedSajuJsonb = { ...sajuJsonb, daeun: daeunData }

          supabase
            .from("saju_sessions")
            .update({ saju: updatedSajuJsonb })
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
      birthYear: birthInfo.solar_year?.toString() || "",
      birthMonth: birthInfo.solar_month?.toString().padStart(2, "0") || "",
      birthDay: birthInfo.solar_day?.toString().padStart(2, "0") || "",
      birthHour: birthInfo.solar_hour?.toString().padStart(2, "0") || "00",
      birthMinute: birthInfo.solar_minute?.toString().padStart(2, "0") || "00",
      lunarYear: birthInfo.lunar_year?.toString() || "",
      lunarMonth: birthInfo.lunar_month?.toString().padStart(2, "0") || "",
      lunarDay: birthInfo.lunar_day?.toString().padStart(2, "0") || "",
      timeUnknown: birthInfo.time_unknown || false,
      createdAt: data.created_at || new Date().toISOString(),
      saju: {
        yearStem: sajuInfo.year_stem || sajuJsonb.yearStem || "",
        yearBranch: sajuInfo.year_branch || sajuJsonb.yearBranch || "",
        monthStem: sajuInfo.month_stem || sajuJsonb.monthStem || "",
        monthBranch: sajuInfo.month_branch || sajuJsonb.monthBranch || "",
        dayStem: sajuInfo.day_stem || sajuJsonb.dayStem || "",
        dayBranch: sajuInfo.day_branch || sajuJsonb.dayBranch || "",
        hourStem: sajuInfo.hour_stem || sajuJsonb.hourStem || "",
        hourBranch: sajuInfo.hour_branch || sajuJsonb.hourBranch || "",
        yearStemHanja: sajuInfo.year_stem_hanja || sajuJsonb.yearStemHanja || "",
        yearBranchHanja: sajuInfo.year_branch_hanja || sajuJsonb.yearBranchHanja || "",
        monthStemHanja: sajuInfo.month_stem_hanja || sajuJsonb.monthStemHanja || "",
        monthBranchHanja: sajuInfo.month_branch_hanja || sajuJsonb.monthBranchHanja || "",
        dayStemHanja: sajuInfo.day_stem_hanja || sajuJsonb.dayStemHanja || "",
        dayBranchHanja: sajuInfo.day_branch_hanja || sajuJsonb.dayBranchHanja || "",
        hourStemHanja: sajuInfo.hour_stem_hanja || sajuJsonb.hourStemHanja || "",
        hourBranchHanja: sajuInfo.hour_branch_hanja || sajuJsonb.hourBranchHanja || "",
        dayMaster: sajuInfo.day_master || sajuJsonb.dayMaster || "",
        dayMasterHanja: sajuInfo.day_master_hanja || sajuJsonb.dayMasterHanja || "",
        yearStemSibseong: sajuJsonb.yearStemSibseong || "",
        monthStemSibseong: sajuJsonb.monthStemSibseong || "",
        dayStemSibseong: sajuJsonb.dayStemSibseong || "비견",
        hourStemSibseong: sajuJsonb.hourStemSibseong || "",
        yearBranchSibseong: sajuJsonb.yearBranchSibseong || "",
        monthBranchSibseong: sajuJsonb.monthBranchSibseong || "",
        dayBranchSibseong: sajuJsonb.dayBranchSibseong || "",
        hourBranchSibseong: sajuJsonb.hourBranchSibseong || "",
        elements: sajuJsonb.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
        daeun: daeunData,
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
    // Let Supabase generate the UUID automatically - don't specify an id
    const { data: sessionData, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert({
        name: birthInfo.name,
        gender: birthInfo.gender,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      throw new Error("Failed to create saju session")
    }

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

    // Create the birth_info record with proper solar date fields
    const { error: birthInfoError } = await supabase.from("birth_info").insert({
      user_id: sessionData.id,
      solar_year: year,
      solar_month: month,
      solar_day: day,
      solar_hour: hour,
      solar_minute: minute,
      birth_city_id: birthInfo.birth_place, // Use birth_city_id instead of birth_place
      time_unknown: false, // Since we're getting time input
      created_at: new Date().toISOString(),
    })

    if (birthInfoError) {
      console.error("Error creating birth info:", birthInfoError)
      // Clean up the session if birth info creation fails
      await supabase.from("saju_sessions").delete().eq("id", sessionData.id)
      throw new Error("Failed to create birth info")
    }

    return sessionData.id
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
      .select(`
        *,
        birth_info (*)
      `)
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
