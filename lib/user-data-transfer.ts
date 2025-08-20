import { supabase } from "./supabase-client"

/**
 * Transfer data from anonymous user to authenticated user
 */
export async function transferAnonymousDataToUser(authUserId: string, sessionId?: string): Promise<boolean> {
  try {
    console.log(`Transferring data from anonymous user to auth user ${authUserId}`)

    const { data: existingSessions, error: existingError } = await supabase
      .from("saju_sessions")
      .select("id, name")
      .eq("auth_user_id", authUserId)

    if (existingError) {
      console.error("Error checking existing sessions:", existingError)
      return false
    }

    if (existingSessions && existingSessions.length > 0) {
      console.log(
        `User ${authUserId} already has ${existingSessions.length} existing sessions, skipping anonymous data transfer`,
      )
      return true // Return true as this is not an error condition
    }

    let anonymousUserId = localStorage.getItem("user_id") || localStorage.getItem("saju_session_id")

    if (!anonymousUserId && sessionId) {
      console.log(`Using provided session ID: ${sessionId}`)
      anonymousUserId = sessionId
    }

    if (!anonymousUserId) {
      console.log("No anonymous user ID available, skipping data transfer")
      return false
    }

    const { data: anonymousUser, error: userError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id, name, email, created_at")
      .eq("id", anonymousUserId)
      .single()

    if (userError || !anonymousUser) {
      console.log(`Anonymous user ${anonymousUserId} not found in database, skipping transfer`)
      return false
    }

    if (anonymousUser.auth_user_id && anonymousUser.auth_user_id !== authUserId) {
      console.error(
        `SECURITY ALERT: Session ${anonymousUserId} is already linked to user ${anonymousUser.auth_user_id}, cannot link to ${authUserId}`,
      )
      return false
    }

    if (anonymousUser.auth_user_id === authUserId) {
      console.log(`Session ${anonymousUserId} is already linked to user ${authUserId}`)
      return true
    }

    const sessionCreatedAt = new Date(anonymousUser.created_at)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    if (sessionCreatedAt < oneHourAgo) {
      console.warn(`Session ${anonymousUserId} is older than 1 hour, requiring additional verification`)
      // For older sessions, we're more cautious about linking
      if (!sessionId) {
        console.log("Skipping transfer of old session without explicit session ID")
        return false
      }
    }

    // Update the auth_user_id for the anonymous user
    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ auth_user_id: authUserId })
      .eq("id", anonymousUserId)
      .is("auth_user_id", null) // Only update if not already linked

    if (updateError) {
      console.error("Error updating auth_user_id:", updateError)
      return false
    }

    console.log(`Successfully linked anonymous user ${anonymousUserId} to auth user ${authUserId}`)

    localStorage.removeItem("user_id")
    localStorage.removeItem("saju_session_id")
    localStorage.removeItem("pending_session_link")
    localStorage.removeItem("anonymous_session_created")

    return true
  } catch (error) {
    console.error("Error transferring user data:", error)
    return false
  }
}

/**
 * Get all user profiles for the current user
 */
export async function getAllUserProfiles(): Promise<any[]> {
  try {
    // Get the current auth user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || !session.user) {
      console.log("No authenticated user found, returning empty profiles")
      return []
    }

    const authUserId = session.user.id

    // Get all saju_sessions linked to this auth user
    const { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select(`
        id,
        name,
        gender,
        created_at,
        birth_info (*)
      `)
      .eq("auth_user_id", authUserId)

    if (sessionsError) {
      console.error("Error fetching user profiles:", sessionsError)
      return []
    }

    if (!sessions || sessions.length === 0) {
      console.log("No profiles found for auth user:", authUserId)
      return []
    }

    // Format the profiles
    const profiles = sessions.map((session) => {
      const birthInfo = session.birth_info?.[0] || {}

      return {
        id: session.id,
        name: session.name || "Unknown",
        gender: session.gender || "unknown",
        birthYear: birthInfo.solar_year?.toString() || "",
        birthMonth: birthInfo.solar_month?.toString().padStart(2, "0") || "",
        birthDay: birthInfo.solar_day?.toString().padStart(2, "0") || "",
        birthHour: birthInfo.solar_hour?.toString().padStart(2, "0") || "00",
        birthMinute: birthInfo.solar_minute?.toString().padStart(2, "0") || "00",
        lunarYear: birthInfo.lunar_year?.toString() || "",
        lunarMonth: birthInfo.lunar_month?.toString().padStart(2, "0") || "",
        lunarDay: birthInfo.lunar_day?.toString().padStart(2, "0") || "",
        timeUnknown: birthInfo.time_unknown || false,
        isDefault: false,
        createdAt: session.created_at || new Date().toISOString(),
      }
    })

    return profiles
  } catch (error) {
    console.error("Error getting all user profiles:", error)
    return []
  }
}

/**
 * Get saju data by UUID
 */
export async function getSajuDataByUuid(uuid: string) {
  try {
    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .select(`
        *,
        birth_info(*),
        saju_info(*),
        interpretations(*)
      `)
      .eq("id", uuid)
      .single()

    if (sessionError) {
      console.error("Error fetching saju session by UUID:", sessionError)
      return null
    }

    if (!session) {
      console.log(`No saju session found with UUID: ${uuid}`)
      return null
    }

    const birthInfo = session.birth_info?.[0] || {}
    const sajuInfo = session.saju_info?.[0] || {}
    const interpretation = session.interpretations?.[0]?.basic_interpretation || ""

    // Format the saju data
    const sajuData = {
      yearStem: sajuInfo.year_stem || "",
      yearBranch: sajuInfo.year_branch || "",
      monthStem: sajuInfo.month_stem || "",
      monthBranch: sajuInfo.month_branch || "",
      dayStem: sajuInfo.day_stem || "",
      dayBranch: sajuInfo.day_branch || "",
      hourStem: sajuInfo.hour_stem || "",
      hourBranch: sajuInfo.hour_branch || "",
      year: birthInfo.solar_year || "",
      month: birthInfo.solar_month || "",
      day: birthInfo.solar_day || "",
      hour: birthInfo.solar_hour || "",
      minute: birthInfo.solar_minute || "",
      lunarYear: birthInfo.lunar_year || "",
      lunarMonth: birthInfo.lunar_month || "",
      lunarDay: birthInfo.lunar_day || "",
      interpretation: interpretation,
    }

    // Format the user data
    const userData = {
      id: session.id,
      name: session.name || "무명",
      gender: session.gender || "unknown",
      createdAt: session.created_at || new Date().toISOString(),
    }

    return { userData, sajuData }
  } catch (error) {
    console.error("Error in getSajuDataByUuid:", error)
    return null
  }
}

/**
 * Set a user profile as the default profile
 */
export async function setDefaultUserProfile(profileId: string): Promise<boolean> {
  try {
    // Get the current auth user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || !session.user) {
      console.log("No authenticated user found, cannot set default profile")
      return false
    }

    const authUserId = session.user.id

    // Get all saju_sessions linked to this auth user
    const { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (sessionsError || !sessions) {
      console.error("Error fetching user sessions:", sessionsError)
      return false
    }

    // Reset is_default for all sessions
    const sessionIds = sessions.map((s) => s.id)
    if (sessionIds.length > 0) {
      const { error: resetError } = await supabase
        .from("saju_sessions")
        .update({ is_default: false })
        .in("id", sessionIds)

      if (resetError) {
        console.error("Error resetting default profiles:", resetError)
        return false
      }
    }

    // Set the selected profile as default
    const { error: updateError } = await supabase.from("saju_sessions").update({ is_default: true }).eq("id", profileId)

    if (updateError) {
      console.error("Error setting default profile:", updateError)
      return false
    }

    console.log(`Successfully set profile ${profileId} as default`)
    return true
  } catch (error) {
    console.error("Error setting default user profile:", error)
    return false
  }
}

// Removed getChatHistory function since we're dropping chat_rooms table
