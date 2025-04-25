import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * 로그인한 사용자의 모든 사주 프로필 가져오기
 * (auth_user_id로 연결된 모든 users 레코드)
 */
export async function getAllUserProfiles() {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return []
    }

    const authUserId = userData.user.id

    // First, try to fetch users based on auth_user_id
    let { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        *,
        birth_info(*),
        saju_info(*)
      `)
      .eq("auth_user_id", authUserId)
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("Error fetching user profiles by auth_user_id:", usersError)
      // If there's an error, try fetching by user ID as a fallback
      users = null // Set users to null to trigger fallback
    }

    // If no users found with auth_user_id, try fetching by user ID
    if (!users || users.length === 0) {
      console.log("No users found with auth_user_id, fetching by user ID")
      const { data: userById, error: userByIdError } = await supabase
        .from("users")
        .select(`
          *,
          birth_info(*),
          saju_info(*)
        `)
        .eq("id", authUserId)
        .order("created_at", { ascending: false })

      if (userByIdError) {
        console.error("Error fetching user profiles by user ID:", userByIdError)
        return []
      }

      users = userById
    }

    // If still no users found, return an empty array
    if (!users || users.length === 0) {
      console.log("No user profiles found")
      return []
    }

    // 사용자 프로필 형식으로 변환
    const profiles = users.map((user) => {
      const birthInfo = user.birth_info?.[0] || {}
      const sajuInfo = user.saju_info?.[0] || {}

      return {
        id: user.id,
        name: user.name || "무명",
        gender: user.gender || "unknown",
        birthYear: birthInfo.solar_year || "",
        birthMonth: birthInfo.solar_month || "",
        birthDay: birthInfo.solar_day || "",
        birthHour: birthInfo.solar_hour || "",
        birthMinute: birthInfo.solar_minute || "",
        lunarYear: birthInfo.lunar_year || "",
        lunarMonth: birthInfo.lunar_month || "",
        lunarDay: birthInfo.lunar_day || "",
        timeUnknown: birthInfo.time_unknown || false,
        isDefault: user.is_default || false,
        createdAt: user.created_at || new Date().toISOString(),
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
    console.error("Error in getAllUserProfiles:", error)
    return []
  }
}

/**
 * UUID로 사주 데이터 가져오기
 */
export async function getSajuDataByUuid(uuid: string) {
  try {
    const supabase = createClientComponentClient()

    // users 테이블에서 해당 UUID 데이터 가져오기
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        *,
        birth_info(*),
        saju_info(*),
        interpretations(*)
      `)
      .eq("id", uuid)
      .single()

    if (userError) {
      console.error("Error fetching user by UUID:", userError)
      return null
    }

    if (!user) {
      return null
    }

    const birthInfo = user.birth_info?.[0] || {}
    const sajuInfo = user.saju_info?.[0] || {}
    const interpretation = user.interpretations?.[0]?.basic_interpretation || ""

    // 사주 데이터 형식으로 변환
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

    const userData = {
      id: user.id,
      name: user.name || "무명",
      gender: user.gender || "unknown",
      createdAt: user.created_at || new Date().toISOString(),
    }

    return { userData, sajuData }
  } catch (error) {
    console.error("Error in getSajuDataByUuid:", error)
    return null
  }
}

/**
 * 기본 사용자 프로필 설정
 */
export async function setDefaultUserProfile(userId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      console.log("No authenticated user found")
      return false
    }

    const authUserId = userData.user.id

    // 먼저 모든 사용자 프로필의 is_default를 false로 설정
    const { error: resetError } = await supabase
      .from("users")
      .update({ is_default: false })
      .eq("auth_user_id", authUserId)

    if (resetError) {
      console.error("Error resetting default profiles:", resetError)
      return false
    }

    // 선택한 프로필을 기본값으로 설정
    const { error: updateError } = await supabase.from("users").update({ is_default: true }).eq("id", userId)

    if (updateError) {
      console.error("Error setting default profile:", updateError)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in setDefaultUserProfile:", error)
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

    // 사용자의 모든 users 레코드 ID 가져오기
    const { data: users, error: usersError } = await supabase.from("users").select("id").eq("auth_user_id", authUserId)

    if (usersError) {
      console.error("Error fetching user IDs:", usersError)
      return []
    }

    if (!users || users.length === 0) {
      return []
    }

    const userIds = users.map((user) => user.id)

    // 채팅 내역 가져오기
    const { data: chatRooms, error: chatError } = await supabase
      .from("chat_rooms")
      .select(`
        *,
        users(name, gender)
      `)
      .in("user_id", userIds)
      .order("updated_at", { ascending: false })

    if (chatError) {
      console.error("Error fetching chat history:", chatError)
      return []
    }

    // 채팅 세션 형식으로 변환
    const chatSessions = await Promise.all(
      chatRooms.map(async (room) => {
        // 사용자 정보 가져오기
        const { data: userInfo, error: userInfoError } = await supabase
          .from("users")
          .select(`
          *,
          birth_info(*),
          saju_info(*)
        `)
          .eq("id", room.user_id)
          .single()

        if (userInfoError) {
          console.error("Error fetching user info for chat:", userInfoError)
        }

        const birthInfo = userInfo?.birth_info?.[0] || {}
        const sajuInfo = userInfo?.saju_info?.[0] || {}

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
          name: userInfo?.name || "무명",
          gender: userInfo?.gender || "unknown",
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
export async function transferAnonymousDataToUser(userId: string, anonymousId?: string): Promise<boolean> {
  try {
    console.log(`Transferring data from anonymous user ${anonymousId} to user ${userId}`)
    const supabase = createClientComponentClient()

    // Update all tables that reference user_id
    const tablesToUpdate = ["birth_info", "saju_info", "interpretations", "compatibility_analysis", "chat_rooms"]

    for (const table of tablesToUpdate) {
      const { error } = await supabase.from(table).update({ user_id: userId }).eq("user_id", anonymousId)

      if (error) {
        console.error(`Error updating ${table}:`, error)
        return false // Stop if any update fails
      }
    }

    // Update the users table itself
    const { error: userError } = await supabase.from("users").update({ auth_user_id: userId }).eq("id", anonymousId)

    if (userError) {
      console.error("Error updating users table:", userError)
      return false
    }

    console.log("Data transfer completed successfully")
    return true
  } catch (error) {
    console.error("Error transferring data:", error)
    return false
  }
}
