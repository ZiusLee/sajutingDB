'use client'

import { useEffect, useMemo, useState } from "react"
import { Coins, X, Zap, Crown, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
  name: "추천구독",
  coins: 30,
  price: 9900,
  crossedPrice: 89500,
  subtitle: "매일 30핑 제공",
  accent: "cyan",
  tag: "구독",
}

const GENERAL: Pkg[] = [
  { id: "basic-20", name: "Basic", coins: 20, price: 9900, accent: "orange" },
  { id: "premium-80", name: "Premium", coins: 80, bonus: 20, price: 29900, crossedPrice: 44900, accent: "cyan" },
  { id: "heritage-200", name: "Heritage", coins: 200, bonus: 100, price: 49900, crossedPrice: 99900, accent: "rose" },
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

async function postPurchase(delta: number, meta: Record<string, any>) {
  try {
    if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
      await new Promise((r) => setTimeout(r, 400))
      return { ok: true }
    }
  } catch {}
  const res = await fetch("/api/user-coins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta, type: "purchase", ...meta }),
  })
  if (!res.ok) throw new Error("결제 실패")
  return await res.json().catch(() => ({ ok: true }))
}

export default function ChargeStation() {
  const { toast } = useToast()
  const [balance, setBalance] = useState<number | null>(null)
  const [autoCharge, setAutoCharge] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const [selected, setSelected] = useState<Pkg | null>(null)

  useEffect(() => {
    fetchBalance().then(setBalance)
  }, [])

  const nextChargeDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const onPurchase = async (pkg: Pkg) => {
    const delta = pkg.coins + (pkg.bonus ?? 0)
    setPending(pkg.id)
    const old = balance ?? 0
    setBalance(old + delta)
    try {
      await postPurchase(delta, { packageId: pkg.id })
      toast({ title: "결��� 완료", description: `${pkg.name} 구매로 ${delta}핑이 적립되었습니다.` })
    } catch (e: any) {
      setBalance(old) // revert
      toast({ title: "결제에 실패했어요", description: e?.message || "다시 시도해주세요.", variant: "destructive" })
    } finally {
      setPending(null)
      setSelected(null)
    }
  }

  const coinPill = (count: number) => (
    <div className="inline-flex items-center gap-1 rounded-full bg-[#1b1c1e] px-2 py-1 text-xs text-white/90 ring-1 ring-white/10">
      <Coins size={14} color={ORANGE} />
      <span className="tabular-nums">{count}핑</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 bg-[#0f0f10]/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-white/5">
        <div className="mx-auto max-w-md md:max-w-lg px-4 md:px-6 h-12 flex items-center justify-between">
          <button
            aria-label="닫기"
            onClick={() => (typeof window !== "undefined" ? window.history.back() : null)}
            className="inline-flex items-center justify-center rounded-md p-2 text-white/70 hover:text-white hover:bg-white/5"
          >
            <X size={18} />
          </button>
          <div className="text-sm text-white/50">sajuping.ai</div>
        </div>
      </div>

      {/* Header - balance */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span>나의 핑</span>
          <Coins size={18} color={ORANGE} />
          <span className="tabular-nums">{balance === null ? "로딩중..." : `${balance}핑`}</span>
          <span className="ml-2 text-xs text-white/50 rounded bg-white/5 px-2 py-0.5">
            {autoCharge ? "자동충전 ON" : "자동충전 OFF"}
          </span>
        </div>
        <p className="text-sm leading-6 text-white/60">
          오프라인 사주보다 10배 합리적인 사주핑에서 마음껏 질문해요!
        </p>
      </section>

      {/* Auto-charge banner */}
      <Card className="bg-[#121315] border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-7 px-3 rounded-full text-xs font-medium flex items-center justify-center ${
                  autoCharge ? "bg-[rgba(40,208,237,0.15)] text-[${CYAN}]" : "bg-white/5 text-white/70"
                }`}
                style={autoCharge ? { color: CYAN } : undefined}
              >
                자동충전 {autoCharge ? "ON" : "OFF"}
              </div>
              {autoCharge && (
                <div className="text-xs text-white/50">{nextChargeDate}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">자동충전</span>
              <Switch checked={autoCharge} onCheckedChange={setAutoCharge} />
            </div>
          </div>
          <div className="mt-3 text-xs text-white/50">
            자동충전을 켜두면 월간 구독으로 안정적으로 핑을 받아볼 수 있어요.
          </div>
        </CardContent>
      </Card>

      {/* Recommended package */}
      <section className="space-y-3">
        <div className="text-sm text-white/70">추천 패키지</div>
        <Card className="bg-[#121315] border-white/10 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  className="bg-[rgba(40,208,237,0.15)] text-[color:var(--c)] border-0"
                  style={{ ["--c" as any]: CYAN }}
                >
                  {RECOMMENDED.name}
                </Badge>
                <Badge variant="secondary" className="bg-white/5 border-white/10 text-white/70">
                  무제한
                </Badge>
              </div>
              <div className="text-xs text-white/50">구독</div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="text-base font-medium">{RECOMMENDED.subtitle}</div>
                <div className="mt-1 text-xs text-white/50 flex items-center gap-2">
                  {RECOMMENDED.crossedPrice && (
                    <span className="line-through decoration-white/30">
                      {formatKRW(RECOMMENDED.crossedPrice)}
                    </span>
                  )}
                  <span className="text-[color:var(--c)]" style={{ ["--c" as any]: CYAN }}>
                    -89%
                  </span>
                </div>
              </div>
              <AlertDialog onOpenChange={(o) => !o && setSelected(null)} open={selected?.id === RECOMMENDED.id}>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={() => setSelected(RECOMMENDED)}
                    className="rounded-lg bg-[color:var(--c)] hover:opacity-90 text-black font-semibold"
                    style={{ ["--c" as any]: CYAN }}
                  >
                    {formatKRW(RECOMMENDED.price)}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#121315] text-white border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle>구독 결제 진행</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                      {RECOMMENDED.subtitle} - 매일 {RECOMMENDED.coins}핑을 제공합니다. 계속하시겠어요?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                      취소
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-[color:var(--c)] text-black hover:opacity-90"
                      style={{ ["--c" as any]: CYAN }}
                      onClick={() => onPurchase(RECOMMENDED)}
                      disabled={pending === RECOMMENDED.id}
                    >
                      {pending === RECOMMENDED.id ? "진행중..." : `${formatKRW(RECOMMENDED.price)} 결제`}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* General packages */}
      <section className="space-y-3">
        <div className="text-sm text-white/70">일반 패키지</div>
        <div className="space-y-3">
          {GENERAL.map((pkg) => {
            const hasBonus = typeof pkg.bonus === "number" && pkg.bonus > 0
            const accentColor =
              pkg.accent === "cyan" ? CYAN : pkg.accent === "orange" ? ORANGE : "#ff6363"
            return (
              <Card key={pkg.id} className="bg-[#121315] border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-white/70">{pkg.name}</div>
                        {pkg.name === "Premium" && (
                          <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[rgba(40,208,237,0.15)]" style={{ color: CYAN }}>
                            <Zap size={12} />
                            인기
                          </div>
                        )}
                        {pkg.name === "Heritage" && (
                          <div className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/70">
                            <Crown size={12} />
                            베스트
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {coinPill(pkg.coins)}
                        {hasBonus && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-[rgba(40,208,237,0.15)] px-2 py-1 text-xs"
                               style={{ color: CYAN }}>
                            +{pkg.bonus}핑 보너스
                          </div>
                        )}
                      </div>
                      {pkg.crossedPrice && (
                        <div className="mt-1 text-xs text-white/50">
                          <span className="line-through decoration-white/30 mr-2">{formatKRW(pkg.crossedPrice)}</span>
                          <span className="text-[color:var(--c)]" style={{ ["--c" as any]: CYAN }}>
                            -{pkg.name === "Premium" ? "33%" : "50%"}
                          </span>
                        </div>
                      )}
                    </div>

                    <AlertDialog onOpenChange={(o) => !o && setSelected(null)} open={selected?.id === pkg.id}>
                      <AlertDialogTrigger asChild>
                        <Button
                          onClick={() => setSelected(pkg)}
                          variant="secondary"
                          className="rounded-lg bg-white text-black hover:bg-white/90"
                        >
                          {formatKRW(pkg.price)}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#121315] text-white border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle>구매 확인</AlertDialogTitle>
                          <AlertDialogDescription className="text-white/60">
                            {pkg.name} 패키지 구매 시 총 {pkg.coins + (pkg.bonus ?? 0)}핑이 즉시 충전됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                            취소
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-[color:var(--c)] text-black hover:opacity-90"
                            style={{ ["--c" as any]: accentColor }}
                            onClick={() => onPurchase(pkg)}
                            disabled={pending === pkg.id}
                          >
                            {pending === pkg.id ? "진행중..." : `${formatKRW(pkg.price)} 결제`}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Bonus section (optional) */}
      <section className="space-y-3">
        <div className="text-sm text-white/70">보너스 패키지</div>
        <Card className="bg-[#121315] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={18} />
                <div className="text-sm">첫 결제 보너스 +5핑</div>
              </div>
              <div className="text-xs text-white/50">자동 지급</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Terms */}
      <p className="text-xs text-white/40">
        결제 완료 시 핑은 즉시 충전됩니다. 구독은 언제든 해지할 수 있으며, 일부 결제수단은 지원되지 않을 수 있어요.
      </p>
    </div>
  )
}
