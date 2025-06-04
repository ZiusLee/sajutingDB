/**
 * 사주 정보 저장 및 관리를 위한 유틸리티 함수들
 */

// 사주 프로필 타입 정의
export interface SajuProfile {
  id: string
  name: string
  gender: string
  birthYear: string
  birthMonth: string
  birthDay: string
  birthHour: string
  birthMinute: string
  timeUnknown: boolean
  createdAt: string
  lunarYear?: string
  lunarMonth?: string
  lunarDay?: string
  saju: {
    yearStem: string
    yearBranch: string
    monthStem: string
    monthBranch: string
    dayStem: string
    dayBranch: string
    hourStem: string
    hourBranch: string
    elements?: {
      wood: number
      fire: number
      earth: number
      metal: number
      water: number
    }
    [key: string]: any
  }
  [key: string]: any
}

// 로컬 스토리지 키 상수
const STORAGE_KEYS = {
  MAIN_SAJU_PROFILE: "main_saju_profile",
  RECENT_SAJU_PROFILE: "recent_saju_profile",
  RECENT_SAJU_PROFILES: "recent_saju_profiles",
  LAST_UPDATED: "last_updated_saju",
}

/**
 * 대표 사주 프로필을 로컬 스토리지에 저장
 */
export function saveMainSajuProfile(profile: SajuProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MAIN_SAJU_PROFILE, JSON.stringify(profile))
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString())
    console.log("대표 사주 프로필이 저장되었습니다:", profile.name)
  } catch (error) {
    console.error("대표 사주 프로필 저장 중 오류 발생:", error)
  }
}

/**
 * 최근 본 사주 프로필을 로컬 스토리지에 저장
 */
export function saveRecentSajuProfile(profile: SajuProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECENT_SAJU_PROFILE, JSON.stringify(profile))

    // 최근 본 사주 목록에도 추가
    const recentProfiles = getRecentSajuProfiles()

    // 이미 같은 ID의 프로필이 있으면 제거
    const filteredProfiles = recentProfiles.filter((p) => p.id !== profile.id)

    // 최근 본 프로필을 맨 앞에 추가
    filteredProfiles.unshift(profile)

    // 최대 5개까지만 저장
    const limitedProfiles = filteredProfiles.slice(0, 5)

    localStorage.setItem(STORAGE_KEYS.RECENT_SAJU_PROFILES, JSON.stringify(limitedProfiles))
    localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString())

    console.log("최근 본 사주 프로필이 저장되었습니다:", profile.name)
  } catch (error) {
    console.error("최근 본 사주 프로필 저장 중 오류 발생:", error)
  }
}

/**
 * 로컬 스토리지에서 대표 사주 프로필 가져오기
 */
export function getMainSajuProfile(): SajuProfile | null {
  try {
    const profileStr = localStorage.getItem(STORAGE_KEYS.MAIN_SAJU_PROFILE)
    if (!profileStr) return null

    return JSON.parse(profileStr) as SajuProfile
  } catch (error) {
    console.error("대표 사주 프로필 로드 중 오류 발생:", error)
    return null
  }
}

/**
 * 로컬 스토리지에서 최근 본 사주 프로필 가져오기
 */
export function getRecentSajuProfile(): SajuProfile | null {
  try {
    const profileStr = localStorage.getItem(STORAGE_KEYS.RECENT_SAJU_PROFILE)
    if (!profileStr) return null

    return JSON.parse(profileStr) as SajuProfile
  } catch (error) {
    console.error("최근 본 사주 프로필 로드 중 오류 발생:", error)
    return null
  }
}

/**
 * 로컬 스토리지에서 최근 본 사주 프로필 목록 가져오기
 */
export function getRecentSajuProfiles(): SajuProfile[] {
  try {
    const profilesStr = localStorage.getItem(STORAGE_KEYS.RECENT_SAJU_PROFILES)
    if (!profilesStr) return []

    return JSON.parse(profilesStr) as SajuProfile[]
  } catch (error) {
    console.error("최근 본 사주 프로필 목록 로드 중 오류 발생:", error)
    return []
  }
}

/**
 * 사용 가능한 사주 프로필 가져오기 (우선순위: 대표 사주 > 최근 본 사주)
 */
export function getAvailableSajuProfile(): SajuProfile | null {
  // 1. 대표 사주 확인
  const mainProfile = getMainSajuProfile()
  if (mainProfile) return mainProfile

  // 2. 최근 본 사주 확인
  const recentProfile = getRecentSajuProfile()
  if (recentProfile) return recentProfile

  // 3. 최근 본 사주 목록에서 첫 번째 항목 확인
  const recentProfiles = getRecentSajuProfiles()
  if (recentProfiles.length > 0) return recentProfiles[0]

  // 사용 가능한 사주 없음
  return null
}

/**
 * 사주 프로필 삭제
 */
export function deleteSajuProfile(profileId: string): boolean {
  try {
    // 대표 사주 확인
    const mainProfile = getMainSajuProfile()
    if (mainProfile && mainProfile.id === profileId) {
      localStorage.removeItem(STORAGE_KEYS.MAIN_SAJU_PROFILE)
    }

    // 최근 본 사주 확인
    const recentProfile = getRecentSajuProfile()
    if (recentProfile && recentProfile.id === profileId) {
      localStorage.removeItem(STORAGE_KEYS.RECENT_SAJU_PROFILE)
    }

    // 최근 본 사주 목록에서 제거
    const recentProfiles = getRecentSajuProfiles()
    const filteredProfiles = recentProfiles.filter((p) => p.id !== profileId)
    localStorage.setItem(STORAGE_KEYS.RECENT_SAJU_PROFILES, JSON.stringify(filteredProfiles))

    return true
  } catch (error) {
    console.error("사주 프로필 삭제 중 오류 발생:", error)
    return false
  }
}
