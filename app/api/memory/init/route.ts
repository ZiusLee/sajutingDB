import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// POST - Initialize memory tables and functions
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if memory_entries table exists
    const { data: tableExists, error: tableError } = await supabaseClient.from("memory_entries").select("id").limit(1)

    if (tableError && tableError.code === "42P01") {
      // Table doesn't exist, need to create it
      return NextResponse.json(
        {
          error: "Memory tables not initialized",
          message: "Please run the memory table creation scripts first",
          needsInit: true,
        },
        { status: 400 },
      )
    }

    // Try to call the stats function to check if it exists
    try {
      await supabaseClient.rpc("get_user_memory_stats", {
        p_user_id: user.id,
      })
    } catch (error) {
      return NextResponse.json(
        {
          error: "Memory functions not initialized",
          message: "Please run the memory functions creation script",
          needsFunctions: true,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Memory system is properly initialized",
    })
  } catch (error) {
    console.error("Error checking memory initialization:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
