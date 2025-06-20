"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Coins, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("")
  const [coins, setCoins] = useState(0)
  const [orderId, setOrderId] = useState("")
  const [isProcessed, setIsProcessed] = useState(false)

  useEffect(() => {
    const processPayment = async () => {
      // 이미 처리된 경우 중복 처리 방지
      if (isProcessed) return

      const paymentKey = searchParams.get("paymentKey")
      const orderId = searchParams.get("orderId")
      const amount = searchParams.get("amount")

      if (!paymentKey || !orderId || !amount) {
        setStatus("error")
        setMessage("결제 정보가 누락되었습니다.")
        return
      }

      setIsProcessed(true)
      setOrderId(orderId)

      try {
        console.log("결제 승인 처리 시작:", { paymentKey, orderId, amount })

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
        console.log("결제 승인 응답:", data)

        if (response.ok && data.success) {
          setStatus("success")
          setMessage(data.message || "결제가 완료되었습니다.")
          setCoins(data.coins || 0)

          toast({
            title: "결제 완료!",
            description: `${data.coins}핑이 충전되었습니다.`,
          })
        } else {
          console.error("결제 승인 실패:", data)
          setStatus("error")
          setMessage(data.error || "결제 처리 중 오류가 발생했습니다.")

          toast({
            title: "결제 오류",
            description: data.error || "결제 처리 중 오류가 발생했습니다.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("결제 처리 오류:", error)
        setStatus("error")
        setMessage("결제 처리 중 오류가 발생했습니다.")

        toast({
          title: "결제 오류",
          description: "결제 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    }

    processPayment()
  }, [searchParams, isProcessed])

  const handleGoBack = () => {
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
            {status === "processing" && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground">결제를 처리하고 있습니다...</p>
              </div>
            )}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-500" />}
            {status === "error" && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <CardTitle className={status === "success" ? "text-green-700" : status === "error" ? "text-red-700" : ""}>
            {status === "processing" && "결제 처리 중"}
            {status === "success" && "결제 완료"}
            {status === "error" && "결제 오류"}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>

          {status === "success" && coins > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <Coins className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-700 dark:text-green-400">{coins}핑이 충전되었습니다!</span>
              </div>
            </div>
          )}

          {orderId && <div className="text-xs text-muted-foreground">주문번호: {orderId}</div>}

          <div className="flex flex-col space-y-2 pt-4">
            {status === "success" && (
              <Button onClick={handleGoHome} className="w-full">
                홈으로 이동
              </Button>
            )}

            <Button variant={status === "success" ? "outline" : "default"} onClick={handleGoBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {status === "error" ? "다시 시도" : "코인 충전소로"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
