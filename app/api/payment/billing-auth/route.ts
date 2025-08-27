import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_5OWRapdA8dWnKzAjQAEBro1zEqZK"

export async function POST(request: NextRequest) {
  try {
    const { authKey, customerKey, orderId, packageId } = await request.json()

    if (!authKey || !customerKey || !orderId || !packageId) {
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

    // Confirm billing auth with Toss Payments
    const tossResponse = await fetch("https://api.tosspayments.com/v1/billing/authorizations/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authKey,
        customerKey,
      }),
    })

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json()
      console.error("Toss billing auth confirmation failed:", errorData)
      return NextResponse.json({ error: "Billing authorization failed" }, { status: 400 })
    }

    const tossData = await tossResponse.json()
    const billingKey = tossData.billingKey

    const { data: paymentOrder, error: updateError } = await supabase
      .from("payment_orders")
      .update({
        billing_key: billingKey,
        subscription_status: "active",
        payment_data: {
          ...tossData,
          customerKey,
          timestamp: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to save billing key:", updateError)
      return NextResponse.json({ error: "Failed to save billing authorization" }, { status: 500 })
    }

    const packageData = getPackageData(packageId)
    if (packageData && packageData.isSubscription) {
      const dailyCoins = Math.floor(packageData.coins / 7)
      const subscriptionEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      await supabase.from("user_coins").upsert({
        user_id: user.id,
        subscription_plan: packageId,
        subscription_start_date: new Date().toISOString().split("T")[0],
        subscription_end_date: subscriptionEndDate.toISOString().split("T")[0],
        subscription_coins: dailyCoins,
        last_daily_charge: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      billingKey,
      orderId: paymentOrder.id,
      message: "Billing authorization confirmed successfully",
    })
  } catch (error) {
    console.error("Billing auth confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getPackageData(packageId: string) {
  const packages: Record<
    string,
    { name: string; coins: number; bonus?: number; price: number; isSubscription?: boolean }
  > = {
    starter: { name: "Starter", coins: 70, price: 9900, isSubscription: true },
    plus: { name: "Plus", coins: 210, price: 19900, isSubscription: true },
    pro: { name: "Pro", coins: 700, price: 49900, isSubscription: true },
  }

  return packages[packageId] || null
}
