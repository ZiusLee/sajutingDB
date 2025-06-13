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

// Update the POST function to handle privacy consent and store saju data in JSONB columns
export async function POST(request: NextRequest) {
  try {
    const sajuData = await request.json()
    console.log("Received saju data in API route:", sajuData)

    // 사용자 ID를 저장할 변수
    let userId: string | null = null

    // 이메일이 있는 경우 기존 사용자 확인
    if (sajuData.email) {
      const { data: existingUsers } = await adminSupabase.from("users").select("id").eq("email", sajuData.email)

      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id
        console.log("Found existing user with ID:", userId)
      }
    }

    // 기존 사용자가 없는 경우 새 사용자 생성
    if (!userId) {
      const { data: newUser, error: userError } = await adminSupabase
        .from("users")
        .insert({
          name: sajuData.name || "Anonymous User",
          email: sajuData.email || null,
          gender: sajuData.gender || "unknown",
          relationship_status: sajuData.relationshipStatus || "unknown",
          is_beta_applicant: false,
          phone: sajuData.phone || null, // 핸드폰 번호 추가
          privacy_consent: sajuData.privacyConsent || false, // 개인정보 동의 추가
        })
        .select("id")
        .single()

      if (userError) {
        console.error("Error creating user:", userError)
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      userId = newUser.id
      console.log("Created new user with ID:", userId)
    }

    // Prepare saju JSONB data - using the raw data structure
    const sajuJsonb = {
      yearStem: sajuData.yearStem,
      yearBranch: sajuData.yearBranch,
      yearStemHanja: sajuData.yearStemHanja || "",
      yearBranchHanja: sajuData.yearBranchHanja || "",
      monthStem: sajuData.monthStem,
      monthBranch: sajuData.monthBranch,
      monthStemHanja: sajuData.monthStemHanja || "",
      monthBranchHanja: sajuData.monthBranchHanja || "",
      dayStem: sajuData.dayStem,
      dayBranch: sajuData.dayBranch,
      dayStemHanja: sajuData.dayStemHanja || "",
      dayBranchHanja: sajuData.dayBranchHanja || "",
      hourStem: sajuData.hourStem || "?",
      hourBranch: sajuData.hourBranch || "?",
      hourStemHanja: sajuData.hourStemHanja || "",
      hourBranchHanja: sajuData.hourBranchHanja || "",
      dayMaster: sajuData.dayMaster || sajuData.dayStem,
      dayMasterHanja: sajuData.dayMasterHanja || "",
      yearAnimal: sajuData.yearAnimal || "",
      elements: sajuData.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
      yearStemSibseong: sajuData.yearStemSibseong || "",
      monthStemSibseong: sajuData.monthStemSibseong || "",
      dayStemSibseong: "본원", // 일주의 천간은 나에 해당하는 부분으로 "본원"으로 저장
      hourStemSibseong: sajuData.hourStemSibseong || "",
      yearBranchSibseong: sajuData.yearBranchSibseong || "",
      monthBranchSibseong: sajuData.monthBranchSibseong || "",
      dayBranchSibseong: sajuData.dayBranchSibseong || "",
      hourBranchSibseong: sajuData.hourBranchSibseong || "",
      birthInfo: {
        solar: {
          year: Number.parseInt(sajuData.year),
          month: Number.parseInt(sajuData.month),
          day: Number.parseInt(sajuData.day),
          hour: sajuData.hour !== undefined ? Number.parseInt(sajuData.hour) : null,
          minute: sajuData.minute !== undefined ? Number.parseInt(sajuData.minute) : null,
        },
        lunar: {
          year: Number.parseInt(sajuData.lunarYear || sajuData.year),
          month: Number.parseInt(sajuData.lunarMonth || sajuData.month),
          day: Number.parseInt(sajuData.lunarDay || sajuData.day),
          isLeapMonth: Boolean(sajuData.isLeapMonth),
        },
        timeUnknown: sajuData.timeUnknown || sajuData.hour === undefined || sajuData.hour === null,
        birthCityId: sajuData.birthCityId || "seoul",
        timeStandard: sajuData.timeStandard || "동경135도",
      },
    }

    // Prepare daeun JSONB data if available
    const daeunJsonb = sajuData.daeun || null
    console.log("Saving daeun data:", daeunJsonb)

    // 로그 추가하여 저장 여부 확인
    if (daeunJsonb) {
      console.log("Daeun data will be saved to database")
    } else {
      console.log("No daeun data to save")
    }

    // Insert into saju_sessions with the JSONB columns
    const { data: sessionData, error: sessionError } = await adminSupabase
      .from("saju_sessions")
      .insert({
        user_id: userId,
        name: sajuData.name || "Anonymous User",
        gender: sajuData.gender || "unknown",
        relationship_status: sajuData.relationshipStatus || "unknown",
        saju: sajuJsonb,
        daeun: daeunJsonb,
      })
      .select("id")
      .single()

    if (sessionError) {
      console.error("Error creating saju session:", sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    // For backward compatibility, still save to the old tables
    // 생년월일 정보 저장
    if (sajuData.year && sajuData.month && sajuData.day) {
      const { error: birthError } = await adminSupabase.from("birth_info").insert({
        user_id: userId,
        solar_year: Number.parseInt(sajuData.year),
        solar_month: Number.parseInt(sajuData.month),
        solar_day: Number.parseInt(sajuData.day),
        solar_hour: sajuData.hour !== undefined ? Number.parseInt(sajuData.hour) : null,
        solar_minute: sajuData.minute !== undefined ? Number.parseInt(sajuData.minute) : null,
        lunar_year: Number.parseInt(sajuData.lunarYear || sajuData.year),
        lunar_month: Number.parseInt(sajuData.lunarMonth || sajuData.month),
        lunar_day: Number.parseInt(sajuData.lunarDay || sajuData.day),
        is_leap_month: Boolean(sajuData.isLeapMonth),
        time_unknown: sajuData.timeUnknown || sajuData.hour === undefined || sajuData.hour === null,
      })

      if (birthError) {
        console.error("Error saving birth info:", birthError)
      }
    }

    // 사주 정보 저장
    let sajuId = null
    if (sajuData.yearStem && sajuData.yearBranch) {
      const { data: saju, error: sajuError } = await adminSupabase
        .from("saju_info")
        .insert({
          user_id: userId,
          year_stem: sajuData.yearStem,
          year_branch: sajuData.yearBranch,
          year_stem_hanja: sajuData.yearStemHanja || "",
          year_branch_hanja: sajuData.yearBranchHanja || "",
          month_stem: sajuData.monthStem,
          month_branch: sajuData.monthBranch,
          month_stem_hanja: sajuData.monthStemHanja || "",
          month_branch_hanja: sajuData.monthBranchHanja || "",
          day_stem: sajuData.dayStem,
          day_branch: sajuData.dayBranch,
          day_stem_hanja: sajuData.dayStemHanja || "",
          day_branch_hanja: sajuData.dayBranchHanja || "",
          hour_stem: sajuData.hourStem || "?",
          hour_branch: sajuData.hourBranch || "?",
          hour_stem_hanja: sajuData.hourStemHanja || "",
          hour_branch_hanja: sajuData.hourBranchHanja || "",
          day_master: sajuData.dayMaster || sajuData.dayStem,
          day_master_hanja: sajuData.dayMasterHanja || "",
          year_animal: sajuData.yearAnimal || "",
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
    if (sajuId && sajuData.elements) {
      const { error: elementsError } = await adminSupabase.from("elements").insert({
        saju_id: sajuId,
        wood: sajuData.elements.wood || 0,
        fire: sajuData.elements.fire || 0,
        earth: sajuData.elements.earth || 0,
        metal: sajuData.elements.metal || 0,
        water: sajuData.elements.water || 0,
      })

      if (elementsError) {
        console.error("Error saving elements:", elementsError)
      }
    }

    // 해석 정보 저장
    if (sajuData.sajuInterpretation) {
      const { error: interpretationError } = await adminSupabase.from("interpretations").insert({
        user_id: userId,
        basic_interpretation: sajuData.sajuInterpretation,
        model_used: sajuData.model || "unknown",
        response_time: sajuData.responseTime || "unknown",
        user_feedback: sajuData.feedback || null, // 피드백 정보 추가
      })

      if (interpretationError) {
        console.error("Error saving interpretation:", interpretationError)
      }
    }

    return NextResponse.json({ success: true, userId, sessionId: sessionData.id })
  } catch (error) {
    console.error("Error in save-saju-data API route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
