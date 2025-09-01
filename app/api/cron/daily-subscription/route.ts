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
    request.headers.get("user-agent")?.includes("vercel-cron") ||
    request.headers.get("x-vercel-cron") === "1" ||
    request.headers.get("x-vercel-deployment-url") !== null ||
    request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`

  const koreanToday = getKoreanDate()
  const koreanNow = getKoreanDateTime()

  console.log("[Daily Charge] Cron job triggered", {
    isManualTest,
    isVercelCron,
    userAgent: request.headers.get("user-agent"),
    xVercelCron: request.headers.get("x-vercel-cron"),
    xVercelDeployment: request.headers.get("x-vercel-deployment-url"),
    hasAuthHeader: !!request.headers.get("authorization"),
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
    console.log("[Daily Charge] Executing scheduled plan changes...")
    const { data: scheduledChanges, error: scheduledError } = await supabase.rpc("execute_scheduled_plan_changes")

    if (scheduledError) {
      console.error("[Daily Charge] Error executing scheduled changes:", scheduledError)
    } else {
      console.log(`[Daily Charge] Executed ${scheduledChanges?.length || 0} scheduled plan changes`)
    }

    console.log("[Daily Charge] Handling expired subscriptions...")
    const { data: expiredSubs, error: expiredError } = await supabase.rpc("handle_expired_subscriptions")

    if (expiredError) {
      console.error("[Daily Charge] Error handling expired subscriptions:", expiredError)
    } else {
      console.log(`[Daily Charge] Handled ${expiredSubs?.length || 0} expired subscriptions`)
    }

    const { data: allUsers, error: usersError } = await supabase.from("user_coins").select(`
        user_id,
        subscription_coins,
        bonus_coins,
        subscription_plan,
        subscription_start_date,
        subscription_end_date,
        last_daily_charge,
        scheduled_plan_change,
        scheduled_date,
        payment_failure_count,
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

      try {
        const freeUserIds = freeUsers.map((user) => user.user_id)
        const dailyCoins = 3 // Free plan gets 3 coins daily

        const { data: batchUpdateResult, error: batchUpdateError } = await supabase
          .from("user_coins")
          .update({
            subscription_coins: dailyCoins,
            last_daily_charge: koreanToday,
            updated_at: koreanNow,
          })
          .in("user_id", freeUserIds)
          .select("user_id")

        if (batchUpdateError) {
          console.error("[Daily Charge] Error in batch update for free users:", batchUpdateError)
          errorCount += freeUsers.length
          freeUsers.forEach((user) => {
            processedUsers.push({
              user_id: user.user_id,
              type: "free",
              coins_set: 0,
              status: "error",
              error: batchUpdateError.message,
            })
          })
        } else {
          const updatedCount = batchUpdateResult?.length || 0
          console.log(`[Daily Charge] Successfully batch updated ${updatedCount} free users with ${dailyCoins} coins`)
          successCount += updatedCount

          batchUpdateResult?.forEach((result) => {
            processedUsers.push({
              user_id: result.user_id,
              type: "free",
              coins_set: dailyCoins,
              status: "success",
            })
          })
        }
      } catch (batchError) {
        console.error("[Daily Charge] Error in free users batch processing:", batchError)
        errorCount += freeUsers.length
        freeUsers.forEach((user) => {
          processedUsers.push({
            user_id: user.user_id,
            type: "free",
            coins_set: 0,
            status: "error",
            error: batchError instanceof Error ? batchError.message : "Batch processing error",
          })
        })
      }
    }

    if (subscriptionUsers.length > 0) {
      console.log("[Daily Charge] Processing subscription users in batches by plan...")

      const planGroups = {
        starter: subscriptionUsers.filter((u) => u.subscription_plan === "starter"),
        plus: subscriptionUsers.filter((u) => u.subscription_plan === "plus"),
        pro: subscriptionUsers.filter((u) => u.subscription_plan === "pro"),
      }

      const planCoins = {
        starter: 10,
        plus: 30,
        pro: 100,
      }

      // Process each plan group in parallel
      const planPromises = Object.entries(planGroups).map(async ([plan, users]) => {
        if (users.length === 0) return { plan, success: 0, errors: 0, processed: [] }

        try {
          const validUsers = users.filter((user) => {
            if (user.subscription_end_date && new Date(user.subscription_end_date) < new Date(koreanToday)) {
              console.warn(`[Daily Charge] Subscription expired for user ${user.user_id}, skipping`)
              return false
            }
            return true
          })

          if (validUsers.length === 0) {
            return { plan, success: 0, errors: 0, processed: [] }
          }

          const userIds = validUsers.map((user) => user.user_id)
          const dailyCoins = planCoins[plan as keyof typeof planCoins]

          const { data: batchResult, error: batchError } = await supabase
            .from("user_coins")
            .update({
              subscription_coins: dailyCoins,
              last_daily_charge: koreanToday,
              updated_at: koreanNow,
            })
            .in("user_id", userIds)
            .select("user_id")

          if (batchError) {
            console.error(`[Daily Charge] Error in batch update for ${plan} users:`, batchError)
            return {
              plan,
              success: 0,
              errors: validUsers.length,
              processed: validUsers.map((user) => ({
                user_id: user.user_id,
                type: "subscription",
                plan: user.subscription_plan,
                coins_set: 0,
                status: "error",
                error: batchError.message,
              })),
            }
          }

          const updatedCount = batchResult?.length || 0
          console.log(
            `[Daily Charge] Successfully batch updated ${updatedCount} ${plan} users with ${dailyCoins} coins`,
          )

          return {
            plan,
            success: updatedCount,
            errors: 0,
            processed:
              batchResult?.map((result) => ({
                user_id: result.user_id,
                type: "subscription",
                plan: plan,
                coins_set: dailyCoins,
                status: "success",
              })) || [],
          }
        } catch (planError) {
          console.error(`[Daily Charge] Error processing ${plan} users:`, planError)
          return {
            plan,
            success: 0,
            errors: users.length,
            processed: users.map((user) => ({
              user_id: user.user_id,
              type: "subscription",
              plan: user.subscription_plan,
              coins_set: 0,
              status: "error",
              error: planError instanceof Error ? planError.message : "Plan processing error",
            })),
          }
        }
      })

      // Wait for all plan batches to complete
      const planResults = await Promise.all(planPromises)

      planResults.forEach((result) => {
        successCount += result.success
        errorCount += result.errors
        processedUsers.push(...result.processed)
      })
    }

    console.log("[Daily Charge] Daily subscription charge process completed", {
      totalProcessed: successCount + errorCount,
      successful: successCount,
      errors: errorCount,
      koreanDate: koreanToday,
      scheduledChanges: scheduledChanges?.length || 0,
      expiredSubscriptions: expiredSubs?.length || 0,
    })

    const { error: cronLogError } = await supabase.from("cron_executions").insert({
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
        scheduledChanges: scheduledChanges?.length || 0,
        expiredSubscriptions: expiredSubs?.length || 0,
        koreanTime: koreanNow,
        utcTime: new Date().toISOString(),
        isManualTest,
        isVercelCron,
        headers: {
          userAgent: request.headers.get("user-agent"),
          xVercelCron: request.headers.get("x-vercel-cron"),
          xVercelDeployment: request.headers.get("x-vercel-deployment-url"),
        },
        errors: processedUsers.filter((u) => u.status === "error").slice(0, 5),
      },
    })

    if (cronLogError) {
      console.error("[Daily Charge] Failed to log cron execution:", cronLogError)
    }

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
        scheduledChanges: scheduledChanges?.length || 0,
        expiredSubscriptions: expiredSubs?.length || 0,
        koreanDate: koreanToday,
        koreanTime: koreanNow,
        processedSample: processedUsers.slice(0, 5),
      },
    })
  } catch (error) {
    console.error("[Daily Charge] Fatal error in daily charge process:", error)

    const { error: cronLogError } = await supabase.from("cron_executions").insert({
      job_name: "daily-subscription",
      execution_date: koreanToday,
      execution_time: koreanNow,
      success_count: 0,
      error_count: 1,
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
      details: {
        koreanTime: koreanNow,
        utcTime: new Date().toISOString(),
        isManualTest,
        isVercelCron,
        errorStack: error instanceof Error ? error.stack : undefined,
        headers: {
          userAgent: request.headers.get("user-agent"),
          xVercelCron: request.headers.get("x-vercel-cron"),
          xVercelDeployment: request.headers.get("x-vercel-deployment-url"),
        },
      },
    })

    if (cronLogError) {
      console.error("[Daily Charge] Failed to log cron execution error:", cronLogError)
    }

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
