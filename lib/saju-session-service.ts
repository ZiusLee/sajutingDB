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

    // Simplified query - just fetch basic saju_sessions data without joins
    console.log("Executing simplified query for auth_user_id:", authUserId)
    const { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select("id, name, gender, email, created_at, auth_user_id")
      .eq("auth_user_id", authUserId)

    console.log("Simplified query result:", sessions)
    console.log("Simplified query error:", sessionsError)

    if (sessionsError) {
      console.error("Error fetching saju sessions:", sessionsError)
      return { profiles: [], authUserId }
    }

    console.log(`Found ${sessions?.length || 0} sessions for auth_user_id ${authUserId}:`, sessions)

    if (!sessions || sessions.length === 0) {
      return { profiles: [], authUserId }
    }

    // Map the data to our profile format with placeholder values for missing join data
    const profiles = sessions.map((session) => {
      return {
        id: session.id,
        name: session.name || "무명",
        gender: session.gender || "unknown",
        birthYear: "N/A", // Placeholder since we don't have birth_info
        birthMonth: "N/A",
        birthDay: "N/A",
        birthHour: "N/A",
        birthMinute: "N/A",
        lunarYear: "N/A",
        lunarMonth: "N/A",
        lunarDay: "N/A",
        timeUnknown: false,
        createdAt: session.created_at || new Date().toISOString(),
        birthInfoId: null, // No birth_info.id available
        saju: {
          yearStem: "N/A",
          yearBranch: "N/A",
          monthStem: "N/A",
          monthBranch: "N/A",
          dayStem: "N/A",
          dayBranch: "N/A",
          hourStem: "N/A",
          hourBranch: "N/A",
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
