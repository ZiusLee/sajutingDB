"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BirthDateFormClient } from "@/components/birth-date-form-client"
import { SajuResultClient } from "@/components/saju-result-client"
import { SignInModal } from "@/components/signin-modal"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import type { BirthInfo } from "@/types/birth-date"

interface SajuOnboardingFlowProps {
  initialBirthInfo?: BirthInfo
}

export default function SajuOnboardingFlow({ initialBirthInfo }: SajuOnboardingFlowProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState<"birth-form" | "saju-result" | "auth-required">("birth-form")
  const [birthInfo, setBirthInfo] = useState<BirthInfo | null>(initialBirthInfo || null)
  const [sajuData, setSajuData] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)

  // 초기 생년월일 정보가 있으면 바로 사주 결과로 이동
  useEffect(() => {
    if (initialBirthInfo) {
      setBirthInfo(initialBirthInfo)
      setCurrentStep("saju-result")
    }
  }, [initialBirthInfo])

  const handleBirthInfoSubmit = (info: BirthInfo) => {
    console.log("📅 Birth info submitted:", info)
    setBirthInfo(info)
    setCurrentStep("saju-result")
  }

  const handleSajuCalculated = (data: any, sessionId: string) => {
    console.log("🔮 Saju calculated:", { data, sessionId })
    setSajuData(data)
    setSessionId(sessionId)

    // 사주 계산 완료 후 로그인 모달 표시
    if (!isAuthenticated) {
      console.log("🔐 User not authenticated, showing sign in modal")
      setShowSignInModal(true)
    } else {
      // 이미 로그인된 경우 바로 채팅으로 이동
      handleNavigateToChat(sessionId)
    }
  }

  const handleAuthSuccess = async () => {
    console.log("🔐 Auth success callback triggered")
    setIsProcessingAuth(true)

    try {
      // 인증 성공 후 세션을 현재 사용자와 연결
      if (sessionId) {
        console.log("🔗 Linking session to authenticated user:", sessionId)

        const response = await fetch("/api/link-user-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          throw new Error("Failed to link user data")
        }

        const result = await response.json()
        console.log("✅ Session linked successfully:", result)

        // localStorage 업데이트
        if (typeof window !== "undefined") {
          localStorage.setItem("currentSessionId", sessionId)
          localStorage.setItem("isAuthenticated", "true")
        }

        toast.success("로그인이 완료되었습니다!")

        // 1초 후 채팅으로 이동 (세션 안정화를 위해)
        setTimeout(() => {
          handleNavigateToChat(sessionId)
        }, 1000)
      }
    } catch (error) {
      console.error("❌ Error linking user data:", error)
      toast.error("사용자 데이터 연결에 실패했습니다.")
    } finally {
      setIsProcessingAuth(false)
      setShowSignInModal(false)
    }
  }

  const handleNavigateToChat = (sessionId: string) => {
    console.log("🚀 Navigating to chat with session:", sessionId)
    router.push(`/saju-chat/general?sessionId=${sessionId}`)
  }

  const handleBackToBirthForm = () => {
    setCurrentStep("birth-form")
    setBirthInfo(null)
    setSajuData(null)
    setSessionId(null)
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {currentStep === "birth-form" && (
          <BirthDateFormClient onSubmit={handleBirthInfoSubmit} initialData={birthInfo} />
        )}

        {currentStep === "saju-result" && birthInfo && (
          <SajuResultClient
            birthInfo={birthInfo}
            onSajuCalculated={handleSajuCalculated}
            onBack={handleBackToBirthForm}
            showChatButton={true}
          />
        )}
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onAuthSuccess={handleAuthSuccess}
        title="사주 해석을 위한 로그인"
        description="사주 해석 결과를 저장하고 AI와 대화하려면 로그인해주세요."
      />
    </>
  )
}
