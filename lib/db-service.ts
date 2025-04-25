import { supabase } from "./supabase-client"

/**
 * Update auth_user_id in the users table
 */
export async function updateAuthUserId(userId: string, authUserId: string): Promise<boolean> {
  try {
    console.log(`Updating auth_user_id for user ${userId} to ${authUserId}`)

    // First check if the user exists
    const { data: existingUser, error: checkError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (checkError) {
      console.error("Error checking user existence:", checkError)
      return false
    }

    console.log("Found existing user:", existingUser)

    // Update the auth_user_id
    const { error } = await supabase.from("users").update({ auth_user_id: authUserId }).eq("id", userId)

    if (error) {
      console.error("Error updating auth_user_id:", error)
      return false
    }

    console.log(`Successfully updated auth_user_id for user ${userId} to ${authUserId}`)
    return true
  } catch (error) {
    console.error("Error in updateAuthUserId:", error)
    return false
  }
}

/**
 * Save birth info to the database
 */
export async function saveBirthInfo(birthInfo: {
  userId: string
  solarYear: number
  solarMonth: number
  solarDay: number
  solarHour: number | null
  solarMinute: number | null
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
  timeUnknown: boolean
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("birth_info")
      .insert({
        user_id: birthInfo.userId,
        solar_year: birthInfo.solarYear,
        solar_month: birthInfo.solarMonth,
        solar_day: birthInfo.solarDay,
        solar_hour: birthInfo.solarHour,
        solar_minute: birthInfo.solarMinute,
        lunar_year: birthInfo.lunarYear,
        lunar_month: birthInfo.lunarMonth,
        lunar_day: birthInfo.lunarDay,
        is_leap_month: birthInfo.isLeapMonth,
        time_unknown: birthInfo.timeUnknown,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error saving birth info:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error in saveBirthInfo:", error)
    return null
  }
}

/**
 * Save saju info to the database
 */
export async function saveSajuInfo(sajuInfo: {
  userId: string
  yearStem: string
  yearBranch: string
  yearStemHanja: string
  yearBranchHanja: string
  monthStem: string
  monthBranch: string
  monthStemHanja: string
  monthBranchHanja: string
  dayStem: string
  dayBranch: string
  dayStemHanja: string
  dayBranchHanja: string
  hourStem: string
  hourBranch: string
  hourStemHanja: string
  hourBranchHanja: string
  dayMaster: string
  dayMasterHanja: string
  yearAnimal: string
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("saju_info")
      .insert({
        user_id: sajuInfo.userId,
        year_stem: sajuInfo.yearStem,
        year_branch: sajuInfo.yearBranch,
        year_stem_hanja: sajuInfo.yearStemHanja,
        year_branch_hanja: sajuInfo.yearBranchHanja,
        month_stem: sajuInfo.monthStem,
        month_branch: sajuInfo.monthBranch,
        month_stem_hanja: sajuInfo.monthStemHanja,
        month_branch_hanja: sajuInfo.monthBranchHanja,
        day_stem: sajuInfo.dayStem,
        day_branch: sajuInfo.dayBranch,
        day_stem_hanja: sajuInfo.dayStemHanja,
        day_branch_hanja: sajuInfo.dayBranchHanja,
        hour_stem: sajuInfo.hourStem,
        hour_branch: sajuInfo.hourBranch,
        hour_stem_hanja: sajuInfo.hourStemHanja,
        hour_branch_hanja: sajuInfo.hourBranchHanja,
        day_master: sajuInfo.dayMaster,
        day_master_hanja: sajuInfo.dayMasterHanja,
        year_animal: sajuInfo.yearAnimal,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error saving saju info:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error in saveSajuInfo:", error)
    return null
  }
}

/**
 * Save elements to the database
 */
export async function saveElements(elements: {
  sajuId: string
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("elements")
      .insert({
        saju_id: elements.sajuId,
        wood: elements.wood,
        fire: elements.fire,
        earth: elements.earth,
        metal: elements.metal,
        water: elements.water,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error saving elements:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error in saveElements:", error)
    return null
  }
}

/**
 * Save interpretation to the database
 */
export async function saveInterpretation(interpretation: {
  userId: string
  basicInterpretation: string
  modelUsed: string
  responseTime: string
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("interpretations")
      .insert({
        user_id: interpretation.userId,
        basic_interpretation: interpretation.basicInterpretation,
        model_used: interpretation.modelUsed,
        response_time: interpretation.responseTime,
      })
      .select("id")
      .single()

    if (error) {
      console.error("Error saving interpretation:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("Error in saveInterpretation:", error)
    return null
  }
}

/**
 * Save beta application to the database
 */
export async function saveBetaApplication(betaApplication: {
  userId: string
  selectedServices: string[]
}): Promise<string | null> {
  try {
    const { data: betaData, error: betaError } = await supabase
      .from("beta_applications")
      .insert({
        user_id: betaApplication.userId,
        selected_services: betaApplication.selectedServices,
        status: "pending",
      })
      .select("id")
      .single()

    if (betaError) {
      console.error("Error saving beta application:", betaError)
      return null
    }

    return betaData.id
  } catch (error) {
    console.error("Error in saveBetaApplication:", error)
    return null
  }
}

/**
 * Save compatibility analysis to the database
 */
export async function saveCompatibilityAnalysis(compatibilityAnalysis: {
  userId: string
  partnerName: string
  partnerGender: string
  partnerBirthYear: number
  partnerBirthMonth: number
  partnerBirthDay: number
  partnerBirthHour: number | null
  partnerBirthMinute: number | null
  partnerTimeUnknown: boolean
  relationshipStatus: string
  compatibilityScore: number
  analysisText: string
  modelUsed: string
  responseTime: string
}): Promise<string | null> {
  try {
    const { data: analysisData, error: analysisError } = await supabase
      .from("compatibility_analysis")
      .insert({
        user_id: compatibilityAnalysis.userId,
        partner_name: compatibilityAnalysis.partnerName,
        partner_gender: compatibilityAnalysis.partnerGender,
        partner_birth_year: compatibilityAnalysis.partnerBirthYear,
        partner_birth_month: compatibilityAnalysis.partnerBirthMonth,
        partner_birth_day: compatibilityAnalysis.partnerBirthDay,
        partner_birth_hour: compatibilityAnalysis.partnerBirthHour,
        partner_birth_minute: compatibilityAnalysis.partnerBirthMinute,
        partner_time_unknown: compatibilityAnalysis.partnerTimeUnknown,
        relationship_status: compatibilityAnalysis.relationshipStatus,
        compatibility_score: compatibilityAnalysis.compatibilityScore,
        analysis_text: compatibilityAnalysis.analysisText,
        model_used: compatibilityAnalysis.modelUsed,
        response_time: compatibilityAnalysis.responseTime,
      })
      .select("id")
      .single()

    if (analysisError) {
      console.error("Error saving compatibility analysis:", analysisError)
      return null
    }

    return analysisData.id
  } catch (error) {
    console.error("Error in saveCompatibilityAnalysis:", error)
    return null
  }
}

/**
 * Get user profiles by auth_user_id
 */
export async function getUserProfilesByAuthId(authUserId: string): Promise<any[]> {
  try {
    // First get all users with this auth_user_id
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, gender")
      .eq("auth_user_id", authUserId)

    if (usersError || !users || users.length === 0) {
      console.error("Error getting users by auth_user_id or no users found:", usersError)
      return []
    }

    console.log(`Found ${users.length} users with auth_user_id ${authUserId}:`, users)

    // Get all birth info for these users
    const userIds = users.map((user) => user.id)
    const { data: birthInfos, error: birthError } = await supabase.from("birth_info").select("*").in("user_id", userIds)

    if (birthError) {
      console.error("Error getting birth info:", birthError)
      return []
    }

    // Get all saju info for these users
    const { data: sajuInfos, error: sajuError } = await supabase.from("saju_info").select("*").in("user_id", userIds)

    if (sajuError) {
      console.error("Error getting saju info:", sajuError)
      return []
    }

    // Combine the data into profiles
    const profiles = users.map((user) => {
      const birthInfo = birthInfos?.find((bi) => bi.user_id === user.id) || null
      const sajuInfo = sajuInfos?.find((si) => si.user_id === user.id) || null

      return {
        id: user.id,
        name: user.name || "Unknown",
        gender: user.gender || "unknown",
        birthYear: birthInfo?.solar_year?.toString() || "",
        birthMonth: birthInfo?.solar_month?.toString().padStart(2, "0") || "",
        birthDay: birthInfo?.solar_day?.toString().padStart(2, "0") || "",
        birthHour: birthInfo?.solar_hour?.toString().padStart(2, "0") || "00",
        birthMinute: birthInfo?.solar_minute?.toString().padStart(2, "0") || "00",
        lunarYear: birthInfo?.lunar_year?.toString() || "",
        lunarMonth: birthInfo?.lunar_month?.toString().padStart(2, "0") || "",
        lunarDay: birthInfo?.lunar_day?.toString().padStart(2, "0") || "",
        timeUnknown: birthInfo?.time_unknown || false,
        isDefault: false, // Default value, can be updated later
        createdAt: user.created_at || new Date().toISOString(),
        saju: sajuInfo || null,
      }
    })

    return profiles
  } catch (error) {
    console.error("Error in getUserProfilesByAuthId:", error)
    return []
  }
}
