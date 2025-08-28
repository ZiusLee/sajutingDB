import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_5OWRapdA8dWnKzAjQAEBro1zEqZK"

export async function POST(request: NextRequest) {
  try {
    const { paymentKey, orderId } = await request.json()

    console.log("[Payment Verify] Verifying payment:", { paymentKey, orderId })

    if (!paymentKey || !orderId) {
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

    const tossResponse = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
    })

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json()
      console.error("[Payment Verify] Toss API error:", errorData)
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 })
    }

    const paymentData = await tossResponse.json()
    console.log("[Payment Verify] Payment status from Toss:", paymentData.status)

    if (paymentData.status !== "DONE") {
      return NextResponse.json(
        {
          error: "Payment not completed",
          status: paymentData.status,
        },
        { status: 400 },
      )
    }

    const { data: paymentOrder, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderId)
      .eq("user_id", user.id)
      .single()

    if (orderError || !paymentOrder) {
      console.error("[Payment Verify] Payment order not found or unauthorized")
      return NextResponse.json({ error: "Payment order not found" }, { status: 404 })
    }

    if (paymentOrder.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        alreadyProcessed: true,
      })
    }

    return NextResponse.json({
      success: true,
      paymentData: {
        orderId: paymentData.orderId,
        status: paymentData.status,
        amount: paymentData.totalAmount,
        approvedAt: paymentData.approvedAt,
      },
      needsProcessing: paymentOrder.status !== "completed",
    })
  } catch (error) {
    console.error("[Payment Verify] Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
