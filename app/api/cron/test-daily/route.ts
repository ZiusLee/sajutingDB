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
  const isDev = process.env.NODE_ENV === "development"
  const authHeader = request.headers.get("authorization")
  const adminSecret = process.env.ADMIN_SECRET || "test-admin-secret"
  const cronSecret = process.env.CRON_SECRET

  if (!isDev && authHeader !== `Bearer ${adminSecret}` && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
  }

  console.log("[Test Daily Charge] Manual test started")

  try {
    const koreanToday = getKoreanDate()

    // Check current state of user_coins table with more detailed info
    const { data: sampleUsers, error: sampleError } = await supabase
      .from("user_coins")
      .select(
        "user_id, subscription_coins, bonus_coins, subscription_plan, subscription_end_date, last_daily_charge, scheduled_plan_change, created_at",
      )
      .limit(10)

    if (sampleError) {
      console.error("[Test Daily Charge] Error fetching sample users:", sampleError)
    }

    const { data: eligibleUsers, error: eligibleError } = await supabase
      .from("user_coins")
      .select("user_id, subscription_coins, bonus_coins, subscription_plan, subscription_end_date, last_daily_charge")
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

    const { data: dbFunctions, error: funcError } = await supabase
      .rpc("execute_scheduled_plan_changes")
      .then(() => ({ exists: true, error: null }))
      .catch((err) => ({ exists: false, error: err.message }))

    const { data: scheduledTest, error: scheduledTestError } = await supabase.rpc("execute_scheduled_plan_changes")
    const { data: expiredTest, error: expiredTestError } = await supabase.rpc("handle_expired_subscriptions")

    // Test the actual cron endpoint
    const baseUrl = request.nextUrl.origin
    const cronUrl = `${baseUrl}/api/cron/daily-subscription?manual=true`

    console.log("[Test Daily Charge] Calling cron endpoint:", cronUrl)

    const cronResponse = await fetch(cronUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader || `Bearer ${adminSecret}`,
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
        databaseFunctions: {
          scheduledChanges: {
            exists: !scheduledTestError,
            result: scheduledTest?.length || 0,
            error: scheduledTestError?.message,
          },
          expiredSubscriptions: {
            exists: !expiredTestError,
            result: expiredTest?.length || 0,
            error: expiredTestError?.message,
          },
        },
        cronResponse: {
          status: cronResponse.status,
          result: cronResult,
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasCronSecret: !!process.env.CRON_SECRET,
          hasAdminSecret: !!process.env.ADMIN_SECRET,
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
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
