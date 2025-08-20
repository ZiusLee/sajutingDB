"use client"

import { useState, useEffect } from "react"
import { SajuOnboardingFlow } from "@/components/saju-onboarding-flow"
import { useRouter, useSearchParams } from "next/navigation"
import ScrollVelocity from "@/components/ScrollVelocity"
import { useAuth } from "@/contexts/auth-context"
import BusinessBar from "@/components/business-bar"

const questionChips = [
  { icon: "💼", text: "직장을 어떤 기준으로 선택하면 좋을까?" },
  { icon: "💕", text: "올해 나의 결혼운은 어때?" },
  { icon: "💰", text: "언제 재물운 들어오는지 알려줘" },
  { icon: "🍀", text: "오늘의 운세를 알려줘" },
  { icon: "👤", text: "내 성격과 기질은 어때?" },
  { icon: "❤️", text: "연애운이 언제 좋아질까?" },
  { icon: "🏠", text: "이사는 언제 하는게 좋을까?" },
  { icon: "😰", text: "불안감이 심한데 내 사주적 원인이 뭘까?" },
  { icon: "🤝", text: "상사와 자꾸 갈등이 생기는 이유는?" },
  { icon: "💔", text: "이별 후 언제쯤 새로운 사랑을 만날까?" },
  { icon: "🎯", text: "창업하기 좋은 시기는 언제일까?" },
  { icon: "👶", text: "아이 갖기 좋은 타이밍을 알려줘" },
  { icon: "🏆", text: "승진 가능성과 적절한 시기는?" },
  { icon: "💸", text: "투자할 때 주의해야 할 점은?" },
  { icon: "🌙", text: "잠이 안 오는 이유가 사주와 관련있을까?" },
  { icon: "🍽️", text: "다이어트가 안 되는 사주적 이유는?" },
  { icon: "👥", text: "인간관계에서 자꾸 상처받는 이유는?" },
  { icon: "📚", text: "공부나 자격증 취득하기 좋은 시기는?" },
  { icon: "🏃‍♀️", text: "번아웃이 왔는데 어떻게 극복할까?" },
  { icon: "💍", text: "지금 만나는 사람과 결혼해도 될까?" },
  { icon: "🎨", text: "내가 진짜 좋아하는 일을 찾고 싶어" },
  { icon: "😔", text: "우울감이 지속되는 사주적 원인은?" },
  { icon: "🏢", text: "회사를 그만둘 타이밍을 알려줘" },
  { icon: "👨‍👩‍👧‍👦", text: "가족과의 갈등을 어떻게 해결할까?" },
  { icon: "💪", text: "자신감을 키우려면 어떻게 해야 할까?" },
  { icon: "🎪", text: "인생의 전환점이 언제 올까?" },
  { icon: "🔮", text: "내년에 가장 주의해야 할 것은?" },
  { icon: "🌟", text: "내 재능을 가장 잘 발휘할 수 있는 분야는?" },
]

export default function LandingPageClient() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userCoins, setUserCoins] = useState({ total: 0, subscription: 0, bonus: 0, plan: null })
  const [loadingCoins, setLoadingCoins] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuth()

  const fetchUserCoins = async () => {
    if (!isAuthenticated || !user) return

    try {
      setLoadingCoins(true)
      const response = await fetch("/api/user-coins")
      if (response.ok) {
        const data = await response.json()
        setUserCoins({
          total: (data.subscription_coins || 0) + (data.bonus_coins || 0),
          subscription: data.subscription_coins || 0,
          bonus: data.bonus_coins || 0,
          plan: data.subscription_plan || null,
        })
      }
    } catch (error) {
      console.error("핑 정보 조회 오류:", error)
    } finally {
      setLoadingCoins(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCoins()
    }
  }, [isAuthenticated, user])

  // Check for showOnboarding query parameter
  useEffect(() => {
    const shouldShowOnboarding = searchParams.get("showOnboarding")
    if (shouldShowOnboarding === "true") {
      setShowOnboarding(true)
      // Clean up URL
      router.replace("/", undefined)
    }
  }, [searchParams, router])

  const handleStartSaju = () => {
    setShowOnboarding(true)
  }

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
  }

  const handleRegisterClick = () => {
    setShowOnboarding(true)
  }

  if (showOnboarding) {
    return <SajuOnboardingFlow onClose={handleCloseOnboarding} />
  }

  return (
    <>
      {/* 메인: 하단 고정 바가 가리지 않도록 패딩 추가 */}
      <div className="min-h-screen relative overflow-hidden bg-white pb-16">
        {/* 메인 콘텐츠 */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-4">
              오늘은 어떤 것이
              <br />
              궁금하세요?
            </h1>
            <div className="space-y-2">
              <p className="text-base md:text-lg text-gray-600">사주로 나를 이해하다, 사주핑</p>

              {isAuthenticated && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg max-w-sm mx-auto">
                  {userCoins.plan && (
                    <p className="text-sm font-medium text-gray-700 mb-2">현재 나의 플랜: {userCoins.plan}</p>
                  )}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-black text-xs font-bold">P</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {loadingCoins ? "..." : `${userCoins.total}핑`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>
                      구독핑: {userCoins.subscription}핑 | 보너스핑: {userCoins.bonus}핑
                    </div>
                    <div>구독핑이 우선적으로 소비되고 다 소진되고 나면 보너스핑이 사용됩니다</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 질문 칩 - 2줄 스크롤 애니메이션 */}
          <div className="mb-8 w-full relative">
            <div className="space-y-2">
              <div className="h-14 overflow-hidden">
                <ScrollVelocity
                  velocity={30}
                  parallaxStyle={{ height: "56px" }}
                  scrollerStyle={{
                    fontSize: "1rem",
                    fontWeight: "500",
                    letterSpacing: "normal",
                    filter: "none",
                    alignItems: "center",
                    height: "56px",
                    display: "flex",
                  }}
                  scrollerClassName="flex items-center h-14"
                  numCopies={8}
                >
                  <div className="flex items-center gap-2">
                    {questionChips.slice(0, 14).map((chip, index) => (
                      <div
                        key={index}
                        className="bg-white text-black border border-gray-200 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
                      >
                        <span className="text-base md:text-lg">{chip.icon}</span>
                        <span>{chip.text}</span>
                      </div>
                    ))}
                  </div>
                </ScrollVelocity>
              </div>

              <div className="h-14 overflow-hidden">
                <ScrollVelocity
                  velocity={-25}
                  parallaxStyle={{ height: "56px" }}
                  scrollerStyle={{
                    fontSize: "1rem",
                    fontWeight: "500",
                    letterSpacing: "normal",
                    filter: "none",
                    alignItems: "center",
                    height: "56px",
                    display: "flex",
                  }}
                  scrollerClassName="flex items-center h-14"
                  numCopies={8}
                >
                  <div className="flex items-center gap-2">
                    {questionChips.slice(14).map((chip, index) => (
                      <div
                        key={index + 14}
                        className="bg-white text-black border border-gray-200 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-sm flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
                      >
                        <span className="text-base md:text-lg">{chip.icon}</span>
                        <span>{chip.text}</span>
                      </div>
                    ))}
                  </div>
                </ScrollVelocity>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4 max-w-md w-full relative z-50">
            <button
              onClick={handleStartSaju}
              className="w-[200px] h-[44px] mx-auto bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-base md:text-lg font-medium flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <span>사주 프로필 생성하기</span>
              <span className="text-lg md:text-xl">→</span>
            </button>

            {!isAuthenticated && (
              <div className="flex items-center justify-center space-x-2 text-xs md:text-sm">
                <span className="text-gray-500">계정이 없으신가요?</span>
                <button
                  onClick={handleRegisterClick}
                  className="text-black hover:underline font-medium hover:text-gray-700 transition-colors cursor-pointer z-50"
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 고정 사업자 정보 바 (작고 가로 레이아웃) */}
      <BusinessBar
        companyName="원테라피"
        representative="이윤섭"
        businessNumber="180-16-02886"
        address="경기도 파주시 파주읍 약수골길 86"
        phone="010-5614-4801"
      />
    </>
  )
}
