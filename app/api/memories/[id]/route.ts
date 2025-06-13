import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import type { MemoryContent, MemoryType } from "@/lib/memory-types"
// import { getCurrentUser } from '@/lib/auth-utils';

async function getAuthIdentifiers(req: NextRequest) {
  const userId = req.headers.get("x-user-id")
  return { userId: userId || null }
}

interface UpdateMemoryPayload {
  type?: MemoryType
  content?: MemoryContent
  tags?: string[]
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { userId } = await getAuthIdentifiers(req)
    // For GET, we might allow fetching by ID if it's public or if user owns it.
    // Add ownership check if necessary: AND (user_id = $2 OR session_id = $2_for_session)
    const result = await query("SELECT * FROM memory_bank WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }
    // Add authorization check: ensure the user (or session) owns this memory
    const memory = result.rows[0]
    if (userId && memory.user_id !== userId) {
      // If there's a user, they must own it.
      // If no userId, it could be an anonymous session, need session_id check.
      // This logic needs to be robust based on your auth.
    }

    return NextResponse.json(memory)
  } catch (error) {
    console.error("Error fetching memory:", error)
    return NextResponse.json({ error: "Failed to fetch memory" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { userId } = await getAuthIdentifiers(req)
    if (!userId) {
      return NextResponse.json({ error: "Authentication required for update" }, { status: 401 })
    }

    const body = (await req.json()) as UpdateMemoryPayload

    const setClauses = []
    const values = []
    let queryIndex = 1

    if (body.type) {
      setClauses.push(`type = $${queryIndex++}`)
      values.push(body.type)
    }
    if (body.content) {
      setClauses.push(`content = $${queryIndex++}`)
      values.push(body.content)
    }
    if (body.tags) {
      setClauses.push(`tags = $${queryIndex++}`)
      values.push(body.tags)
    }
    setClauses.push(`updated_at = NOW()`)

    if (setClauses.length === 1) {
      // only updated_at
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(id) // for WHERE id = $N
    values.push(userId) // for WHERE user_id = $N+1 (ownership check)

    const result = await query(
      `UPDATE memory_bank SET ${setClauses.join(", ")}
       WHERE id = $${queryIndex++} AND user_id = $${queryIndex++}
       RETURNING *`,
      values,
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Memory not found or not authorized" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error updating memory:", error)
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { userId } = await getAuthIdentifiers(req)
    if (!userId) {
      // Or check session_id for anonymous users if they can delete
      return NextResponse.json({ error: "Authentication required for delete" }, { status: 401 })
    }

    // Add ownership check: AND user_id = $2 (or session_id for anonymous)
    const result = await query("DELETE FROM memory_bank WHERE id = $1 AND user_id = $2 RETURNING *", [id, userId])

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Memory not found or not authorized" }, { status: 404 })
    }

    return NextResponse.json({ message: "Memory deleted successfully" })
  } catch (error) {
    console.error("Error deleting memory:", error)
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 })
  }
}
