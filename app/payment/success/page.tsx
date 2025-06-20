"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Coins, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      const orderId = searchParams.get("orderId")
      const paymentKey = searchParams.get("paymentKey")
      const amount = searchParams.get("amount")

      if (!orderId || !paymentKey || !amount) {
        setError("결제 정보가 누락되었습니다.")
        setIsProcessing(false)
        return
      }

      try {
        console.log("결제 승인 요청:", { orderId, paymentKey, amount })

        const response = await fetch("/api/payments/success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            paymentKey,
            amount: Number.parseInt(amount),
          }),
        })

        const data = await response.json()
        console.log("결제 승인 응답:", data)

        if (response.ok && data.success) {
          setPaymentResult(data)
          toast({
            title: "결제 완료!",
            description: `${data.coins}핑이 충전되었습니다.`,
          })
        } else {
          throw new Error(data.error || "결제 처리 중 오류가 발생했습니다.")
        }
      } catch (error: any) {
        console.error("결제 처리 오류:", error)
        setError(error.message)
        toast({
          title: "결제 오류",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [searchParams])

  const handleGoBack = () => {
    router.push("/coin-shop")
  }

  const handleGoToChat = () => {
    router.push("/saju-chat/general")
  }

  if (isProcessing) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-center text-muted-foreground">결제를 처리하고 있습니다...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-red-600 text-2xl">✕</span>
            </div>
            <CardTitle className="text-red-600">결제 오류</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600">결제 완료!</CardTitle>
          <CardDescription>핑 충전이 성공적으로 완료되었습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentResult && (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-600">
                <Coins className="w-5 h-5" />
                <span>+{paymentResult.coins}핑 충전</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleGoToChat} className="w-full">
              사주 채팅 시작하기
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              코인샵으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
