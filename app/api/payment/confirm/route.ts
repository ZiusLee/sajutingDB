import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_5OWRapdA8dWnKzAjQAEBro1zEqZK"

export async function POST(request: NextRequest) {
  try {
    const { orderId, packageId, paymentKey, amount } = await request.json()

    console.log("[Payment Confirm] Processing payment:", { orderId, packageId, paymentKey, amount })

    if (!orderId || !packageId) {
      console.error("[Payment Confirm] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[Payment Confirm] Authentication failed:", userError)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const packageData = getPackageData(packageId)
    if (!packageData) {
      console.error("[Payment Confirm] Invalid package:", packageId)
      return NextResponse.json({ error: "Invalid package" }, { status: 400 })
    }

    const dailyCoins = packageData.dailyCoins

    console.log("[Payment Confirm] Package data:", { packageData, dailyCoins })

    console.log("[Payment Confirm] Processing subscription - deactivating previous subscriptions")
    await supabase
      .from("payment_orders")
      .update({
        subscription_status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("subscription_status", "active")

    const { data: paymentOrder, error: insertError } = await supabase
      .from("payment_orders")
      .insert({
        user_id: user.id,
        order_id: orderId,
        package_id: packageId,
        amount: amount || packageData.price,
        coins: dailyCoins, // Store daily coins, not total
        payment_key: paymentKey,
        status: "pending",
        subscription_type: packageId,
        subscription_status: "active",
        daily_coins: dailyCoins,
        next_billing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        payment_data: {
          packageName: packageData.name,
          timestamp: new Date().toISOString(),
          isSubscription: true,
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to create payment order:", insertError)
      return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 })
    }

    // Process the package and add coins to user account
    if (paymentKey && amount) {
      // Confirm payment with Toss Payments
      const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      })

      if (!tossResponse.ok) {
        const errorData = await tossResponse.json()
        console.error("Toss payment confirmation failed:", errorData)

        await supabase
          .from("payment_orders")
          .update({
            status: "failed",
            subscription_status: "failed",
            failure_reason: errorData.message || "Payment confirmation failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentOrder.id)

        return NextResponse.json({ error: "Payment confirmation failed" }, { status: 400 })
      }

      const tossData = await tossResponse.json()
      await supabase
        .from("payment_orders")
        .update({
          status: "confirmed",
          payment_data: {
            ...paymentOrder.payment_data,
            tossResponse: tossData,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id)
    }

    try {
      console.log("[Payment Confirm] Processing subscription activation")

      const subscriptionEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const today = new Date().toISOString().split("T")[0]

      const { data: userCoinsData, error: userCoinsError } = await supabase
        .from("user_coins")
        .upsert(
          {
            user_id: user.id,
            subscription_coins: dailyCoins, // Set to daily coins amount (immediate coins for today)
            bonus_coins: 0, // Reset bonus coins
            subscription_plan: packageId,
            subscription_status: "active",
            subscription_start_date: today,
            subscription_end_date: subscriptionEndDate.toISOString().split("T")[0],
            last_daily_charge: today, // Mark as charged today
            payment_failure_count: 0,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
            ignoreDuplicates: false,
          },
        )
        .select()
        .single()

      if (userCoinsError) {
        console.error("[Payment Confirm] Failed to update user coins:", userCoinsError)
        throw new Error(`Failed to activate subscription: ${userCoinsError.message}`)
      }

      console.log("[Payment Confirm] Subscription activated successfully:", userCoinsData)

      await supabase
        .from("payment_orders")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id)

      return NextResponse.json({
        success: true,
        coinsAdded: dailyCoins,
        coinType: "subscription",
        totalCoins: (userCoinsData.subscription_coins || 0) + (userCoinsData.bonus_coins || 0),
        packageName: packageData.name,
        orderId: paymentOrder.id,
        isSubscription: true,
        subscriptionDetails: {
          plan: packageId,
          dailyCoins: dailyCoins,
          status: "active",
          startDate: today,
          endDate: subscriptionEndDate.toISOString().split("T")[0],
        },
      })
    } catch (coinsError) {
      console.error("[Payment Confirm] Failed to process subscription:", coinsError)

      await supabase
        .from("payment_orders")
        .update({
          status: "failed",
          subscription_status: "failed",
          failure_reason: `Failed to process subscription: ${coinsError instanceof Error ? coinsError.message : "Unknown error"}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id)

      return NextResponse.json(
        {
          error: "Failed to process subscription",
          details: `Payment confirmed but processing failed: ${coinsError instanceof Error ? coinsError.message : "Unknown error"}`,
          isSubscription: true,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[Payment Confirm] Payment confirmation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getPackageData(packageId: string) {
  const packages: Record<string, { name: string; dailyCoins: number; price: number }> = {
    starter: { name: "Starter", dailyCoins: 10, price: 9900 },
    plus: { name: "Plus", dailyCoins: 30, price: 19900 },
    pro: { name: "Pro", dailyCoins: 100, price: 49900 },
  }

  return packages[packageId] || null
}
