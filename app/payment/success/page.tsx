"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Coins, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessed, setIsProcessed] = useState(false)
  const [processing, setProcessing] = useState(true)
  const [orderInfo, setOrderInfo] = useState<any>(null)

  const paymentKey = searchParams.get("paymentKey")
  const orderId = searchParams.get("orderId")
  const amount = searchParams.get("amount")

  useEffect(() => {
    if (!paymentKey || !orderId || !amount || isProcessed) {
      return
    }

    const processPayment = async () => {
      try {
        console.log("결제 성공 처리 시작:", { paymentKey, orderId, amount })

        const response = await fetch("/api/payments/success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number.parseInt(amount),
          }),
        })

        const data = await response.json()
        console.log("결제 처리 응답:", data)

        if (response.ok && data.success) {
          setOrderInfo(data.order)
          toast({
            title: "결제 완료!",
            description: `${data.order?.coins || 0}핑이 충전되었습니다.`,
          })
        } else {
          throw new Error(data.error || "결제 처리 실패")
        }
      } catch (error) {
        console.error("결제 처리 오류:", error)
        toast({
          title: "처리 중 오류 발생",
          description:
            error instanceof Error
              ? error.message
              : "결제는 완료되었지만 처리 중 오류가 발생했습니다. 고객센터에 문의해 주세요.",
          variant: "destructive",
        })
      } finally {
        setProcessing(false)
        setIsProcessed(true)
      }
    }

    processPayment()
  }, [paymentKey, orderId, amount, isProcessed])

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">결제 처리 중...</p>
            <p className="text-sm text-gray-500 mt-2">잠시만 기다려 주세요</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">결제 완료!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {orderInfo && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">주문번호:</span>
                <span className="font-mono text-sm">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">결제금액:</span>
                <span className="font-semibold">₩{Number.parseInt(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">충전된 코인:</span>
                <div className="flex items-center gap-1 text-yellow-600 font-bold">
                  <Coins className="w-4 h-4" />
                  {orderInfo.coins}핑
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-gray-600">
            <p>코인이 성공적으로 충전되었습니다!</p>
            <p className="text-sm mt-1">이제 사주팅의 다양한 서비스를 이용해 보세요.</p>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push("/saju-chat/general")}>
              사주 상담 시작하기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <Button variant="outline" className="w-full" onClick={() => router.push("/mypage")}>
              마이페이지로 이동
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
