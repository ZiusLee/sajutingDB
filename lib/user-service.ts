import { db } from "./db"
import bcrypt from "bcryptjs"

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
    //비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update table name from users to saju_sessions
    const result = await db.query(
      `INSERT INTO saju_sessions (email, password, name, auth_user_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, auth_user_id, created_at, updated_at`,
      [email, hashedPassword, name, auth_user_id],
    )

    const session = result.rows[0]

    return {
      id: session.id,
      email: session.email,
      name: session.name,
      auth_user_id: session.auth_user_id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    }
  } catch (error) {
    console.error("사주 세션 생성 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 임시 세션 반환
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
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
    // Update table name from users to saju_sessions
    const result = await db.query(`SELECT * FROM saju_sessions WHERE email = $1`, [email])

    if (result.rows.length === 0) {
      return null
    }

    const session = result.rows[0]

    return {
      id: session.id,
      email: session.email,
      name: session.name,
      password: session.password,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      auth_user_id: session.auth_user_id,
    }
  } catch (error) {
    console.error("사주 세션 조회 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 null 반환
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 세션 조회")
      // 테스트 계정만 확인
      if (email === "test@example.com") {
        return {
          id: "temp-test-session",
          email: "test@example.com",
          name: "테스트 사용자",
          password: "$2a$10$XQCg1z4YSl5K1fZqufz8aO5x.xBWO7uVCUDP.xvFxe9HCCpx5rIFy", // "password123"의 해시
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
  try {
    const session = await getSajuSessionByEmail(email)

    if (!session || !session.password) {
      return null
    }

    const passwordMatch = await bcrypt.compare(password, session.password)

    if (!passwordMatch) {
      return null
    }

    // 비밀번호 필드 제거 후 반환
    const { password: _, ...sessionWithoutPassword } = session
    return sessionWithoutPassword
  } catch (error) {
    console.error("사주 세션 인증 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 임시 인증
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 세션 인증")
      // 테스트 계정만 인증
      if (email === "test@example.com" && password === "password123") {
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

// Update function to get session by ID
export async function getSajuSessionById(id: string): Promise<SajuSession | null> {
  try {
    // Update table name from users to saju_sessions
    const result = await db.query(`SELECT * FROM saju_sessions WHERE id = $1`, [id])

    if (result.rows.length === 0) {
      return null
    }

    const session = result.rows[0]

    // 비밀번호 필드 제거 후 반환
    return {
      id: session.id,
      email: session.email,
      name: session.name,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      auth_user_id: session.auth_user_id,
    }
  } catch (error) {
    console.error("사주 세션 조회 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 임시 세션 반환
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 세션 조회")
      // 테스트 ID만 반환
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
  try {
    const result = await db.query(`SELECT * FROM saju_sessions WHERE id = $1`, [id])

    if (result.rows.length === 0) {
      return null
    }

    const session = result.rows[0]

    // 비밀번호 필드 제거 후 반환
    return {
      id: session.id,
      email: session.email,
      name: session.name,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      auth_user_id: session.auth_user_id,
    }
  } catch (error) {
    console.error("사주 세션 조회 오류:", error)
    return null
  }
}
