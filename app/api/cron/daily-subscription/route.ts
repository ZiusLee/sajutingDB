import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[Daily Charge] Starting daily subscription charge process...")

  const today = new Date().toISOString().split("T")[0]

  try {
    // Get all active subscriptions that haven't been charged today
    const { data: activeSubscriptions, error } = await supabase
      .from("user_coins")
      .select(`
        user_id,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        last_daily_charge,
        payment_orders!inner(daily_coins, subscription_status)
      `)
      .not("subscription_plan", "is", null)
      .lt("subscription_end_date", new Date().toISOString())
      .neq("last_daily_charge", today)
      .eq("payment_orders.subscription_status", "active")

    if (error) {
      console.error("[Daily Charge] Error fetching subscriptions:", error)
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    console.log(`[Daily Charge] Found ${activeSubscriptions?.length || 0} subscriptions to charge`)

    let successCount = 0
    let errorCount = 0

    for (const subscription of activeSubscriptions || []) {
      try {
        const dailyCoins = subscription.payment_orders.daily_coins

        // Add daily coins to subscription_coins
        const { error: updateError } = await supabase
          .from("user_coins")
          .update({
            subscription_coins: supabase.raw(`subscription_coins + ${dailyCoins}`),
            last_daily_charge: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", subscription.user_id)

        if (updateError) {
          console.error(`[Daily Charge] Error updating coins for user ${subscription.user_id}:`, updateError)
          errorCount++
          continue
        }

        // Record the charge
        await supabase.from("subscription_charges").insert({
          user_id: subscription.user_id,
          subscription_order_id: subscription.payment_orders.id,
          charge_date: today,
          coins_added: dailyCoins,
          status: "completed",
        })

        console.log(`[Daily Charge] Successfully charged ${dailyCoins} coins to user ${subscription.user_id}`)
        successCount++
      } catch (userError) {
        console.error(`[Daily Charge] Error processing user ${subscription.user_id}:`, userError)
        errorCount++
      }
    }

    console.log("[Daily Charge] Daily subscription charge process completed")

    return NextResponse.json({
      success: true,
      message: "Daily subscription charge completed",
      statistics: {
        totalSubscriptions: activeSubscriptions?.length || 0,
        successfulCharges: successCount,
        errors: errorCount,
        date: today,
      },
    })
  } catch (error) {
    console.error("[Daily Charge] Fatal error in daily charge process:", error)
    return NextResponse.json(
      {
        error: "Fatal error in daily charge process",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
