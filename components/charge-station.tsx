"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

type SubscriptionPkg = {
  id: string
  name: string
  coins: number
  price: number
  crossedPrice?: number
  accent?: "cyan" | "green" | "red"
  tag?: string
  subtitle?: string
  period: string
  isCurrentPlan?: boolean
}

const KRW = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 })
function formatKRW(v: number) {
  return KRW.format(v).replace("₩", "₩")
}

const SUBSCRIPTION_PACKAGES: SubscriptionPkg[] = [
  {
    id: "starter",
    name: "Starter",
    coins: 10,
    price: 9900,
    crossedPrice: 14000,
    subtitle: "하루에 10핑씩 제공",
    accent: "cyan",
    period: "주",
    isCurrentPlan: false,
  },
  {
    id: "plus",
    name: "Plus",
    coins: 30,
    price: 19900,
    crossedPrice: 42000,
    subtitle: "하루에 30핑씩 제공",
    accent: "green",
    period: "주",
    isCurrentPlan: false,
  },
  {
    id: "pro",
    name: "Pro",
    coins: 100,
    price: 49900,
    crossedPrice: 140000,
    subtitle: "하루에 100핑씩 제공",
    accent: "red",
    period: "주",
    isCurrentPlan: false,
  },
]

const BONUS: { id: string; name: string; coins: number; buttonText: string; action: () => void }[] = [
  {
    id: "friend-referral",
    name: "친구추천",
    coins: 20,
    buttonText: "초대 코드 복사",
    action: () => {
      navigator.clipboard?.writeText("SAJUPING2024")
    },
  },
]

export default function ChargeStation() {
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [userCoins, setUserCoins] = useState({
    total: 0,
    subscription: 0,
    bonus: 0,
    plan: null,
  })
  const [loadingCoins, setLoadingCoins] = useState(false)

  const fetchBalance = async () => {
    if (!isAuthenticated || !user) return

    try {
      setLoadingCoins(true)
      const response = await fetch("/api/user-coins")
      if (response.ok) {
        const data = await response.json()
        const total = (data.subscription_coins || 0) + (data.bonus_coins || 0)
        setBalance(total)
        setUserCoins({
          total,
          subscription: data.subscription_coins || 0,
          bonus: data.bonus_coins || 0,
          plan: data.subscription_plan || "Free Plan",
        })
      }
    } catch (error) {
      console.error("핑 정보 조회 오류:", error)
    } finally {
      setLoadingCoins(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [isAuthenticated, user])

  const onSubscribe = async (pkg: SubscriptionPkg) => {
    const params = new URLSearchParams({
      packageId: pkg.id,
      name: pkg.name,
      coins: pkg.coins.toString(),
      price: pkg.price.toString(),
      isSubscription: "true",
      period: pkg.period,
      userEmail: "skyywwind@gmail.com",
    })

    router.push(`/payment?${params.toString()}`)
  }

  const handleBonusAction = (bonus: (typeof BONUS)[0]) => {
    bonus.action()
    if (bonus.id === "friend-referral") {
      toast({ title: "초대 코드 복사됨", description: "친구에게 공유해보세요!" })
    }
  }

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  const getDiscountPercent = (price: number, crossedPrice?: number) => {
    if (!crossedPrice) return null
    const discount = Math.round((1 - price / crossedPrice) * 100)
    return `-${discount}%`
  }

  const getAccentColor = (accent?: string) => {
    switch (accent) {
      case "cyan":
        return "#28d0ed"
      case "green":
        return "#1ed45a"
      case "red":
        return "#ff6363"
      default:
        return "#28d0ed"
    }
  }

  return (
    <div className="min-h-screen bg-[#1b1c1e] text-white">
      <div className="sticky top-0 z-10 bg-[#1b1c1e] border-b border-[#70737c]/20">
        <div className="flex items-center justify-between p-4">
          <button aria-label="닫기" onClick={handleGoBack} className="p-2 text-[#aeb0b6] hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6">
        <section className="pt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-medium text-white">나의 플랜</span>
            <span className="text-2xl font-medium text-[#28d0ed]">{userCoins.plan}</span>
          </div>
          <p className="text-[#aeb0b6] text-sm">
            오프라인 사주보다 10배 합리적인 사주핑에서
            <br />
            마음껏 질문하세요!
          </p>
          <p className="text-[#ffa938] text-xs font-medium">구독중에는 구독핑이 보너스핑보다 우선 소진됩니다.</p>
        </section>

        {isAuthenticated && (
          <section className="space-y-3">
            <h3 className="text-white text-base font-medium">현재 나의 핑</h3>
            <Card className="bg-[#141415] border-[#70737c]/20">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#ffa938] flex items-center justify-center">
                      <span className="text-black text-sm font-bold">P</span>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {loadingCoins ? "..." : `${userCoins.total}핑`}
                    </span>
                  </div>
                  <div className="text-xs text-[#aeb0b6] space-y-1">
                    <div>
                      구독핑: {userCoins.subscription}핑 | 보너스핑: {userCoins.bonus}핑
                    </div>
                    <div>구독핑이 우선적으로 소비되고 다 소진되고 나면 보너스핑이 사용됩니다</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-[#aeb0b6] text-sm font-medium">현재 플랜</h3>
          <Card className="bg-[#141415] border-[#70737c]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[#aeb0b6] px-2 py-1 bg-[#70737c]/20 rounded text-xs">{userCoins.plan}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#ffa938] flex items-center justify-center">
                      <span className="text-black text-xs font-bold">P</span>
                    </div>
                    <span className="text-white text-sm">하루에 3핑씩</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#70737c]/20 rounded-full">
                  <Check size={14} className="text-[#1ed45a]" />
                  <span className="text-white text-xs">현재 플랜</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-white text-base font-medium">일반 패키지</h3>
          <div className="space-y-3">
            {SUBSCRIPTION_PACKAGES.map((pkg) => {
              const discountPercent = getDiscountPercent(pkg.price, pkg.crossedPrice)
              const accentColor = getAccentColor(pkg.accent)

              return (
                <Card
                  key={pkg.id}
                  className="bg-[#141415] border-[#70737c]/20 cursor-pointer hover:bg-[#1a1b1d] transition-colors"
                  onClick={() => onSubscribe(pkg)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: accentColor }}>
                            {pkg.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#ffa938] flex items-center justify-center">
                            <span className="text-black text-xs font-bold">P</span>
                          </div>
                          <span className="text-white text-sm">{pkg.subtitle}</span>
                        </div>
                        {pkg.crossedPrice && discountPercent && (
                          <div className="flex items-center gap-2">
                            <span className="line-through text-[#70737c] text-xs">{formatKRW(pkg.crossedPrice)}</span>
                            <span className="text-xs font-medium" style={{ color: accentColor }}>
                              {discountPercent}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Button className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm">
                          {formatKRW(pkg.price)}/{pkg.period}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-white text-base font-medium">보너스 패키지</h3>
          <div className="space-y-3">
            {BONUS.map((bonus) => (
              <Card key={bonus.id} className="bg-[#141415] border-[#70737c]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm">{bonus.name}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-[#ffa938] flex items-center justify-center">
                          <span className="text-black text-xs font-bold">P</span>
                        </div>
                        <span className="text-[#ffa938] text-sm font-medium">{bonus.coins}핑</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleBonusAction(bonus)}
                      className="bg-[#70737c]/20 text-white hover:bg-[#70737c]/30 border-[#70737c]/20 text-sm px-4 rounded-lg"
                    >
                      {bonus.buttonText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="text-center pt-6 pb-4">
          <div className="inline-flex items-center gap-1 text-[#aeb0b6] text-xs">
            <div className="w-3 h-3 bg-[#aeb0b6] rounded-sm"></div>
            <span>sajuping.ai</span>
          </div>
        </div>
      </div>
    </div>
  )
}
