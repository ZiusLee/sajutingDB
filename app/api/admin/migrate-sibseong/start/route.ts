import { isAdmin } from "@/lib/admin-utils"
import { calculateSibseong } from "@/lib/saju"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// 마이그레이션 상태를 저장할 전역 변수
let migrationState = {
  isRunning: false,
  totalCount: 0,
  processedCount: 0,
  error: null as string | null,
  isCompleted: false,
}

export async function POST() {
  try {
    // 이미 실행 중인지 확인
    if (migrationState.isRunning) {
      return NextResponse.json({ error: "마이그레이션이 이미 실행 중입니다." }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 })
    }

    const isAdminUser = await isAdmin(session.user.id)

    if (!isAdminUser) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 })
    }

    // 1. 테이블 구조 변경 (ALTER TABLE)
    await supabase.rpc("add_sibseong_columns")

    // 2. 십성 데이터가 없는 사주 정보 조회
    const { data: sajuInfos, error: countError } = await supabase
      .from("saju_info")
      .select("id")
      .is("year_stem_sibseong", null)

    if (countError) {
      return NextResponse.json({ error: `사주 정보 조회 오류: ${countError.message}` }, { status: 500 })
    }

    const totalCount = sajuInfos?.length || 0

    // 마이그레이션 상태 초기화
    migrationState = {
      isRunning: true,
      totalCount,
      processedCount: 0,
      error: null,
      isCompleted: false,
    }

    // 비동기로 마이그레이션 실행
    processMigration(supabase)

    return NextResponse.json({
      message: "마이그레이션이 시작되었습니다.",
      totalCount,
    })
  } catch (error) {
    console.error("마이그레이션 시작 오류:", error)
    return NextResponse.json(
      { error: `마이그레이션 시작 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 },
    )
  }
}

// 비동기 마이그레이션 처리 함수
async function processMigration(supabase: any) {
  try {
    // 십성 데이터가 없는 사주 정보 조회
    const { data: sajuInfos, error: fetchError } = await supabase
      .from("saju_info")
      .select("*")
      .is("year_stem_sibseong", null)

    if (fetchError) {
      migrationState.error = `사주 정보 조회 오류: ${fetchError.message}`
      migrationState.isRunning = false
      return
    }

    // 배치 처리 (20개씩)
    const batchSize = 20
    for (let i = 0; i < sajuInfos.length; i += batchSize) {
      if (migrationState.error) break // 오류 발생 시 중단

      const batch = sajuInfos.slice(i, i + batchSize)

      for (const saju of batch) {
        try {
          // 십성 계산
          const sibseongData = calculateSibseong(saju)

          // 업데이트
          const { error: updateError } = await supabase.from("saju_info").update(sibseongData).eq("id", saju.id)

          if (updateError) {
            throw new Error(`사주 정보 업데이트 오류 (ID: ${saju.id}): ${updateError.message}`)
          }

          // 처리 카운트 증가
          migrationState.processedCount++
        } catch (err) {
          console.error(`사주 ID ${saju.id} 처리 오류:`, err)
          // 개별 오류는 기록하되 계속 진행
        }
      }

      // 잠시 대기 (서버 부하 방지)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // 마이그레이션 완료
    migrationState.isCompleted = true
    migrationState.isRunning = false
  } catch (error) {
    console.error("마이그레이션 처리 오류:", error)
    migrationState.error = error instanceof Error ? error.message : "알 수 없는 오류"
    migrationState.isRunning = false
  }
}
