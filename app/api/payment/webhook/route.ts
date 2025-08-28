import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_5OWRapdA8dWnKzAjQAEBro1zEqZK"

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("toss-signature")

    console.log("[Webhook] Received Toss Payments webhook")

    // Verify webhook signature for security
    if (signature) {
      const expectedSignature = crypto.createHmac("sha256", TOSS_SECRET_KEY).update(body).digest("base64")

      if (signature !== expectedSignature) {
        console.error("[Webhook] Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const webhookData = JSON.parse(body)
    const { eventType, data } = webhookData

    console.log("[Webhook] Processing event:", eventType, "for order:", data?.orderId)

    switch (eventType) {
      case "PAYMENT_STATUS_CHANGED":
        await handlePaymentStatusChanged(data)
        break
      case "BILLING_KEY_ISSUED":
        await handleBillingKeyIssued(data)
        break
      case "SUBSCRIPTION_PAYMENT_SUCCESS":
        await handleSubscriptionPaymentSuccess(data)
        break
      case "SUBSCRIPTION_PAYMENT_FAILED":
        await handleSubscriptionPaymentFailed(data)
        break
      default:
        console.log("[Webhook] Unhandled event type:", eventType)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentStatusChanged(data: any) {
  const { orderId, status, paymentKey } = data

  console.log("[Webhook] Payment status changed:", { orderId, status })

  // Update payment order status
  const { error } = await supabase
    .from("payment_orders")
    .update({
      status: status.toLowerCase(),
      payment_key: paymentKey,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)

  if (error) {
    console.error("[Webhook] Failed to update payment status:", error)
    throw error
  }

  // If payment is confirmed, process the purchase
  if (status === "DONE") {
    await processConfirmedPayment(orderId)
  }
}

async function handleBillingKeyIssued(data: any) {
  const { customerKey, billingKey } = data

  console.log("[Webhook] Billing key issued for customer:", customerKey)

  // Update payment order with billing key
  const { error } = await supabase
    .from("payment_orders")
    .update({
      billing_key: billingKey,
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_data", "customerKey", customerKey)

  if (error) {
    console.error("[Webhook] Failed to save billing key:", error)
    throw error
  }
}

async function handleSubscriptionPaymentSuccess(data: any) {
  const { orderId, billingKey, amount } = data

  console.log("[Webhook] Subscription payment success:", { orderId, amount })

  // Process subscription payment and add daily coins
  await processSubscriptionPayment(orderId, amount)
}

async function handleSubscriptionPaymentFailed(data: any) {
  const { orderId, billingKey, failReason } = data

  console.log("[Webhook] Subscription payment failed:", { orderId, failReason })

  // Handle subscription payment failure
  const { error } = await supabase
    .from("payment_orders")
    .update({
      status: "failed",
      failure_reason: failReason,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)

  if (error) {
    console.error("[Webhook] Failed to update failed payment:", error)
  }
}

async function processConfirmedPayment(orderId: string) {
  // Get payment order details
  const { data: paymentOrder, error: fetchError } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_id", orderId)
    .single()

  if (fetchError || !paymentOrder) {
    console.error("[Webhook] Payment order not found:", orderId)
    return
  }

  // Add coins to user account
  const coinType = paymentOrder.subscription_type ? "subscription" : "bonus"
  const coinsToAdd = paymentOrder.subscription_type ? paymentOrder.daily_coins : paymentOrder.coins

  try {
    // Call user-coins API to add coins
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/user-coins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "add",
        amount: coinsToAdd,
        coin_type: coinType,
        user_id: paymentOrder.user_id,
      }),
    })

    if (response.ok) {
      // Mark payment as completed
      await supabase
        .from("payment_orders")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentOrder.id)

      console.log("[Webhook] Payment processing completed for order:", orderId)
    } else {
      throw new Error("Failed to add coins")
    }
  } catch (error) {
    console.error("[Webhook] Failed to process confirmed payment:", error)

    // Mark as failed for manual review
    await supabase
      .from("payment_orders")
      .update({
        status: "failed",
        failure_reason: `Webhook processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentOrder.id)
  }
}

async function processSubscriptionPayment(orderId: string, amount: number) {
  // Similar to processConfirmedPayment but for recurring payments
  // This would handle daily/weekly subscription charges
  console.log("[Webhook] Processing subscription payment:", { orderId, amount })

  // Implementation for subscription payment processing
  // This would add daily coins and update subscription status
}
