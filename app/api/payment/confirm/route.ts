import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_5OWRapdA8dWnKzAjQAEBro1zEqZK"

export async function POST(request: NextRequest) {
  try {
    const { orderId, packageId, paymentKey, amount } = await request.json()

    if (!orderId || !packageId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const packageData = getPackageData(packageId)
    if (!packageData) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 })
    }

    const isSubscription = packageData.isSubscription || false
    const dailyCoins = isSubscription ? Math.floor(packageData.coins / 7) : 0

    if (isSubscription) {
      // Deactivate previous subscription orders
      await supabase
        .from("payment_orders")
        .update({
          subscription_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("subscription_status", "active")

      // Clear existing subscription coins when changing plans
      await supabase
        .from("user_coins")
        .update({
          subscription_coins: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      console.log(`[Payment Confirm] Cleared existing subscription coins for user ${user.id}`)
    }

    const { data: paymentOrder, error: insertError } = await supabase
      .from("payment_orders")
      .insert({
        user_id: user.id,
        order_id: orderId,
        package_id: packageId,
        amount: amount || packageData.price,
        coins: packageData.coins + (packageData.bonus || 0),
        payment_key: paymentKey,
        status: "pending",
        subscription_type: isSubscription ? packageId : null,
        subscription_status: isSubscription ? "pending" : "inactive",
        daily_coins: dailyCoins,
        next_billing_date: isSubscription ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
        payment_data: {
          packageName: packageData.name,
          timestamp: new Date().toISOString(),
          isSubscription: isSubscription,
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
      const coinType = isSubscription ? "subscription" : "bonus"
      const coinsToAdd = isSubscription ? dailyCoins : packageData.coins + (packageData.bonus || 0)

      const coinsResponse = await fetch(`${request.nextUrl.origin}/api/user-coins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          action: "add",
          amount: coinsToAdd,
          coin_type: coinType,
        }),
      })

      if (!coinsResponse.ok) {
        const errorData = await coinsResponse.json()
        throw new Error(errorData.error || "Failed to add coins")
      }

      const coinsData = await coinsResponse.json()

      if (isSubscription) {
        const subscriptionEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

        await supabase
          .from("user_coins")
          .update({
            subscription_plan: packageId,
            subscription_start_date: new Date().toISOString().split("T")[0],
            subscription_end_date: subscriptionEndDate.toISOString().split("T")[0],
            last_daily_charge: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        await supabase
          .from("payment_orders")
          .update({
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentOrder.id)
      }

      await supabase
        .from("payment_orders")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id)

      return NextResponse.json({
        success: true,
        coinsAdded: coinsToAdd,
        coinType: coinType,
        totalCoins: coinsData.total_coins || coinsData.coins,
        packageName: packageData.name,
        orderId: paymentOrder.id,
        isSubscription: isSubscription,
      })
    } catch (coinsError) {
      console.error("Failed to add coins to user account:", coinsError)

      await supabase
        .from("payment_orders")
        .update({
          status: "failed",
          failure_reason: "Failed to add coins to user account",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id)

      return NextResponse.json(
        {
          error: "Failed to process purchase",
          details: "Payment confirmed but coin addition failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getPackageData(packageId: string) {
  const packages: Record<
    string,
    { name: string; coins: number; bonus?: number; price: number; isSubscription?: boolean }
  > = {
    starter: { name: "Starter", coins: 70, price: 9900, isSubscription: true }, // 7 days * 10 coins
    plus: { name: "Plus", coins: 210, price: 19900, isSubscription: true }, // 7 days * 30 coins
    pro: { name: "Pro", coins: 700, price: 49900, isSubscription: true }, // 7 days * 100 coins
    "basic-20": { name: "Basic", coins: 20, price: 9900 },
    "premium-60": { name: "Premium", coins: 60, bonus: 20, price: 29900 },
    "heritage-100": { name: "Heritage", coins: 100, bonus: 100, price: 49900 },
  }

  return packages[packageId] || null
}
