import { createClient } from "@supabase/supabase-js"
import { calculateSaju } from "../lib/saju"
import { calculateDaeunInfo } from "../lib/daeun-calculator"

// Supabase 클라이언트 초기화
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

interface SessionData {
  id: string
  user_id: string
  name: string
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number
  birth_minute: number
  gender: string
  time_unknown: boolean
  is_leap_month: boolean
  lunar_year: number
  lunar_month: number
  lunar_day: number
  solar_year: number
  solar_month: number
  solar_day: number
  time_standard: string
  saju: any
  daeun: any
}

async function updateSajuSessions() {
  console.log("[v0] 사주 세션 데이터 업데이트 시작...")

  try {
    // 1. 모든 saju_sessions 데이터 가져오기
    const { data: sessions, error: fetchError } = await supabase
      .from("saju_sessions")
      .select("*")
      .order("created_at", { ascending: true })

    if (fetchError) {
      console.error("[v0] 세션 데이터 조회 실패:", fetchError)
      return
    }

    if (!sessions || sessions.length === 0) {
      console.log("[v0] 업데이트할 세션이 없습니다.")
      return
    }

    console.log(`[v0] 총 ${sessions.length}개의 세션을 업데이트합니다.`)

    let successCount = 0
    let errorCount = 0

    // 2. 각 세션에 대해 사주와 대운 재계산
    for (const session of sessions as SessionData[]) {
      try {
        console.log(`[v0] 세션 ${session.id} (${session.name}) 처리 중...`)

        // 필수 데이터 검증
        if (!session.birth_year || !session.birth_month || !session.birth_day) {
          console.warn(`[v0] 세션 ${session.id}: 생년월일 정보 부족, 건너뜀`)
          errorCount++
          continue
        }

        // 기본값 설정
        const birthHour = session.birth_hour || 12
        const birthMinute = session.birth_minute || 0
        const gender = session.gender || "male"
        const timeUnknown = session.time_unknown || false
        const isLeapMonth = session.is_leap_month || false
        const timeStandard = (session.time_standard || "동경135도") as any

        // 음력/양력 정보 설정
        const lunarYear = session.lunar_year || session.birth_year
        const lunarMonth = session.lunar_month || session.birth_month
        const lunarDay = session.lunar_day || session.birth_day
        const solarYear = session.solar_year || session.birth_year
        const solarMonth = session.solar_month || session.birth_month
        const solarDay = session.solar_day || session.birth_day

        console.log(`[v0] 사주 계산: ${session.name} (${solarYear}-${solarMonth}-${solarDay})`)

        // 3. 사주 계산
        const sajuResult = calculateSaju(
          lunarYear,
          lunarMonth,
          lunarDay,
          birthHour,
          birthMinute,
          solarYear,
          solarMonth,
          solarDay,
          gender,
          session.name,
          timeUnknown,
          isLeapMonth,
          undefined, // apiMonthStem
          undefined, // apiMonthBranch
          timeStandard,
        )

        console.log(`[v0] 대운 계산: ${session.name}`)

        // 4. 대운 계산
        const daeunResult = calculateDaeunInfo(
          {
            yearStem: sajuResult.yearStem,
            monthStem: sajuResult.monthStem,
            monthBranch: sajuResult.monthBranch,
          },
          solarYear,
          solarMonth,
          solarDay,
          gender,
          birthHour,
          birthMinute,
          timeUnknown,
        )

        // 5. 완전한 사주 데이터 구성 (십성, 오행 포함)
        const completeSajuData = {
          // 기본 사주 정보
          yearStem: sajuResult.yearStem,
          yearBranch: sajuResult.yearBranch,
          monthStem: sajuResult.monthStem,
          monthBranch: sajuResult.monthBranch,
          dayStem: sajuResult.dayStem,
          dayBranch: sajuResult.dayBranch,
          hourStem: sajuResult.hourStem,
          hourBranch: sajuResult.hourBranch,

          // 한자 정보
          yearStemHanja: sajuResult.yearStemHanja,
          yearBranchHanja: sajuResult.yearBranchHanja,
          monthStemHanja: sajuResult.monthStemHanja,
          monthBranchHanja: sajuResult.monthBranchHanja,
          dayStemHanja: sajuResult.dayStemHanja,
          dayBranchHanja: sajuResult.dayBranchHanja,
          hourStemHanja: sajuResult.hourStemHanja,
          hourBranchHanja: sajuResult.hourBranchHanja,

          // 십성 정보
          yearStemSibseong: sajuResult.yearStemSibseong,
          monthStemSibseong: sajuResult.monthStemSibseong,
          dayStemSibseong: sajuResult.dayStemSibseong,
          hourStemSibseong: sajuResult.hourStemSibseong,
          yearBranchSibseong: sajuResult.yearBranchSibseong,
          monthBranchSibseong: sajuResult.monthBranchSibseong,
          dayBranchSibseong: sajuResult.dayBranchSibseong,
          hourBranchSibseong: sajuResult.hourBranchSibseong,

          // 오행 정보
          elements: sajuResult.elements,

          // 기타 정보
          interpretation: sajuResult.interpretation,
          yearAnimal: sajuResult.yearAnimal,
          dayMaster: sajuResult.dayMaster,
          dayMasterHanja: sajuResult.dayMasterHanja,
          gender: sajuResult.gender,
          name: sajuResult.name,
          timeUnknown: sajuResult.timeUnknown,
          timeStandard: sajuResult.timeStandard,

          // 생년월일시 정보
          birthInfo: {
            lunarYear,
            lunarMonth,
            lunarDay,
            solarYear,
            solarMonth,
            solarDay,
            birthHour,
            birthMinute,
            isLeapMonth,
          },
        }

        console.log(`[v0] 데이터베이스 업데이트: ${session.name}`)

        // 6. 데이터베이스 업데이트
        const { error: updateError } = await supabase
          .from("saju_sessions")
          .update({
            saju: completeSajuData,
            daeun: daeunResult,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id)

        if (updateError) {
          console.error(`[v0] 세션 ${session.id} 업데이트 실패:`, updateError)
          errorCount++
        } else {
          console.log(`[v0] 세션 ${session.id} (${session.name}) 업데이트 완료`)
          successCount++
        }

        // 과부하 방지를 위한 짧은 대기
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[v0] 세션 ${session.id} 처리 중 오류:`, error)
        errorCount++
      }
    }

    console.log(`[v0] 업데이트 완료: 성공 ${successCount}개, 실패 ${errorCount}개`)
  } catch (error) {
    console.error("[v0] 스크립트 실행 중 오류:", error)
  }
}

// 스크립트 실행
updateSajuSessions()
  .then(() => {
    console.log("[v0] 사주 세션 업데이트 스크립트 완료")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[v0] 스크립트 실행 실패:", error)
    process.exit(1)
  })
