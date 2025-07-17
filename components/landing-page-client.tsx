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
    <div className="min-h-screen w-full bg-white">
      <SiteHeader />

      <div className="flex min-h-screen w-full">
        {/* Left Panel */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-start p-6 sm:p-8 lg:p-16 xl:p-24 pt-24 lg:pt-16">
          <div className="w-full max-w-lg">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black tracking-tight leading-[1.1] mb-6 lg:mb-8">
              오늘은 어떤것이
              <br />
              궁금하세요?
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 lg:mb-12 max-w-md leading-relaxed">
              사주를 바탕으로 나와 대화하는 AI 친구, 사주핑
            </p>
            <div className="flex flex-col items-start gap-4 lg:gap-6">
              <Button
                size="lg"
                className="h-12 lg:h-14 px-6 lg:px-8 bg-black text-white hover:bg-gray-800 rounded-full text-base lg:text-lg font-medium transition-colors"
                onClick={handleStartSaju}
              >
                사주 프로필 생성하기
                <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
              <div className="flex items-center space-x-2 text-sm lg:text-base">
                <span className="text-gray-500">계정이 없으신가요?</span>
                <button onClick={handleRegisterClick} className="text-blue-600 hover:underline font-medium">
                  회원가입
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Desktop Only */}
        <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-gray-50">
          {/* Gradient Sphere Background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('/images/gradient-sphere.jpeg')`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
          </div>

          {/* Text Overlay */}
          <div className="relative z-10 text-left p-8 lg:p-12 xl:p-16 max-w-2xl">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-6 lg:mb-8 text-gray-700">
              Leave worries,
              <br />
              live the present
            </h2>
            <p className="text-base lg:text-lg leading-relaxed max-w-lg text-gray-600 opacity-90">
              OneTherapy is more than just a chatbot. It's an inner sanctuary for the digital age — a way of living with
              AI advisors who truly understand you. We build bridges between technology and philosophy, so people can
              design their lives with themselves at the center again.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Section */}
      <div className="lg:hidden px-6 sm:px-8 pb-12">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-4 text-gray-700">
            Leave worries,
            <br />
            live the present
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-gray-600 opacity-90 max-w-md mx-auto">
            Theraping is more than just a chatbot. It's an inner sanctuary for the digital age — a way of living with AI
            advisors who truly understand you.
          </p>
        </div>
      </div>
    </div>
  )
}
