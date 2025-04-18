import { db } from "./db"
import bcrypt from "bcryptjs"

// 사용자 타입 정의
export type User = {
  id: string
  email: string
  name: string
  password?: string
  auth_user_id?: string // Add this new field
  createdAt?: Date
  updatedAt?: Date
}

// 사용자 생성 함수
export async function createUser({
  email,
  password,
  name,
  auth_user_id,
}: {
  email: string
  password: string
  name: string
  auth_user_id?: string
}): Promise<User> {
  try {
    //비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10)

    // 데이터베이스에 사용자 생성 (include auth_user_id)
    const result = await db.query(
      `INSERT INTO users (email, password, name, auth_user_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, auth_user_id, created_at, updated_at`,
      [email, hashedPassword, name, auth_user_id],
    )

    const user = result.rows[0]

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      auth_user_id: user.auth_user_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }
  } catch (error) {
    console.error("사용자 생성 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 임시 사용자 반환
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 사용자 생성")
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

// 이메일로 사용자 조회 함수
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await db.query(`SELECT * FROM users WHERE email = $1`, [email])

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.password,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      auth_user_id: user.auth_user_id,
    }
  } catch (error) {
    console.error("사용자 조회 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 null 반환
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 사용자 조회")
      // 테스트 계정만 확인
      if (email === "test@example.com") {
        return {
          id: "temp-test-user",
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

// 사용자 인증 함수
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByEmail(email)

    if (!user || !user.password) {
      return null
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return null
    }

    // 비밀번호 필드 제거 후 반환
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  } catch (error) {
    console.error("사용자 인증 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 임시 인증
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 사용자 인증")
      // 테스트 계정만 인증
      if (email === "test@example.com" && password === "password123") {
        return {
          id: "temp-test-user",
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

// ID로 사용자 조회 함수
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await db.query(`SELECT * FROM users WHERE id = $1`, [id])

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]

    // 비밀번호 필드 제거 후 반환
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      auth_user_id: user.auth_user_id,
    }
  } catch (error) {
    console.error("사용자 조회 오류:", error)

    // 임시 구현: 데이터베이스 연결 실패 시 임시 사용자 반환
    // 실제 환경에서는 이 부분을 제거하고 오류를 throw해야 함
    if (process.env.NODE_ENV === "development") {
      console.warn("개발 환경에서 임시 사용자 조회")
      // 테스트 ID만 반환
      if (id === "temp-test-user") {
        return {
          id: "temp-test-user",
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
