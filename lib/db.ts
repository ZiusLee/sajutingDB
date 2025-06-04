import { Pool, type PoolClient } from "pg"

// 데이터베이스 연결 설정
const connectionString = process.env.POSTGRES_URL

if (!connectionString) {
  console.error("POSTGRES_URL is not defined in environment variables")
  throw new Error("POSTGRES_URL is not defined")
}

// 데이터베이스 연결 풀 생성
const db = new Pool({
  connectionString,
})

// 쿼리 실행 함수
async function query(text: string, params: any[] = []) {
  try {
    const result = await db.query(text, params)
    return result
  } catch (error) {
    console.error("쿼리 실행 오류:", error)
    throw error
  }
}

// 트랜잭션 실행 함수
async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

export { query, db, withTransaction }
