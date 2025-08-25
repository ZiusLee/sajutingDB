import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function getKoreanDate(): string {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000) // UTC + 9 hours
  return koreanTime.toISOString().split("T")[0]
}

export async function GET(request: NextRequest) {
  // Only allow in development or with admin auth
  const isDev = process.env.NODE_ENV === "development"
  const authHeader = request.headers.get("authorization")
  const adminSecret = process.env.ADMIN_SECRET || "test-admin-secret"

  if (!isDev && authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
  }

  console.log("[Test Daily Charge] Manual test started")

  try {
    const koreanToday = getKoreanDate()

    // Check current state of user_coins table with more detailed info
    const { data: sampleUsers, error: sampleError } = await supabase
      .from("user_coins")
      .select("user_id, subscription_coins, bonus_coins, subscription_plan, last_daily_charge, created_at")
      .limit(10)

    if (sampleError) {
      console.error("[Test Daily Charge] Error fetching sample users:", sampleError)
    }

    const { data: eligibleUsers, error: eligibleError } = await supabase
      .from("user_coins")
      .select("user_id, subscription_coins, bonus_coins, subscription_plan, last_daily_charge")
      .or(`last_daily_charge.is.null,last_daily_charge.neq.${koreanToday}`)
      .limit(5)

    if (eligibleError) {
      console.error("[Test Daily Charge] Error fetching eligible users:", eligibleError)
    }

    // Check recent cron executions
    const { data: recentExecutions, error: execError } = await supabase
      .from("cron_executions")
      .select("*")
      .eq("job_name", "daily-subscription")
      .order("execution_time", { ascending: false })
      .limit(5)

    if (execError) {
      console.error("[Test Daily Charge] Error fetching executions:", execError)
    }

    // Test the actual cron endpoint
    const baseUrl = request.nextUrl.origin
    const cronUrl = `${baseUrl}/api/cron/daily-subscription?manual=true`

    console.log("[Test Daily Charge] Calling cron endpoint:", cronUrl)

    const cronResponse = await fetch(cronUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const cronResult = await cronResponse.json()

    return NextResponse.json({
      success: true,
      message: "Manual test completed",
      data: {
        koreanDate: koreanToday,
        utcDate: new Date().toISOString().split("T")[0],
        sampleUsers: sampleUsers || [],
        eligibleUsers: eligibleUsers || [],
        recentExecutions: recentExecutions || [],
        cronResponse: {
          status: cronResponse.status,
          result: cronResult,
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasCronSecret: !!process.env.CRON_SECRET,
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      },
    })
  } catch (error) {
    console.error("[Test Daily Charge] Error in manual test:", error)
    return NextResponse.json(
      {
        error: "Test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
