"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, CreditCard, Gift, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CoinPackage {
  id: string
  name: string
  coins: number
  price: number
  bonus?: number
  popular?: boolean
  description: string
}

const packages: CoinPackage[] = [
  {
    id: "starter",
    name: "스타터",
    coins: 30,
    price: 1000,
    description: "가볍게 시작하기",
  },
  {
    id: "basic",
    name: "베이직",
    coins: 80,
    price: 2500,
    bonus: 5,
    description: "기본 패키지",
  },
  {
    id: "standard",
    name: "스탠다드",
    coins: 170,
    price: 5000,
    bonus: 20,
    popular: true,
    description: "가장 인기 있는 패키지",
  },
  {
    id: "premium",
    name: "프리미엄",
    coins: 350,
    price: 10000,
    bonus: 50,
    description: "많이 사용하는 분들께",
  },
  {
    id: "mega",
    name: "메가",
    coins: 650,
    price: 18000,
    bonus: 100,
    description: "최대 용량",
  },
]

export default function CoinShopPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [userCoins, setUserCoins] = useState<number>(0)

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    fetchUserCoins()
  }, [user, router])

  const fetchUserCoins = async () => {
    try {
      const response = await fetch("/api/user-coins")
      if (response.ok) {
        const data = await response.json()
        setUserCoins(data.coins || 0)
      }
    } catch (error) {
      console.error("Failed to fetch user coins:", error)
    }
  }

  const handlePurchase = async (pkg: CoinPackage) => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "코인 구매를 위해 로그인해 주세요.",
        variant: "destructive",
      })
      router.push("/auth")
      return
    }

    setLoading(true)
    try {
      // 1. 주문 준비
      const prepareResponse = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: pkg.id,
          amount: pkg.price,
          coins: pkg.coins + (pkg.bonus || 0),
          orderName: `${pkg.name} 패키지 (${pkg.coins + (pkg.bonus || 0)}핑)`,
        }),
      })

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json()
        throw new Error(errorData.error || "주문 준비 실패")
      }

      const { orderId, amount, orderName } = await prepareResponse.json()

      // 2. 토스페이먼츠 위젯 로드 및 실행
      const { loadTossPayments } = await import("@tosspayments/payment-sdk")

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY!)

      const payment = tossPayments.payment({
        amount: amount,
        orderId: orderId,
        orderName: orderName,
        customerName: user.user_metadata?.full_name || user.email?.split("@")[0] || "사용자",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })

      // 3. 결제 창 호출
      await payment.requestPayment({
        method: "CARD",
      })
    } catch (error) {
      console.error("결제 오류:", error)
      toast({
        title: "결제 오류",
        description: error instanceof Error ? error.message : "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmPurchase = () => {
    if (selectedPackage) {
      setShowConfirmDialog(false)
      handlePurchase(selectedPackage)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Coins className="w-8 h-8 text-yellow-500" />
              코인 충전소
            </h1>
            <p className="text-gray-600 mt-2">
              현재 보유 코인: <span className="font-semibold text-yellow-600">{userCoins}핑</span>
            </p>
          </div>
        </div>

        {/* 패키지 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative transition-all hover:shadow-lg ${
                pkg.popular ? "ring-2 ring-purple-500 shadow-lg" : ""
              }`}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white">
                  인기
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{pkg.coins}핑</div>
                  {pkg.bonus && (
                    <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-1">
                      <Gift className="w-4 h-4" />
                      보너스 +{pkg.bonus}핑
                    </div>
                  )}
                  <div className="text-lg font-semibold mt-2">₩{pkg.price.toLocaleString()}</div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedPackage(pkg)
                    setShowConfirmDialog(true)
                  }}
                  disabled={loading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  구매하기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 안내사항 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">💡 이용 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• 구매한 코인은 사주 상담, 궁합 분석 등에 사용됩니다</p>
            <p>• 코인은 환불되지 않으니 신중하게 구매해 주세요</p>
            <p>• 보너스 코인은 패키지와 함께 즉시 지급됩니다</p>
            <p>• 결제는 토스페이먼츠를 통해 안전하게 처리됩니다</p>
          </CardContent>
        </Card>
      </div>

      {/* 구매 확인 다이얼로그 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>구매 확인</DialogTitle>
            <DialogDescription>선택한 패키지를 구매하시겠습니까?</DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>패키지:</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>기본 코인:</span>
                  <span>{selectedPackage.coins}핑</span>
                </div>
                {selectedPackage.bonus && (
                  <div className="flex justify-between text-green-600">
                    <span>보너스 코인:</span>
                    <span>+{selectedPackage.bonus}핑</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>총 코인:</span>
                    <span className="text-yellow-600">{selectedPackage.coins + (selectedPackage.bonus || 0)}핑</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>결제 금액:</span>
                    <span>₩{selectedPackage.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              취소
            </Button>
            <Button onClick={confirmPurchase} disabled={loading}>
              {loading ? "처리 중..." : "결제하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
