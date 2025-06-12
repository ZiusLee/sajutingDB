import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// GET - Retrieve memory entries
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const tags = searchParams.get("tags")?.split(",")
    const category = searchParams.get("category")
    const searchQuery = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = supabaseClient
      .from("memory_entries")
      .select(`
        *,
        memory_saju_links (
          saju_session_id,
          relevance_score,
          link_type
        )
      `)
      .order("entry_date", { ascending: false })
      .order("entry_time", { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by user (authenticated users only see their own)
    if (user) {
      query = query.eq("user_id", user.id)
    } else {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Date range filter
    if (startDate) query = query.gte("entry_date", startDate)
    if (endDate) query = query.lte("entry_date", endDate)

    // Category filter
    if (category) query = query.eq("category", category)

    // Tags filter
    if (tags && tags.length > 0) {
      query = query.overlaps("tags", tags)
    }

    // Full-text search
    if (searchQuery) {
      query = query.textSearch("search_vector", searchQuery, {
        type: "websearch",
        config: "korean",
      })
    }

    const { data: entries, error } = await query

    if (error) {
      console.error("Error fetching memory entries:", error)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error("Error in memory entries GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new memory entry
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    const body = await request.json()
    const {
      title,
      content,
      entryDate,
      entryTime,
      emotionalState,
      entryType = "manual",
      contextData = {},
      tags = [],
      category,
      sessionId,
      isPrivate = true,
      visibility = "private",
    } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Validate entry_type
    const validEntryTypes = ["manual", "ai_generated", "session_summary", "insight_summary"]
    if (!validEntryTypes.includes(entryType)) {
      return NextResponse.json({ error: "Invalid entry type" }, { status: 400 })
    }

    // Validate visibility
    const validVisibilities = ["private", "shared", "public"]
    if (!validVisibilities.includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 })
    }

    // Create memory entry
    const { data: entry, error: entryError } = await supabaseClient
      .from("memory_entries")
      .insert({
        user_id: user?.id || null,
        session_id: sessionId || null,
        title,
        content,
        entry_date: entryDate || new Date().toISOString().split("T")[0],
        entry_time: entryTime || new Date().toTimeString().split(" ")[0],
        emotional_state: emotionalState || {},
        entry_type: entryType,
        context_data: contextData,
        tags,
        category,
        is_private: isPrivate,
        visibility,
        ai_processed: false,
        ai_insights: {},
      })
      .select()
      .single()

    if (entryError) {
      console.error("Error creating memory entry:", entryError)
      return NextResponse.json({ error: "Failed to create entry" }, { status: 500 })
    }

    // Link to saju session if provided
    if (sessionId && entry) {
      await supabaseClient.from("memory_saju_links").insert({
        memory_id: entry.id,
        saju_session_id: sessionId,
        relevance_score: 0.8, // High relevance for manual links
        link_type: "manual",
        ai_confidence: 1.0, // Manual links have 100% confidence
      })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error("Error in memory entries POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
