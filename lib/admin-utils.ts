import { createClient } from "@supabase/supabase-js"

// 서비스 롤 키를 사용하여 Supabase 클라이언트 생성
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
)

// 관리자 이메일 목록
const ADMIN_EMAILS = ["yoonslee@utexas.edu"]

// 사용자 ID가 관리자인지 확인
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.from("users").select("email").eq("id", userId).single()

    if (error || !data) {
      console.error("관리자 확인 오류:", error)
      return false
    }

    return ADMIN_EMAILS.includes(data.email)
  } catch (error) {
    console.error("관리자 확인 중 오류 발생:", error)
    return false
  }
}

// 이메일로 사용자 ID 찾기
export async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    // 서비스 롤 키를 사용하여 사용자 조회
    const { data, error } = await supabaseAdmin.from("users").select("id").eq("email", email).single()

    if (error || !data) {
      console.error("사용자 ID 조회 오류:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("사용자 ID 조회 중 오류 발생:", error)
    return null
  }
}

// 클라이언트에서 관리자 확인 (API 호출)
export async function checkAdminStatus(): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/check-admin")
    const data = await response.json()
    return data.isAdmin
  } catch (error) {
    console.error("관리자 상태 확인 중 오류 발생:", error)
    return false
  }
}
