import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Get all saju profiles for the current authenticated user
 */
export async function getAllSajuProfiles() {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return []
    }

    const authUserId = userData.user.id

    // First, try to fetch saju_sessions based on auth_user_id
    let { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select(`
        *,
        birth_info(*),
        saju_info(*)
      `)
      .eq("auth_user_id", authUserId)
      .order("created_at", { ascending: false })

    if (sessionsError) {
      console.error("Error fetching saju profiles by auth_user_id:", sessionsError)
      // If there's an error, try fetching by user ID as a fallback
      sessions = null // Set sessions to null to trigger fallback
    }

    // If no sessions found with auth_user_id, try fetching by user ID
    if (!sessions || sessions.length === 0) {
      console.log("No sessions found with auth_user_id, fetching by user ID")
      const { data: sessionById, error: sessionByIdError } = await supabase
        .from("saju_sessions")
        .select(`
          *,
          birth_info(*),
          saju_info(*)
        `)
        .eq("id", authUserId)
        .order("created_at", { ascending: false })

      if (sessionByIdError) {
        console.error("Error fetching saju profiles by user ID:", sessionByIdError)
        return []
      }

      sessions = sessionById
    }

    // If still no sessions found, return an empty array
    if (!sessions || sessions.length === 0) {
      console.log("No saju profiles found")
      return []
    }

    // 사용자 프로필 형식으로 변환
    const profiles = sessions.map((session) => {
      const birthInfo = session.birth_info?.[0] || {}
      const sajuInfo = session.saju_info?.[0] || {}

      return {
        id: session.id,
        name: session.name || "무명",
        gender: session.gender || "unknown",
        birthYear: birthInfo.solar_year || "",
        birthMonth: birthInfo.solar_month || "",
        birthDay: birthInfo.solar_day || "",
        birthHour: birthInfo.solar_hour || "",
        birthMinute: birthInfo.solar_minute || "",
        lunarYear: birthInfo.lunar_year || "",
        lunarMonth: birthInfo.lunar_month || "",
        lunarDay: birthInfo.lunar_day || "",
        timeUnknown: birthInfo.time_unknown || false,
        isDefault: session.is_default || false,
        createdAt: session.created_at || new Date().toISOString(),
        saju: {
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
        },
      }
    })

    return profiles
  } catch (error) {
    console.error("Error in getAllSajuProfiles:", error)
    return []
  }
}

/**
 * Retrieves saju data by UUID from the database
 * @param uuid The UUID of the saju data to retrieve
 * @returns The saju data and user data if found, null otherwise
 */
export async function getSajuDataByUuid(uuid: string) {
  try {
    console.log(`Fetching saju data for UUID: ${uuid}`)

    // First, get the birth info and user data
    const { data: birthInfo, error: birthError } = await supabase
      .from("birth_info")
      .select("*, saju_sessions(*)")
      .eq("id", uuid)
      .single()

    if (birthError || !birthInfo) {
      console.error("Error fetching birth info:", birthError)
      return null
    }

    // Get the saju info
    const { data: sajuInfo, error: sajuError } = await supabase
      .from("saju_info")
      .select("*")
      .eq("user_id", birthInfo.user_id)
      .single()

    if (sajuError) {
      console.error("Error fetching saju info:", sajuError)
      return null
    }

    // Get the elements
    const { data: elements, error: elementsError } = await supabase
      .from("elements")
      .select("*")
      .eq("saju_id", sajuInfo?.id)
      .single()

    if (elementsError && elementsError.code !== "PGRST116") {
      console.error("Error fetching elements:", elementsError)
    }

    // Get the interpretation
    const { data: interpretation, error: interpretationError } = await supabase
      .from("interpretations")
      .select("*")
      .eq("user_id", birthInfo.user_id)
      .single()

    if (interpretationError && interpretationError.code !== "PGRST116") {
      console.error("Error fetching interpretation:", interpretationError)
    }

    // Format the data
    const userData = {
      id: birthInfo.user_id,
      name: birthInfo.saju_sessions?.name || "무명",
      gender: birthInfo.saju_sessions?.gender || "unknown",
      createdAt: birthInfo.created_at,
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
      yearStemHanja: sajuInfo?.year_stem_hanja || "",
      yearBranchHanja: sajuInfo?.year_branch_hanja || "",
      monthStemHanja: sajuInfo?.month_stem_hanja || "",
      monthBranchHanja: sajuInfo?.month_branch_hanja || "",
      dayStemHanja: sajuInfo?.day_stem_hanja || "",
      dayBranchHanja: sajuInfo?.day_branch_hanja || "",
      hourStemHanja: sajuInfo?.hour_stem_hanja || "",
      hourBranchHanja: sajuInfo?.hour_branch_hanja || "",
      dayMaster: sajuInfo?.day_master || "",
      dayMasterHanja: sajuInfo?.day_master_hanja || "",
      yearAnimal: sajuInfo?.year_animal || "",
      year: birthInfo.solar_year.toString(),
      month: birthInfo.solar_month.toString().padStart(2, "0"),
      day: birthInfo.solar_day.toString().padStart(2, "0"),
      hour: birthInfo.solar_hour?.toString() || "",
      minute: birthInfo.solar_minute?.toString() || "",
      lunarYear: birthInfo.lunar_year.toString(),
      lunarMonth: birthInfo.lunar_month.toString().padStart(2, "0"),
      lunarDay: birthInfo.lunar_day.toString().padStart(2, "0"),
      timeUnknown: birthInfo.time_unknown,
      elements: elements
        ? {
            wood: elements.wood,
            fire: elements.fire,
            earth: elements.earth,
            metal: elements.metal,
            water: elements.water,
          }
        : undefined,
      interpretation: interpretation?.basic_interpretation || "",
    }

    return { userData, sajuData }
  } catch (error) {
    console.error("Error in getSajuDataByUuid:", error)
    return null
  }
}

/**
 * Syncs local storage data to the database
 * @param localData The local storage data to sync
 * @param authUserId Optional auth user ID to link the data to
 * @returns The UUID of the synced data
 */
export async function syncLocalStorageToDatabase(localData: any, authUserId?: string) {
  try {
    console.log("Syncing local storage data to database", { localData, authUserId })

    // Generate a UUID for the birth info
    const birthInfoId = uuidv4()

    // Check if user already exists with the auth_user_id
    let userId: string

    if (authUserId) {
      const { data: existingUser } = await supabase
        .from("saju_sessions")
        .select("id")
        .eq("auth_user_id", authUserId)
        .single()

      if (existingUser) {
        userId = existingUser.id
        console.log("Found existing user:", userId)
      } else {
        // Create a new user
        userId = uuidv4()
        const { error: userError } = await supabase.from("saju_sessions").insert({
          id: userId,
          name: localData.name || "무명",
          gender: localData.gender || "unknown",
          relationship_status: localData.relationshipStatus || "single",
          is_beta_applicant: false,
          auth_user_id: authUserId,
        })

        if (userError) {
          console.error("Error creating user:", userError)
          throw userError
        }
      }
    } else {
      // Create a new user without auth_user_id
      userId = uuidv4()
      const { error: userError } = await supabase.from("saju_sessions").insert({
        id: userId,
        name: localData.name || "무명",
        gender: localData.gender || "unknown",
        relationship_status: localData.relationshipStatus || "single",
        is_beta_applicant: false,
      })

      if (userError) {
        console.error("Error creating user:", userError)
        throw userError
      }
    }

    // Insert birth info
    const { error: birthError } = await supabase.from("birth_info").insert({
      id: birthInfoId,
      user_id: userId,
      solar_year: Number.parseInt(localData.year),
      solar_month: Number.parseInt(localData.month),
      solar_day: Number.parseInt(localData.day),
      solar_hour: localData.hour ? Number.parseInt(localData.hour) : null,
      solar_minute: localData.minute ? Number.parseInt(localData.minute) : null,
      lunar_year: Number.parseInt(localData.lunarYear),
      lunar_month: Number.parseInt(localData.lunarMonth),
      lunar_day: Number.parseInt(localData.lunarDay),
      is_leap_month: localData.isLeapMonth || false,
      time_unknown: localData.timeUnknown || false,
    })

    if (birthError) {
      console.error("Error inserting birth info:", birthError)
      throw birthError
    }

    // Insert saju info
    const sajuId = uuidv4()
    const { error: sajuError } = await supabase.from("saju_info").insert({
      id: sajuId,
      user_id: userId,
      year_stem: localData.yearStem,
      year_branch: localData.yearBranch,
      year_stem_hanja: localData.yearStemHanja,
      year_branch_hanja: localData.yearBranchHanja,
      month_stem: localData.monthStem,
      month_branch: localData.monthBranch,
      month_stem_hanja: localData.monthStemHanja,
      month_branch_hanja: localData.monthBranchHanja,
      day_stem: localData.dayStem,
      day_branch: localData.dayBranch,
      day_stem_hanja: localData.dayStemHanja,
      day_branch_hanja: localData.dayBranchHanja,
      hour_stem: localData.hourStem,
      hour_branch: localData.hourBranch,
      hour_stem_hanja: localData.hourStemHanja,
      hour_branch_hanja: localData.hourBranchHanja,
      day_master: localData.dayMaster,
      day_master_hanja: localData.dayMasterHanja,
      year_animal: localData.yearAnimal,
    })

    if (sajuError) {
      console.error("Error inserting saju info:", sajuError)
      throw sajuError
    }

    // Insert elements if available
    if (localData.elements) {
      const { error: elementsError } = await supabase.from("elements").insert({
        saju_id: sajuId,
        wood: localData.elements.wood,
        fire: localData.elements.fire,
        earth: localData.elements.earth,
        metal: localData.elements.metal,
        water: localData.elements.water,
      })

      if (elementsError) {
        console.error("Error inserting elements:", elementsError)
        // Non-critical, continue
      }
    }

    // Insert interpretation if available
    if (localData.interpretation) {
      const { error: interpretationError } = await supabase.from("interpretations").insert({
        user_id: userId,
        basic_interpretation: localData.interpretation,
        model_used: "gpt-4",
        response_time: new Date().toISOString(),
      })

      if (interpretationError) {
        console.error("Error inserting interpretation:", interpretationError)
        // Non-critical, continue
      }
    }

    return birthInfoId
  } catch (error) {
    console.error("Error in syncLocalStorageToDatabase:", error)
    throw error
  }
}

/**
 * Links user data to an authenticated user
 * @param tempUserId The temporary user ID to link
 * @param authUserId The auth user ID to link to
 * @returns True if successful, false otherwise
 */
export async function linkUserData(tempUserId: string, authUserId: string) {
  try {
    console.log(`Linking user data: tempUserId=${tempUserId}, authUserId=${authUserId}`)

    // Update the user record
    const { error } = await supabase.from("saju_sessions").update({ auth_user_id: authUserId }).eq("id", tempUserId)

    if (error) {
      console.error("Error linking user data:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in linkUserData:", error)
    return false
  }
}

/**
 * Gets all user profiles for a given auth user ID
 * @param authUserId The auth user ID to get profiles for
 * @returns An array of user profiles
 */
export async function getAllUserProfiles(authUserId: string) {
  try {
    console.log(`Getting all user profiles for auth user ID: ${authUserId}`)

    // Get all users with the given auth_user_id
    const { data: users, error: userError } = await supabase
      .from("saju_sessions")
      .select("*")
      .eq("auth_user_id", authUserId)

    if (userError) {
      console.error("Error getting users:", userError)
      return []
    }

    if (!users || users.length === 0) {
      console.log("No users found for auth user ID:", authUserId)
      return []
    }

    // Get all birth info for the users
    const userIds = users.map((user) => user.id)
    const { data: birthInfos, error: birthError } = await supabase.from("birth_info").select("*").in("user_id", userIds)

    if (birthError) {
      console.error("Error getting birth infos:", birthError)
      return []
    }

    // Get all saju info for the users
    const { data: sajuInfos, error: sajuError } = await supabase.from("saju_info").select("*").in("user_id", userIds)

    if (sajuError) {
      console.error("Error getting saju infos:", sajuError)
      return []
    }

    // Format the data
    const profiles = users.map((user) => {
      const birthInfo = birthInfos?.find((bi) => bi.user_id === user.id)
      const sajuInfo = sajuInfos?.find((si) => si.user_id === user.id)

      return {
        id: user.id,
        name: user.name,
        gender: user.gender,
        birthInfo: birthInfo
          ? {
              id: birthInfo.id,
              solarYear: birthInfo.solar_year,
              solarMonth: birthInfo.solar_month,
              solarDay: birthInfo.solar_day,
              solarHour: birthInfo.solar_hour,
              solarMinute: birthInfo.solar_minute,
              lunarYear: birthInfo.lunar_year,
              lunarMonth: birthInfo.lunar_month,
              lunarDay: birthInfo.lunar_day,
              isLeapMonth: birthInfo.is_leap_month,
              timeUnknown: birthInfo.time_unknown,
            }
          : null,
        sajuInfo: sajuInfo
          ? {
              yearStem: sajuInfo.year_stem,
              yearBranch: sajuInfo.year_branch,
              monthStem: sajuInfo.month_stem,
              monthBranch: sajuInfo.month_branch,
              dayStem: sajuInfo.day_stem,
              dayBranch: sajuInfo.day_branch,
              hourStem: sajuInfo.hour_stem,
              hourBranch: sajuInfo.hour_branch,
            }
          : null,
        createdAt: birthInfo?.created_at || user.created_at,
      }
    })

    return profiles
  } catch (error) {
    console.error("Error in getAllUserProfiles:", error)
    return []
  }
}

/**
 * Gets chat history for a given auth user ID
 * @param authUserId The auth user ID to get chat history for
 * @returns An array of chat rooms
 */
// export async function getChatHistory(authUserId: string) {
//   try {
//     console.log(`Getting chat history for auth user ID: ${authUserId}`)

//     // Get the user with the given auth_user_id
//     const { data: user, error: userError } = await supabase
//       .from("saju_sessions")
//       .select("id")
//       .eq("auth_user_id", authUserId)
//       .single()

//     if (userError) {
//       console.error("Error getting user:", userError)
//       return []
//     }

//     if (!user) {
//       console.log("No user found for auth user ID:", authUserId)
//       return []
//     }

//     // Get all chat rooms for the user
//     const { data: chatRooms, error: chatError } = await supabase
//       .from("chat_rooms")
//       .select("*")
//       .eq("user_id", user.id)
//       .order("created_at", { ascending: false })

//     if (chatError) {
//       console.error("Error getting chat rooms:", chatError)
//       return []
//     }

//     return chatRooms || []
//   } catch (error) {
//     console.error("Error in getChatHistory:", error)
//     return []
//   }
// }

/**
 * Sets the default user profile for a given auth user ID
 * @param authUserId The auth user ID to set the default profile for
 * @param profileId The profile ID to set as default
 * @returns True if successful, false otherwise
 */
export async function setDefaultUserProfile(authUserId: string, profileId: string) {
  try {
    console.log(`Setting default user profile: authUserId=${authUserId}, profileId=${profileId}`)

    // Update all users with the given auth_user_id to not be default
    const { error: resetError } = await supabase
      .from("saju_sessions")
      .update({ is_default: false })
      .eq("auth_user_id", authUserId)

    if (resetError) {
      console.error("Error resetting default profiles:", resetError)
      return false
    }

    // Update the specified profile to be default
    const { error } = await supabase
      .from("saju_sessions")
      .update({ is_default: true })
      .eq("id", profileId)
      .eq("auth_user_id", authUserId)

    if (error) {
      console.error("Error setting default profile:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in setDefaultUserProfile:", error)
    return false
  }
}

/**
 * 기본 사주 프로필 설정
 */
export async function setDefaultSajuProfile(sessionId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return false
    }

    const authUserId = userData.user.id

    // 먼저 모든 사주 프로필의 is_default를 false로 설정
    const { error: resetError } = await supabase
      .from("saju_sessions")
      .update({ is_default: false })
      .eq("auth_user_id", authUserId)

    if (resetError) {
      console.error("Error resetting default profiles:", resetError)
      return false
    }

    // 선택한 프로필을 기본값으로 설정
    const { error: updateError } = await supabase.from("saju_sessions").update({ is_default: true }).eq("id", sessionId)

    if (updateError) {
      console.error("Error setting default profile:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in setDefaultSajuProfile:", error)
    return false
  }
}

/**
 * 채팅 내역 가져오기
 */
export async function getChatHistory() {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return []
    }

    const authUserId = userData.user.id

    // 사용자의 모든 saju_sessions 레코드 ID 가져오기
    const { data: sessions, error: sessionsError } = await supabase
      .from("saju_sessions")
      .select("id")
      .eq("auth_user_id", authUserId)

    if (sessionsError) {
      console.error("Error fetching session IDs:", sessionsError)
      return []
    }

    if (!sessions || sessions.length === 0) {
      return []
    }

    const sessionIds = sessions.map((session) => session.id)

    // 채팅 내역 가져오기
    const { data: chatRooms, error: chatError } = await supabase
      .from("chat_rooms")
      .select(`
        *,
        saju_sessions(name, gender)
      `)
      .in("user_id", sessionIds)
      .order("updated_at", { ascending: false })

    if (chatError) {
      console.error("Error fetching chat history:", chatError)
      return []
    }

    // 채팅 세션 형식으로 변환
    const chatSessions = await Promise.all(
      chatRooms.map(async (room) => {
        // 사용자 정보 가져오기
        const { data: sessionInfo, error: sessionInfoError } = await supabase
          .from("saju_sessions")
          .select(`
            *,
            birth_info(*),
            saju_info(*)
          `)
          .eq("id", room.user_id)
          .single()

        if (sessionInfoError) {
          console.error("Error fetching session info for chat:", sessionInfoError)
        }

        const birthInfo = sessionInfo?.birth_info?.[0] || {}
        const sajuInfo = sessionInfo?.saju_info?.[0] || {}

        // 사주 데이터 구성
        const saju = {
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
        }

        return {
          id: room.id,
          roomType: room.room_type || "general",
          lastMessage: room.last_message || "",
          lastMessageTime: room.updated_at || room.created_at,
          messages: [], // 메시지는 필요할 때 별도로 가져옴
          saju: saju,
          name: sessionInfo?.name || "무명",
          gender: sessionInfo?.gender || "unknown",
        }
      }),
    )

    return chatSessions
  } catch (error) {
    console.error("Error in getChatHistory:", error)
    return []
  }
}

/**
 * 익명 사용자 데이터를 인증된 사용자에게 연결
 */
export async function linkAnonymousDataToAuthUser(sessionId: string, authUserId: string): Promise<boolean> {
  try {
    console.log(`Linking anonymous session ${sessionId} to auth user ${authUserId}`)
    const supabase = createClientComponentClient()

    // Update the auth_user_id for the session
    const { error } = await supabase.from("saju_sessions").update({ auth_user_id: authUserId }).eq("id", sessionId)

    if (error) {
      console.error("Error updating auth_user_id:", error)
      return false
    }

    console.log("Data linking completed successfully")
    return true
  } catch (error) {
    console.error("Error linking data:", error)
    return false
  }
}
