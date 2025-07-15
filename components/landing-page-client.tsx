"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SajuOnboardingFlow } from "@/components/saju-onboarding-flow"
import { useRouter } from "next/navigation"

const HanjiTexture = () => {
  // 한지 텍스처 패턴
  const hanjiPattern = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <filter id="roughPaper">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
        <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="2">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>
        <feComposite operator="multiply" in2="SourceGraphic" />
      </filter>
      <rect width="100%" height="100%" filter="url(#roughPaper)" opacity="0.4" />
      <g opacity="0.3">
        <path d="M10,20 Q50,40 90,20 T170,20" stroke="#d4c5b9" strokeWidth="0.5" fill="none" />
        <path d="M0,60 Q40,80 80,60 T160,60" stroke="#d4c5b9" strokeWidth="0.8" fill="none" />
        <path d="M20,100 Q60,120 100,100 T180,100" stroke="#d4c5b9" strokeWidth="0.3" fill="none" />
        <path d="M0,140 Q40,160 80,140 T160,140" stroke="#d4c5b9" strokeWidth="0.6" fill="none" />
        <path d="M30,180 Q70,200 110,180 T190,180" stroke="#d4c5b9" strokeWidth="0.4" fill="none" />
      </g>
    </svg>
  `

  const encodedPattern = `data:image/svg+xml,${encodeURIComponent(hanjiPattern)}`

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#f4ede4",
        backgroundImage: `url("${encodedPattern}")`,
        backgroundSize: "200px 200px",
        backgroundPosition: "0 0, 100px 100px",
      }}
    >
      {/* Additional texture layers */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(212, 197, 185, 0.1) 10px,
              rgba(212, 197, 185, 0.1) 20px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 15px,
              rgba(212, 197, 185, 0.05) 15px,
              rgba(212, 197, 185, 0.05) 25px
            )
          `,
          mixBlendMode: "multiply",
        }}
      />

      {/* Grain effect */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  )
}

export default function LandingPageClient() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()

  const handleStartSaju = () => {
    setShowOnboarding(true)
  }

  // Remove the handleOnboardingComplete function entirely
  // const handleOnboardingComplete = (sessionId: string) => {
  //   setShowOnboarding(false)
  //   router.push(`/saju-chat/sajuping?session=${sessionId}`)
  // }

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
    <div className="min-h-screen bg-white">
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
          className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg"
        >
          로그인
        </Button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Korean Content with Hanji Texture */}
        <div className="flex-1 flex items-center justify-center px-12 relative">
          <HanjiTexture />
          <div className="relative z-10 max-w-lg space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold text-black leading-tight">
                걱정은 내려놓고,
                <br />
                자신에게 집중해보세요.
              </h1>
              <p className="text-lg text-gray-600">사주를 바탕으로 나와 대화하는 AI 불안케어 플랫폼, 사주핑</p>
            </div>

            <Button
              onClick={handleStartSaju}
              className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium flex items-center space-x-2"
            >
              <span>사주 프로필 생성하기</span>
              <span>→</span>
            </Button>

            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">계정이 없으신가요?</span>
              <button onClick={handleRegisterClick} className="text-blue-600 hover:underline">
                회원가입
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Gradient Background with English Text */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200"
            style={{
              background: `linear-gradient(135deg, 
                rgba(196, 181, 253, 0.8) 0%, 
                rgba(251, 207, 232, 0.8) 25%, 
                rgba(147, 197, 253, 0.8) 50%, 
                rgba(196, 181, 253, 0.8) 75%, 
                rgba(251, 207, 232, 0.8) 100%)`,
            }}
          />

          <div className="relative z-10 flex items-center justify-center h-full px-12">
            <div className="max-w-lg space-y-6 text-white">
              <h2 className="text-5xl font-bold leading-tight opacity-90">
                Leave worries,
                <br />
                live the present
              </h2>

              <div className="space-y-4 text-lg opacity-80">
                <p>Theraping is more than just a chatbot.</p>
                <p>
                  It's an inner sanctuary for the digital age — a way of living with AI advisors who truly understand
                  you.
                </p>
                <p>
                  We build bridges between technology and philosophy, so people can design their lives with themselves
                  at the center again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen relative overflow-hidden">
        {/* Mobile Gradient Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, 
              rgba(196, 181, 253, 0.3) 0%, 
              rgba(251, 207, 232, 0.3) 25%, 
              rgba(147, 197, 253, 0.3) 50%, 
              rgba(134, 239, 172, 0.3) 75%, 
              rgba(251, 207, 232, 0.3) 100%)`,
          }}
        />

        {/* Mobile Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          {/* English Title */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-600 leading-tight mb-4">
              Leave worries,
              <br />
              live the present
            </h1>
          </div>

          {/* Korean Content */}
          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-black leading-tight">
                걱정은 내려놓고,
                <br />
                자신에게 집중해보세요.
              </h2>
              <p className="text-base text-gray-600">사주를 바탕으로 나와 대화하는 AI 불안케어 플랫폼, 사주핑</p>
            </div>

            <Button
              onClick={handleStartSaju}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-medium flex items-center justify-center space-x-2"
            >
              <span>사주 프로필 생성하기</span>
              <span>→</span>
            </Button>

            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="text-gray-500">계정이 없으신가요?</span>
              <button onClick={handleRegisterClick} className="text-blue-600 hover:underline font-medium">
                회원가입
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
