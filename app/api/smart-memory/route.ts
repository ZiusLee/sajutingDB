import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query = supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`content.ilike.%${search}%,keywords.ilike.%${search}%`)
    }

    const { data: memories, error } = await query

    if (error) {
      console.error("메모리 조회 오류:", error)
      return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 })
    }

    return NextResponse.json({ memories })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, content, type, keywords, importance, is_pinned } = await request.json()

    const { data, error } = await supabase
      .from("smart_contexts")
      .update({
        content,
        type,
        keywords,
        importance,
        is_pinned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("메모리 업데이트 오류:", error)
      return NextResponse.json({ error: "Failed to update memory" }, { status: 500 })
    }

    return NextResponse.json({ memory: data })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const deleteAll = searchParams.get("deleteAll") === "true"

    if (deleteAll) {
      const { error } = await supabase.from("smart_contexts").delete().eq("user_id", user.id)

      if (error) {
        console.error("전체 메모리 삭제 오류:", error)
        return NextResponse.json({ error: "Failed to delete all memories" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("smart_contexts").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("메모리 삭제 오류:", error)
      return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
