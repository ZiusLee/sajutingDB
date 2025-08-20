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
    const { data: allUsers, error: usersError } = await supabase
      .from("user_coins")
      .select(`
        user_id,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        last_daily_charge
      `)
      .neq("last_daily_charge", today)

    if (usersError) {
      console.error("[Daily Charge] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

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

    let successCount = 0
    let errorCount = 0

    for (const user of freeUsers) {
      try {
        const dailyCoins = 3 // Free plan gets 3 coins daily

        const { error: updateError } = await supabase
          .from("user_coins")
          .update({
            subscription_coins: supabase.raw(`subscription_coins + ${dailyCoins}`),
            last_daily_charge: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.user_id)

        if (updateError) {
          console.error(`[Daily Charge] Error updating coins for free user ${user.user_id}:`, updateError)
          errorCount++
          continue
        }

        console.log(`[Daily Charge] Successfully charged ${dailyCoins} coins to free user ${user.user_id}`)
        successCount++
      } catch (userError) {
        console.error(`[Daily Charge] Error processing free user ${user.user_id}:`, userError)
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

        const { error: updateError } = await supabase
          .from("user_coins")
          .update({
            subscription_coins: supabase.raw(`subscription_coins + ${dailyCoins}`),
            last_daily_charge: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.user_id)

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

        console.log(`[Daily Charge] Successfully charged ${dailyCoins} coins to subscription user ${user.user_id}`)
        successCount++
      } catch (userError) {
        console.error(`[Daily Charge] Error processing subscription user ${user.user_id}:`, userError)
        errorCount++
      }
    }

    console.log("[Daily Charge] Daily subscription charge process completed")

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
