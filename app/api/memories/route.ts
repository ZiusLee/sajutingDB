import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { MemoryType, MemoryContent } from "@/lib/memory-types"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

async function getUserId() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error("Supabase auth error:", error)
      return null
    }

    return user?.id || null
  } catch (error) {
    console.error("Error getting user ID:", error)
    return null
  }
}

interface CreateMemoryPayload {
  session_id?: string // For anonymous users
  type: MemoryType
  content: MemoryContent
  tags?: string[]
}

// Helper to get user_id or session_id
async function getAuthIdentifiers(req: NextRequest) {
  // const user = await getCurrentUser(req); // Implement this based on your auth system (e.g., Supabase)
  // For now, let's assume user_id might come from a header or a session cookie
  // And session_id might come from the client for anonymous users
  const userId = req.headers.get("x-user-id") // Example: get user_id if authenticated
  return { userId: userId || null }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuthIdentifiers(req)
    const body = (await req.json()) as CreateMemoryPayload

    if (!body.type || !body.content) {
      return NextResponse.json({ error: "Type and content are required" }, { status: 400 })
    }

    // If not authenticated, a session_id must be provided by the client for anonymous memories
    if (!userId && !body.session_id) {
      return NextResponse.json({ error: "User ID or Session ID is required" }, { status: 401 })
    }

    const sessionIdToSave = userId ? null : body.session_id

    const result = await query(
      `INSERT INTO memory_bank (user_id, session_id, type, content, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, sessionIdToSave, body.type, body.content, body.tags || null],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating memory:", error)
    return NextResponse.json({ error: "Failed to create memory" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId()
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("session_id")
    const type = searchParams.get("type") as MemoryType | null

    console.log("Memory API - userId:", userId, "sessionId:", sessionId)

    if (!userId && !sessionId) {
      return NextResponse.json({ error: "User ID or Session ID is required" }, { status: 401 })
    }

    const queryParams: any[] = []
    let queryString = "SELECT * FROM memory_bank WHERE "

    if (userId) {
      queryString += "user_id = $1"
      queryParams.push(userId)
    } else {
      queryString += "session_id = $1"
      queryParams.push(sessionId)
    }

    if (type) {
      queryString += ` AND type = $${queryParams.length + 1}`
      queryParams.push(type)
    }

    queryString += " ORDER BY created_at DESC"

    console.log("Executing query:", queryString, "with params:", queryParams)

    const result = await query(queryString, queryParams)

    console.log("Query result:", result.rows.length, "rows")

    // 결과가 없어도 빈 배열 반환
    return NextResponse.json(result.rows || [])
  } catch (error) {
    console.error("Error fetching memories:", error)
    // 에러 발생시에도 빈 배열 반환하여 프론트엔드가 정상 작동하도록
    return NextResponse.json([], { status: 200 })
  }
}
