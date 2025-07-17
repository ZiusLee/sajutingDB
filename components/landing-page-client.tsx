"use client"

import { useState } from "react"
import { SajuOnboardingFlow } from "@/components/saju-onboarding-flow"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"

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

  if (showOnboarding) {
    return <SajuOnboardingFlow onClose={handleCloseOnboarding} />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <SiteHeader />

      {/* Single column centered layout */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 pt-20 pb-12">
        {/* Large gradient sphere background */}
        <div className="relative w-full max-w-md mx-auto mb-8">
          <div className="aspect-square w-full relative overflow-hidden">
            {/* Colorful gradient sphere */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 via-blue-400 via-green-400 to-yellow-400 opacity-80 blur-sm"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-300 via-purple-300 via-blue-300 via-green-300 to-yellow-300 opacity-90"></div>

            {/* Text overlay on sphere */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 leading-tight mb-2">
                Leave worries,
                <br />
                live the present
              </h2>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="text-center max-w-lg mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4 leading-tight">
            걱정은 내려놓고,
            <br />
            자신에게 집중해보세요.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 mb-8 leading-relaxed">
            사주를 바탕으로 나와 대화하는
            <br />
            AI 불안케어 플랫폼, 사주핑
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            className="w-full max-w-sm h-14 px-8 bg-gray-900 text-white hover:bg-gray-800 rounded-2xl text-lg font-medium transition-colors mb-6"
            onClick={handleStartSaju}
          >
            사주 프로필 생성하기
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          {/* Sign up link */}
          <div className="flex items-center justify-center space-x-2 text-base">
            <span className="text-gray-500">계정이 없으신가요?</span>
            <button onClick={handleRegisterClick} className="text-blue-600 hover:underline font-medium">
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
