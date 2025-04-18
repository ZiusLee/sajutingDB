import type { NextRequest } from "next/server"
import { verify } from "jsonwebtoken"

// JWT 시크릿 키 (실제 프로덕션에서는 환경 변수로 관리)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// 요청에서 사용자 ID 추출
export async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  try {
    // 쿠키에서 토큰 추출
    const token = req.cookies.get("auth_token")?.value

    if (!token) {
      return null
    }

    // 토큰 검증
    const decoded = verify(token, JWT_SECRET) as { userId: number }

    return decoded.userId
  } catch (error) {
    console.error("토큰 검증 오류:", error)
    return null
  }
}

// 클라이언트 측 인증 상태 확인
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("user_authenticated") === "true"
}

// 클라이언트 측 사용자 ID 가져오기
export function getUserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("user_id") || localStorage.getItem("user_token")
}

// 클라이언트 측 사용자 이름 가져오기
export function getUserName(): string {
  if (typeof window === "undefined") return "사용자"
  return localStorage.getItem("user_name") || "사용자"
}

// 클라이언트 측 사용자 이메일 가져오기
export function getUserEmail(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("user_email")
}

// 사주 프로필 저장
export function saveSajuProfile(profile: any): void {
  if (typeof window === "undefined") return

  try {
    // 기존 프로필 불러오기
    const profilesStr = localStorage.getItem("saju_profiles")
    const profiles = profilesStr ? JSON.parse(profilesStr) : []

    // 고유 ID 생성
    const newProfile = {
      ...profile,
      id: `profile_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    // 프로필 추가 및 저장
    profiles.push(newProfile)
    localStorage.setItem("saju_profiles", JSON.stringify(profiles))

    // 인증된 사용자인 경우 사용자 ID와 연결
    if (isAuthenticated()) {
      const userId = getUserId()
      if (userId) {
        localStorage.setItem(`user_profiles_${userId}`, JSON.stringify(profiles))
      }
    }
  } catch (error) {
    console.error("사주 프로필 저장 오류:", error)
  }
}

// 사주 프로필 불러오기
export function loadSajuProfiles(): any[] {
  if (typeof window === "undefined") return []

  try {
    // 인증된 사용자인 경우 사용자별 프로필 불러오기
    if (isAuthenticated()) {
      const userId = getUserId()
      if (userId) {
        const userProfilesStr = localStorage.getItem(`user_profiles_${userId}`)
        if (userProfilesStr) {
          return JSON.parse(userProfilesStr)
        }
      }
    }

    // 기본 프로필 불러오기
    const profilesStr = localStorage.getItem("saju_profiles")
    return profilesStr ? JSON.parse(profilesStr) : []
  } catch (error) {
    console.error("사주 프로필 불러오기 오류:", error)
    return []
  }
}
