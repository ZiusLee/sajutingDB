import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const authUserId = searchParams.get("authUserId")
    const name = searchParams.get("name")
    const gender = searchParams.get("gender")

    const supabase = createServerSupabaseClient()
    let query = supabase.from("saju_sessions").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (userId) {
      query = query.eq("id", userId)
    } else if (authUserId) {
      query = query.eq("auth_user_id", authUserId)
    } else if (name && gender) {
      query = query.eq("name", name).eq("gender", gender)
    }

    // Get latest sessions first
    query = query.limit(10)

    const { data: sessions, error } = await query

    if (error) {
      console.error("Error fetching saju sessions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("Error in saju-sessions GET API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, gender, saju, roomType, birthInfo, daeun } = await request.json()

    const supabase = createServerSupabaseClient()

    // Generate session ID
    const sessionId = uuidv4()

    let isDefault = false
    if (userId) {
      // For authenticated users, check if they have any existing sessions
      const { data: existingSessions, error: checkError } = await supabase
        .from("saju_sessions")
        .select("id")
        .eq("auth_user_id", userId)
        .limit(1)

      if (!checkError && (!existingSessions || existingSessions.length === 0)) {
        isDefault = true // This is the first session for this user
      }
    } else {
      // For anonymous users, this is always their first session
      isDefault = true
    }

    const sessionData = {
      id: sessionId,
      name: name,
      gender: gender,
      room_type: roomType || "sajuping",
      auth_user_id: userId,
      relationship_status: "solo",
      is_beta_applicant: false,
      is_default: isDefault, // Set is_default based on whether this is the first session
      saju: saju
        ? {
            // 기본 사주 정보
            yearStem: saju.yearStem,
            yearBranch: saju.yearBranch,
            yearStemHanja: saju.yearStemHanja,
            yearBranchHanja: saju.yearBranchHanja,
            monthStem: saju.monthStem,
            monthBranch: saju.monthBranch,
            monthStemHanja: saju.monthStemHanja,
            monthBranchHanja: saju.monthBranchHanja,
            dayStem: saju.dayStem,
            dayBranch: saju.dayBranch,
            dayStemHanja: saju.dayStemHanja,
            dayBranchHanja: saju.dayBranchHanja,
            hourStem: saju.hourStem,
            hourBranch: saju.hourBranch,
            hourStemHanja: saju.hourStemHanja,
            hourBranchHanja: saju.hourBranchHanja,
            dayMaster: saju.dayMaster,
            dayMasterHanja: saju.dayMasterHanja,
            yearAnimal: saju.yearAnimal,
            // 십성 정보
            yearStemSibseong: saju.yearStemSibseong,
            monthStemSibseong: saju.monthStemSibseong,
            dayStemSibseong: saju.dayStemSibseong,
            hourStemSibseong: saju.hourStemSibseong,
            yearBranchSibseong: saju.yearBranchSibseong,
            monthBranchSibseong: saju.monthBranchSibseong,
            dayBranchSibseong: saju.dayBranchSibseong,
            hourBranchSibseong: saju.hourBranchSibseong,
            // 오행 정보
            elements: saju.elements,
            // 생년월일시 정보 (birthInfo에서 가져옴)
            birthYear: birthInfo?.solarYear,
            birthMonth: birthInfo?.solarMonth,
            birthDay: birthInfo?.solarDay,
            birthHour: birthInfo?.solarHour,
            birthMinute: birthInfo?.solarMinute,
          }
        : null,
      daeun: daeun || null, // 대운 정보는 daeun column에 저장
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error: sessionError } = await supabase.from("saju_sessions").insert(sessionData).select("id").single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    // If birthInfo is provided, save it to birth_info table
    if (birthInfo) {
      const birthInfoData = {
        user_id: data.id,
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
        // Don't fail the whole process, but log the error
      }
    }

    if (saju) {
      const sajuInfoData = {
        user_id: data.id,
        year_stem: saju.yearStem,
        year_branch: saju.yearBranch,
        year_stem_hanja: saju.yearStemHanja,
        year_branch_hanja: saju.yearBranchHanja,
        month_stem: saju.monthStem,
        month_branch: saju.monthBranch,
        month_stem_hanja: saju.monthStemHanja,
        month_branch_hanja: saju.monthBranchHanja,
        day_stem: saju.dayStem,
        day_branch: saju.dayBranch,
        day_stem_hanja: saju.dayStemHanja,
        day_branch_hanja: saju.dayBranchHanja,
        hour_stem: saju.hourStem,
        hour_branch: saju.hourBranch,
        hour_stem_hanja: saju.hourStemHanja,
        hour_branch_hanja: saju.hourBranchHanja,
        day_master: saju.dayMaster,
        day_master_hanja: saju.dayMasterHanja,
        year_animal: saju.yearAnimal,
        // 십성 정보 올바르게 저장
        year_stem_sibseong: saju.yearStemSibseong,
        month_stem_sibseong: saju.monthStemSibseong,
        day_stem_sibseong: saju.dayStemSibseong,
        hour_stem_sibseong: saju.hourStemSibseong,
        year_branch_sibseong: saju.yearBranchSibseong,
        month_branch_sibseong: saju.monthBranchSibseong,
        day_branch_sibseong: saju.dayBranchSibseong,
        hour_branch_sibseong: saju.hourBranchSibseong,
        created_at: new Date().toISOString(),
      }

      const { error: sajuInfoError } = await supabase.from("saju_info").insert(sajuInfoData)

      if (sajuInfoError) {
        console.error("Error creating saju info:", sajuInfoError)
        // Don't fail the whole process, but log the error
      }
    }

    return NextResponse.json({ id: data.id, sessionId: data.id })
  } catch (error) {
    console.error("Error in saju-sessions POST API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
