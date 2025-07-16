"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SajuOnboardingFlow } from "@/components/saju-onboarding-flow"
import { useRouter } from "next/navigation"
import ScrollVelocity from "@/components/ScrollVelocity"

const questionChips = [
  { icon: "💼", text: "직장을 어떤 기준으로 선택하면 좋을까?" },
  { icon: "💕", text: "올해 나의 결혼운은 어때?" },
  { icon: "💰", text: "이번달 재물은 알려줘" },
  { icon: "🍀", text: "오늘의 운세를 알려줘" },
  { icon: "👤", text: "내 성격과 기질은 어때?" },
  { icon: "❤️", text: "연애운이 언제 좋아질까?" },
  { icon: "🏠", text: "이사는 언제 하는게 좋을까?" },
  { icon: "🎯", text: "내 인생의 목표는 무엇일까?" },
]

export default function LandingPageClient() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()

  const handleStartSaju = () => {
    setShowOnboarding(true)
  }

  const handleCloseOnboarding = () => {
    setShowOnboarding(false)
  }

  const handleLogoClick = () => {
    router.push("/")
  }

  const handleLoginClick = () => {
    router.push("/login")
  }

  const handleRegisterClick = () => {
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

      {/* Floating Navigation */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <button onClick={handleLogoClick} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-xl font-bold text-black">SAJUPING</span>
        </button>
        <Button
          onClick={handleLoginClick}
          variant="default"
          className="bg-gray-950 hover:bg-gray-800 text-white px-6 py-2 rounded-lg"
        >
          로그인
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        {/* Main Question */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight mb-6">
            오늘은 어떤 것이
            <br />
            궁금하세요?
          </h1>
          <p className="text-lg md:text-xl text-gray-600">사주를 바탕으로 나를 이해하는 
AI 불안케어 플랫폼</p>
        </div>

        {/* Scrolling Question Chips */}
        <div className="mb-12 w-full">
          <div className="space-y-4">
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
                <div className="flex items-center gap-6">
                  {questionChips.slice(0, 4).map((chip, index) => (
                    <div
                      key={index}
                      className="bg-white text-black border-2 border-gray-200 px-4 py-3 rounded-full shadow-sm flex items-center space-x-2 text-sm font-medium hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
                    >
                      <span className="text-lg">{chip.icon}</span>
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
                <div className="flex items-center gap-6">
                  {questionChips.slice(4, 8).map((chip, index) => (
                    <div
                      key={index + 4}
                      className="bg-white text-black border-2 border-gray-200 px-4 py-3 rounded-full shadow-sm flex items-center space-x-2 text-sm font-medium hover:scale-105 hover:shadow-md cursor-pointer transition-all duration-200 whitespace-nowrap flex-shrink-0"
                    >
                      <span className="text-lg">{chip.icon}</span>
                      <span>{chip.text}</span>
                    </div>
                  ))}
                </div>
              </ScrollVelocity>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-6 max-w-md w-full relative z-20">
          <Button
            onClick={handleStartSaju}
            className="w-full bg-gray-950 hover:bg-gray-800 text-white px-8 py-4 rounded-full text-lg font-medium flex items-center justify-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <span>사주 프로필 생성하기</span>
            <span className="text-xl">→</span>
          </Button>

          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-500">계정이 없으신가요?</span>
            <button
              onClick={handleRegisterClick}
              className="text-black hover:underline font-medium hover:text-gray-700 transition-colors"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>

      {/* Oriental Wave Pattern at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-48 md:h-64 lg:h-80 z-0">
        <div
          className="w-full h-full opacity-15"
          style={{
            backgroundImage: `url('/images/oriental-wave-pattern.png')`,
            backgroundSize: "400px 200px",
            backgroundRepeat: "repeat-x",
            backgroundPosition: "bottom",
          }}
        />
        {/* Gradient overlay to blend with background */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-50/30 via-transparent to-transparent" />
      </div>

      {/* Additional subtle pattern overlay for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 md:h-40 z-5">
        <div
          className="w-full h-full opacity-8"
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
