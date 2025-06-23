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

    // createClient 대신 createServerSupabaseClient 사용
    const supabase = createServerSupabaseClient()
    let query = supabase.from("saju_sessions").select("*").order("created_at", { ascending: false })

    // 필터 적용
    if (userId) {
      query = query.eq("id", userId)
    } else if (authUserId) {
      query = query.eq("auth_user_id", authUserId)
    } else if (name && gender) {
      query = query.eq("user_name", name).eq("gender", gender)
    }

    // 최신 세션 우선으로 가져오기
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

    // 세션 데이터 생성
    const sessionId = uuidv4()
    const sessionData = {
      id: sessionId,
      user_name: name,
      gender: gender,
      birth_year: saju?.year || birthInfo?.solarYear,
      birth_month: saju?.month || birthInfo?.solarMonth,
      birth_day: saju?.day || birthInfo?.solarDay,
      birth_hour: saju?.hour || birthInfo?.solarHour,
      day_stem: saju?.dayStem,
      day_branch: saju?.dayBranch,
      room_type: roomType || "sajuping",
      auth_user_id: userId,
      saju: saju ? JSON.stringify(saju) : null, // 사주 데이터를 JSONB로 저장
      daeun: daeun ? JSON.stringify(daeun) : null, // 대운 데이터를 JSONB로 저장
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // createClient 대신 createServerSupabaseClient 사용
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("saju_sessions").insert(sessionData).select("id").single()

    if (error) {
      console.error("Error creating saju session:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, sessionId: data.id })
  } catch (error) {
    console.error("Error in saju-sessions POST API:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
