import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { enhancedMemoryService } from "@/lib/memory-service-enhanced"

// GET - Get memory entries
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate") || undefined
    const endDate = searchParams.get("endDate") || undefined
    const category = searchParams.get("category") || undefined
    const search = searchParams.get("search") || undefined
    const tags = searchParams.get("tags") ? searchParams.get("tags")?.split(",") : undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 50
    const offset = searchParams.get("offset") ? Number.parseInt(searchParams.get("offset") as string) : 0

    // 로그인한 사용자의 auth.users.id
    const authUserId = user.id

    // 메모리 서비스를 통해 엔트리 가져오기
    const entries = await enhancedMemoryService.getMemoryEntries(authUserId, {
      startDate,
      endDate,
      category,
      tags,
      search,
      limit,
      offset,
    })

    return NextResponse.json({
      success: true,
      entries,
      count: entries.length,
    })
  } catch (error) {
    console.error("Error in memory entries GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create memory entry
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, emotionalState, tags, category, sessionId, entryType, visibility } = body

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // 유효성 검사
    const validEntryTypes = ["manual", "ai_generated", "session_summary", "insight_summary"]
    if (entryType && !validEntryTypes.includes(entryType)) {
      return NextResponse.json({ error: "Invalid entry type" }, { status: 400 })
    }

    const validVisibility = ["private", "shared", "public"]
    if (visibility && !validVisibility.includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 })
    }

    // 로그인한 사용자의 auth.users.id
    const authUserId = user.id

    // 메모리 서비스를 통해 엔트리 생성
    const entry = await enhancedMemoryService.createMemoryEntry({
      userId: authUserId,
      sessionId,
      title,
      content,
      emotionalState,
      tags,
      category,
      entryType: entryType || "manual",
      visibility: visibility || "private",
    })

    if (!entry) {
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      entry,
    })
  } catch (error) {
    console.error("Error in memory entries POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
