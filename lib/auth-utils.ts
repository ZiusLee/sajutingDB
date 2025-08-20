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

// 사주 프로필 저장 - 사용자별로 분리
export function saveSajuProfile(profile: any): void {
  if (typeof window === "undefined") return

  try {
    const userId = getUserId()
    const isAuth = isAuthenticated()

    // 고유 ID 생성
    const newProfile = {
      ...profile,
      id: `profile_${Date.now()}`,
      createdAt: new Date().toISOString(),
      userId: isAuth ? userId : null, // 사용자 ID 추가
    }

    if (isAuth && userId) {
      // 인증된 사용자의 경우 사용자별로 저장
      const userProfilesStr = localStorage.getItem(`user_profiles_${userId}`)
      const userProfiles = userProfilesStr ? JSON.parse(userProfilesStr) : []
      userProfiles.push(newProfile)
      localStorage.setItem(`user_profiles_${userId}`, JSON.stringify(userProfiles))
    } else {
      // 비인증 사용자의 경우 기본 저장소 사용
      const profilesStr = localStorage.getItem("saju_profiles")
      const profiles = profilesStr ? JSON.parse(profilesStr) : []
      profiles.push(newProfile)
      localStorage.setItem("saju_profiles", JSON.stringify(profiles))
    }
  } catch (error) {
    console.error("사주 프로필 저장 오류:", error)
  }
}

// 사주 프로필 불러오기 - 현재 사용자의 데이터만
export function loadSajuProfiles(): any[] {
  if (typeof window === "undefined") return []

  try {
    const userId = getUserId()
    const isAuth = isAuthenticated()

    if (isAuth && userId) {
      // 인증된 사용자의 경우 해당 사용자의 프로필만 불러오기
      const userProfilesStr = localStorage.getItem(`user_profiles_${userId}`)
      return userProfilesStr ? JSON.parse(userProfilesStr) : []
    } else {
      // 비인증 사용자의 경우 기본 프로필 불러오기
      const profilesStr = localStorage.getItem("saju_profiles")
      return profilesStr ? JSON.parse(profilesStr) : []
    }
  } catch (error) {
    console.error("사주 프로필 불러오기 오류:", error)
    return []
  }
}

// 현재 사용자의 모든 데이터 삭제 (로그아웃 시 사용)
export function clearCurrentUserData(): void {
  if (typeof window === "undefined") return

  try {
    const userId = getUserId()

    // 사용자별 데이터 삭제
    if (userId) {
      localStorage.removeItem(`user_profiles_${userId}`)
    }

    // 공통 사주 관련 데이터 삭제
    localStorage.removeItem("current_saju")
    localStorage.removeItem("tempSajuData")
    localStorage.removeItem("saju_session_id")
    localStorage.removeItem("last_chat_saju_data")
    localStorage.removeItem("chat_return_path")
    localStorage.removeItem("saved_partners")
    localStorage.removeItem("saju_profiles")

    console.log("Current user data cleared from localStorage")
  } catch (error) {
    console.error("사용자 데이터 삭제 오류:", error)
  }
}

// Link anonymous user data to authenticated user
export async function linkAnonymousDataToAuthUser(anonymousUserId: string, authUserId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/link-user-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anonymousUserId,
        authUserId,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to link user data")
    }

    const result = await response.json()
    return result.success
  } catch (error) {
    console.error("Error linking user data:", error)
    return false
  }
}
