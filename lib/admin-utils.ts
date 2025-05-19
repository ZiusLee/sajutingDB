import { createClient } from "@supabase/supabase-js"

// 관리자 이메일 목록
const ADMIN_EMAILS = ["yoonslee@utexas.edu"]

// 관리자 권한 확인 함수 (클라이언트 또는 서버에서 사용 가능)
export async function isAdmin(userId: string): Promise<boolean> {
  // 클라이언트 측에서 호출된 경우
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/admin/check-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) return false

      const data = await response.json()
      return data.isAdmin
    } catch (error) {
      console.error("관리자 권한 확인 오류:", error)
      return false
    }
  }
  // 서버 측에서 호출된 경우
  else {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    // 서비스 롤 키로 Supabase 클라이언트 생성 (관리자 권한)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
      // 사용자 정보 조회
      const { data: user, error } = await supabase.from("users").select("email").eq("id", userId).single()

      if (error || !user) {
        console.error("사용자 정보 조회 오류:", error)
        return false
      }

      // 관리자 이메일 목록에 포함되어 있는지 확인
      return ADMIN_EMAILS.includes(user.email)
    } catch (error) {
      console.error("관리자 권한 확인 오류:", error)
      return false
    }
  }
}

// 이메일로 사용자 ID 찾기
export async function getUserIdByEmail(email: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  // 서비스 롤 키로 Supabase 클라이언트 생성 (관리자 권한)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 이메일로 사용자 조회
    const { data, error } = await supabase.from("auth.users").select("id").eq("email", email).single()

    if (error || !data) {
      console.error("이메일로 사용자 조회 오류:", error)
      return null
    }

    return data.id
  } catch (error) {
    console.error("이메일로 사용자 조회 오류:", error)
    return null
  }
}
