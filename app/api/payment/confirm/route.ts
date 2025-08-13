import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_5OWRapdA8dWnKzAjQAEBro1zEqZK"

export async function POST(request: NextRequest) {
  try {
    const { orderId, packageId, paymentKey, amount } = await request.json()

    if (!orderId || !packageId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Process the package and add coins to user account
    const packageData = getPackageData(packageId)
    if (!packageData) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 })
    }

    const coinsToAdd = packageData.coins + (packageData.bonus || 0)

    const { data: paymentOrder, error: insertError } = await supabase
      .from("payment_orders")
      .insert({
        user_id: user.id,
        order_id: orderId,
        package_id: packageId,
        amount: amount || packageData.price,
        coins: coinsToAdd,
        payment_key: paymentKey,
        status: "pending",
        payment_data: {
          packageName: packageData.name,
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error("Failed to create payment order:", insertError)
      return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 })
    }

    // For subscription payments, paymentKey might not be present
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

    // Call the existing user-coins API to add coins
    const coinsResponse = await fetch(`${request.nextUrl.origin}/api/user-coins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({
        delta: coinsToAdd,
        type: "purchase",
        packageId,
        orderId,
        paymentKey,
      }),
    })

    if (!coinsResponse.ok) {
      console.error("Failed to add coins to user account")

      await supabase
        .from("payment_orders")
        .update({
          status: "failed",
          failure_reason: "Failed to add coins to user account",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id)

      return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 })
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
      packageName: packageData.name,
      orderId: paymentOrder.id,
    })
  } catch (error) {
    console.error("Payment confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getPackageData(packageId: string) {
  const packages: Record<string, { name: string; coins: number; bonus?: number; price: number }> = {
    "daily-30": { name: "주간구독", coins: 30, price: 9900 },
    "basic-20": { name: "Basic", coins: 20, price: 9900 },
    "premium-60": { name: "Premium", coins: 60, bonus: 20, price: 29900 },
    "heritage-100": { name: "Heritage", coins: 100, bonus: 100, price: 49900 },
  }

  return packages[packageId] || null
}
