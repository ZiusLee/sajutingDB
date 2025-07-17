"use client"

import { useState } from "react"
import { SajuOnboardingFlow } from "@/components/saju-onboarding-flow"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function LandingPageClient() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()

  const handleStartSaju = () => {
    setShowOnboarding(true)
  }

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
  }

  const handleRegisterClick = () => {
    router.push("/register")
  }

  const handleLoginClick = () => {
    router.push("/login")
  }

  if (showOnboarding) {
    return <SajuOnboardingFlow onClose={handleCloseOnboarding} />
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 relative overflow-hidden">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center relative z-20">
        <div className="w-10 h-10 bg-gray-800 rounded-xl"></div>
        <Button
          onClick={handleLoginClick}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl text-sm font-medium"
        >
          로그인
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6 relative">
        {/* Gradient Sphere Background */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] -mt-32">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-300 via-purple-300 via-blue-300 via-green-300 to-yellow-300 opacity-80 blur-sm"></div>
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-pink-200 via-purple-200 via-blue-200 via-green-200 to-yellow-200 opacity-60"></div>
        </div>

        {/* English Text Overlay */}
        <div className="relative z-10 text-center mb-16 mt-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 leading-tight">
            Leave worries,
            <br />
            live the present
          </h2>
        </div>

        {/* Korean Main Content */}
        <div className="relative z-10 text-center space-y-6 max-w-md mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
            걱정은 내려놓고,
            <br />
            자신에게 집중해보세요.
          </h1>

          <p className="text-base md:text-lg text-gray-600 leading-relaxed px-4">
            사주를 바탕으로 나와 대화하는
            <br />
            AI 불안케어 플랫폼, 사주핑
          </p>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 mt-12 mb-8">
          <Button
            size="lg"
            className="h-14 px-8 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-lg font-medium transition-colors shadow-lg"
            onClick={handleStartSaju}
          >
            사주 프로필 생성하기
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Sign Up Link */}
        <div className="relative z-10 flex items-center space-x-2 text-sm md:text-base">
          <span className="text-gray-500">계정이 없으신가요?</span>
          <button onClick={handleRegisterClick} className="text-blue-600 hover:underline font-medium">
            회원가입
          </button>
        </div>
      </div>
    </div>
  )
}
