"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TermsDialog } from "./terms-dialog"

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProvider: (provider: "kakao" | "google") => void
  isLoading?: boolean
}

export function SignupDialog({ open, onOpenChange, onSelectProvider, isLoading = false }: SignupDialogProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const handleProviderSelect = (provider: "kakao" | "google") => {
    if (!agreedToTerms) {
      return
    }
    onSelectProvider(provider)
  }

  const handleSkip = () => {
    // 회원가입 없이 바로 채팅으로 이동
    window.location.href = "/saju-chat/sajuping"
  }

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md w-[90vw] max-w-[400px] rounded-3xl p-8 bg-white border-0 shadow-2xl"
          hideCloseButton
        >
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                지금 계정을 연동하고
                <br />
                3초만에 사주 분석을 받아보세요
              </h2>
            </div>

            <div className="w-full flex items-center justify-center my-4">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="px-4 text-xs text-gray-500 font-medium">SNS LOGIN</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <div className="w-full space-y-3">
              <Button
                onClick={() => handleProviderSelect("kakao")}
                disabled={!agreedToTerms || isLoading}
                className="w-full h-12 bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium rounded-full border-0 disabled:opacity-50"
              >
                {isLoading ? "로그인 중..." : "카카오로 3초만에 시작하기"}
              </Button>

              <Button
                onClick={() => handleProviderSelect("google")}
                disabled={!agreedToTerms || isLoading}
                variant="outline"
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-full border-gray-300 disabled:opacity-50"
              >
                {isLoading ? "로그인 중..." : "구글로 3초만에 시작하기"}
              </Button>
            </div>

            <div className="flex items-start space-x-2 w-full">
              <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} className="mt-0.5" />
              <div className="text-xs text-gray-600 leading-relaxed">
                <label htmlFor="terms" className="cursor-pointer">
                  {"[필수] "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    개인정보 처리방침
                  </button>
                  에 동의합니다.
                </label>
              </div>
            </div>

            <Button
              onClick={handleSkip}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700 text-sm font-normal"
            >
              회원가입 없이 계속하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TermsDialog open={showTerms} onOpenChange={setShowTerms} />
    </>
  )
}
