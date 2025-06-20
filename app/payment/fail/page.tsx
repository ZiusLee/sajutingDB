"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft } from "lucide-react"

export default function PaymentFailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const orderId = searchParams.get("orderId")
  const code = searchParams.get("code")
  const message = searchParams.get("message")

  useEffect(() => {
    // 결제 실패 로그 전송
    if (orderId && code && message) {
      fetch("/api/payments/fail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          code,
          message,
        }),
      }).catch(console.error)
    }
  }, [orderId, code, message])

  const handleGoBack = () => {
    router.push("/coin-shop")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-red-600">결제 실패</CardTitle>
          <CardDescription>결제 처리 중 오류가 발생했습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}

          {orderId && (
            <div className="text-center text-sm text-muted-foreground">
              <p>주문번호: {orderId}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              홈으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
