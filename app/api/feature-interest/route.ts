import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getUserIdFromRequest } from "@/lib/auth-utils"

// 기능 관심도 카운터 API
export async function POST(req: NextRequest) {
  try {
    const { featureType } = await req.json()

    if (!featureType) {
      return NextResponse.json({ success: false, message: "기능 유형이 필요합니다." }, { status: 400 })
    }

    // 사용자 ID 가져오기 (로그인한 경우)
    const userId = await getUserIdFromRequest(req)

    // IP 주소 가져오기 (익명 사용자 구분용)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"

    // 기능 관심도 테이블이 없으면 생성
    await query(`
      CREATE TABLE IF NOT EXISTS feature_interest (
        id SERIAL PRIMARY KEY,
        feature_type VARCHAR(50) NOT NULL,
        user_id INTEGER,
        ip_address VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 관심도 기록
    await query(
      `INSERT INTO feature_interest (feature_type, user_id, ip_address) 
       VALUES ($1, $2, $3)`,
      [featureType, userId || null, ip],
    )

    // 해당 기능에 대한 총 관심도 카운트 (중복 제거)
    const result = await query(
      `SELECT COUNT(DISTINCT COALESCE(user_id::text, ip_address)) as interest_count 
       FROM feature_interest 
       WHERE feature_type = $1`,
      [featureType],
    )

    const interestCount = result.rows[0]?.interest_count || 0

    return NextResponse.json({
      success: true,
      interestCount,
    })
  } catch (error) {
    console.error("기능 관심도 기록 오류:", error)
    return NextResponse.json({ success: false, message: "관심도 기록 중 오류가 발생했습니다." }, { status: 500 })
  }
}

// 기능별 관심도 통계 조회
export async function GET(req: NextRequest) {
  try {
    // 관리자 권한 확인 (실제 구현에서는 적절한 인증 로직 추가)
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "인증이 필요합니다." }, { status: 401 })
    }

    // 기능별 관심도 통계 조회 (중복 제거)
    const result = await query(
      `SELECT 
         feature_type, 
         COUNT(DISTINCT COALESCE(user_id::text, ip_address)) as unique_users,
         COUNT(*) as total_clicks
       FROM feature_interest 
       GROUP BY feature_type
       ORDER BY unique_users DESC`,
    )

    return NextResponse.json({
      success: true,
      statistics: result.rows,
    })
  } catch (error) {
    console.error("기능 관심도 통계 조회 오류:", error)
    return NextResponse.json({ success: false, message: "통계 조회 중 오류가 발생했습니다." }, { status: 500 })
  }
}
