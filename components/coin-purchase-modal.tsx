"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Crown, Zap } from "lucide-react"
import { COIN_PACKAGES } from "@/lib/toss-payments"
import { loadTossPayments } from "@tosspayments/payment-sdk"

interface CoinPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (coins: number) => void
}

export function CoinPurchaseModal({ isOpen, onClose, onSuccess }: CoinPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePurchase = async (packageId: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    setSelectedPackage(packageId)

    try {
      // 결제 준비
      const prepareResponse = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packageId }),
      })

      if (!prepareResponse.ok) {
        const error = await prepareResponse.json()
        throw new Error(error.error || "결제 준비에 실패했습니다.")
      }

      const { orderId, amount, orderName, customerName, customerEmail } = await prepareResponse.json()

      // Toss Payments SDK 로드
      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY!)

      // 결제 요청
      await tossPayments.requestPayment("카드", {
        amount,
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error) {
      console.error("결제 오류:", error)
      alert(error instanceof Error ? error.message : "결제 중 오류가 발생했습니다.")
    } finally {
      setIsProcessing(false)
      setSelectedPackage(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <Coins className="h-5 w-5 mr-2 text-amber-500" />핑 충전하기
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {COIN_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`bg-slate-800 border-slate-600 hover:border-amber-500 transition-colors cursor-pointer ${
                pkg.popular ? "ring-2 ring-amber-500" : ""
              }`}
              onClick={() => handlePurchase(pkg.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {pkg.id === "premium" && <Crown className="h-5 w-5 text-amber-500 mr-1" />}
                      {pkg.id === "standard" && <Zap className="h-5 w-5 text-blue-500 mr-1" />}
                      <Coins className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-white">{pkg.name}</h3>
                        {pkg.popular && (
                          <Badge variant="secondary" className="bg-amber-500 text-black text-xs">
                            인기
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{pkg.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{pkg.price.toLocaleString()}원</p>
                    <p className="text-sm text-amber-400">{pkg.coins}핑</p>
                  </div>
                </div>

                {isProcessing && selectedPackage === pkg.id && (
                  <div className="mt-3 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                    <span className="ml-2 text-sm text-gray-400">결제 처리 중...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">안전한 결제를 위해 토스페이먼츠를 사용합니다</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
