import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const { name, gender, birthInfo, sajuData, daeunData, interpretation } = await request.json()

    if (!name || !gender || !birthInfo || !sajuData) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Create saju session with separated data
    const sessionData = {
      name,
      gender,
      relationship_status: "solo",
      is_beta_applicant: false,
      // Store only saju data without daeun
      saju: JSON.stringify({
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
      }),
      // Store daeun data separately
      daeun: daeunData ? JSON.stringify(daeunData) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: session, error: sessionError } = await supabase
      .from("saju_sessions")
      .insert(sessionData)
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Create birth info
    const birthInfoData = {
      user_id: session.id,
      solar_year: birthInfo.solarYear,
      solar_month: birthInfo.solarMonth,
      solar_day: birthInfo.solarDay,
      solar_hour: birthInfo.solarHour,
      solar_minute: birthInfo.solarMinute,
      lunar_year: birthInfo.lunarYear,
      lunar_month: birthInfo.lunarMonth,
      lunar_day: birthInfo.lunarDay,
      is_leap_month: birthInfo.isLeapMonth || false,
      time_unknown: birthInfo.timeUnknown || false,
      birth_city_id: birthInfo.birthCityId || "seoul",
      time_standard: birthInfo.timeStandard || "동경135도",
      created_at: new Date().toISOString(),
    }

    const { error: birthInfoError } = await supabase.from("birth_info").insert(birthInfoData)

    if (birthInfoError) {
      console.error("Error creating birth info:", birthInfoError)
      // Clean up session if birth info creation fails
      await supabase.from("saju_sessions").delete().eq("id", session.id)
      return NextResponse.json({ error: "Failed to create birth info" }, { status: 500 })
    }

    // Create saju info
    const sajuInfoData = {
      user_id: session.id,
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
    }

    const { data: sajuInfo, error: sajuInfoError } = await supabase
      .from("saju_info")
      .insert(sajuInfoData)
      .select("id")
      .single()

    if (sajuInfoError) {
      console.error("Error creating saju info:", sajuInfoError)
      // Clean up session and birth info if saju info creation fails
      await supabase.from("birth_info").delete().eq("user_id", session.id)
      await supabase.from("saju_sessions").delete().eq("id", session.id)
      return NextResponse.json({ error: "Failed to create saju info" }, { status: 500 })
    }

    // Create elements record using saju_info.id
    if (sajuData.elements) {
      const elementsData = {
        saju_id: sajuInfo.id, // Use saju_info.id, not session.id
        wood: sajuData.elements.wood || 0,
        fire: sajuData.elements.fire || 0,
        earth: sajuData.elements.earth || 0,
        metal: sajuData.elements.metal || 0,
        water: sajuData.elements.water || 0,
        created_at: new Date().toISOString(),
      }

      const { error: elementsError } = await supabase.from("elements").insert(elementsData)

      if (elementsError) {
        console.error("Error creating elements:", elementsError)
        // Don't fail the whole process if elements creation fails
      }
    }

    // Create interpretation if provided
    if (interpretation) {
      const interpretationData = {
        user_id: session.id,
        basic_interpretation: interpretation,
        model_used: "system",
        response_time: "0ms",
        created_at: new Date().toISOString(),
      }

      const { error: interpretationError } = await supabase.from("interpretations").insert(interpretationData)

      if (interpretationError) {
        console.error("Error creating interpretation:", interpretationError)
        // Don't fail the whole process if interpretation creation fails
      }
    }

    return NextResponse.json({ success: true, userId: session.id })
  } catch (error) {
    console.error("Error in save-user-data API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
