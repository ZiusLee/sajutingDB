import { neon } from "@neondatabase/serverless"
import { calculateSaju } from "../lib/saju"
import { calculateDaeunInfo } from "../lib/daeun-calculator"

const sql = neon(process.env.DATABASE_URL!)

async function updateMissingSajuData() {
  console.log("[v0] Starting safe update of missing saju data...")

  try {
    // saju 또는 daeun이 null이거나 비어있는 세션들만 조회
    const sessionsToUpdate = await sql`
      SELECT id, user_id, birth_info, saju, daeun, name
      FROM saju_sessions 
      WHERE saju IS NULL 
         OR daeun IS NULL 
         OR saju = '{}'::jsonb 
         OR daeun = '{}'::jsonb
         OR jsonb_typeof(saju) = 'null'
         OR jsonb_typeof(daeun) = 'null'
      ORDER BY created_at ASC
    `

    console.log(`[v0] Found ${sessionsToUpdate.length} sessions with missing data`)

    if (sessionsToUpdate.length === 0) {
      console.log("[v0] No sessions need updating")
      return
    }

    let updatedCount = 0
    let errorCount = 0

    for (const session of sessionsToUpdate) {
      try {
        console.log(`[v0] Processing session ${session.id} for user ${session.user_id}`)

        // birth_info에서 생년월일 정보 추출
        const birthInfo = session.birth_info
        if (!birthInfo || !birthInfo.year || !birthInfo.month || !birthInfo.day) {
          console.log(`[v0] Skipping session ${session.id} - missing birth info`)
          errorCount++
          continue
        }

        // 사주 계산 (saju가 없는 경우만)
        let sajuData = session.saju
        if (!sajuData || sajuData === null || Object.keys(sajuData).length === 0) {
          console.log(`[v0] Calculating saju for session ${session.id}`)
          sajuData = calculateSaju(
            birthInfo.year,
            birthInfo.month,
            birthInfo.day,
            birthInfo.hour || 12,
            birthInfo.minute || 0,
            birthInfo.isLunar || false,
            birthInfo.gender || "male",
          )
        }

        // 대운 계산 (daeun이 없는 경우만)
        let daeunData = session.daeun
        if (!daeunData || daeunData === null || Object.keys(daeunData).length === 0) {
          console.log(`[v0] Calculating daeun for session ${session.id}`)
          daeunData = calculateDaeunInfo(
            birthInfo.year,
            birthInfo.month,
            birthInfo.day,
            birthInfo.hour || 12,
            birthInfo.minute || 0,
            birthInfo.isLunar || false,
            birthInfo.gender || "male",
          )
        }

        // 데이터베이스 업데이트
        await sql`
          UPDATE saju_sessions 
          SET 
            saju = ${JSON.stringify(sajuData)},
            daeun = ${JSON.stringify(daeunData)},
            updated_at = NOW()
          WHERE id = ${session.id}
        `

        updatedCount++
        console.log(`[v0] Successfully updated session ${session.id}`)
      } catch (error) {
        console.error(`[v0] Error updating session ${session.id}:`, error)
        errorCount++
      }
    }

    console.log(`[v0] Update completed: ${updatedCount} sessions updated, ${errorCount} errors`)

    // 업데이트 결과 확인
    const verificationResult = await sql`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN saju IS NOT NULL AND saju != '{}'::jsonb THEN 1 END) as sessions_with_saju,
        COUNT(CASE WHEN daeun IS NOT NULL AND daeun != '{}'::jsonb THEN 1 END) as sessions_with_daeun
      FROM saju_sessions
    `

    console.log("[v0] Verification results:", verificationResult[0])
  } catch (error) {
    console.error("[v0] Fatal error during update:", error)
    throw error
  }
}

// 스크립트 실행
updateMissingSajuData()
  .then(() => {
    console.log("[v0] Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[v0] Script failed:", error)
    process.exit(1)
  })
