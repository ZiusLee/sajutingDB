"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, CreditCard, Gift, Zap } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "@/hooks/use-toast"

interface CoinPackage {
  id: string
  name: string
  coins: number
  price: number
  bonus: number
  popular?: boolean
  icon: React.ReactNode
}

const coinPackages: CoinPackage[] = [
  {
    id: "starter",
    name: "스타터",
    coins: 30,
    price: 3000,
    bonus: 0,
    icon: <Coins className="w-6 h-6" />,
  },
  {
    id: "basic",
    name: "베이직",
    coins: 100,
    price: 9000,
    bonus: 10,
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "standard",
    name: "스탠다드",
    coins: 200,
    price: 17000,
    bonus: 30,
    popular: true,
    icon: <Gift className="w-6 h-6" />,
  },
  {
    id: "premium",
    name: "프리미엄",
    coins: 350,
    price: 28000,
    bonus: 50,
    icon: <CreditCard className="w-6 h-6" />,
  },
  {
    id: "mega",
    name: "메가",
    coins: 650,
    price: 50000,
    bonus: 100,
    icon: <Coins className="w-6 h-6 text-yellow-500" />,
  },
]

export default function CoinShopPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [userCoins, setUserCoins] = useState<number>(0)
  const [loading, setLoading] = useState(false)

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
      console.error("코인 조회 실패:", error)
    }
  }

  const handlePurchase = async (packageData: CoinPackage) => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "결제를 위해 로그인이 필요합니다.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // 1. 결제 준비
      const prepareResponse = await fetch("/api/payments/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: packageData.id,
          amount: packageData.price,
          coins: packageData.coins + packageData.bonus,
          orderName: `${packageData.name} 패키지 (${packageData.coins + packageData.bonus}핑)`,
        }),
      })

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json()
        throw new Error(errorData.error || "주문 준비 실패")
      }

      const { orderId, amount, orderName } = await prepareResponse.json()

      // 2. 토스페이먼츠 결제창 호출
      const { loadTossPayments } = await import("@tosspayments/payment-sdk")

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY!)

      await tossPayments.requestPayment("카드", {
        amount,
        orderId,
        orderName,
        customerName: user.user_metadata?.full_name || user.email?.split("@")[0] || "사용자",
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      })
    } catch (error: any) {
      console.error("결제 오류:", error)
      toast({
        title: "결제 오류",
        description: error.message || "결제 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">코인 충전소</h1>
        <p className="text-muted-foreground mb-4">사주팅에서 사용할 수 있는 핑을 충전하세요</p>
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span>보유 핑: {userCoins.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coinPackages.map((pkg) => (
          <Card key={pkg.id} className={`relative ${pkg.popular ? "ring-2 ring-blue-500" : ""}`}>
            {pkg.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">인기</Badge>
            )}
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">{pkg.icon}</div>
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription>
                <div className="text-2xl font-bold text-primary">{pkg.price.toLocaleString()}원</div>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <div className="text-lg font-semibold">{pkg.coins.toLocaleString()}핑</div>
                {pkg.bonus > 0 && <div className="text-sm text-green-600 font-medium">+ 보너스 {pkg.bonus}핑</div>}
                <div className="text-sm text-muted-foreground mt-1">
                  총 {(pkg.coins + pkg.bonus).toLocaleString()}핑
                </div>
              </div>

              <Button onClick={() => handlePurchase(pkg)} disabled={loading} className="w-full" size="lg">
                {loading ? "처리중..." : "구매하기"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>• 결제는 토스페이먼츠를 통해 안전하게 처리됩니다</p>
        <p>• 구매한 핑은 즉시 계정에 충전됩니다</p>
        <p>• 결제 관련 문의는 고객센터로 연락해주세요</p>
      </div>
    </div>
  )
}
