import { supabase } from "./supabase-client"

/**
 * Transfer data from anonymous user to authenticated user
 */
export async function transferAnonymousDataToUser(authUserId: string, anonymousUserId?: string): Promise<boolean> {
  try {
    console.log(`Transferring data from anonymous user ${anonymousUserId || "unknown"} to auth user ${authUserId}`)

    // If no anonymous user ID provided, try to get it from localStorage
    if (!anonymousUserId) {
      anonymousUserId = localStorage.getItem("user_id") || undefined
      console.log(`Using anonymous user ID from localStorage: ${anonymousUserId || "not found"}`)
    }

    if (!anonymousUserId) {
      console.log("No anonymous user ID available, skipping data transfer")
      return false
    }

    // Check if the anonymous user exists in saju_sessions
    const { data: anonymousUser, error: userError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("id", anonymousUserId)
      .single()

    if (userError || !anonymousUser) {
      console.log(`Anonymous user ${anonymousUserId} not found in database, skipping transfer`)
      return false
    }

    // Update the auth_user_id for the anonymous user
    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ auth_user_id: authUserId })
      .eq("id", anonymousUserId)

    if (updateError) {
      console.error("Error updating auth_user_id:", updateError)
      return false
    }

    console.log(`Successfully linked anonymous user ${anonymousUserId} to auth user ${authUserId}`)
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

/**
 * Get chat history for the current user
 */
export async function getChatHistory(): Promise<any[]> {
  try {
    // Get the current auth user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session || !session.user) {
      console.log("No authenticated user found, returning empty chat history")
      return []
    }

    const authUserId = session.user.id

    // Get all saju_sessions linked to this auth user
    const { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (sessionsError || !sessions || sessions.length === 0) {
      console.log("No sessions found for auth user:", authUserId)
      return []
    }

    // Get all chat rooms for these sessions
    const sessionIds = sessions.map((s) => s.id)
    const { data: chatRooms, error: chatError } = await supabase
      .from("chat_rooms")
      .select(`
        id,
        title,
        room_type,
        created_at,
        updated_at,
        user_id
      `)
      .in("user_id", sessionIds)
      .order("updated_at", { ascending: false })

    if (chatError) {
      console.error("Error fetching chat rooms:", chatError)
      return []
    }

    if (!chatRooms || chatRooms.length === 0) {
      console.log("No chat rooms found for user sessions")
      return []
    }

    // Format the chat history
    return chatRooms.map((room) => ({
      id: room.id,
      title: room.title || "Untitled Chat",
      roomType: room.room_type || "general",
      createdAt: room.created_at,
      updatedAt: room.updated_at,
      userId: room.user_id,
    }))
  } catch (error) {
    console.error("Error getting chat history:", error)
    return []
  }
}
