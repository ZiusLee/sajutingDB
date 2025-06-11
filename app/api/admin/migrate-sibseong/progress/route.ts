import { isAdmin } from "@/lib/admin-utils"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// 마이그레이션 상태를 저장할 전역 변수 (start/route.ts와 공유)
const migrationState = {
  isRunning: false,
  totalCount: 0,
  processedCount: 0,
  error: null as string | null,
  isCompleted: false,
}

export async function GET() {
  try {
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

    return NextResponse.json({
      isRunning: migrationState.isRunning,
      total: migrationState.totalCount,
      processed: migrationState.processedCount,
      error: migrationState.error,
      isCompleted: migrationState.isCompleted,
    })
  } catch (error) {
    console.error("진행 상황 조회 오류:", error)
    return NextResponse.json(
      { error: `진행 상황 조회 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 },
    )
  }
}
