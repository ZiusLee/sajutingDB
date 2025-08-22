import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const isManualTest = request.nextUrl.searchParams.get("manual") === "true"

  console.log("[Daily Charge] Cron job triggered", {
    hasAuthHeader: !!authHeader,
    hasCronSecret: !!cronSecret,
    isManualTest,
    timestamp: new Date().toISOString(),
  })

  // Allow manual testing in development or with special parameter
  if (!isManualTest && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[Daily Charge] Unauthorized access attempt", {
      authHeader: authHeader ? "present" : "missing",
      cronSecret: cronSecret ? "present" : "missing",
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[Daily Charge] Starting daily subscription charge process...")

  const today = new Date().toISOString().split("T")[0]
  const now = new Date().toISOString()

  try {
    console.log("[Daily Charge] Fetching users who haven't been charged today:", today)

    const { data: allUsers, error: usersError } = await supabase
      .from("user_coins")
      .select(`
        user_id,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        last_daily_charge,
        subscription_coins,
        purchased_coins
      `)
      .neq("last_daily_charge", today)

    if (usersError) {
      console.error("[Daily Charge] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users", details: usersError }, { status: 500 })
    }

    console.log(`[Daily Charge] Total users found: ${allUsers?.length || 0}`)

    const freeUsers = allUsers?.filter((user) => !user.subscription_plan || user.subscription_plan === "free") || []
    const subscriptionUsers =
      allUsers?.filter(
        (user) =>
          user.subscription_plan &&
          user.subscription_plan !== "free" &&
          user.subscription_end_date &&
          new Date(user.subscription_end_date) >= new Date(),
      ) || []

    console.log(
      `[Daily Charge] Found ${freeUsers.length} free users and ${subscriptionUsers.length} subscription users to charge`,
    )

    if (freeUsers.length > 0) {
      console.log(
        "[Daily Charge] Sample free users:",
        freeUsers.slice(0, 3).map((u) => ({
          user_id: u.user_id,
          subscription_plan: u.subscription_plan,
          last_daily_charge: u.last_daily_charge,
          current_coins: u.subscription_coins,
        })),
      )
    }

    let successCount = 0
    let errorCount = 0
    const processedUsers = []

    for (const user of freeUsers) {
      try {
        const dailyCoins = 3 // Free plan gets 3 coins daily

        console.log(`[Daily Charge] Processing free user ${user.user_id}, current coins: ${user.subscription_coins}`)

        const { data: updateResult, error: updateError } = await supabase
          .from("user_coins")
          .update({
            subscription_coins: supabase.raw(`subscription_coins + ${dailyCoins}`),
            last_daily_charge: today,
            updated_at: now,
          })
          .eq("user_id", user.user_id)
          .select()

        if (updateError) {
          console.error(`[Daily Charge] Error updating coins for free user ${user.user_id}:`, updateError)
          errorCount++
          continue
        }

        console.log(
          `[Daily Charge] Successfully charged ${dailyCoins} coins to free user ${user.user_id}`,
          updateResult,
        )
        processedUsers.push({
          user_id: user.user_id,
          type: "free",
          coins_added: dailyCoins,
          status: "success",
        })
        successCount++
      } catch (userError) {
        console.error(`[Daily Charge] Error processing free user ${user.user_id}:`, userError)
        processedUsers.push({
          user_id: user.user_id,
          type: "free",
          coins_added: 0,
          status: "error",
          error: userError instanceof Error ? userError.message : "Unknown error",
        })
        errorCount++
      }
    }

    for (const user of subscriptionUsers) {
      try {
        // Get payment order for this subscription user
        const { data: paymentOrder, error: paymentError } = await supabase
          .from("payment_orders")
          .select("daily_coins, subscription_status")
          .eq("user_id", user.user_id)
          .eq("subscription_status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (paymentError || !paymentOrder) {
          console.warn(`[Daily Charge] No active payment order found for user ${user.user_id}`)
          continue
        }

        const dailyCoins = paymentOrder.daily_coins

        console.log(
          `[Daily Charge] Processing subscription user ${user.user_id}, current coins: ${user.subscription_coins}`,
        )

        const { data: updateResult, error: updateError } = await supabase
          .from("user_coins")
          .update({
            subscription_coins: supabase.raw(`subscription_coins + ${dailyCoins}`),
            last_daily_charge: today,
            updated_at: now,
          })
          .eq("user_id", user.user_id)
          .select()

        if (updateError) {
          console.error(`[Daily Charge] Error updating coins for subscription user ${user.user_id}:`, updateError)
          errorCount++
          continue
        }

        // Record the charge
        await supabase.from("subscription_charges").insert({
          user_id: user.user_id,
          charge_date: today,
          coins_added: dailyCoins,
          status: "completed",
        })

        console.log(
          `[Daily Charge] Successfully charged ${dailyCoins} coins to subscription user ${user.user_id}`,
          updateResult,
        )
        processedUsers.push({
          user_id: user.user_id,
          type: "subscription",
          coins_added: dailyCoins,
          status: "success",
        })
        successCount++
      } catch (userError) {
        console.error(`[Daily Charge] Error processing subscription user ${user.user_id}:`, userError)
        processedUsers.push({
          user_id: user.user_id,
          type: "subscription",
          coins_added: 0,
          status: "error",
          error: userError instanceof Error ? userError.message : "Unknown error",
        })
        errorCount++
      }
    }

    console.log("[Daily Charge] Daily subscription charge process completed")

    try {
      await supabase.from("cron_executions").insert({
        job_name: "daily-subscription",
        execution_date: today,
        execution_time: now,
        success_count: successCount,
        error_count: errorCount,
        total_users: allUsers?.length || 0,
        free_users: freeUsers.length,
        subscription_users: subscriptionUsers.length,
        status: errorCount === 0 ? "completed" : "completed_with_errors",
        details: { processedUsers: processedUsers.slice(0, 10) }, // Store sample for debugging
      })
    } catch (logError) {
      console.error("[Daily Charge] Failed to log execution:", logError)
    }

    return NextResponse.json({
      success: true,
      message: "Daily subscription charge completed",
      statistics: {
        totalUsers: allUsers?.length || 0,
        freeUsers: freeUsers.length,
        subscriptionUsers: subscriptionUsers.length,
        successfulCharges: successCount,
        errors: errorCount,
        date: today,
        executionTime: now,
        processedSample: processedUsers.slice(0, 5),
      },
    })
  } catch (error) {
    console.error("[Daily Charge] Fatal error in daily charge process:", error)

    try {
      await supabase.from("cron_executions").insert({
        job_name: "daily-subscription",
        execution_date: today,
        execution_time: now,
        success_count: 0,
        error_count: 1,
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
    } catch (logError) {
      console.error("[Daily Charge] Failed to log error:", logError)
    }

    return NextResponse.json(
      {
        error: "Fatal error in daily charge process",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: now,
      },
      { status: 500 },
    )
  }
}
