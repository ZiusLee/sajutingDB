import { query } from "./db"

export interface SajuProfile {
  id: number
  user_id: number
  name: string
  gender: string
  birth_year: string
  birth_month: string
  birth_day: string
  birth_hour: string | null
  birth_minute: string | null
  lunar_calendar: boolean
  saju_data: any
  is_default: boolean
  created_at: Date
  updated_at: Date
}

export interface SajuProfileInput {
  user_id: number
  name: string
  gender: string
  birth_year: string
  birth_month: string
  birth_day: string
  birth_hour?: string
  birth_minute?: string
  lunar_calendar?: boolean
  saju_data: any
  is_default?: boolean
}

// 사주 프로필 생성
export async function createSajuProfile(profileData: SajuProfileInput): Promise<SajuProfile> {
  const {
    user_id,
    name,
    gender,
    birth_year,
    birth_month,
    birth_day,
    birth_hour,
    birth_minute,
    lunar_calendar = false,
    saju_data,
    is_default = false,
  } = profileData

  const result = await query(
    `INSERT INTO saju_profiles 
    (user_id, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_minute, lunar_calendar, saju_data, is_default) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
    RETURNING *`,
    [
      user_id,
      name,
      gender,
      birth_year,
      birth_month,
      birth_day,
      birth_hour,
      birth_minute,
      lunar_calendar,
      saju_data,
      is_default,
    ],
  )

  return result.rows[0]
}

// 사용자 ID로 사주 프로필 목록 조회
export async function getSajuProfilesByUserId(userId: number): Promise<SajuProfile[]> {
  const result = await query("SELECT * FROM saju_profiles WHERE user_id = $1 ORDER BY created_at DESC", [userId])

  return result.rows
}

// ID로 사주 프로필 조회
export async function getSajuProfileById(id: number): Promise<SajuProfile | null> {
  const result = await query("SELECT * FROM saju_profiles WHERE id = $1", [id])

  return result.rows.length > 0 ? result.rows[0] : null
}

// 사주 프로필 업데이트
export async function updateSajuProfile(
  id: number,
  profileData: Partial<SajuProfileInput>,
): Promise<SajuProfile | null> {
  const updates = []
  const values = []

  Object.entries(profileData).forEach(([key, value], index) => {
    if (value !== undefined) {
      updates.push(`${key} = $${index + 1}`)
      values.push(value)
    }
  })

  if (updates.length === 0) {
    return getSajuProfileById(id)
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)

  const result = await query(
    `UPDATE saju_profiles SET ${updates.join(", ")} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  )

  return result.rows.length > 0 ? result.rows[0] : null
}

// 사주 프로필 삭제
export async function deleteSajuProfile(id: number): Promise<boolean> {
  const result = await query("DELETE FROM saju_profiles WHERE id = $1 RETURNING id", [id])

  return result.rows.length > 0
}

// 사용자의 기본 사주 프로필 설정
export async function setDefaultSajuProfile(userId: number, profileId: number): Promise<boolean> {
  // 먼저 모든 프로필의 is_default를 false로 설정
  await query("UPDATE saju_profiles SET is_default = false WHERE user_id = $1", [userId])

  // 지정된 프로필을 기본값으로 설정
  const result = await query("UPDATE saju_profiles SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING id", [
    profileId,
    userId,
  ])

  return result.rows.length > 0
}
