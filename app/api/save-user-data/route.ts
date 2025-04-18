import { createServerSupabaseClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Create a server-side Supabase client with admin privileges
    const supabase = createServerSupabaseClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    console.log(authUser)

    // Insert user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: data.userId,
        name: data.name || "Anonymous User",
        gender: data.gender || "unknown",
        relationship_status: data.relationshipStatus || "unknown",
        is_beta_applicant: false,
        auth_user_id: authUser !== null ? authUser.id : null,
      })
      .select()

    if (userError) {
      console.error("Error inserting user data:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Insert birth info if provided
    if (data.year && data.month && data.day) {
      const { error: birthInfoError } = await supabase.from("birth_info").insert({
        user_id: data.userId,
        solar_year: data.year,
        solar_month: data.month,
        solar_day: data.day,
        solar_hour: data.hour || null,
        solar_minute: data.minute || null,
        lunar_year: data.lunarYear,
        lunar_month: data.lunarMonth,
        lunar_day: data.lunarDay,
        is_leap_month: false,
        time_unknown: data.timeUnknown || false,
      })

      if (birthInfoError) {
        console.error("Error inserting birth info:", birthInfoError)
        // Continue even if birth info insertion fails
      }
    }

    // Insert saju info if provided
    if (data.yearStem && data.yearBranch) {
      const { data: sajuInfoData, error: sajuInfoError } = await supabase
        .from("saju_info")
        .insert({
          user_id: data.userId,
          year_stem: data.yearStem,
          year_branch: data.yearBranch,
          year_stem_hanja: data.yearStemHanja || "",
          year_branch_hanja: data.yearBranchHanja || "",
          month_stem: data.monthStem,
          month_branch: data.monthBranch,
          month_stem_hanja: data.monthStemHanja || "",
          month_branch_hanja: data.monthBranchHanja || "",
          day_stem: data.dayStem,
          day_branch: data.dayBranch,
          day_stem_hanja: data.dayStemHanja || "",
          day_branch_hanja: data.dayBranchHanja || "",
          hour_stem: data.hourStem || "?",
          hour_branch: data.hourBranch || "?",
          hour_stem_hanja: data.hourStemHanja || "",
          hour_branch_hanja: data.hourBranchHanja || "",
          day_master: data.dayMaster || data.dayStem,
          day_master_hanja: data.dayMasterHanja || "",
          year_animal: data.yearAnimal || "",
        })
        .select()

      if (sajuInfoError) {
        console.error("Error inserting saju info:", sajuInfoError)
        // Continue even if saju info insertion fails
      } else if (sajuInfoData && sajuInfoData[0] && data.elements) {
        // Insert elements if saju info was successfully inserted
        const sajuId = sajuInfoData[0].id
        const { error: elementsError } = await supabase.from("elements").insert({
          saju_id: sajuId,
          wood: data.elements.wood || 0,
          fire: data.elements.fire || 0,
          earth: data.elements.earth || 0,
          metal: data.elements.metal || 0,
          water: data.elements.water || 0,
        })

        if (elementsError) {
          console.error("Error inserting elements:", elementsError)
        }
      }
    }

    // Insert interpretation if provided
    if (data.interpretation) {
      const { error: interpretationError } = await supabase.from("interpretations").insert({
        user_id: data.userId,
        basic_interpretation: data.interpretation,
        model_used: data.model || "unknown",
        response_time: data.responseTime || "N/A",
      })

      if (interpretationError) {
        console.error("Error inserting interpretation:", interpretationError)
      }
    }

    return NextResponse.json({ success: true, userId: data.userId })
  } catch (error) {
    console.error("Error in save-user-data API route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
