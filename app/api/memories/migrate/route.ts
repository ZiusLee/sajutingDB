import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
// import { getCurrentUser } from '@/lib/auth-utils'; // Ensure this gives the newly authenticated user's ID

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  // Replace with your actual logic to get the authenticated user's ID
  // This should be the ID of the user who just logged in/signed up.
  const userId = req.headers.get("x-user-id")
  return userId
}

interface MigratePayload {
  session_id: string
}

export async function POST(req: NextRequest) {
  try {
    const newUserId = await getAuthenticatedUserId(req)
    if (!newUserId) {
      return NextResponse.json({ error: "User must be authenticated to migrate memories" }, { status: 401 })
    }

    const body = (await req.json()) as MigratePayload
    const { session_id } = body

    if (!session_id) {
      return NextResponse.json({ error: "Session ID is required for migration" }, { status: 400 })
    }

    const result = await query(
      `UPDATE memory_bank
       SET user_id = $1, session_id = NULL, updated_at = NOW()
       WHERE session_id = $2 AND user_id IS NULL
       RETURNING id`,
      [newUserId, session_id],
    )

    return NextResponse.json({
      message: "Memories migrated successfully",
      migrated_count: result.rowCount,
      migrated_ids: result.rows.map((r) => r.id),
    })
  } catch (error) {
    console.error("Error migrating memories:", error)
    return NextResponse.json({ error: "Failed to migrate memories" }, { status: 500 })
  }
}
