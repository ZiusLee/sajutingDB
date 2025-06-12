import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { enhancedMemoryService } from "@/lib/memory-service-enhanced"

// GET - Get memory analytics for user
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
    const days = Number.parseInt(searchParams.get("days") || "30")

    // 로그인한 사용자의 auth.users.id
    const authUserId = user.id

    // 메모리 서비스를 통해 분석 데이터 가져오기
    const analytics = await enhancedMemoryService.getMemoryAnalytics(authUserId, days)

    if (!analytics) {
      return NextResponse.json({ error: "No data found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      analytics,
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Error in memory analytics GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
