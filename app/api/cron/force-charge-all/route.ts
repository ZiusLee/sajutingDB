import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function getKoreanDate(): string {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split("T")[0]
}

function getKoreanDateTime(): string {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString()
}

export async function POST(request: NextRequest) {
  // Admin only endpoint
  const authHeader = request.headers.get("authorization")
  const adminSecret = process.env.ADMIN_SECRET || "admin-secret"

  if (authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 })
  }

  const koreanToday = getKoreanDate()
  const koreanNow = getKoreanDateTime()

  console.log("[Force Charge] Starting force charge for all users...")

  try {
    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from("user_coins")
      .select("user_id, coins, subscription_plan, last_daily_charge")

    if (usersError) {
      console.error("[Force Charge] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    console.log(`[Force Charge] Found ${allUsers?.length || 0} total users`)

    const freeUsers =
      allUsers?.filter((user) => {
        const isFreeUser =
          !user.subscription_plan ||
          user.subscription_plan === "free" ||
          user.subscription_plan === "" ||
          user.subscription_plan === null
        return isFreeUser
      }) || []

    const subscriptionUsers =
      allUsers?.filter((user) => {
        return (
          user.subscription_plan &&
          user.subscription_plan !== "free" &&
          user.subscription_plan !== "" &&
          user.subscription_plan !== null
        )
      }) || []

    console.log(
      `[Force Charge] Processing ${freeUsers.length} free users and ${subscriptionUsers.length} subscription users...`,
    )

    let successCount = 0
    let errorCount = 0
    const processedUsers = []

    // Update all free users to have 3 coins
    for (const user of freeUsers) {
      try {
        const { error: updateError } = await supabase
          .from("user_coins")
          .update({
            coins: 3, // Set to 3 coins (daily allowance)
            last_daily_charge: koreanToday,
            updated_at: koreanNow,
          })
          .eq("user_id", user.user_id)

        if (updateError) {
          console.error(`[Force Charge] Error updating free user ${user.user_id}:`, updateError)
          errorCount++
        } else {
          processedUsers.push({ user_id: user.user_id, type: "free", coins_set: 3 })
          successCount++
        }
      } catch (error) {
        console.error(`[Force Charge] Error processing free user ${user.user_id}:`, error)
        errorCount++
      }
    }

    for (const user of subscriptionUsers) {
      try {
        let dailyCoins = 10 // Default for starter

        switch (user.subscription_plan) {
          case "starter":
            dailyCoins = 10
            break
          case "plus":
            dailyCoins = 30
            break
          case "pro":
            dailyCoins = 100
            break
          default:
            dailyCoins = 10
        }

        const { error: updateError } = await supabase
          .from("user_coins")
          .update({
            coins: (user.coins || 0) + dailyCoins,
            last_daily_charge: koreanToday,
            updated_at: koreanNow,
          })
          .eq("user_id", user.user_id)

        if (updateError) {
          console.error(`[Force Charge] Error updating subscription user ${user.user_id}:`, updateError)
          errorCount++
        } else {
          processedUsers.push({
            user_id: user.user_id,
            type: "subscription",
            plan: user.subscription_plan,
            coins_added: dailyCoins,
            previous_coins: user.coins || 0,
            new_coins: (user.coins || 0) + dailyCoins,
          })
          successCount++
        }
      } catch (error) {
        console.error(`[Force Charge] Error processing subscription user ${user.user_id}:`, error)
        errorCount++
      }
    }

    // Log the execution
    await supabase.from("cron_executions").insert({
      job_name: "force-charge-all",
      execution_date: koreanToday,
      execution_time: koreanNow,
      success_count: successCount,
      error_count: errorCount,
      total_users: allUsers?.length || 0,
      free_users: freeUsers.length,
      subscription_users: subscriptionUsers.length,
      status: errorCount === 0 ? "completed" : "completed_with_errors",
      details: {
        type: "force_charge",
        processedSample: processedUsers.slice(0, 10),
        koreanTime: koreanNow,
        utcTime: new Date().toISOString(),
      },
    })

    console.log(`[Force Charge] Completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: "Force charge completed",
      statistics: {
        totalUsers: allUsers?.length || 0,
        freeUsers: freeUsers.length,
        subscriptionUsers: subscriptionUsers.length,
        successfulCharges: successCount,
        errors: errorCount,
        koreanDate: koreanToday,
        processedSample: processedUsers.slice(0, 5),
      },
    })
  } catch (error) {
    console.error("[Force Charge] Fatal error:", error)
    return NextResponse.json(
      {
        error: "Force charge failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
