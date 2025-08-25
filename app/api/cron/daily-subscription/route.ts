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

function getKoreanDateTime(): string {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000) // UTC + 9 hours
  return koreanTime.toISOString()
}

export async function GET(request: NextRequest) {
  const isManualTest = request.nextUrl.searchParams.get("manual") === "true"
  const isVercelCron =
    request.headers.get("user-agent")?.includes("vercel-cron") || request.headers.get("x-vercel-cron") === "1"

  const koreanToday = getKoreanDate()
  const koreanNow = getKoreanDateTime()

  console.log("[Daily Charge] Cron job triggered", {
    isManualTest,
    isVercelCron,
    userAgent: request.headers.get("user-agent"),
    koreanDate: koreanToday,
    koreanTime: koreanNow,
    utcTime: new Date().toISOString(),
  })

  if (!isManualTest && !isVercelCron) {
    console.error("[Daily Charge] Unauthorized access - not from Vercel cron or manual test")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  console.log("[Daily Charge] Starting daily subscription charge process...")

  try {
    const { data: allUsers, error: usersError } = await supabase.from("user_coins").select(`
        user_id,
        coins,
        bonus_coins,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        last_daily_charge,
        created_at,
        updated_at
      `)

    if (usersError) {
      console.error("[Daily Charge] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users", details: usersError }, { status: 500 })
    }

    console.log(`[Daily Charge] Total users in database: ${allUsers?.length || 0}`)

    const usersNeedingCharge =
      allUsers?.filter((user) => {
        const needsCharge = !user.last_daily_charge || user.last_daily_charge !== koreanToday
        return needsCharge
      }) || []

    console.log(`[Daily Charge] Users needing charge today: ${usersNeedingCharge.length}`)

    const freeUsers = usersNeedingCharge.filter((user) => {
      const isFreeUser =
        !user.subscription_plan ||
        user.subscription_plan === "free" ||
        user.subscription_plan === "" ||
        user.subscription_plan === null
      return isFreeUser
    })

    const subscriptionUsers = usersNeedingCharge.filter((user) => {
      const hasValidSubscription =
        user.subscription_plan &&
        user.subscription_plan !== "free" &&
        user.subscription_plan !== "" &&
        user.subscription_end_date &&
        new Date(user.subscription_end_date) >= new Date(koreanToday)
      return hasValidSubscription
    })

    console.log(
      `[Daily Charge] Found ${freeUsers.length} free users and ${subscriptionUsers.length} subscription users to charge`,
    )

    let successCount = 0
    let errorCount = 0
    const processedUsers = []

    if (freeUsers.length > 0) {
      console.log("[Daily Charge] Processing free users in batch...")

      for (const user of freeUsers) {
        try {
          const dailyCoins = 3 // Free plan gets 3 coins daily

          const { data: updateResult, error: updateError } = await supabase
            .from("user_coins")
            .update({
              coins: dailyCoins, // Set to 3 coins, don't accumulate for free users
              last_daily_charge: koreanToday,
              updated_at: koreanNow,
            })
            .eq("user_id", user.user_id)
            .select()

          if (updateError) {
            console.error(`[Daily Charge] Error updating coins for free user ${user.user_id}:`, updateError)
            errorCount++
            continue
          }

          console.log(`[Daily Charge] Successfully set ${dailyCoins} coins for free user ${user.user_id}`)
          processedUsers.push({
            user_id: user.user_id,
            type: "free",
            coins_set: dailyCoins,
            status: "success",
          })
          successCount++
        } catch (userError) {
          console.error(`[Daily Charge] Error processing free user ${user.user_id}:`, userError)
          errorCount++
        }
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
            dailyCoins = 10 // Default to starter plan
        }

        console.log(`[Daily Charge] Processing subscription user ${user.user_id}:`, {
          current_coins: user.coins,
          subscription_plan: user.subscription_plan,
          daily_coins: dailyCoins,
        })

        const { data: updateResult, error: updateError } = await supabase
          .from("user_coins")
          .update({
            coins: (user.coins || 0) + dailyCoins,
            last_daily_charge: koreanToday,
            updated_at: koreanNow,
          })
          .eq("user_id", user.user_id)
          .select()

        if (updateError) {
          console.error(`[Daily Charge] Error updating coins for subscription user ${user.user_id}:`, updateError)
          errorCount++
          continue
        }

        console.log(
          `[Daily Charge] Successfully charged ${dailyCoins} coins to subscription user ${user.user_id}`,
          updateResult?.[0],
        )
        processedUsers.push({
          user_id: user.user_id,
          type: "subscription",
          plan: user.subscription_plan,
          coins_added: dailyCoins,
          status: "success",
          previous_coins: user.coins || 0,
          new_coins: (user.coins || 0) + dailyCoins,
        })
        successCount++
      } catch (userError) {
        console.error(`[Daily Charge] Error processing subscription user ${user.user_id}:`, userError)
        processedUsers.push({
          user_id: user.user_id,
          type: "subscription",
          plan: user.subscription_plan,
          coins_added: 0,
          status: "error",
          error: userError instanceof Error ? userError.message : "Unknown error",
        })
        errorCount++
      }
    }

    console.log("[Daily Charge] Daily subscription charge process completed", {
      totalProcessed: successCount + errorCount,
      successful: successCount,
      errors: errorCount,
      koreanDate: koreanToday,
    })

    await supabase.from("cron_executions").insert({
      job_name: "daily-subscription",
      execution_date: koreanToday,
      execution_time: koreanNow,
      success_count: successCount,
      error_count: errorCount,
      total_users: allUsers?.length || 0,
      free_users: freeUsers.length,
      subscription_users: subscriptionUsers.length,
      status: errorCount === 0 ? "completed" : "completed_with_errors",
      details: {
        processedUsers: processedUsers.slice(0, 10),
        koreanTime: koreanNow,
        utcTime: new Date().toISOString(),
        isManualTest,
        isVercelCron,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Daily subscription charge completed",
      statistics: {
        totalUsers: allUsers?.length || 0,
        usersNeedingCharge: usersNeedingCharge.length,
        freeUsers: freeUsers.length,
        subscriptionUsers: subscriptionUsers.length,
        successfulCharges: successCount,
        errors: errorCount,
        koreanDate: koreanToday,
        koreanTime: koreanNow,
        processedSample: processedUsers.slice(0, 5),
      },
    })
  } catch (error) {
    console.error("[Daily Charge] Fatal error in daily charge process:", error)

    await supabase.from("cron_executions").insert({
      job_name: "daily-subscription",
      execution_date: koreanToday,
      execution_time: koreanNow,
      success_count: 0,
      error_count: 1,
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
    })

    return NextResponse.json(
      {
        error: "Fatal error in daily charge process",
        details: error instanceof Error ? error.message : "Unknown error",
        koreanTime: koreanNow,
        utcTime: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
