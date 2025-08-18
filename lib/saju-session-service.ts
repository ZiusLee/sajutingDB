import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"

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

    // First get the basic session data without joins to avoid duplicates
    const { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select("id, name, gender, email, created_at, auth_user_id, is_default, saju, daeun")
      .eq("auth_user_id", authUserId)

    console.log("Sessions query result:", sessions)
    console.log("Sessions query error:", sessionsError)

    if (sessionsError) {
      console.error("Error fetching saju sessions:", sessionsError)
      return { profiles: [], authUserId }
    }

    if (!sessions || sessions.length === 0) {
      console.log("No sessions found for auth_user_id:", authUserId)
      return { profiles: [], authUserId }
    }

    console.log(`Found ${sessions.length} sessions for auth_user_id ${authUserId}`)

    // Filter out invalid sessions and remove duplicates
    const validSessions = sessions.filter((session, index, self) => {
      const hasValidData = session && session.id && session.name
      const isUnique = self.findIndex((s) => s.id === session.id) === index

      if (!hasValidData) {
        console.warn("Invalid session found:", session)
      }
      if (!isUnique) {
        console.warn("Duplicate session found:", session.id)
      }

      return hasValidData && isUnique
    })

    console.log(`After filtering: ${validSessions.length} valid unique sessions`)

    // Now get birth_info and saju_info for each session separately
    // Note: user_id in these tables actually refers to session_id
    const profiles = await Promise.all(
      validSessions.map(async (session) => {
        // Get birth_info for this session (user_id column contains session_id)
        const { data: birthInfoData } = await supabase
          .from("birth_info")
          .select("*")
          .eq("user_id", session.id)
          .limit(1)
          .single()

        // Get saju_info for this session (user_id column contains session_id)
        const { data: sajuInfoData } = await supabase
          .from("saju_info")
          .select("*")
          .eq("user_id", session.id)
          .limit(1)
          .single()

        const birthInfo = birthInfoData || {}
        const sajuInfo = sajuInfoData || {}
        const sajuJsonb = session.saju || {}

        let daeunData = session.daeun
        let shouldUpdateDB = false

        // 대운이 없거나 잘못된 데이터인 경우 계산
        if (
          !daeunData ||
          !daeunData.pillars ||
          (daeunData.pillars &&
            daeunData.pillars.length > 0 &&
            daeunData.pillars.every((p: any) => p.stem === "갑" && p.branch === "자"))
        ) {
          console.log(`Session ${session.id}: 대운 데이터가 없거나 잘못됨, 새로 계산합니다.`)

          // 대운 계산에 필요한 데이터가 있는지 확인
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

              console.log(`Session ${session.id}: 새로 계산된 대운:`, daeunData)
              shouldUpdateDB = true
            } catch (error) {
              console.error(`Error calculating daeun for session ${session.id}:`, error)
            }
          }
        }

        if (shouldUpdateDB && daeunData) {
          // 비동기로 DB 업데이트 (await 하지 않음)
          supabase
            .from("saju_sessions")
            .update({ daeun: daeunData })
            .eq("id", session.id)
            .then(({ error }) => {
              if (error) {
                console.error(`Error updating daeun for session ${session.id}:`, error)
              } else {
                console.log(`Successfully updated daeun for session ${session.id}`)
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
            // 십성 정보는 saju JSONB에서 가져옴
            yearStemSibseong: sajuJsonb.yearStemSibseong || "",
            monthStemSibseong: sajuJsonb.monthStemSibseong || "",
            dayStemSibseong: sajuJsonb.dayStemSibseong || "",
            hourStemSibseong: sajuJsonb.hourStemSibseong || "",
            yearBranchSibseong: sajuJsonb.yearBranchSibseong || "",
            monthBranchSibseong: sajuJsonb.monthBranchSibseong || "",
            dayBranchSibseong: sajuJsonb.dayBranchSibseong || "",
            hourBranchSibseong: sajuJsonb.hourBranchSibseong || "",
            // 오행 정보도 saju JSONB에서 가져옴
            elements: sajuJsonb.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
            daeun: daeunData,
          },
        }
      }),
    )

    console.log(`Returning ${profiles.length} profiles`)
    return { profiles, authUserId }
  } catch (error) {
    console.error("Error in getUserSajuProfiles:", error)
    return { profiles: [], authUserId: null }
  }
}

/**
 * Link a session to the current authenticated user and set as default if it's their first
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

    if (session.auth_user_id && session.auth_user_id !== authUserId) {
      console.log(`Session ${sessionId} is already linked to different user ${session.auth_user_id}`)
      return false
    }

    // If already linked to this user, no need to update
    if (session.auth_user_id === authUserId) {
      console.log(`Session ${sessionId} is already linked to user ${authUserId}`)
      return true
    }

    const { data: existingSessions, error: existingError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (existingError) {
      console.error("Error checking existing sessions:", existingError)
      return false
    }

    const shouldBeDefault = !existingSessions || existingSessions.length === 0

    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({
        auth_user_id: authUserId,
        is_default: shouldBeDefault,
      })
      .eq("id", sessionId)
      .eq("auth_user_id", null) // null인 경우에만 업데이트하도록 추가 보안

    if (updateError) {
      console.error("Error linking session:", updateError)
      return false
    }

    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id, is_default")
      .eq("id", sessionId)
      .single()

    if (verifyError) {
      console.error("Error verifying session update:", verifyError)
      return false
    }

    console.log(
      `Verification: Session ${sessionId} now has auth_user_id: ${verifyData.auth_user_id}, is_default: ${verifyData.is_default}`,
    )
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

    // Strategy 0: Check for pending session link first
    const pendingSessionId = localStorage.getItem("pending_session_link")
    if (pendingSessionId) {
      console.log(`Checking pending session ID: ${pendingSessionId}`)
      const success = await linkSessionIfUnlinked(pendingSessionId, authUserId)
      if (success) {
        linkedCount++
        localStorage.removeItem("pending_session_link")
        localStorage.removeItem("anonymous_session_created")
      }
    }

    // Strategy 1: Check localStorage for session ID
    const localStorageSessionId = localStorage.getItem("saju_session_id")
    if (localStorageSessionId && localStorageSessionId !== pendingSessionId) {
      console.log(`Checking localStorage session ID: ${localStorageSessionId}`)
      const success = await linkSessionIfUnlinked(localStorageSessionId, authUserId)
      if (success) linkedCount++
    }

    // Strategy 2: Check if there's a session with matching email
    if (userEmail) {
      console.log(`Looking for sessions with email: ${userEmail}`)
      const { data: emailSessions, error: emailError } = await supabase
        .from("saju_sessions")
        .select("id, auth_user_id, name")
        .eq("email", userEmail)
        .is("auth_user_id", null) // Only get unlinked sessions

      if (emailError) {
        console.error("Error finding sessions by email:", emailError)
      } else if (emailSessions && emailSessions.length > 0) {
        console.log(`Found ${emailSessions.length} unlinked sessions with email ${userEmail}`)
        for (const session of emailSessions) {
          const success = await linkSessionToUser(session.id)
          if (success) linkedCount++
        }
      }
    }

    // Strategy 3: Check if there's a session with matching name (more restrictive)
    if (userName && userEmail) {
      // Require both name and email for name-based matching
      console.log(`Looking for sessions with name: ${userName} and email: ${userEmail}`)
      const { data: nameSessions, error: nameError } = await supabase
        .from("saju_sessions")
        .select("id, auth_user_id, name, email")
        .eq("name", userName)
        .eq("email", userEmail) // Must match both name and email
        .is("auth_user_id", null) // Only get unlinked sessions

      if (nameError) {
        console.error("Error finding sessions by name and email:", nameError)
      } else if (nameSessions && nameSessions.length > 0) {
        console.log(`Found ${nameSessions.length} unlinked sessions with name ${userName} and email ${userEmail}`)
        for (const session of nameSessions) {
          const success = await linkSessionToUser(session.id)
          if (success) linkedCount++
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

    if (session.auth_user_id && session.auth_user_id !== authUserId) {
      console.log(`Session ${sessionId} is already linked to different user ${session.auth_user_id}`)
      return false
    }

    // If already linked to this user, no need to update
    if (session.auth_user_id === authUserId) {
      console.log(`Session ${sessionId} is already linked to user ${authUserId}`)
      return false
    }

    const { data: existingSessions, error: existingError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (existingError) {
      console.error("Error checking existing sessions:", existingError)
      return false
    }

    const shouldBeDefault = !existingSessions || existingSessions.length === 0

    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({
        auth_user_id: authUserId,
        is_default: shouldBeDefault,
      })
      .eq("id", sessionId)
      .eq("auth_user_id", null) // null인 경우에만 업데이트하도록 추가 보안

    if (updateError) {
      console.error(`Error linking session ${sessionId}:`, updateError)
      return false
    }

    // Verify the update was successful
    const { data: verifyData, error: verifyError } = await supabase
      .from("saju_sessions")
      .select("id, auth_user_id, is_default")
      .eq("id", sessionId)
      .single()

    if (verifyError) {
      console.error("Error verifying session update:", verifyError)
      return false
    }

    console.log(
      `Verification: Session ${sessionId} now has auth_user_id: ${verifyData.auth_user_id}, is_default: ${verifyData.is_default}`,
    )
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
      .select("*")
      .eq("id", uuid)
      .single()

    if (sessionError) {
      console.log(`No session found with ID ${uuid}, trying to find by birth_info.id`)

      // Try to get by birth_info.id
      const { data: birthInfo, error: birthError } = await supabase
        .from("birth_info")
        .select("*")
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

      // Get the related session using user_id (which contains session_id)
      const { data: relatedSession } = await supabase
        .from("saju_sessions")
        .select("*")
        .eq("id", birthInfo.user_id)
        .single()

      // Get the related saju_info using user_id (which contains session_id)
      const { data: sajuInfo } = await supabase.from("saju_info").select("*").eq("user_id", birthInfo.user_id).single()

      // Format the data
      const userData = {
        id: relatedSession?.id || "",
        name: relatedSession?.name || "무명",
        gender: relatedSession?.gender || "unknown",
        createdAt: birthInfo.created_at || new Date().toISOString(),
      }

      const sajuData = {
        yearStem: sajuInfo?.year_stem || "",
        yearBranch: sajuInfo?.year_branch || "",
        monthStem: sajuInfo?.month_stem || "",
        monthBranch: sajuInfo?.year_branch || "",
        dayStem: sajuInfo?.day_stem || "",
        dayBranch: sajuInfo?.day_branch || "",
        hourStem: sajuInfo?.hour_stem || "",
        hourBranch: sajuInfo?.hour_branch || "",
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

    // Get birth_info using user_id (which contains session_id)
    const { data: birthInfo } = await supabase.from("birth_info").select("*").eq("user_id", session.id).single()

    // Get saju_info using user_id (which contains session_id)
    const { data: sajuInfo } = await supabase.from("saju_info").select("*").eq("user_id", session.id).single()

    // Format the data
    const userData = {
      id: session.id,
      name: session.name || "무명",
      gender: session.gender || "unknown",
      createdAt: session.created_at || new Date().toISOString(),
    }

    const sajuData = {
      yearStem: sajuInfo?.year_stem || "",
      yearBranch: sajuInfo?.year_branch || "",
      monthStem: sajuInfo?.month_stem || "",
      monthBranch: sajuInfo?.month_branch || "",
      dayStem: sajuInfo?.day_stem || "",
      dayBranch: sajuInfo?.day_branch || "",
      hourStem: sajuInfo?.hour_stem || "",
      hourBranch: sajuInfo?.hour_branch || "",
      year: birthInfo?.solar_year?.toString() || "",
      month: birthInfo?.solar_month?.toString() || "",
      day: birthInfo?.solar_day?.toString() || "",
      hour: birthInfo?.solar_hour?.toString() || "",
      minute: birthInfo?.solar_minute?.toString() || "",
      lunarYear: birthInfo?.lunar_year?.toString() || "",
      lunarMonth: birthInfo?.lunar_month?.toString() || "",
      lunarDay: birthInfo?.lunar_day?.toString() || "",
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
      .select("id, name, gender, created_at, saju, daeun")
      .eq("id", sessionId)
      .single()

    if (error) {
      console.error("Error getting saju profile by session ID:", error)
      return null
    }

    // Get birth_info using user_id (which contains session_id)
    const { data: birthInfo } = await supabase.from("birth_info").select("*").eq("user_id", sessionId).single()

    // Get saju_info using user_id (which contains session_id)
    const { data: sajuInfo } = await supabase.from("saju_info").select("*").eq("user_id", sessionId).single()

    const sajuJsonb = data?.saju || {}

    console.log("JSONB saju data from database:", sajuJsonb)

    let daeunData = data?.daeun

    // 대운이 없거나 잘못된 데이터인 경우 계산
    if (
      !daeunData ||
      !daeunData.pillars ||
      (daeunData.pillars &&
        daeunData.pillars.length > 0 &&
        daeunData.pillars.every((p: any) => p.stem === "갑" && p.branch === "자"))
    ) {
      console.log(`Session ${sessionId}: 대운 데이터가 없거나 잘못됨, 새로 계산합니다.`)

      // 대운 계산에 필요한 데이터가 있는지 확인
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

          console.log(`Session ${sessionId}: 새로 계산된 대운:`, daeunData)

          supabase
            .from("saju_sessions")
            .update({ daeun: daeunData })
            .eq("id", sessionId)
            .then(({ error }) => {
              if (error) {
                console.error(`Error updating daeun for session ${sessionId}:`, error)
              } else {
                console.log(`Successfully updated daeun for session ${sessionId}`)
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
      birthYear: birthInfo?.solar_year?.toString() || "",
      birthMonth: birthInfo?.solar_month?.toString().padStart(2, "0") || "",
      birthDay: birthInfo?.solar_day?.toString().padStart(2, "0") || "",
      birthHour: birthInfo?.solar_hour?.toString().padStart(2, "0") || "00",
      birthMinute: birthInfo?.solar_minute?.toString().padStart(2, "0") || "00",
      lunarYear: birthInfo?.lunar_year?.toString() || "",
      lunarMonth: birthInfo?.lunar_month?.toString().padStart(2, "0") || "",
      lunarDay: birthInfo?.lunar_day?.toString().padStart(2, "0") || "",
      timeUnknown: birthInfo?.time_unknown || false,
      createdAt: data.created_at || new Date().toISOString(),
      saju: {
        yearStem: sajuInfo?.year_stem || sajuJsonb.yearStem || "",
        yearBranch: sajuInfo?.year_branch || sajuJsonb.yearBranch || "",
        monthStem: sajuInfo?.month_stem || sajuJsonb.monthStem || "",
        monthBranch: sajuInfo?.month_branch || sajuJsonb.monthBranch || "",
        dayStem: sajuInfo?.day_stem || sajuJsonb.dayStem || "",
        dayBranch: sajuInfo?.day_branch || sajuJsonb.dayBranch || "",
        hourStem: sajuInfo?.hour_stem || sajuJsonb.hourStem || "",
        hourBranch: sajuInfo?.hour_branch || sajuJsonb.hourBranch || "",
        yearStemHanja: sajuInfo?.year_stem_hanja || sajuJsonb.yearStemHanja || "",
        yearBranchHanja: sajuInfo?.year_branch_hanja || sajuJsonb.yearBranchHanja || "",
        monthStemHanja: sajuInfo?.month_stem_hanja || sajuJsonb.monthStemHanja || "",
        monthBranchHanja: sajuInfo?.month_branch_hanja || sajuJsonb.monthBranchHanja || "",
        dayStemHanja: sajuInfo?.day_stem_hanja || sajuJsonb.dayStemHanja || "",
        dayBranchHanja: sajuInfo?.day_branch_hanja || sajuJsonb.dayBranchHanja || "",
        hourStemHanja: sajuInfo?.hour_stem_hanja || sajuJsonb.hourStemHanja || "",
        hourBranchHanja: sajuInfo?.hour_branch_hanja || sajuJsonb.hourBranchHanja || "",
        dayMaster: sajuInfo?.day_master || sajuJsonb.dayMaster || "",
        dayMasterHanja: sajuInfo?.day_master_hanja || sajuJsonb.dayMasterHanja || "",
        // 십성 정보는 saju JSONB에서 가져옴
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
