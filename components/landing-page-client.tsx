"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SajuOnboardingFlow } from "@/components/saju-onboarding-flow"
import { useRouter } from "next/navigation"
import ScrollVelocity from "@/components/ScrollVelocity"

const questionChips = [
  // 기존 질문들
  { icon: "💼", text: "직장을 어떤 기준으로 선택하면 좋을까?" },
  { icon: "💕", text: "올해 나의 결혼운은 어때?" },
  { icon: "💰", text: "언제 재물운 들어오는지 알려줘" },
  { icon: "🍀", text: "오늘의 운세를 알려줘" },
  { icon: "👤", text: "내 성격과 기질은 어때?" },
  { icon: "❤️", text: "연애운이 언제 좋아질까?" },
  { icon: "🏠", text: "이사는 언제 하는게 좋을까?" },
  // 새로운 디테일한 질문들
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
  const router = useRouter()

  const handleStartSaju = () => {
    console.log("사주 프로필 생성하기 버튼 클릭됨")
    setShowOnboarding(true)
  }

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
  }

  const handleLogoClick = () => {
    router.push("/")
  }

  const handleLoginClick = () => {
    console.log("로그인 버튼 클릭됨")
    router.push("/login")
  }

  const handleRegisterClick = () => {
    console.log("회원가입 버튼 클릭됨")
    router.push("/register")
  }

  if (showOnboarding) {
    return <SajuOnboardingFlow onClose={handleCloseOnboarding} />
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Korean Wave Pattern Background - Transparent with lines only */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url('/images/korean-wave-pattern.png')`,
          backgroundSize: "300px 300px",
          backgroundRepeat: "repeat",
          filter: "grayscale(100%) contrast(200%)",
        }}
      />

  

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Main Question */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-6">
            오늘은 어떤 것이
            <br />
            궁금하세요?
          </h1>
          <p className="text-lg md:text-xl text-gray-600">사주를 바탕으로 나와 대화하는 AI Companion, 사주핑</p>
        </div>

        {/* Scrolling Question Chips */}
        <div className="mb-12 w-full relative">
          {/* Left fade overlay - smaller on mobile */}
          <div className="absolute left-0 top-0 bottom-0 w-4 md:w-20 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
          {/* Right fade overlay - smaller on mobile */}
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-20 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

          <div className="space-y-2">
            {/* First row - scrolling right */}
            <div className="h-16 overflow-hidden">
              <ScrollVelocity
                velocity={30}
                parallaxStyle={{ height: "64px" }}
                scrollerStyle={{
                  fontSize: "1rem",
                  fontWeight: "500",
                  letterSpacing: "normal",
                  filter: "none",
                  alignItems: "center",
                  height: "64px",
                  display: "flex",
                }}
                scrollerClassName="flex items-center h-16"
                numCopies={10}
              >
                <div className="flex items-center gap-2">
                  {questionChips.slice(0, 14).map((chip, index) => (
                    <div
                      key={index}
                      className="bg-white text-black border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 rounded-full shadow-sm flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
                    >
                      <span className="text-base md:text-lg">{chip.icon}</span>
                      <span>{chip.text}</span>
                    </div>
                  ))}
                </div>
              </ScrollVelocity>
            </div>

            {/* Second row - scrolling left */}
            <div className="h-16 overflow-hidden">
              <ScrollVelocity
                velocity={-25}
                parallaxStyle={{ height: "64px" }}
                scrollerStyle={{
                  fontSize: "1rem",
                  fontWeight: "500",
                  letterSpacing: "normal",
                  filter: "none",
                  alignItems: "center",
                  height: "64px",
                  display: "flex",
                }}
                scrollerClassName="flex items-center h-16"
                numCopies={10}
              >
                <div className="flex items-center gap-2">
                  {questionChips.slice(14).map((chip, index) => (
                    <div
                      key={index + 14}
                      className="bg-white text-black border-2 border-gray-200 px-3 py-2 md:px-4 md:py-3 rounded-full shadow-sm flex items-center gap-1 md:gap-2 text-xs md:text-sm font-medium hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
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

        {/* CTA Section */}
        <div className="space-y-6 max-w-md w-full relative z-50">
          <button
            onClick={handleStartSaju}
            className="w-[200px] h-[46px] mx-auto bg-gray-950 hover:bg-gray-800 text-white rounded-xl text-lg font-medium flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all duration-200 cursor-pointer"
          >
            <span>사주 프로필 생성하기</span>
            <span className="text-xl">→</span>
          </button>

          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-500">계정이 없으신가요?</span>
            <button
              onClick={handleRegisterClick}
              className="text-black hover:underline font-medium hover:text-gray-700 transition-colors cursor-pointer z-50"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>

      {/* Smooth transition fade out before wave pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-50/20 via-white/50 to-transparent z-5" />

      {/* Oriental Wave Pattern at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 lg:h-80 z-1">
        <div
          className="w-full h-full opacity-10"
          style={{
            backgroundImage: `url('/images/oriental-wave-pattern.png')`,
            backgroundSize: "400px 200px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "bottom",
          }}
        />
        {/* Gradient overlay to blend with background */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-50/20 via-transparent to-transparent" />
      </div>

      {/* Additional subtle pattern overlay for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 z-0">
        <div
          className="w-full h-full opacity-5"
          style={{
            backgroundImage: `url('/images/oriental-wave-pattern.png')`,
            backgroundSize: "300px 150px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "bottom",
            transform: "scaleY(-1)",
          }}
        />
      </div>
    </div>
  )
}
