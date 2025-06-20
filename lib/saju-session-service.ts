import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Get all saju profiles for the current authenticated user
 * This is the main function to fetch all profiles linked to the current user
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

    // First, check if we have any sessions with this auth_user_id
    const { data: sessionCheck, error: checkError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (checkError) {
      console.error("Error checking sessions:", checkError)
    } else {
      console.log(`Initial check found ${sessionCheck?.length || 0} sessions with auth_user_id ${authUserId}`)
    }

    // Query saju_sessions with proper joins to get all related data
    console.log("Executing full query with joins for auth_user_id:", authUserId)
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
          hour_branch,
          year_stem_sibseong,
          month_stem_sibseong,
          day_stem_sibseong,
          hour_stem_sibseong,
          year_branch_sibseong,
          month_branch_sibseong,
          day_branch_sibseong,
          hour_branch_sibseong
        )
      `)
      .eq("auth_user_id", authUserId)

    console.log("Full query result:", sessions)
    console.log("Full query error:", sessionsError)

    if (sessionsError) {
      console.error("Error fetching saju sessions:", sessionsError)
      return { profiles: [], authUserId }
    }

    console.log(`Found ${sessions?.length || 0} sessions for auth_user_id ${authUserId}:`, sessions)

    if (!sessions || sessions.length === 0) {
      return { profiles: [], authUserId }
    }

    // Map the data to our profile format
    const profiles = sessions.map((session) => {
      // Get the first birth_info and saju_info records if they exist
      const birthInfo = session.birth_info && session.birth_info.length > 0 ? session.birth_info[0] : null
      const sajuInfo = session.saju_info && session.saju_info.length > 0 ? session.saju_info[0] : null

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
          yearStem: sajuInfo?.year_stem || "N/A",
          yearBranch: sajuInfo?.year_branch || "N/A",
          monthStem: sajuInfo?.month_stem || "N/A",
          monthBranch: sajuInfo?.month_branch || "N/A",
          dayStem: sajuInfo?.day_stem || "N/A",
          dayBranch: sajuInfo?.day_branch || "N/A",
          hourStem: sajuInfo?.hour_stem || "N/A",
          hourBranch: sajuInfo?.hour_branch || "N/A",
          yearStemSibseong: sajuInfo?.year_stem_sibseong || "",
          monthStemSibseong: sajuInfo?.month_stem_sibseong || "",
          dayStemSibseong: sajuInfo?.day_stem_sibseong || "",
          hourStemSibseong: sajuInfo?.hour_stem_sibseong || "",
          yearBranchSibseong: sajuInfo?.year_branch_sibseong || "",
          monthBranchSibseong: sajuInfo?.month_branch_sibseong || "",
          dayBranchSibseong: sajuInfo?.day_branch_sibseong || "",
          hourBranchSibseong: sajuInfo?.hour_branch_sibseong || "",
        },
      }
    })

    console.log(`Returning ${profiles.length} profiles`)
    return { profiles, authUserId }
  } catch (error) {
    console.error("Error in getUserSajuProfiles:", error)
    return { profiles: [], authUserId: null }
  }
}

/**
 * Link a session to the current authenticated user
 * @param sessionId The ID of the session to link
 */
export async function linkSessionToUser(sessionId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return false
    }

    const authUserId = userData.user.id
    console.log(`Linking session ${sessionId} to user ${authUserId}`)

    // Check if the session exists
    const { data: session, error: checkError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id")
      .eq("id", sessionId)
      .single()

    if (checkError) {
      console.error(`Session ${sessionId} not found:`, checkError)
      return false
    }

    // If already linked to this user, no need to update
    if (session.auth_user_id === authUserId) {
      console.log(`Session ${sessionId} is already linked to user ${authUserId}`)
      return true
    }

    // Update the auth_user_id for the session
    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ auth_user_id: authUserId })
      .eq("id", sessionId)

    if (updateError) {
      console.error("Error linking session:", updateError)
      return false
    }

    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id")
      .eq("id", sessionId)
      .single()

    if (verifyError) {
      console.error("Error verifying session update:", verifyError)
      return false
    }

    console.log(`Verification: Session ${sessionId} now has auth_user_id: ${verifyData.auth_user_id}`)
    return true
  } catch (error) {
    console.error("Error in linkSessionToUser:", error)
    return false
  }
}

/**
 * Find and link all sessions that might belong to the current user
 * This function tries multiple strategies to find sessions
 */
export async function findAndLinkSessions(): Promise<{ success: boolean; linkedCount: number }> {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return { success: false, linkedCount: 0 }
    }

    const authUserId = userData.user.id
    const userEmail = userData.user.email
    const userName = userData.user.user_metadata?.name
    let linkedCount = 0

    console.log(`Finding sessions for user ${authUserId} (${userEmail})`)

    // Strategy 1: Check localStorage
    const localStorageSessionId = localStorage.getItem("user_id")
    if (localStorageSessionId) {
      console.log(`Checking localStorage session ID: ${localStorageSessionId}`)
      const success = await linkSessionIfUnlinked(localStorageSessionId, authUserId)
      if (success) linkedCount++
    }

    // Strategy 2: Check if there's a session with matching email
    if (userEmail) {
      console.log(`Looking for sessions with email: ${userEmail}`)
      const { data: emailSessions, error: emailError } = await supabase
        .from("saju_sessions")
        .select("id, auth_user_id")
        .eq("email", userEmail)

      if (emailError) {
        console.error("Error finding sessions by email:", emailError)
      } else if (emailSessions && emailSessions.length > 0) {
        console.log(`Found ${emailSessions.length} sessions with email ${userEmail}`)
        for (const session of emailSessions) {
          // Only link if not already linked to this user
          if (session.auth_user_id !== authUserId) {
            const success = await linkSessionToUser(session.id)
            if (success) linkedCount++
          }
        }
      }
    }

    // Strategy 3: Check if there's a session with matching name
    if (userName) {
      console.log(`Looking for sessions with name: ${userName}`)
      const { data: nameSessions, error: nameError } = await supabase
        .from("saju_sessions")
        .select("id, auth_user_id")
        .eq("name", userName)

      if (nameError) {
        console.error("Error finding sessions by name:", nameError)
      } else if (nameSessions && nameSessions.length > 0) {
        console.log(`Found ${nameSessions.length} sessions with name ${userName}`)
        for (const session of nameSessions) {
          // Only link if not already linked to this user
          if (session.auth_user_id !== authUserId) {
            const success = await linkSessionToUser(session.id)
            if (success) linkedCount++
          }
        }
      }
    }

    // After linking, verify we can find the sessions
    const { data: verifyData, error: verifyError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (verifyError) {
      console.error("Error verifying linked sessions:", verifyError)
    } else {
      console.log(`Verification found ${verifyData?.length || 0} sessions linked to user ${authUserId}`)
    }

    console.log(`Linked ${linkedCount} sessions in total`)
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

    // Check if the session exists and is not linked
    const { data: session, error: checkError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id")
      .eq("id", sessionId)
      .single()

    if (checkError) {
      console.error(`Session ${sessionId} not found:`, checkError)
      return false
    }

    // If already linked to this user, no need to update
    if (session.auth_user_id === authUserId) {
      console.log(`Session ${sessionId} is already linked to user ${authUserId}`)
      return false
    }

    // If linked to another user or not linked at all, update it
    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ auth_user_id: authUserId })
      .eq("id", sessionId)

    if (updateError) {
      console.error(`Error linking session ${sessionId}:`, updateError)
      return false
    }

    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id")
      .eq("id", sessionId)
      .single()

    if (verifyError) {
      console.error("Error verifying session update:", verifyError)
      return false
    }

    console.log(`Verification: Session ${sessionId} now has auth_user_id: ${verifyData.auth_user_id}`)
    return true
  } catch (error) {
    console.error(`Error in linkSessionIfUnlinked for session ${sessionId}:`, error)
    return false
  }
}

/**
 * Get saju data by UUID (either session ID or birth info ID)
 */
export async function getSajuDataByUuid(uuid: string) {
  try {
    const supabase = createClientComponentClient()
    console.log(`Fetching saju data for UUID: ${uuid}`)

    // First try to get the session directly
    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .select(
        `
        *,
        birth_info(*),
        saju_info(*)
      `,
      )
      .eq("id", uuid)
      .single()

    if (sessionError) {
      console.log(`No session found with ID ${uuid}, trying to find by birth_info.id`)

      // Try to get by birth_info.id
      const { data: birthInfo, error: birthError } = await supabase
        .from("birth_info")
        .select(
          `
          *,
          saju_sessions(*),
          saju_info!inner(*)
        `,
        )
        .eq("id", uuid)
        .single()

      if (birthError) {
        console.error("Error fetching by birth_info.id:", birthError)
        return null
      }

      if (!birthInfo) {
        console.log(`No birth info found with ID ${uuid}`)
        return null
      }

      // Format the data
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

    // If we found the session directly
    if (!session) {
      console.log(`No session found with ID ${uuid}`)
      return null
    }

    const birthInfo = session.birth_info?.[0] || {}
    const sajuInfo = session.saju_info?.[0] || {}

    // Format the data
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

    // Check for sessions with this auth_user_id
    const { data: sessions, error } = await supabase
      .from("saju_sessions")
      .select("id, name, auth_user_id")
      .eq("auth_user_id", authUserId)

    if (error) {
      console.error("Error checking sessions:", error)
      return { success: false, sessions: [] }
    }

    console.log(`Debug: Found ${sessions?.length || 0} sessions with auth_user_id ${authUserId}:`, sessions)
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

    // First, reset all sessions for this user to not be default
    const { error: resetError } = await supabase
      .from("saju_sessions")
      .update({ is_default: false })
      .eq("auth_user_id", authUserId)

    if (resetError) {
      console.error("Error resetting default sessions:", resetError)
      return false
    }

    // Then set the specified session as default
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
 * Get a saju profile by session ID
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
        yearStem: sajuInfo.year_stem || "",
        yearBranch: sajuInfo.year_branch || "",
        monthStem: sajuInfo.month_stem || "",
        monthBranch: sajuInfo.month_branch || "",
        dayStem: sajuInfo.day_stem || "",
        dayBranch: sajuInfo.day_branch || "",
        hourStem: sajuInfo.hour_stem || "",
        hourBranch: sajuInfo.hour_branch || "",
        yearStemHanja: sajuInfo.year_stem_hanja || "",
        yearBranchHanja: sajuInfo.year_branch_hanja || "",
        monthStemHanja: sajuInfo.month_stem_hanja || "",
        monthBranchHanja: sajuInfo.month_branch_hanja || "",
        dayStemHanja: sajuInfo.day_stem_hanja || "",
        dayBranchHanja: sajuInfo.day_branch_hanja || "",
        hourStemHanja: sajuInfo.hour_stem_hanja || "",
        hourBranchHanja: sajuInfo.hour_branch_hanja || "",
        dayMaster: sajuInfo.day_master || "",
        dayMasterHanja: sajuInfo.day_master_hanja || "",
        elements: { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
      },
    }
  } catch (error) {
    console.error("Error in getSajuProfileBySessionId:", error)
    return null
  }
}
