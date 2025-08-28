"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(true)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [processingSuccess, setProcessingSuccess] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const processPayment = async () => {
    const orderId = searchParams.get("orderId")
    const packageId = searchParams.get("packageId")
    const paymentKey = searchParams.get("paymentKey")
    const amount = searchParams.get("amount")
    const authKey = searchParams.get("authKey")
    const customerKey = searchParams.get("customerKey")

    console.log("[Payment Success] Processing payment with params:", {
      orderId,
      packageId,
      paymentKey,
      amount,
      authKey: !!authKey,
      customerKey: !!customerKey,
    })

    if (!orderId || !packageId) {
      console.error("[Payment Success] Missing required parameters")
      setProcessingError("결제 정보가 누락되었습니다.")
      setIsProcessing(false)
      return
    }

    try {
      if (paymentKey) {
        console.log("[Payment Success] Verifying payment status")
        const verifyResponse = await fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
          }),
        })

        const verifyData = await verifyResponse.json()
        console.log("[Payment Success] Payment verification result:", verifyData)

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error || "결제 상태 확인에 실패했습니다.")
        }

        if (verifyData.alreadyProcessed) {
          console.log("[Payment Success] Payment already processed")
          setProcessingSuccess(true)
          setIsProcessing(false)
          toast({
            title: "결제 완료",
            description: "결제가 이미 처리되었습니다.",
          })
          return
        }

        if (!verifyData.needsProcessing) {
          console.log("[Payment Success] Payment does not need processing")
          setProcessingSuccess(true)
          setIsProcessing(false)
          return
        }
      }

      if (authKey && customerKey) {
        console.log("[Payment Success] Processing subscription billing auth")
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

        const billingData = await billingResponse.json()
        console.log("[Payment Success] Billing auth response:", billingData)

        if (billingResponse.ok && billingData.success) {
          console.log("[Payment Success] Subscription registered successfully")
          setProcessingSuccess(true)
          toast({
            title: "구독 등록 완료",
            description: "구독이 성공적으로 등록되었습니다. 매일 질문권이 자동으로 제공됩니다!",
          })
        } else {
          console.error("[Payment Success] Billing auth failed:", billingData)
          throw new Error(billingData.error || billingData.details || "구독 등록에 실패했습니다.")
        }
      } else {
        console.log("[Payment Success] Processing one-time payment confirmation")
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

        const responseData = await response.json()
        console.log("[Payment Success] Payment confirm response:", responseData)

        if (response.ok && responseData.success) {
          console.log("[Payment Success] Payment processed successfully")
          setProcessingSuccess(true)
          toast({
            title: "결제 완료",
            description: `질문권 ${responseData.coinsAdded}개가 성공적으로 지급되었습니다!`,
          })
        } else {
          console.error("[Payment Success] Payment confirm failed:", responseData)
          throw new Error(responseData.error || responseData.details || "결제 처리에 실패했습니다.")
        }
      }
    } catch (error) {
      console.error("[Payment Success] Payment processing error:", error)
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
      setProcessingError(errorMessage)

      toast({
        title: "결제 처리 오류",
        description: `결제는 완료되었지만 처리 중 오류가 발생했습니다: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    processPayment()
  }, [searchParams, toast])

  const handleRetry = async () => {
    if (retryCount >= 3) {
      toast({
        title: "재시도 한계 초과",
        description: "고객센터에 문의해주세요.",
        variant: "destructive",
      })
      return
    }

    setRetryCount((prev) => prev + 1)
    setIsProcessing(true)
    setProcessingError(null)
    await processPayment()
  }

  return (
    <div className="min-h-screen bg-[#1b1c1e] text-white flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center space-y-6">
        <div className="flex justify-center">
          {isProcessing ? (
            <RefreshCw size={64} className="text-[#28d0ed] animate-spin" />
          ) : processingError ? (
            <AlertCircle size={64} className="text-red-500" />
          ) : (
            <CheckCircle size={64} className="text-[#28d0ed]" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {isProcessing ? "처리 중..." : processingError ? "처리 중 오류 발생" : "결제 완료"}
          </h1>
          <p className="text-[#aeb0b6]">
            {isProcessing
              ? "결제를 처리하고 있습니다..."
              : processingError
                ? processingError
                : processingSuccess
                  ? "질문권이 성공적으로 지급되었습니다!"
                  : "처리가 완료되었습니다."}
          </p>

          {processingError && (
            <div className="text-sm text-[#aeb0b6] mt-4 space-y-2">
              <p>결제는 정상적으로 완료되었습니다.</p>
              <p>질문권이 지급되지 않았다면 아래 버튼으로 재시도하거나 고객센터에 문의해주세요.</p>
              {retryCount > 0 && <p className="text-yellow-400">재시도 횟수: {retryCount}/3</p>}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/charge")}
            className="w-full bg-[#28d0ed] text-black hover:bg-[#28d0ed]/90"
            disabled={isProcessing}
          >
            구독 관리로 돌아가기
          </Button>

          {processingError && retryCount < 3 && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full border-[#70737c] text-white hover:bg-white/5 bg-transparent"
              disabled={isProcessing}
            >
              {isProcessing ? "재시도 중..." : "다시 시도"}
            </Button>
          )}

          {processingError && (
            <Button
              onClick={() => window.open("mailto:support@sajuping.ai", "_blank")}
              variant="outline"
              className="w-full border-[#70737c] text-white hover:bg-white/5"
            >
              고객센터 문의하기
            </Button>
          )}
        </div>
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
