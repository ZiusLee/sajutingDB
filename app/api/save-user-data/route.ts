import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 서버 측에서 서비스 롤 키를 사용하여 Supabase 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 서비스 롤 키가 없는 경우 에러 로깅
if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not defined")
}

const adminSupabase = createClient(supabaseUrl!, supabaseServiceKey!)

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()
    console.log("=== SAVE USER DATA API START ===")
    console.log("Received user data keys:", Object.keys(userData))
    console.log("User ID:", userData.userId)
    console.log("Auth User ID:", userData.authUserId)
    console.log("Name:", userData.name)
    console.log("Gender:", userData.gender)
    console.log("Received user data in API route:", userData)

    // 사용자 ID 확인
    const userId = userData.userId
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Ensure saju JSONB data has the correct dayStemSibseong value
    if (userData.saju) {
      userData.saju.dayStemSibseong = "본원" // 일주의 천간은 나에 해당하는 부분으로 "본원"으로 저장
    }

    // 사용자 세션 생성 또는 업데이트
    console.log("Attempting to upsert saju session with data:", {
      id: userId,
      name: userData.name || "Anonymous User",
      gender: userData.gender || "unknown",
      relationship_status: userData.relationshipStatus || "unknown",
      auth_user_id: userData.authUserId || null,
      hasSaju: !!userData.saju,
      hasDaeun: !!userData.daeun,
    })

    const { data: sessionData, error: sessionError } = await adminSupabase
      .from("saju_sessions")
      .upsert(
        {
          id: userId,
          name: userData.name || "Anonymous User",
          gender: userData.gender || "unknown",
          relationship_status: userData.relationshipStatus || "unknown",
          auth_user_id: userData.authUserId || null,
          saju: userData.saju || null, // Include saju JSONB data
          daeun: userData.daeun || null, // Include daeun JSONB data
        },
        { onConflict: "id" },
      )
      .select()

    if (sessionError) {
      console.error("Error creating/updating saju session:")
      console.error("- Error message:", sessionError.message)
      console.error("- Error details:", sessionError.details)
      console.error("- Error hint:", sessionError.hint)
      console.error("- Error code:", sessionError.code)
      console.error("- Full error object:", JSON.stringify(sessionError, null, 2))
      return NextResponse.json(
        {
          error: sessionError.message || "Database error occurred",
          details: sessionError.details,
          code: sessionError.code,
        },
        { status: 500 },
      )
    }

    // For backward compatibility, still save to the old tables
    // 생년월일 정보 저장
    if (userData.year && userData.month && userData.day) {
      const { error: birthError } = await adminSupabase.from("birth_info").insert({
        user_id: userId,
        solar_year: Number.parseInt(userData.year),
        solar_month: Number.parseInt(userData.month),
        solar_day: Number.parseInt(userData.day),
        solar_hour: userData.hour !== undefined ? Number.parseInt(userData.hour) : null,
        solar_minute: userData.minute !== undefined ? Number.parseInt(userData.minute) : null,
        lunar_year: Number.parseInt(userData.lunarYear || userData.year),
        lunar_month: Number.parseInt(userData.lunarMonth || userData.month),
        lunar_day: Number.parseInt(userData.lunarDay || userData.day),
        is_leap_month: Boolean(userData.isLeapMonth),
        time_unknown: userData.timeUnknown || userData.hour === undefined || userData.hour === null,
      })

      if (birthError) {
        console.error("Error saving birth info:", birthError)
      }
    }

    // 사주 정보 저장
    let sajuId = null
    if (userData.yearStem && userData.yearBranch) {
      const { data: saju, error: sajuError } = await adminSupabase
        .from("saju_info")
        .insert({
          user_id: userId,
          year_stem: userData.yearStem,
          year_branch: userData.yearBranch,
          year_stem_hanja: userData.yearStemHanja || "",
          year_branch_hanja: userData.yearBranchHanja || "",
          month_stem: userData.monthStem,
          month_branch: userData.monthBranch,
          month_stem_hanja: userData.monthStemHanja || "",
          month_branch_hanja: userData.monthBranchHanja || "",
          day_stem: userData.dayStem,
          day_branch: userData.dayBranch,
          day_stem_hanja: userData.dayStemHanja || "",
          day_branch_hanja: userData.dayBranchHanja || "",
          hour_stem: userData.hourStem || "?",
          hour_branch: userData.hourBranch || "?",
          hour_stem_hanja: userData.hourStemHanja || "",
          hour_branch_hanja: userData.hourBranchHanja || "",
          day_master: userData.dayMaster || userData.dayStem,
          day_master_hanja: userData.dayMasterHanja || "",
          year_animal: userData.yearAnimal || "",
        })
        .select("id")
        .single()

      if (sajuError) {
        console.error("Error saving saju info:", sajuError)
      } else {
        sajuId = saju.id
      }
    }

    // 오행 정보 저장
    if (sajuId && userData.elements) {
      const { error: elementsError } = await adminSupabase.from("elements").insert({
        saju_id: sajuId,
        wood: userData.elements.wood || 0,
        fire: userData.elements.fire || 0,
        earth: userData.elements.earth || 0,
        metal: userData.elements.metal || 0,
        water: userData.elements.water || 0,
      })

      if (elementsError) {
        console.error("Error saving elements:", elementsError)
      }
    }

    return NextResponse.json({ success: true, userId })
  } catch (error) {
    console.error("Error in save-user-data API route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
