"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft, Home } from "lucide-react"

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState("")
  const [orderId, setOrderId] = useState("")

  useEffect(() => {
    const message = searchParams.get("message")
    const code = searchParams.get("code")
    const orderId = searchParams.get("orderId")

    setErrorMessage(message || "결제가 취소되었습니다.")
    setOrderId(orderId || "")

    // 실패한 주문을 DB에서 실패 상태로 업데이트
    if (orderId) {
      fetch("/api/payments/fail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          failureReason: `${code}: ${message}`,
        }),
      }).catch(console.error)
    }
  }, [searchParams])

  const handleRetry = () => {
    router.push("/coin-shop")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-red-700">결제 실패</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{errorMessage}</p>

          {orderId && <div className="text-xs text-muted-foreground">주문번호: {orderId}</div>}

          <div className="flex flex-col space-y-2 pt-4">
            <Button onClick={handleRetry} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              다시 시도
            </Button>

            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              홈으로 이동
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
