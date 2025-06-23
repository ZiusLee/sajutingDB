"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowLeft, Coins, Crown, Zap, Star, Gift, Construction } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const COIN_PACKAGES = [
  {
    id: "starter",
    name: "스타터 패키지",
    coins: 30,
    price: 3000,
    originalPrice: 3000,
    description: "30핑 충전",
    popular: false,
    bonus: 0,
    icon: <Coins className="h-6 w-6" />,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "basic",
    name: "베이직 패키지",
    coins: 60,
    price: 5000,
    originalPrice: 6000,
    description: "60핑 충전",
    popular: false,
    bonus: 10,
    icon: <Zap className="h-6 w-6" />,
    color: "from-green-500 to-green-600",
  },
  {
    id: "standard",
    name: "스탠다드 패키지",
    coins: 130,
    price: 10000,
    originalPrice: 13000,
    description: "130핑 충전",
    popular: true,
    bonus: 30,
    icon: <Star className="h-6 w-6" />,
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "premium",
    name: "프리미엄 패키지",
    coins: 300,
    price: 20000,
    originalPrice: 30000,
    description: "300핑 충전",
    popular: false,
    bonus: 100,
    icon: <Crown className="h-6 w-6" />,
    color: "from-amber-500 to-amber-600",
  },
  {
    id: "mega",
    name: "메가 패키지",
    coins: 650,
    price: 40000,
    originalPrice: 65000,
    description: "650핑 충전",
    popular: false,
    bonus: 250,
    icon: <Gift className="h-6 w-6" />,
    color: "from-pink-500 to-pink-600",
  },
]

export default function CoinShopPage() {
  const router = useRouter()
  const [userCoins, setUserCoins] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData?.session) {
          router.push("/login?returnUrl=/coin-shop")
          return
        }

        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          setUser(userData.user)
          await loadUserCoins()
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
        // 페이지 로드 완료 후 바로 점검 모달 표시
        setShowMaintenanceModal(true)
      }
    }

    checkAuth()
  }, [router, supabase])

  const loadUserCoins = async () => {
    try {
      const response = await fetch("/api/user-coins")
      if (response.ok) {
        const data = await response.json()
        setUserCoins(data.coins || 0)
      }
    } catch (error) {
      console.error("코인 정보 로드 오류:", error)
    }
  }

  const handleGoBack = () => {
    setShowMaintenanceModal(false)
    router.back()
  }

  const handlePurchase = async (packageId: string) => {
    // ===== 결제 기능 임시 비활성화 =====
    // 이 함수는 현재 호출되지 않지만 나중을 위해 보존
    return
  }

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      {/* 점검 중 모달 */}
      <Dialog open={showMaintenanceModal} onOpenChange={setShowMaintenanceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
              <Construction className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle className="text-xl font-bold">결제 기능 준비 중</DialogTitle>
            <DialogDescription className="text-center space-y-2">
              <div>안전하고 편리한 결제 시스템을 준비하고 있습니다.</div>
              <div className="text-sm text-muted-foreground">곧 더 나은 서비스로 찾아뵙겠습니다!</div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-6">
            <Button onClick={handleGoBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              돌아가기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 메인 콘텐츠 (음영 처리) */}
      <div
        className={`transition-all duration-300 ${showMaintenanceModal ? "blur-sm opacity-50 pointer-events-none" : ""}`}
      >
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">코인 충전소</h1>
                <p className="text-muted-foreground">사주핑과 더 많은 대화를 나누세요</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
              <Coins className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-amber-700 dark:text-amber-400">보유 코인: {userCoins}핑</span>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-8 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded-full">
                <Coins className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">핑(Ping) 사용 안내</h3>
                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• 질문 1개당 1핑이 소모됩니다</li>
                  <li>• 충전한 핑은 영구적으로 보관됩니다</li>
                  <li>• 패키지별로 보너스 핑을 추가로 드립니다</li>
                  <li>• 안전한 결제를 위해 토스페이먼츠를 사용합니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 패키지 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COIN_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                  pkg.popular ? "ring-2 ring-purple-500 shadow-lg" : "hover:shadow-md"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    인기
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div
                    className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${pkg.color} flex items-center justify-center text-white mb-4`}
                  >
                    {pkg.icon}
                  </div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                  {/* 가격 정보 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-3xl font-bold">{pkg.price.toLocaleString()}원</span>
                      {pkg.originalPrice > pkg.price && (
                        <span className="text-lg text-muted-foreground line-through">
                          {pkg.originalPrice.toLocaleString()}원
                        </span>
                      )}
                    </div>
                    {pkg.originalPrice > pkg.price && (
                      <Badge variant="destructive" className="text-xs">
                        {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}% 할인
                      </Badge>
                    )}
                  </div>

                  {/* 코인 정보 */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">기본 핑</span>
                      <span className="font-semibold">{pkg.coins - pkg.bonus}핑</span>
                    </div>
                    {pkg.bonus > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600 dark:text-green-400">보너스 핑</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">+{pkg.bonus}핑</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="font-semibold">총 핑</span>
                      <span className="text-lg font-bold text-amber-600">{pkg.coins}핑</span>
                    </div>
                  </div>

                  {/* 구매 버튼 (비활성화) */}
                  <Button
                    disabled
                    className={`w-full bg-gradient-to-r ${pkg.color} opacity-50 text-white font-semibold py-3 cursor-not-allowed`}
                  >
                    준비 중
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 하단 안내 */}
          <div className="mt-12 text-center space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-3">결제 관련 안내</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong className="text-foreground">안전한 결제</strong>
                  <p>토스페이먼츠의 보안 시스템으로 안전하게 결제됩니다</p>
                </div>
                <div>
                  <strong className="text-foreground">즉시 충전</strong>
                  <p>결제 완료 즉시 핑이 계정에 충전됩니다</p>
                </div>
                <div>
                  <strong className="text-foreground">고객 지원</strong>
                  <p>결제 관련 문의사항은 고객센터로 연락주세요</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              결제 시 문제가 발생하면 새로고침 후 다시 시도해주세요. 중복 결제 방지를 위해 결제 완료 전까지 페이지를
              새로고침하지 마세요.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
