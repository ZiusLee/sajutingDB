import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("🔍 Smart Memory GET - Request received")
  console.log("🔍 Request headers:", Object.fromEntries(request.headers.entries()))
  console.log("🔍 Request URL:", request.url)
  console.log("🔍 Request method:", request.method)

  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log(
      "🔍 All cookies:",
      allCookies.map((c) => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
    )

    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    })

    console.log("🔍 Supabase client created, attempting to get user...")

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("🔍 Smart Memory GET - Auth result:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      authErrorCode: authError?.status,
    })

    if (authError || !user) {
      console.log("❌ Smart Memory GET - Unauthorized:", {
        authError: authError?.message,
        hasUser: !!user,
        cookieCount: allCookies.length,
        origin: request.headers.get("origin"),
        referer: request.headers.get("referer"),
      })

      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError?.message,
          debug: {
            hasUser: !!user,
            cookieCount: allCookies.length,
            authErrorCode: authError?.status,
          },
        },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        },
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    console.log("🔍 Querying smart_contexts for user:", user.id, "search:", search)

    let query = supabase
      .from("smart_contexts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (search) {
      query = query.or(`content.ilike.%${search}%,keywords.ilike.%${search}%`)
    }

    const { data: memories, error } = await query

    console.log("🔍 Query result:", {
      memoriesCount: memories?.length || 0,
      error: error?.message,
      errorCode: error?.code,
    })

    if (error) {
      console.error("❌ 메모리 조회 오류:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch memories",
          details: error.message,
          debug: {
            errorCode: error.code,
            userId: user.id,
          },
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    console.log("✅ Smart Memory GET - Success:", memories?.length, "memories found")
    return NextResponse.json(
      { memories },
      {
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  } catch (error) {
    console.error("❌ Smart Memory GET - API 오류:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("🔍 Smart Memory POST - Request received")

  try {
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log(
      "🔍 POST cookies:",
      allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("🔍 Smart Memory POST - Auth result:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    })

    if (authError || !user) {
      console.log("❌ Smart Memory POST - Unauthorized:", { authError, hasUser: !!user })
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    const body = await request.json()
    console.log("🔍 Smart Memory POST - Body:", body)

    const { content, type, keywords, importance, is_pinned } = body

    if (!content || !type) {
      return NextResponse.json(
        { error: "Content and type are required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    console.log("🔍 Inserting memory into smart_contexts...")

    const { data, error } = await supabase
      .from("smart_contexts")
      .insert({
        user_id: user.id,
        content,
        type,
        keywords: keywords || [],
        importance: importance || 1,
        is_pinned: is_pinned || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ 메모리 저장 오류:", error)
      return NextResponse.json(
        {
          error: "Failed to save memory",
          details: error.message,
          debug: {
            errorCode: error.code,
            userId: user.id,
          },
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    console.log("✅ Smart Memory POST - Success:", data)
    return NextResponse.json(
      { memory: data },
      {
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  } catch (error) {
    console.error("❌ Smart Memory POST - API 오류:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
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
      console.error("❌ 메모리 업데이트 오류:", error)
      return NextResponse.json(
        { error: "Failed to update memory", details: error.message },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    return NextResponse.json(
      { memory: data },
      {
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  } catch (error) {
    console.error("❌ Smart Memory PUT - API 오류:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore,
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message },
        {
          status: 401,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const deleteAll = searchParams.get("deleteAll") === "true"

    if (deleteAll) {
      const { error } = await supabase.from("smart_contexts").delete().eq("user_id", user.id)

      if (error) {
        console.error("❌ 전체 메모리 삭제 오류:", error)
        return NextResponse.json(
          { error: "Failed to delete all memories", details: error.message },
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Credentials": "true",
              "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
            },
          },
        )
      }

      return NextResponse.json(
        { success: true },
        {
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: "Memory ID is required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    const { error } = await supabase.from("smart_contexts").delete().eq("id", id).eq("user_id", user.id)

    if (error) {
      console.error("❌ 메모리 삭제 오류:", error)
      return NextResponse.json(
        { error: "Failed to delete memory", details: error.message },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
          },
        },
      )
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  } catch (error) {
    console.error("❌ Smart Memory DELETE - API 오류:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
        },
      },
    )
  }
}

// OPTIONS 메서드 추가 (CORS preflight 요청 처리)
export async function OPTIONS(request: NextRequest) {
  console.log("🔍 Smart Memory OPTIONS - CORS preflight request")
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": request.headers.get("origin") || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  })
}
