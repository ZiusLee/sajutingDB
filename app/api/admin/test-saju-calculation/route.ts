import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { calculateSaju, type TimeStandard } from "@/lib/saju"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import { getCityById, DEFAULT_CITY_ID } from "@/lib/city-timezone-data"

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "세션 ID가 필요합니다." }, { status: 400 })
    }

    // 세션 데이터 가져오기
    const { data: session, error: selectError } = await supabase
      .from("saju_sessions")
      .select(`
        id,
        auth_user_id,
        saju,
        daeun,
        gender,
        birth_info!birth_info_user_id_fkey (
          solar_year,
          solar_month,
          solar_day,
          solar_hour,
          solar_minute,
          lunar_year,
          lunar_month,
          lunar_day,
          is_leap_month,
          time_unknown,
          time_standard,
          birth_city_id
        )
      `)
      .eq("id", sessionId)
      .single()

    if (selectError || !session) {
      return NextResponse.json({ error: "세션을 찾을 수 없습니다." }, { status: 404 })
    }

    const birthInfo = Array.isArray(session.birth_info) ? session.birth_info[0] : session.birth_info
    if (!birthInfo) {
      return NextResponse.json({ error: "birth_info가 없습니다." }, { status: 400 })
    }

    const gender = session.gender || "female"
    const solarYear = Number(birthInfo.solar_year)
    const solarMonth = Number(birthInfo.solar_month)
    const solarDay = Number(birthInfo.solar_day)
    const lunarYear = Number(birthInfo.lunar_year)
    const lunarMonth = Number(birthInfo.lunar_month)
    const lunarDay = Number(birthInfo.lunar_day)
    const isLeapMonth = birthInfo.is_leap_month || false
    const timeUnknown = birthInfo.time_unknown || false

    let solarHour: number
    let solarMinute: number

    if (timeUnknown) {
      solarHour = 12
      solarMinute = 0
    } else {
      solarHour = Number(birthInfo.solar_hour) || 0
      solarMinute = Number(birthInfo.solar_minute) || 0
    }

    // 시간 표준 설정
    const birthCityId = birthInfo.birth_city_id || DEFAULT_CITY_ID
    const cityData = getCityById(birthCityId)
    const timeStandard: TimeStandard = cityData?.timeStandard || birthInfo.time_standard || "동경135도"

    // 사주 계산
    const newSajuResult = calculateSaju(
      lunarYear,
      lunarMonth,
      lunarDay,
      solarHour,
      solarMinute,
      solarYear,
      solarMonth,
      solarDay,
      gender,
      "",
      timeUnknown,
      isLeapMonth,
      undefined,
      undefined,
      timeStandard,
    )

    // 대운 계산
    const newDaeunResult = calculateDaeunInfo(
      newSajuResult,
      solarYear,
      solarMonth,
      solarDay,
      gender,
      timeUnknown ? undefined : solarHour,
      timeUnknown ? undefined : solarMinute,
      timeUnknown,
    )

    return NextResponse.json({
      sessionId,
      inputData: {
        solarYear,
        solarMonth,
        solarDay,
        lunarYear,
        lunarMonth,
        lunarDay,
        solarHour,
        solarMinute,
        timeUnknown,
        isLeapMonth,
        gender,
        timeStandard,
      },
      existingSaju: session.saju,
      existingDaeun: session.daeun,
      newSaju: newSajuResult,
      newDaeun: newDaeunResult,
    })
  } catch (error) {
    console.error("[v0] 사주 계산 테스트 오류:", error)
    return NextResponse.json({ error: "테스트 중 오류가 발생했습니다." }, { status: 500 })
  }
}
