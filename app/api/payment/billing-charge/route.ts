import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_5OWRapdA8dWnKzAjQAEBro1zEqZK"

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { billingKey, amount, orderId, orderName, customerEmail, customerName } = await request.json()

    if (!billingKey || !amount || !orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const tossResponse = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerKey: `customer_${Date.now()}`,
        amount,
        orderId,
        orderName: orderName || "사주핑 구독 결제",
        customerEmail: customerEmail || "customer@sajuping.ai",
        customerName: customerName || "사주핑 사용자",
        taxFreeAmount: 0,
        taxExemptionAmount: 0,
      }),
    })

    const tossData = await tossResponse.json()

    if (!tossResponse.ok) {
      console.error("Toss billing payment failed:", tossData)
      return NextResponse.json(
        {
          success: false,
          error: tossData.message || "Payment failed",
          code: tossData.code,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      paymentKey: tossData.paymentKey,
      orderId: tossData.orderId,
      amount: tossData.totalAmount,
      status: tossData.status,
      approvedAt: tossData.approvedAt,
    })
  } catch (error) {
    console.error("Billing charge error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
