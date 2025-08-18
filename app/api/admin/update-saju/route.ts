import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { calculateSaju } from "@/lib/saju"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"

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
                time_unknown,
                time_standard
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
              const solarHour = Number(birthInfo.solar_hour) || 12
              const solarMinute = Number(birthInfo.solar_minute) || 0

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
                solarDay > 31
              ) {
                console.log(`[v0] 세션 ${session.id}: 잘못된 생년월일 데이터`, {
                  solarYear,
                  solarMonth,
                  solarDay,
                })
                stats.errors++
                stats.processed++
                continue
              }

              console.log(`[v0] 세션 ${session.id} 처리 시작:`, {
                solarYear,
                solarMonth,
                solarDay,
                solarHour,
                solarMinute,
              })

              let needsUpdate = false
              const updateData: any = {}

              const hasSibseongInfo =
                session.saju &&
                typeof session.saju === "object" &&
                session.saju.yearStemSibseong &&
                session.saju.monthStemSibseong &&
                session.saju.dayStemSibseong &&
                session.saju.hourStemSibseong &&
                session.saju.yearBranchSibseong &&
                session.saju.monthBranchSibseong &&
                session.saju.dayBranchSibseong &&
                session.saju.hourBranchSibseong

              const needsSajuUpdate =
                !session.saju ||
                session.saju === null ||
                (typeof session.saju === "object" && Object.keys(session.saju).length === 0) ||
                (session.saju && typeof session.saju === "object" && "daeun" in session.saju) ||
                (session.saju && typeof session.saju === "object" && !session.saju.yearStem) ||
                !hasSibseongInfo // 십성 정보가 불완전한 경우 추가

              if (needsSajuUpdate) {
                console.log(`[v0] 세션 ${session.id}: 사주 업데이트 필요 - 십성 정보 확인:`, {
                  hasSaju: !!session.saju,
                  hasYearStem: !!(session.saju && session.saju.yearStem),
                  hasSibseongInfo: hasSibseongInfo,
                })

                try {
                  const sajuResult = calculateSaju(
                    solarYear, // lunarYear (양력 연도 사용)
                    solarMonth, // lunarMonth
                    solarDay, // lunarDay
                    solarHour, // hour
                    solarMinute, // minute
                    solarYear, // solarYear
                    solarMonth, // solarMonth
                    solarDay, // solarDay
                    gender, // 실제 gender 값 사용
                    "", // name
                    birthInfo.time_unknown || false, // timeUnknown
                    false, // isLeapMonth
                    undefined, // apiMonthStem
                    undefined, // apiMonthBranch
                    birthInfo.time_standard || "동경135도", // timeStandard
                  )

                  if (sajuResult && sajuResult.yearStem) {
                    updateData.saju = sajuResult
                    needsUpdate = true
                    console.log(`[v0] 세션 ${session.id}: 사주 계산 성공`, {
                      yearStem: sajuResult.yearStem,
                      dayStem: sajuResult.dayStem,
                    })
                  } else {
                    console.log(`[v0] 세션 ${session.id}: 사주 계산 실패 - yearStem이 없음`)
                    stats.errors++
                    stats.processed++
                    continue
                  }
                } catch (sajuError) {
                  console.error(`[v0] 세션 ${session.id}: 사주 계산 오류:`, sajuError)
                  stats.errors++
                  stats.processed++
                  continue
                }
              }

              const needsDaeunUpdate =
                !session.daeun ||
                session.daeun === null ||
                (typeof session.daeun === "object" && Object.keys(session.daeun).length === 0)

              if (needsDaeunUpdate) {
                try {
                  const sajuForDaeun = updateData.saju || session.saju
                  if (!sajuForDaeun || !sajuForDaeun.yearStem) {
                    console.log(`[v0] 세션 ${session.id}: 대운 계산을 위한 사주 데이터가 없음`)
                    stats.processed++
                    continue
                  }

                  const daeunResult = calculateDaeunInfo(
                    sajuForDaeun, // saju 객체
                    solarYear, // birthYear
                    solarMonth, // birthMonth
                    solarDay, // birthDay
                    gender, // gender
                    solarHour, // birthHour
                    solarMinute, // birthMinute
                    birthInfo.time_unknown || false, // timeUnknown
                  )

                  if (daeunResult) {
                    updateData.daeun = daeunResult
                    needsUpdate = true
                    console.log(`[v0] 세션 ${session.id}: 대운 계산 성공`, {
                      direction: daeunResult.direction,
                      pillarsCount: daeunResult.pillars?.length || 0,
                    })
                  }
                } catch (daeunError) {
                  console.error(`[v0] 세션 ${session.id}: 대운 계산 오류:`, daeunError)
                  // 대운 계산 실패는 전체 업데이트를 중단하지 않음
                }
              }

              // 업데이트 실행
              if (needsUpdate) {
                const { error: updateError } = await supabase
                  .from("saju_sessions")
                  .update(updateData)
                  .eq("id", session.id)

                if (updateError) {
                  throw updateError
                }

                stats.updated++
                console.log(`[v0] 세션 ${session.id}: 업데이트 완료`)
              }

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
