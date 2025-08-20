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

    // Server-Sent Events 응답 설정
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { data: sessions, error: selectError } = await supabase
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
            .not("birth_info", "is", null)

          if (selectError) {
            throw selectError
          }

          const stats = {
            total: sessions?.length || 0,
            processed: 0,
            updated: 0,
            errors: 0,
          }

          // 초기 통계 전송
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stats })}\n\n`))

          if (!sessions || sessions.length === 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "complete",
                  stats,
                  message: "업데이트할 세션이 없습니다.",
                })}\n\n`,
              ),
            )
            controller.close()
            return
          }

          // 각 세션 처리
          for (const session of sessions) {
            try {
              const birthInfo = Array.isArray(session.birth_info) ? session.birth_info[0] : session.birth_info
              if (!birthInfo) {
                console.log(`[v0] 세션 ${session.id}: birth_info가 없음`)
                stats.errors++
                stats.processed++
                continue
              }

              const gender = session.gender || "female"
              console.log(`[v0] 세션 ${session.id}: gender = ${gender}`)

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
                // time_unknown이 true면 12시 0분으로 설정
                solarHour = 12
                solarMinute = 0
              } else {
                // time_unknown이 false인데 null인 경우 0으로 처리
                solarHour = Number(birthInfo.solar_hour) || 0
                solarMinute = Number(birthInfo.solar_minute) || 0
              }

              // 데이터 유효성 검사
              if (
                !solarYear ||
                solarYear < 1900 ||
                solarYear > 2100 ||
                !solarMonth ||
                solarMonth < 1 ||
                solarMonth > 12 ||
                !solarDay ||
                solarDay < 1 ||
                solarDay > 31 ||
                !lunarYear ||
                !lunarMonth ||
                !lunarDay
              ) {
                console.log(`[v0] 세션 ${session.id}: 잘못된 생년월일 데이터`, {
                  solarYear,
                  solarMonth,
                  solarDay,
                  lunarYear,
                  lunarMonth,
                  lunarDay,
                })
                stats.errors++
                stats.processed++
                continue
              }

              console.log(`[v0] 세션 ${session.id} 처리 시작:`, {
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
              })

              const updateData: any = {}

              try {
                const birthCityId = birthInfo.birth_city_id || DEFAULT_CITY_ID
                const cityData = getCityById(birthCityId)
                const timeStandard: TimeStandard = cityData?.timeStandard || birthInfo.time_standard || "동경135도"
                console.log(`[v0] 세션 ${session.id}: 시간 표준 = ${timeStandard}`)

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
                  "", // name
                  timeUnknown,
                  isLeapMonth,
                  undefined, // apiMonthStem
                  undefined, // apiMonthBranch
                  timeStandard,
                )

                if (!newSajuResult || !newSajuResult.yearStem) {
                  console.log(`[v0] 세션 ${session.id}: 사주 계산 실패`)
                  stats.errors++
                  stats.processed++
                  continue
                }

                console.log(`[v0] 세션 ${session.id}: 사주 계산 완료`, {
                  yearStem: newSajuResult.yearStem,
                  monthStem: newSajuResult.monthStem,
                  dayStem: newSajuResult.dayStem,
                  hourStem: newSajuResult.hourStem,
                })

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

                console.log(`[v0] 세션 ${session.id}: 대운 계산 완료`, {
                  direction: newDaeunResult?.direction,
                  pillarsCount: newDaeunResult?.pillars?.length,
                })

                updateData.saju = newSajuResult
                if (newDaeunResult) {
                  updateData.daeun = newDaeunResult
                }

                console.log(`[v0] 세션 ${session.id}: 업데이트 데이터 준비 완료`)
              } catch (calculationError) {
                console.error(`[v0] 세션 ${session.id}: 계산 오류:`, calculationError)
                stats.errors++
                stats.processed++
                continue
              }

              const { error: updateError } = await supabase
                .from("saju_sessions")
                .update(updateData)
                .eq("id", session.id)

              if (updateError) {
                throw updateError
              }

              stats.updated++
              console.log(`[v0] 세션 ${session.id}: 업데이트 완료`, {
                updatedSaju: !!updateData.saju,
                updatedDaeun: !!updateData.daeun,
              })

              stats.processed++

              // 진행 상황 전송 (5개마다)
              if (stats.processed % 5 === 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "progress", stats })}\n\n`))
              }
            } catch (error) {
              console.error(`[v0] 세션 ${session.id} 업데이트 오류:`, error)
              stats.errors++
              stats.processed++
            }
          }

          // 완료 메시지 전송
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                stats,
                message: `업데이트 완료: ${stats.updated}개 세션 업데이트, ${stats.errors}개 오류`,
              })}\n\n`,
            ),
          )
        } catch (error) {
          console.error("[v0] 사주 데이터 업데이트 오류:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: `업데이트 중 오류가 발생했습니다: ${error.message}`,
              })}\n\n`,
            ),
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] 사주 데이터 업데이트 오류:", error)
    return NextResponse.json({ error: "업데이트 중 오류가 발생했습니다." }, { status: 500 })
  }
}
