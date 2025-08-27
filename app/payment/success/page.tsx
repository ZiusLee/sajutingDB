"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processPayment = async () => {
      const orderId = searchParams.get("orderId")
      const packageId = searchParams.get("packageId")
      const paymentKey = searchParams.get("paymentKey")
      const amount = searchParams.get("amount")
      const authKey = searchParams.get("authKey")
      const customerKey = searchParams.get("customerKey")

      if (orderId && packageId) {
        try {
          if (authKey && customerKey) {
            const billingResponse = await fetch("/api/payment/billing-auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                authKey,
                customerKey,
                orderId,
                packageId,
              }),
            })

            if (billingResponse.ok) {
              toast({
                title: "구독 등록 완료",
                description: "구독이 성공적으로 등록되었습니다. 매일 질문권이 자동으로 제공됩니다!",
              })
            } else {
              throw new Error("Billing authorization failed")
            }
          } else {
            const response = await fetch("/api/payment/confirm", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                orderId,
                packageId,
                paymentKey,
                amount: amount ? Number.parseInt(amount) : undefined,
              }),
            })

            if (response.ok) {
              toast({
                title: "결제 완료",
                description: "질문권이 성공적으로 지급되었습니다!",
              })
            } else {
              throw new Error("Payment confirmation failed")
            }
          }
        } catch (error) {
          console.error("Payment confirmation error:", error)
          toast({
            title: "결제 처리 오류",
            description: "결제는 완료되었지만 처리 중 오류가 발생했습니다. 고객센터에 문의해주세요.",
            variant: "destructive",
          })
        }
      }
      setIsProcessing(false)
    }

    processPayment()
  }, [searchParams, toast])

  return (
    <div className="min-h-screen bg-[#1b1c1e] text-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle size={64} className="text-[#28d0ed]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">결제 완료</h1>
          <p className="text-[#aeb0b6]">
            {isProcessing ? "결제를 처리하고 있습니다..." : "질문권이 성공적으로 지급되었습니다!"}
          </p>
        </div>

        <Button
          onClick={() => router.push("/charge")}
          className="w-full bg-[#28d0ed] text-black hover:bg-[#28d0ed]/90"
          disabled={isProcessing}
        >
          구독 관리로 돌아가기
        </Button>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1b1c1e] flex items-center justify-center">
          <div className="text-white">로딩중...</div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  )
}
