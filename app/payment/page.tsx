"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getTossClientKey } from "@/app/actions/payment"

// Toss Payments types
declare global {
  interface Window {
    TossPayments: any
  }
}

type PaymentData = {
  packageId: string
  name: string
  coins: number
  bonus?: number
  price: number
  isSubscription: boolean
  userEmail: string
}

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tossPayments, setTossPayments] = useState<any>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    const packageId = searchParams.get("packageId")
    const name = searchParams.get("name")
    const coins = searchParams.get("coins")
    const bonus = searchParams.get("bonus")
    const price = searchParams.get("price")
    const isSubscription = searchParams.get("isSubscription") === "true"
    const userEmail = searchParams.get("userEmail") || "skyywwind@gmail.com"

    if (packageId && name && coins && price) {
      setPaymentData({
        packageId,
        name,
        coins: Number.parseInt(coins),
        bonus: bonus ? Number.parseInt(bonus) : undefined,
        price: Number.parseInt(price),
        isSubscription,
        userEmail,
      })
    }
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    if (scriptLoaded || document.querySelector('script[src="https://js.tosspayments.com/v1/payment"]')) {
      return
    }

    const script = document.createElement("script")
    script.src = "https://js.tosspayments.com/v1/payment"
    script.onload = async () => {
      setScriptLoaded(true)
      if (window.TossPayments) {
        const clientKey = await getTossClientKey()
        setTossPayments(window.TossPayments(clientKey))
      }
    }
    script.onerror = () => {
      console.error("Failed to load Toss Payments SDK")
      toast({
        title: "결제 시스템 오류",
        description: "결제 시스템을 불러올 수 없습니다. 페이지를 새로고침해주세요.",
        variant: "destructive",
      })
    }

    document.head.appendChild(script)
  }, [toast]) // Only depend on toast which is stable

  const formatKRW = useCallback((amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("₩", "₩")
  }, [])

  const formatDate = useCallback((date: Date) => {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }, [])

  const handlePayment = useCallback(async () => {
    if (!paymentData || !tossPayments) return

    setIsLoading(true)
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      if (paymentData.isSubscription) {
        // Subscription billing
        await tossPayments.requestBillingAuth("카드", {
          customerKey: `customer_${Date.now()}`,
          successUrl: `${window.location.origin}/payment/success?orderId=${orderId}&packageId=${paymentData.packageId}`,
          failUrl: `${window.location.origin}/payment/fail?orderId=${orderId}`,
        })
      } else {
        // One-time payment
        await tossPayments.requestPayment("카드", {
          amount: paymentData.price,
          orderId,
          orderName: `${paymentData.name} 패키지`,
          customerName: "사주핑 사용자",
          customerEmail: paymentData.userEmail,
          successUrl: `${window.location.origin}/payment/success?orderId=${orderId}&packageId=${paymentData.packageId}`,
          failUrl: `${window.location.origin}/payment/fail?orderId=${orderId}`,
        })
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "결제 오류",
        description: "결제 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [paymentData, tossPayments, toast])

  if (!paymentData) {
    return (
      <div className="min-h-screen bg-[#1b1c1e] flex items-center justify-center">
        <div className="text-white">결제 정보를 불러오는 중...</div>
      </div>
    )
  }

  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  return (
    <div className="min-h-screen bg-[#1b1c1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1b1c1e]/95 backdrop-blur border-b border-[#70737c]/20">
        <div className="mx-auto max-w-md px-4 h-12 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-md p-2 text-[#aeb0b6] hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md px-4 py-6 space-y-8">
        <h1 className="text-2xl font-bold text-white">결제하기</h1>

        <div className="space-y-6">
          {/* Product */}
          <div className="space-y-2">
            <div className="text-[#aeb0b6] text-sm">상품</div>
            <div className="text-white text-lg">
              {paymentData.isSubscription ? "추천패키지 / 주간구독형" : `${paymentData.name} 패키지`}
            </div>
            <div className="h-px bg-[#70737c]/20"></div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="text-[#aeb0b6] text-sm">정구 금액</div>
            <div className="text-white text-lg">{formatKRW(paymentData.price)}</div>
            <div className="h-px bg-[#70737c]/20"></div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <div className="text-[#aeb0b6] text-sm">결제일</div>
            <div className="text-white text-lg">{formatDate(today)}</div>
            <div className="h-px bg-[#70737c]/20"></div>
          </div>

          {/* Next Payment Date (only for subscriptions) */}
          {paymentData.isSubscription && (
            <div className="space-y-2">
              <div className="text-[#aeb0b6] text-sm">다음 결제일</div>
              <div className="text-white text-lg">{formatDate(nextWeek)}</div>
              <div className="h-px bg-[#70737c]/20"></div>
            </div>
          )}

          {/* Billing Email */}
          <div className="space-y-2">
            <div className="text-[#aeb0b6] text-sm">청구 이메일 주소</div>
            <div className="text-white text-lg">{paymentData.userEmail}</div>
            <div className="h-px bg-[#70737c]/20"></div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="pt-8">
          <Button
            onClick={handlePayment}
            disabled={isLoading || !tossPayments}
            className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-xl text-lg font-semibold flex items-center justify-center gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0064ff] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">pay</span>
              </div>
              <span>{isLoading ? "처리중..." : "결제하기"}</span>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-8 text-center">
          <div className="text-[#aeb0b6] text-sm">🔒 sajuping.ai</div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1b1c1e] flex items-center justify-center">
          <div className="text-white">로딩중...</div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  )
}
