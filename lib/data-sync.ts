import { getSupabase } from "./supabase-client"
import { v4 as uuidv4 } from "uuid"

export async function syncLocalStorageToDatabase(authUserId?: string | null): Promise<string | null> {
  try {
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (!tempSajuData) {
      console.log("No temp saju data found in localStorage")
      return null
    }

    const sajuData = JSON.parse(tempSajuData)
    console.log("Syncing saju data to database:", sajuData)

    const supabase = getSupabase()
    const sessionId = uuidv4()

    // 1. Create saju_sessions record
    const sessionData = {
      id: sessionId,
      name: sajuData.name,
      gender: sajuData.gender,
      relationship_status: sajuData.relationshipStatus || "solo",
      auth_user_id: authUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Store saju data as JSON in the saju column
      saju: {
        yearStem: sajuData.yearStem,
        yearBranch: sajuData.yearBranch,
        yearStemHanja: sajuData.yearStemHanja,
        yearBranchHanja: sajuData.yearBranchHanja,
        monthStem: sajuData.monthStem,
        monthBranch: sajuData.monthBranch,
        monthStemHanja: sajuData.monthStemHanja,
        monthBranchHanja: sajuData.monthBranchHanja,
        dayStem: sajuData.dayStem,
        dayBranch: sajuData.dayBranch,
        dayStemHanja: sajuData.dayStemHanja,
        dayBranchHanja: sajuData.dayBranchHanja,
        hourStem: sajuData.hourStem,
        hourBranch: sajuData.hourBranch,
        hourStemHanja: sajuData.hourStemHanja,
        hourBranchHanja: sajuData.hourBranchHanja,
        dayMaster: sajuData.dayMaster,
        dayMasterHanja: sajuData.dayMasterHanja,
        yearAnimal: sajuData.yearAnimal,
        elements: sajuData.elements,
        yearStemSibseong: sajuData.yearStemSibseong,
        monthStemSibseong: sajuData.monthStemSibseong,
        dayStemSibseong: sajuData.dayStemSibseong,
        hourStemSibseong: sajuData.hourStemSibseong,
        yearBranchSibseong: sajuData.yearBranchSibseong,
        monthBranchSibseong: sajuData.monthBranchSibseong,
        dayBranchSibseong: sajuData.dayBranchSibseong,
        hourBranchSibseong: sajuData.hourBranchSibseong,
      },
      // Store daeun data separately
      daeun: sajuData.daeun,
    }

    const { data: sessionResult, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert(sessionData)
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      return null
    }

    console.log("Created saju session:", sessionResult.id)

    // 2. Create birth_info record
    const birthInfoData = {
      user_id: sessionId,
      solar_year: sajuData.year,
      solar_month: sajuData.month,
      solar_day: sajuData.day,
      solar_hour: sajuData.timeUnknown ? null : sajuData.hour,
      solar_minute: sajuData.timeUnknown ? null : sajuData.minute,
      lunar_year: sajuData.lunarYear,
      lunar_month: sajuData.lunarMonth,
      lunar_day: sajuData.lunarDay,
      is_leap_month: sajuData.isLeapMonth || false,
      time_unknown: sajuData.timeUnknown,
      birth_city_id: sajuData.birthCityId,
      time_standard: sajuData.timeStandard,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: birthInfoError } = await supabase.from("birth_info").insert(birthInfoData)

    if (birthInfoError) {
      console.error("Error creating birth info:", birthInfoError)
      // Don't return null here, as the session was created successfully
    } else {
      console.log("Created birth info for session:", sessionId)
    }

    // 3. Create saju_info record
    const sajuInfoData = {
      user_id: sessionId,
      year_stem: sajuData.yearStem,
      year_branch: sajuData.yearBranch,
      year_stem_hanja: sajuData.yearStemHanja,
      year_branch_hanja: sajuData.yearBranchHanja,
      month_stem: sajuData.monthStem,
      month_branch: sajuData.monthBranch,
      month_stem_hanja: sajuData.monthStemHanja,
      month_branch_hanja: sajuData.monthBranchHanja,
      day_stem: sajuData.dayStem,
      day_branch: sajuData.dayBranch,
      day_stem_hanja: sajuData.dayStemHanja,
      day_branch_hanja: sajuData.dayBranchHanja,
      hour_stem: sajuData.hourStem,
      hour_branch: sajuData.hourBranch,
      hour_stem_hanja: sajuData.hourStemHanja,
      hour_branch_hanja: sajuData.hourBranchHanja,
      day_master: sajuData.dayMaster,
      day_master_hanja: sajuData.dayMasterHanja,
      year_animal: sajuData.yearAnimal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: sajuInfoResult, error: sajuInfoError } = await supabase
      .from("saju_info")
      .insert(sajuInfoData)
      .select("id")
      .single()

    if (sajuInfoError) {
      console.error("Error creating saju info:", sajuInfoError)
    } else {
      console.log("Created saju info:", sajuInfoResult.id)

      // 4. Create elements record
      if (sajuData.elements && sajuInfoResult.id) {
        const elementsData = {
          saju_id: sajuInfoResult.id,
          wood: sajuData.elements.wood || 0,
          fire: sajuData.elements.fire || 0,
          earth: sajuData.elements.earth || 0,
          metal: sajuData.elements.metal || 0,
          water: sajuData.elements.water || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: elementsError } = await supabase.from("elements").insert(elementsData)

        if (elementsError) {
          console.error("Error creating elements:", elementsError)
        } else {
          console.log("Created elements for saju info:", sajuInfoResult.id)
        }
      }
    }

    // Clear temp data after successful sync
    localStorage.removeItem("tempSajuData")
    console.log("Successfully synced saju data to database")

    return sessionId
  } catch (error) {
    console.error("Error syncing localStorage to database:", error)
    return null
  }
}

export async function linkUserDataToAuth(authUserId: string): Promise<boolean> {
  try {
    const supabase = getSupabase()

    // Get all sessions that don't have an auth_user_id but might belong to this user
    // This is a simplified approach - you might want to implement more sophisticated matching
    const { data: sessions, error } = await supabase
      .from("saju_sessions")
      .select("id")
      .is("auth_user_id", null)
      .limit(10) // Limit to prevent too many updates

    if (error) {
      console.error("Error fetching sessions to link:", error)
      return false
    }

    if (!sessions || sessions.length === 0) {
      console.log("No sessions found to link to auth user")
      return true
    }

    // Update sessions to link them to the authenticated user
    const { error: updateError } = await supabase
      .from("saju_sessions")
      .update({ auth_user_id: authUserId, updated_at: new Date().toISOString() })
      .in(
        "id",
        sessions.map((s) => s.id),
      )

    if (updateError) {
      console.error("Error linking sessions to auth user:", updateError)
      return false
    }

    console.log(`Successfully linked ${sessions.length} sessions to auth user ${authUserId}`)
    return true
  } catch (error) {
    console.error("Error in linkUserDataToAuth:", error)
    return false
  }
}
