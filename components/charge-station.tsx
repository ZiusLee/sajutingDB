"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { TicketIcon } from "@/components/ticket-icon"

type SubscriptionPkg = {
  id: string
  name: string
  coins: number
  price: number
  crossedPrice?: number
  accent?: "cyan" | "green" | "red" | "gray"
  tag?: string
  subtitle?: string
  period: string
  isCurrentPlan?: boolean
  isDowngrade?: boolean
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
    subtitle: "하루에 10질문권씩 제공",
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
    subtitle: "하루에 30질문권씩 제공",
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
    subtitle: "하루에 100질문권씩 제공",
    accent: "red",
    period: "주",
    isCurrentPlan: false,
  },
  {
    id: "free",
    name: "Free Plan",
    coins: 3,
    price: 0,
    subtitle: "하루에 3질문권씩 제공",
    accent: "gray",
    period: "주",
    isCurrentPlan: false,
    isDowngrade: true,
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
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)
  const [selectedDowngradePkg, setSelectedDowngradePkg] = useState<SubscriptionPkg | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedUpgradePkg, setSelectedUpgradePkg] = useState<SubscriptionPkg | null>(null)

  const fetchBalance = async () => {
    if (!isAuthenticated || !user) return

    try {
      setLoadingCoins(true)
      const response = await fetch("/api/user-coins")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("코인 정보 조회 실패:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error("응답이 JSON이 아닙니다:", contentType, responseText)
        throw new Error("서버에서 올바르지 않은 응답을 받았습니다")
      }

      const data = await response.json()
      const total = (data.subscription_coins || 0) + (data.bonus_coins || 0)
      setBalance(total)
      setUserCoins({
        total,
        subscription: data.subscription_coins || 0,
        bonus: data.bonus_coins || 0,
        plan: data.subscription_plan || "Free Plan",
      })
    } catch (error) {
      console.error("질문권 정보 조회 오류:", error)
      // Don't show error toast for now, just log it
    } finally {
      setLoadingCoins(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [isAuthenticated, user])

  const isDowngrade = (selectedPlan: string, currentPlan: string | null) => {
    if (!currentPlan || currentPlan === "Free Plan") return false

    const planHierarchy = { free: 0, starter: 1, plus: 2, pro: 3 }
    const currentLevel = planHierarchy[currentPlan.toLowerCase() as keyof typeof planHierarchy] || 0
    const selectedLevel = planHierarchy[selectedPlan.toLowerCase() as keyof typeof planHierarchy] || 0

    return selectedLevel < currentLevel
  }

  const onSubscribe = async (pkg: SubscriptionPkg) => {
    if (isDowngrade(pkg.id, userCoins.plan)) {
      setSelectedDowngradePkg(pkg)
      setShowDowngradeDialog(true)
      return
    }

    setSelectedUpgradePkg(pkg)
    setShowUpgradeDialog(true)
  }

  const handleDowngradeConfirm = async () => {
    if (!selectedDowngradePkg) return

    try {
      const response = await fetch("/api/subscription/schedule-downgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPlan: selectedDowngradePkg.id,
          planName: selectedDowngradePkg.name,
        }),
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        toast({
          title: "다운그레이드 예약 완료",
          description: `현재 주차가 끝나면 ${selectedDowngradePkg.name}으로 전환됩니다.`,
        })
        fetchBalance()
      } else {
        throw new Error(responseData.error || "다운그레이드 예약 실패")
      }
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "다운그레이드 예약 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setShowDowngradeDialog(false)
      setSelectedDowngradePkg(null)
    }
  }

  const handleUpgradeConfirm = async () => {
    if (!selectedUpgradePkg) return

    const params = new URLSearchParams({
      packageId: selectedUpgradePkg.id,
      name: selectedUpgradePkg.name,
      coins: selectedUpgradePkg.coins.toString(),
      price: selectedUpgradePkg.price.toString(),
      isSubscription: "true",
      period: selectedUpgradePkg.period,
      userEmail: "skyywwind@gmail.com",
    })

    setShowUpgradeDialog(false)
    setSelectedUpgradePkg(null)
    router.push(`/payment?${params.toString()}`)
  }

  const handleBonusAction = (bonus: (typeof BONUS)[0]) => {
    bonus.action()
    if (bonus.id === "friend-referral") {
      toast({ title: "초대 코드 복사됨", description: "친구에게 공유해보세요!" })
    }
  }

  const handleGoBack = () => {
    try {
      if (typeof window !== "undefined") {
        // Try to go back in history first
        if (window.history.length > 1) {
          window.history.back()
        } else {
          // Fallback to home page
          router.push("/")
        }
      } else {
        router.push("/")
      }
    } catch (error) {
      // Final fallback
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
      case "gray":
        return "#70737c"
      default:
        return "#28d0ed"
    }
  }

  const getDailyPingAmount = (planName: string | null) => {
    if (!planName) return 3

    const plan = planName.toLowerCase()
    if (plan.includes("starter")) return 10
    if (plan.includes("plus")) return 30
    if (plan.includes("pro")) return 100
    return 3
  }

  const getVisiblePackages = () => {
    if (!userCoins.plan || userCoins.plan === "Free Plan") {
      return SUBSCRIPTION_PACKAGES.filter((pkg) => !pkg.isDowngrade)
    }
    return SUBSCRIPTION_PACKAGES
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#1b1c1e]/95 backdrop-blur-sm border-b border-[#70737c]/20"></div>

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
        </section>

        {isAuthenticated && (
          <section className="space-y-3">
            <h3 className="text-white text-base font-medium">현재 나의 질문권</h3>
            <Card className="bg-[#141415] border-[#70737c]/20">
              <CardContent className="p-4">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <TicketIcon className="text-[#ffa938]" size={24} />
                    <span className="text-2xl font-bold text-white">
                      {loadingCoins ? "..." : `${userCoins.total}질문권`}
                    </span>
                  </div>
                  <div className="text-xs text-[#aeb0b6] space-y-1">
                    <div>
                      구독질문권: {userCoins.subscription}질문권 | 보너스질문권: {userCoins.bonus}질문권
                    </div>
                    <div>구독중에는 구독질문권이 보너스질문권보다 우선 소진됩니다.</div>
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
                    <TicketIcon className="text-[#ffa938]" size={20} />
                    <span className="text-white text-sm">하루에 {getDailyPingAmount(userCoins.plan)}질문권씩</span>
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
            {getVisiblePackages().map((pkg) => {
              const discountPercent = getDiscountPercent(pkg.price, pkg.crossedPrice)
              const accentColor = getAccentColor(pkg.accent)
              const isCurrentUserPlan = userCoins.plan?.toLowerCase().includes(pkg.id.toLowerCase())
              const willBeDowngrade = isDowngrade(pkg.id, userCoins.plan)

              return (
                <Card
                  key={pkg.id}
                  className={`bg-[#141415] border-[#70737c]/20 cursor-pointer hover:bg-[#1a1b1d] transition-colors ${
                    isCurrentUserPlan ? "ring-1 ring-[#28d0ed]/50" : ""
                  }`}
                  onClick={() => !isCurrentUserPlan && onSubscribe(pkg)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: accentColor }}>
                            {pkg.name}
                          </span>
                          {willBeDowngrade && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                              다운그레이드
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <TicketIcon className="text-[#ffa938]" size={20} />
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
                        {isCurrentUserPlan ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#70737c]/20 rounded-lg">
                            <Check size={14} className="text-[#1ed45a]" />
                            <span className="text-white text-xs">현재 플랜</span>
                          </div>
                        ) : (
                          <Button className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm">
                            {pkg.price === 0 ? "무료 전환" : `${formatKRW(pkg.price)}/${pkg.period}`}
                          </Button>
                        )}
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
                        <TicketIcon className="text-[#ffa938]" size={20} />
                        <span className="text-[#ffa938] text-sm font-medium">{bonus.coins}질문권</span>
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
            <span>sajuping.ai</span>
          </div>
        </div>
      </div>

      {showDowngradeDialog && selectedDowngradePkg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border border-[#70737c]/20 rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-orange-400" size={24} />
              <h3 className="text-white text-lg font-semibold">다운그레이드 확인</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-[#aeb0b6] text-sm">선택하신 요금제로 변경하시겠습니까?</p>
              <div className="bg-[#70737c]/10 p-3 rounded-lg">
                <p className="text-white text-sm font-medium mb-2">다운그레이드 안내</p>
                <ul className="text-[#aeb0b6] text-xs space-y-1">
                  <li>
                    • <strong>현재 주차 종료 후</strong> 변경됩니다
                  </li>
                  <li>
                    • 그때까지는 <strong>기존 요금제가 유지</strong>됩니다
                  </li>
                  <li>
                    • 질문권 제공량도 <strong>기존 기준으로 유지</strong>됩니다
                  </li>
                  <li>
                    • <strong>다음 결제부터 새 요금제 금액으로 결제</strong>됩니다
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDowngradeDialog(false)
                  setSelectedDowngradePkg(null)
                }}
                className="flex-1 bg-[#70737c]/20 text-white hover:bg-[#70737c]/30"
              >
                취소
              </Button>
              <Button onClick={handleDowngradeConfirm} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUpgradeDialog && selectedUpgradePkg && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141415] border border-[#70737c]/20 rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-blue-400" size={24} />
              <h3 className="text-white text-lg font-semibold">업그레이드 확인</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-[#aeb0b6] text-sm">선택하신 요금제로 즉시 전환하시겠습니까?</p>
              <div className="bg-[#70737c]/10 p-3 rounded-lg">
                <p className="text-white text-sm font-medium mb-2">업그레이드 안내</p>
                <ul className="text-[#aeb0b6] text-xs space-y-1">
                  <li>
                    • 업그레이드 시 <strong>현재 요금제는 즉시 종료</strong>됩니다
                  </li>
                  <li>
                    • <strong>새 요금제 금액이 즉시 결제</strong>됩니다
                  </li>
                  <li>
                    • <strong>오늘부터 새로운 질문권 제공량이 적용</strong>됩니다
                  </li>
                  <li>
                    • <strong>남은 기간 및 질문권은 환불되지 않습니다</strong>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowUpgradeDialog(false)
                  setSelectedUpgradePkg(null)
                }}
                className="flex-1 bg-[#70737c]/20 text-white hover:bg-[#70737c]/30"
              >
                취소
              </Button>
              <Button onClick={handleUpgradeConfirm} className="flex-1 bg-blue-500 text-white hover:bg-blue-600">
                확인
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
