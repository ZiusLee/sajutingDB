"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

type Pkg = {
  id: string
  name: string
  coins: number
  price: number
  crossedPrice?: number
  bonus?: number
  accent?: "cyan" | "orange" | "rose"
  tag?: string
  subtitle?: string
}

const CYAN = "#28d0ed"
const ORANGE = "#ffa938"

const KRW = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 })
function formatKRW(v: number) {
  return KRW.format(v).replace("₩", "₩")
}

const RECOMMENDED: Pkg = {
  id: "daily-30",
  name: "주간구독",
  coins: 30,
  price: 9900,
  crossedPrice: 97500,
  subtitle: "매일 30핑 제공",
  accent: "cyan",
  tag: "주간구독",
}

const GENERAL: Pkg[] = [
  { id: "basic-20", name: "Basic", coins: 20, price: 9900 },
  { id: "premium-60", name: "Premium", coins: 60, bonus: 20, price: 29900, crossedPrice: 39900 },
  { id: "heritage-100", name: "Heritage", coins: 100, bonus: 100, price: 49900, crossedPrice: 99900 },
]

const BONUS: { id: string; name: string; coins: number; buttonText: string; action: () => void }[] = [
  {
    id: "friend-referral",
    name: "친구추천",
    coins: 20,
    buttonText: "초대 코드 복사",
    action: () => {
      navigator.clipboard?.writeText("SAJUPING2024")
      // toast will be handled in component
    },
  },
  {
    id: "feedback",
    name: "피드백",
    coins: 3,
    buttonText: "피드백 작성",
    action: () => {
      window.open("/feedback", "_blank")
    },
  },
]

async function fetchBalance(): Promise<number> {
  try {
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
      await new Promise((r) => setTimeout(r, 250))
      return 26
    }
  } catch {}
  try {
    const res = await fetch("/api/user-coins", { cache: "no-store" })
    const data = await res.json().catch(() => ({}))
    if (typeof data?.balance === "number") return data.balance
    if (typeof data?.coins === "number") return data.coins
    return 0
  } catch {
    return 0
  }
}

export default function ChargeStation() {
  const { toast } = useToast()
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    fetchBalance().then(setBalance)
  }, [])

  const onPurchase = async (pkg: Pkg) => {
    const params = new URLSearchParams({
      packageId: pkg.id,
      name: pkg.name,
      coins: pkg.coins.toString(),
      price: pkg.price.toString(),
      isSubscription: (pkg.id === "daily-30").toString(),
      userEmail: "skyywwind@gmail.com", // This should come from user session
    })

    if (pkg.bonus) {
      params.set("bonus", pkg.bonus.toString())
    }

    router.push(`/payment?${params.toString()}`)
  }

  const handleBonusAction = (bonus: (typeof BONUS)[0]) => {
    bonus.action()
    if (bonus.id === "friend-referral") {
      toast({ title: "초대 코드 복사됨", description: "친구에게 공유해보세요!" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 bg-[#1b1c1e]/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-[#70737c]/20">
        <div className="mx-auto max-w-md md:max-w-lg px-4 md:px-6 h-12 flex items-center justify-between">
          <button
            aria-label="닫기"
            onClick={() => (typeof window !== "undefined" ? window.history.back() : null)}
            className="inline-flex items-center justify-center rounded-md p-2 text-[#aeb0b6] hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
          <div className="text-sm text-[#aeb0b6]">sajuping.ai</div>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-2xl font-medium">
          <span className="text-white">나의 핑</span>
          <span className="text-[#28d0ed] tabular-nums">{balance === null ? "로딩중..." : `${balance}핑`}</span>
          <div className="w-6 h-6 rounded-full bg-[#ffa938] flex items-center justify-center">
            <span className="text-black text-sm font-bold">P</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#aeb0b6]">
          오프라인 사주보다 10배 합리적인 사주핑에서 마음껏 질문하세요!
        </p>
      </section>

      <section className="space-y-3">
        <div className="text-base font-medium text-white">추천 패키지</div>
        <Card className="bg-[#141415] border-[#70737c]/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-[#28d0ed]/20 text-[#28d0ed]">
                    {RECOMMENDED.tag}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#ffa938] flex items-center justify-center">
                    <span className="text-black text-sm font-bold">P</span>
                  </div>
                  <span className="text-white font-medium">{RECOMMENDED.subtitle}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {RECOMMENDED.crossedPrice && (
                    <span className="line-through text-[#70737c]">{formatKRW(RECOMMENDED.crossedPrice)}</span>
                  )}
                  <span className="text-[#28d0ed] font-medium">-89%</span>
                </div>
              </div>
              <Button
                onClick={() => onPurchase(RECOMMENDED)}
                className="rounded-lg bg-[#28d0ed] hover:bg-[#28d0ed]/90 text-black font-semibold px-6"
              >
                {formatKRW(RECOMMENDED.price)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="text-base font-medium text-white">일반 패키지</div>
        <div className="space-y-3">
          {GENERAL.map((pkg) => {
            const hasBonus = typeof pkg.bonus === "number" && pkg.bonus > 0
            const discountPercent = pkg.name === "Premium" ? "-33%" : pkg.name === "Heritage" ? "-50%" : null

            return (
              <Card key={pkg.id} className="bg-[#141415] border-[#70737c]/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[#aeb0b6] text-sm">{pkg.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-[#ffa938] flex items-center justify-center">
                          <span className="text-black text-sm font-bold">P</span>
                        </div>
                        <span className="text-white font-medium">{pkg.coins}핑</span>
                        {hasBonus && <span className="text-[#28d0ed] text-sm font-medium">+{pkg.bonus}핑</span>}
                      </div>
                      {pkg.crossedPrice && discountPercent && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="line-through text-[#70737c]">{formatKRW(pkg.crossedPrice)}</span>
                          <span className="text-[#28d0ed] font-medium">{discountPercent}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => onPurchase(pkg)}
                      variant="secondary"
                      className="rounded-lg bg-white text-black hover:bg-white/90 font-semibold px-6"
                    >
                      {formatKRW(pkg.price)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-base font-medium text-white">보너스 패키지</div>
        <div className="space-y-3">
          {BONUS.map((bonus) => (
            <Card key={bonus.id} className="bg-[#141415] border-[#70737c]/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#aeb0b6] text-sm">{bonus.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-[#ffa938] flex items-center justify-center">
                        <span className="text-black text-xs font-bold">P</span>
                      </div>
                      <span className="text-white text-sm font-medium">{bonus.coins}핑</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleBonusAction(bonus)}
                    variant="secondary"
                    className="rounded-lg bg-[#70737c]/20 text-white hover:bg-[#70737c]/30 border-[#70737c]/20 text-sm px-4"
                  >
                    {bonus.buttonText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
