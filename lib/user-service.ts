import { getSupabase } from "./supabase-client"

// Update type definition to SajuSession
export type SajuSession = {
  id: string
  email: string
  name: string
  password?: string
  auth_user_id?: string
  createdAt?: Date
  updatedAt?: Date
}

// Update function to create a session instead of a user
export async function createSajuSession({
  email,
  password,
  name,
  auth_user_id,
}: {
  email: string
  password: string
  name: string
  auth_user_id?: string
}): Promise<SajuSession> {
  try {
    const supabase = getSupabase()

    // Supabase 클라이언트를 사용하여 데이터 삽입
    const { data, error } = await supabase
      .from("saju_sessions")
      .insert([
        {
          email,
          name,
          auth_user_id,
          gender: "unknown",
          relationship_status: "solo",
          is_beta_applicant: false,
          privacy_consent: true,
          is_default: false,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase 삽입 오류:", error)
      throw error
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      auth_user_id: data.auth_user_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (error) {
    console.error("사주 세션 생성 오류 - 상세 정보:")
    console.error("- Error message:", error?.message)
    console.error("- Error code:", error?.code)
    console.error("- Error detail:", error?.detail)
    console.error("- Full error:", JSON.stringify(error, null, 2))

    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 세션 생성")
      return {
        id: "temp-" + Date.now(),
        email,
        name,
        auth_user_id,
      }
    }

    throw error
  }
}

// Update function to get session by email
export async function getSajuSessionByEmail(email: string): Promise<SajuSession | null> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.from("saju_sessions").select("*").eq("email", email).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null
      }
      throw error
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      auth_user_id: data.auth_user_id,
    }
  } catch (error) {
    console.error("사주 세션 조회 오류:", error)

    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 세션 조회")
      if (email === "test@example.com") {
        return {
          id: "temp-test-session",
          email: "test@example.com",
          name: "테스트 사용자",
          auth_user_id: "test-auth-id",
        }
      }
      return null
    }

    throw error
  }
}

// Update function to authenticate session
export async function authenticateSession(email: string, password: string): Promise<SajuSession | null> {
  // Supabase Auth를 사용하므로 여기서는 세션 정보만 반환
  return await getSajuSessionByEmail(email)
}

// Update function to get session by ID
export async function getSajuSessionById(id: string): Promise<SajuSession | null> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.from("saju_sessions").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return null
      }
      throw error
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      auth_user_id: data.auth_user_id,
    }
  } catch (error) {
    console.error("사주 세션 조회 오류:", error)

    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 세션 조회")
      if (id === "temp-test-session") {
        return {
          id: "temp-test-session",
          email: "test@example.com",
          name: "테스트 사용자",
          auth_user_id: "test-auth-id",
        }
      }
      return null
    }

    throw error
  }
}

export async function getUserById(id: string): Promise<SajuSession | null> {
  return await getSajuSessionById(id)
}
