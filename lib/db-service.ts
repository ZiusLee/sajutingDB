import { supabase, type User } from "./supabase-client"

// Update the saveUserData function to handle auth_user_id
export async function saveUserData(userData: {
  name: string
  gender: string
  relationshipStatus: string
  email?: string
  isBetaApplicant?: boolean
  userId?: string // Add userId parameter for updates
  auth_user_id?: string // Add auth_user_id parameter
}): Promise<string | null> {
  try {
    // If userId is provided, update existing user
    if (userData.userId) {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: userData.name,
          email: userData.email,
          gender: userData.gender,
          relationship_status: userData.relationshipStatus,
          is_beta_applicant: userData.isBetaApplicant || false,
          auth_user_id: userData.auth_user_id, // Include auth_user_id in updates
        })
        .eq("id", userData.userId)

      if (updateError) {
        console.error("Error updating user data:", updateError)
        return null
      }

      return userData.userId
    }

    // Check if user with this email already exists
    if (userData.email) {
      const { data: existingUsers } = await supabase.from("users").select("id").eq("email", userData.email)

      if (existingUsers && existingUsers.length > 0) {
        const existingUserId = existingUsers[0].id

        // Update existing user
        const { error: updateError } = await supabase
          .from("users")
          .update({
            name: userData.name,
            gender: userData.gender,
            relationship_status: userData.relationshipStatus,
            is_beta_applicant: userData.isBetaApplicant || false,
            auth_user_id: userData.auth_user_id, // Include auth_user_id in updates
          })
          .eq("id", existingUserId)

        if (updateError) {
          console.error("Error updating existing user data:", updateError)
          return null
        }

        return existingUserId
      }
    }

    // Create new user if no existing user found
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        name: userData.name,
        email: userData.email,
        gender: userData.gender,
        relationship_status: userData.relationshipStatus,
        is_beta_applicant: userData.isBetaApplicant || false,
        auth_user_id: userData.auth_user_id, // Include auth_user_id in inserts
      })
      .select("id")
      .single()

    if (userError) {
      console.error("Error saving user data:", userError)
      return null
    }

    return user.id
  } catch (error) {
    console.error("Error in saveUserData:", error)
    return null
  }
}

/**
 * Save birth information to the database
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
    const { data: birth, error: birthError } = await supabase
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

    if (birthError) {
      console.error("Error saving birth info:", birthError)
      return null
    }

    return birth.id
  } catch (error) {
    console.error("Error in saveBirthInfo:", error)
    return null
  }
}

/**
 * Save saju information to the database
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
    const { data: saju, error: sajuError } = await supabase
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

    if (sajuError) {
      console.error("Error saving saju info:", sajuError)
      return null
    }

    return saju.id
  } catch (error) {
    console.error("Error in saveSajuInfo:", error)
    return null
  }
}

/**
 * Save elements information to the database
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
    const { data: elementsData, error: elementsError } = await supabase
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

    if (elementsError) {
      console.error("Error saving elements:", elementsError)
      return null
    }

    return elementsData.id
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
    const { data: interpretationData, error: interpretationError } = await supabase
      .from("interpretations")
      .insert({
        user_id: interpretation.userId,
        basic_interpretation: interpretation.basicInterpretation,
        model_used: interpretation.modelUsed,
        response_time: interpretation.responseTime,
      })
      .select("id")
      .single()

    if (interpretationError) {
      console.error("Error saving interpretation:", interpretationError)
      return null
    }

    return interpretationData.id
  } catch (error) {
    console.error("Error in saveInterpretation:", error)
    return null
  }
}

/**
 * Save additional question to the database
 */
export async function saveAdditionalQuestion(question: {
  userId: string
  questionCategory: string
  questionText: string
  answerText: string
  modelUsed: string
  responseTime: string
}): Promise<string | null> {
  try {
    const { data: questionData, error: questionError } = await supabase
      .from("additional_questions")
      .insert({
        user_id: question.userId,
        question_category: question.questionCategory,
        question_text: question.questionText,
        answer_text: question.answerText,
        model_used: question.modelUsed,
        response_time: question.responseTime,
      })
      .select("id")
      .single()

    if (questionError) {
      console.error("Error saving additional question:", questionError)
      return null
    }

    return questionData.id
  } catch (error) {
    console.error("Error in saveAdditionalQuestion:", error)
    return null
  }
}

/**
 * Save beta application to the database
 */
export async function saveBetaApplication(application: {
  userId: string
  selectedServices: string[]
  status?: string
}): Promise<string | null> {
  try {
    // Update user as beta applicant
    await supabase.from("users").update({ is_beta_applicant: true }).eq("id", application.userId)

    // Save beta application
    const { data: applicationData, error: applicationError } = await supabase
      .from("beta_applications")
      .insert({
        user_id: application.userId,
        selected_services: application.selectedServices,
        status: application.status || "pending",
      })
      .select("id")
      .single()

    if (applicationError) {
      console.error("Error saving beta application:", applicationError)
      return null
    }

    return applicationData.id
  } catch (error) {
    console.error("Error in saveBetaApplication:", error)
    return null
  }
}

/**
 * Save compatibility analysis to the database
 */
export async function saveCompatibilityAnalysis(analysis: {
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
        user_id: analysis.userId,
        partner_name: analysis.partnerName,
        partner_gender: analysis.partnerGender,
        partner_birth_year: analysis.partnerBirthYear,
        partner_birth_month: analysis.partnerBirthMonth,
        partner_birth_day: analysis.partnerBirthDay,
        partner_birth_hour: analysis.partnerBirthHour,
        partner_birth_minute: analysis.partnerBirthMinute,
        partner_time_unknown: analysis.partnerTimeUnknown,
        relationship_status: analysis.relationshipStatus,
        compatibility_score: analysis.compatibilityScore,
        analysis_text: analysis.analysisText,
        model_used: analysis.modelUsed,
        response_time: analysis.responseTime,
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
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error getting user:", error)
      return null
    }

    return data as User
  } catch (error) {
    console.error("Error in getUserById:", error)
    return null
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // First check if the email exists
    const { data, error } = await supabase.from("users").select("*").eq("email", email)

    if (error) {
      console.error("Error getting user by email:", error)
      return null
    }

    // If no data or empty array, return null
    if (!data || data.length === 0) {
      return null
    }

    // If multiple users found with the same email (shouldn't happen if email is unique)
    // return the first one
    return data[0] as User
  } catch (error) {
    console.error("Error in getUserByEmail:", error)
    return null
  }
}

/**
 * Update user email
 */
export async function updateUserEmail(userId: string, email: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").update({ email }).eq("id", userId)

    if (error) {
      console.error("Error updating user email:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateUserEmail:", error)
    return false
  }
}

/**
 * Get all user data including related information
 */
export async function getAllUserData(userId: string): Promise<any | null> {
  try {
    // Get user
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error("Error getting user:", userError)
      return null
    }

    // Get birth info
    const { data: birthInfo, error: birthError } = await supabase
      .from("birth_info")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (birthError && birthError.code !== "PGRST116") {
      console.error("Error getting birth info:", birthError)
    }

    // Get saju info
    const { data: sajuInfo, error: sajuError } = await supabase
      .from("saju_info")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (sajuError && sajuError.code !== "PGRST116") {
      console.error("Error getting saju info:", sajuError)
    }

    // Get elements if saju info exists
    let elements = null
    if (sajuInfo) {
      const { data: elementsData, error: elementsError } = await supabase
        .from("elements")
        .select("*")
        .eq("saju_id", sajuInfo.id)
        .single()

      if (elementsError && elementsError.code !== "PGRST116") {
        console.error("Error getting elements:", elementsError)
      }

      elements = elementsData
    }

    // Get interpretation
    const { data: interpretation, error: interpretationError } = await supabase
      .from("interpretations")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (interpretationError && interpretationError.code !== "PGRST116") {
      console.error("Error getting interpretation:", interpretationError)
    }

    // Get additional questions
    const { data: additionalQuestions, error: questionsError } = await supabase
      .from("additional_questions")
      .select("*")
      .eq("user_id", userId)

    if (questionsError) {
      console.error("Error getting additional questions:", questionsError)
    }

    // Get beta application
    const { data: betaApplication, error: applicationError } = await supabase
      .from("beta_applications")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (applicationError && applicationError.code !== "PGRST116") {
      console.error("Error getting beta application:", applicationError)
    }

    // Get compatibility analyses
    const { data: compatibilityAnalyses, error: analysesError } = await supabase
      .from("compatibility_analysis")
      .select("*")
      .eq("user_id", userId)

    if (analysesError) {
      console.error("Error getting compatibility analyses:", analysesError)
    }

    // Combine all data
    return {
      user,
      birthInfo: birthInfo || null,
      sajuInfo: sajuInfo || null,
      elements: elements || null,
      interpretation: interpretation || null,
      additionalQuestions: additionalQuestions || [],
      betaApplication: betaApplication || null,
      compatibilityAnalyses: compatibilityAnalyses || [],
    }
  } catch (error) {
    console.error("Error in getAllUserData:", error)
    return null
  }
}

/**
 * Update auth_user_id for an existing user
 */
export async function updateAuthUserId(userId: string, authUserId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").update({ auth_user_id: authUserId }).eq("id", userId)

    if (error) {
      console.error("Error updating auth_user_id:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateAuthUserId:", error)
    return false
  }
}
