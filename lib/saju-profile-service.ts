import { query } from "./db"

export interface SajuProfile {
  id: number
  userId: number
  name: string
  gender: string
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number | null
  birthMinute: number | null
  isLunar: boolean
  createdAt: Date
}

export interface SajuProfileInput {
  userId: string
  name: string
  gender: string
  birthYear: string
  birthMonth: string
  birthDay: string
  birthHour: string | null
  birthMinute: string | null
  isLunar: boolean
}

// 사주 프로필 생성
export async function createSajuProfile(profileData: SajuProfileInput): Promise<SajuProfile> {
  const { userId, name, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, isLunar } = profileData

  const result = await query(
    "INSERT INTO saju_profiles (user_id, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, is_lunar) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [userId, name, gender, birthYear, birthMonth, birthDay, birthHour || null, birthMinute || null, isLunar],
  )

  return result.rows[0]
}

// 사용자 ID로 사주 프로필 목록 조회
export async function getSajuProfilesByUserId(userId: string): Promise<SajuProfile[]> {
  const result = await query("SELECT * FROM saju_profiles WHERE user_id = $1 ORDER BY created_at DESC", [userId])

  return result.rows
}
