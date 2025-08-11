"use client"

import type * as React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { getSupabase } from "@/lib/supabase-client"
import { toast } from "@/hooks/use-toast"

type Provider = "kakao" | "google" | "apple"

export interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProvider: (provider: Provider) => void
}

export function SignupDialog({ open, onOpenChange, onSelectProvider }: SignupDialogProps) {
  const [showTerms, setShowTerms] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [serviceTermsChecked, setServiceTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const canProceed = serviceTermsChecked && privacyChecked

  const handleProviderSelect = (provider: Provider) => {
    if (provider === "apple") return // currently disabled
    setSelectedProvider(provider)
    setShowTerms(true)
  }

  const handleAgree = async () => {
    if (!canProceed || !selectedProvider) return

    setIsLoading(true)
    try {
      const supabase = getSupabase()

      // Perform OAuth login
      const { error } = await supabase.auth.signInWithOAuth({
        provider: selectedProvider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: selectedProvider === "google" ? "openid email profile" : undefined,
        },
      })

      if (error) {
        console.error("OAuth error:", error)
        toast({
          title: "로그인 실패",
          description: "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
          variant: "destructive",
        })
        return
      }

      // OAuth redirect will happen, so we don't need to call onSelectProvider here
      // The callback will be handled in the auth callback page
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "로그인 실패",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Prevent dialog from closing - only allow programmatic closing after successful auth
  const handleOpenChange = (newOpen: boolean) => {
    // Don't allow closing the dialog
    return
  }

  const providerLabel = selectedProvider === "kakao" ? "카카오" : selectedProvider === "google" ? "구글" : "Apple"

  return (
    <>
      {/* Main signup dialog */}
      <Dialog open={open && !showTerms && !showPrivacyDetails} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          className="sm:max-w-md rounded-2xl shadow-xl p-0 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="p-6">
            <DialogHeader className="space-y-3 text-center">
              <DialogTitle className="text-xl font-bold leading-tight tracking-tight">
                지금 계정을 연동하고 3초만에 사주 분석을 받아보세요.
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                로그인하면 더 많은 기능을 이용할 수 있습니다
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8">
              <div className="grid grid-cols-2 gap-4">
                {/* Kakao */}
                <ProviderButton
                  label="카카오로 시작하기"
                  bgClass="bg-[#FEE500] hover:bg-[#E6CF00] text-black"
                  onClick={() => handleProviderSelect("kakao")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M12 3C6.48 3 2 6.48 2 10.8C2 13.8 3.92 16.44 6.76 17.88L5.6 21.48C5.52 21.72 5.76 21.96 6 21.84L10.32 19.2C10.88 19.28 11.44 19.32 12 19.32C17.52 19.32 22 15.84 22 10.8C22 6.48 17.52 3 12 3Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="ml-2 text-sm font-medium">카카오</span>
                </ProviderButton>

                {/* Google */}
                <ProviderButton
                  label="구글로 시작하기"
                  bgClass="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
                  onClick={() => handleProviderSelect("google")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="ml-2 text-sm font-medium">구글</span>
                </ProviderButton>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms agreement dialog */}
      <Dialog open={showTerms && !showPrivacyDetails} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{providerLabel} 로그인을 위한 약관 동의</DialogTitle>
            <DialogDescription>서비스 이용을 위해 다음 약관에 동의해주세요.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="service-terms"
                checked={serviceTermsChecked}
                onCheckedChange={setServiceTermsChecked}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="service-terms" className="text-sm font-medium cursor-pointer">
                  서비스 이용약관 동의 (필수)
                </label>
                <p className="text-xs text-muted-foreground mt-1">사주핑 서비스 이용에 관한 기본 약관입니다.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy-terms"
                checked={privacyChecked}
                onCheckedChange={setPrivacyChecked}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="privacy-terms" className="text-sm font-medium cursor-pointer">
                  개인정보 처리방침 동의 (필수)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">개인정보 수집 및 이용에 관한 동의입니다.</p>
                  <button
                    type="button"
                    onClick={() => setShowPrivacyDetails(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    자세히
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowTerms(false)}
              className="flex-1 bg-transparent"
              disabled={isLoading}
            >
              이전
            </Button>
            <Button onClick={handleAgree} disabled={!canProceed || isLoading} className="flex-1">
              {isLoading ? "로그인 중..." : `동의하고 ${providerLabel} 로그인`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy policy details dialog */}
      <Dialog open={showPrivacyDetails} onOpenChange={setShowPrivacyDetails}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">개인정보 처리방침</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowPrivacyDetails(false)} className="h-6 w-6">
              ✕
            </Button>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-3">1. 개인정보의 처리 목적</h3>
                <p className="leading-relaxed">사주핑은 다음의 목적을 위하여 개인정보를 처리합니다.</p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>회원 가입 및 관리</li>
                  <li>사주 해석 서비스 제공</li>
                  <li>고객 상담 및 불만 처리</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-3">2. 개인정보의 처리 및 보유 기간</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>회원 탈퇴 시까지 보유</li>
                  <li>관련 법령에 따른 보존 의무가 있는 경우 해당 기간까지 보유</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-3">3. 개인정보의 제3자 제공</h3>
                <p className="leading-relaxed">회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.</p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-3">4. 개인정보 처리의 위탁</h3>
                <p className="leading-relaxed">
                  회사는 서비스 향상을 위해 개인정보 처리업무를 외부 전문업체에 위탁할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-3">5. 정보주체의 권리·의무 및 행사방법</h3>
                <p className="leading-relaxed">
                  이용자는 개인정보 열람, 정정·삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-3">6. 개인정보의 안전성 확보조치</h3>
                <p className="leading-relaxed mb-2">
                  회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>관리적 조치: 내부관리계획 수립·시행</li>
                  <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리</li>
                  <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-3">7. 개인정보 보호책임자</h3>
                <div className="space-y-1">
                  <p>
                    <strong>성명:</strong> 사주핑 개인정보보호팀
                  </p>
                  <p>
                    <strong>연락처:</strong> privacy@sajuping.com
                  </p>
                </div>
              </section>

              <section className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">본 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다.</p>
              </section>
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowPrivacyDetails(false)}>확인</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ProviderButton({
  children,
  label,
  onClick,
  bgClass,
  disabled,
}: {
  children: React.ReactNode
  label: string
  onClick?: () => void
  bgClass?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-12 px-4 rounded-lg inline-flex items-center justify-center shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
        bgClass,
        disabled && "cursor-not-allowed opacity-60",
        "hover:scale-[1.02] active:scale-[0.98]",
      )}
    >
      {children}
    </button>
  )
}
