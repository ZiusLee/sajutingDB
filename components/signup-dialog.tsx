"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface SignupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProvider: (provider: "kakao" | "google") => void
}

export function SignupDialog({ open, onOpenChange, onSelectProvider }: SignupDialogProps) {
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)
  const [showServiceTermsDetails, setShowServiceTermsDetails] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<"kakao" | "google" | null>(null)
  const [agreedToService, setAgreedToService] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [agreedToAge, setAgreedToAge] = useState(false)
  const [agreedToMarketing, setAgreedToMarketing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    return
  }

  const handleProviderSelect = useCallback((provider: "kakao" | "google") => {
    setSelectedProvider(provider)
    setShowTerms(true)
  }, [])

  const handleAgreeAll = useCallback((checked: boolean) => {
    setAgreedToService(checked)
    setAgreedToPrivacy(checked)
    setAgreedToAge(checked)
    setAgreedToMarketing(checked)
  }, [])

  const allRequiredAgreed = agreedToService && agreedToPrivacy && agreedToAge
  const allAgreed = allRequiredAgreed && agreedToMarketing

  const handleTermsAgree = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (!selectedProvider || !allRequiredAgreed || isProcessing) {
        return
      }

      setIsProcessing(true)

      try {
        const response = await fetch("/api/user/update-privacy-consent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            privacy_consent: true,
            marketing_consent: agreedToMarketing,
          }),
        })

        if (response.ok) {
          setShowTerms(false)
          onSelectProvider(selectedProvider)
        } else {
          // 실패해도 진행
          setShowTerms(false)
          onSelectProvider(selectedProvider)
        }
      } catch (error) {
        console.error("Failed to update privacy consent:", error)
        // 에러가 발생해도 진행
        setShowTerms(false)
        onSelectProvider(selectedProvider)
      } finally {
        setIsProcessing(false)
      }
    },
    [selectedProvider, allRequiredAgreed, agreedToMarketing, onSelectProvider, isProcessing],
  )

  const handleBackToProviders = useCallback(() => {
    setShowTerms(false)
    setSelectedProvider(null)
    setAgreedToService(false)
    setAgreedToPrivacy(false)
    setAgreedToAge(false)
    setAgreedToMarketing(false)
    setIsProcessing(false)
  }, [])

  const showServiceTerms = useCallback(() => {
    setShowServiceTermsDetails(true)
  }, [])

  const hideServiceTerms = useCallback(() => {
    setShowServiceTermsDetails(false)
  }, [])

  const showPrivacyTerms = useCallback(() => {
    setShowPrivacyDetails(true)
  }, [])

  const hidePrivacyTerms = useCallback(() => {
    setShowPrivacyDetails(false)
  }, [])

  if (showServiceTermsDetails) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          className="sm:max-w-md max-w-[90vw] rounded-3xl border-none bg-white shadow-xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-row items-center justify-between p-6 pb-0">
            <h2 className="text-lg font-semibold">서비스 이용약관</h2>
            <Button variant="ghost" size="icon" onClick={hideServiceTerms} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-96 w-full px-6">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">제1조 (목적)</h4>
                <p className="text-gray-600">
                  본 약관은 사주핑 주식회사(이하 "회사")가 운영하는 모바일 앱·웹 기반의 사주핑 서비스(이하 "서비스")
                  이용과 관련하여, 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제2조 (용어의 정의)</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>
                    "서비스"란 회사가 이용자에게 사주 기반 AI 해석, 감정케어 상담, 운세 리포트 등 콘텐츠를 제공하기 위해
                    정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 의미합니다.
                  </li>
                  <li>
                    "이용자"란 회사의 서비스에 접속하여 본 약관에 따라 회사가 제공하는 콘텐츠와 제반 서비스를 이용하는
                    회원 및 비회원을 말합니다.
                  </li>
                  <li>
                    "회원"이란 본 약관에 동의하고 가입하여 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를
                    말합니다.
                  </li>
                  <li>"비회원"이란 회원 가입 없이 회사가 제공하는 서비스 일부를 이용하는 자를 말합니다.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제3조 (회원가입 및 계정관리)</h4>
                <p className="text-gray-600 mb-2">
                  회원가입은 카카오, 네이버, 구글, 애플 등 제3자 소셜 로그인 또는 이메일 가입을 통해 가능합니다.
                </p>
                <p className="text-gray-600 mb-2">
                  가입 시 필수 입력 정보: 성별, 생년월일(음·양력 여부 포함), 태어난 도시
                </p>
                <p className="text-gray-600 mb-2">선택 입력 정보: 태어난 시, 추가 프로필 정보</p>
                <p className="text-gray-600">
                  "동의하고 시작하기" 버튼 클릭 시 본 약관과 개인정보 처리방침에 동의한 것으로 간주합니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제4조 (회원의 의무)</h4>
                <p className="text-gray-600 mb-2">회원은 다음 행위를 하여서는 안 됩니다:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>서비스 접근 방해 또는 비정상적 사용 시도</li>
                  <li>타인의 개인정보 수집·이용·제공</li>
                  <li>음란·저작권 침해·허위 정보 게시</li>
                  <li>회사 승인 없이 서비스 또는 소프트웨어 복제·변경·판매·양도</li>
                  <li>다계정 생성, 이벤트 부정참여, 포인트·사이버머니 부정사용</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제5조 (서비스 제공 및 변경)</h4>
                <p className="text-gray-600">
                  회사는 24시간, 365일 안정적인 서비스 제공을 위해 노력합니다. 점검, 시스템 업그레이드, 천재지변 등
                  불가피한 사유로 서비스가 일시 중단될 수 있으며, 사전 또는 사후 공지를 진행합니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제6조 (유료콘텐츠 이용)</h4>
                <p className="text-gray-600">
                  유료콘텐츠는 포인트("핑") 또는 인앱결제를 통해 구매 후 이용할 수 있으며, 환불 규정은 별도의 유료
                  이용약관에 따릅니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제7조 (회원 탈퇴)</h4>
                <p className="text-gray-600">
                  회원은 앱 내 계정삭제 메뉴 또는 고객센터를 통해 언제든 탈퇴할 수 있습니다. 탈퇴 시 법령에 따라 보관
                  의무가 있는 정보를 제외하고 모든 데이터는 삭제됩니다.
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">공고일자: 2025년 8월 6일</p>
                <p className="text-sm text-gray-500">시행일자: 2025년 8월 6일</p>
              </div>
            </div>
          </ScrollArea>
          <div className="p-6 pt-0">
            <Button onClick={hideServiceTerms} className="w-full">
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showPrivacyDetails) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          className="sm:max-w-md max-w-[90vw] rounded-3xl border-none bg-white shadow-xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-row items-center justify-between p-6 pb-0">
            <h2 className="text-lg font-semibold">개인정보 처리방침</h2>
            <Button variant="ghost" size="icon" onClick={hidePrivacyTerms} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-96 w-full px-6">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">제1조 (개인정보의 수집 및 이용)</h4>
                <p className="text-gray-600 mb-2">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집·이용합니다:</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-gray-700">1. 회원가입 및 서비스 이용</p>
                    <p className="text-gray-600">필수항목: 이름, 성별, 음/양력 여부, 생년월일, 태어난 도시, 소셜ID</p>
                    <p className="text-gray-600">선택항목: 태어난 시</p>
                    <p className="text-gray-600">보유기간: 회원 탈퇴 시까지</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">2. 유료서비스 결제</p>
                    <p className="text-gray-600">필수항목: 결제수단 정보, 결제기록</p>
                    <p className="text-gray-600">보유기간: 전자상거래법 등 관계 법령에 따른 기간</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제2조 (민감정보 수집 제한)</h4>
                <p className="text-gray-600">회사는 이용자의 사상, 신념, 건강 등 민감정보를 수집하지 않습니다.</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제3조 (만 14세 미만 아동의 개인정보)</h4>
                <p className="text-gray-600">
                  만 14세 미만 아동의 개인정보를 수집하지 않으며, 이와 관련하여 서비스 이용을 제한합니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제4조 (개인정보의 보유·이용기간)</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>회원 탈퇴 시 즉시 파기</li>
                  <li>결제기록: 5년</li>
                  <li>소비자 불만 및 분쟁 기록: 3년</li>
                  <li>접속 기록: 3개월</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제5조 (개인정보 처리 위탁)</h4>
                <p className="text-gray-600 mb-2">
                  회사는 원활한 서비스 제공을 위해 일부 업무를 외부에 위탁할 수 있습니다:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Supabase, AWS, Google Firebase: 데이터 저장 및 서버 운영</li>
                  <li>PG사(결제대행사): 결제 처리</li>
                  <li>Onesignal: 푸시 알림 발송</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">제6조 (개인정보 보호책임자)</h4>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    <strong>성명:</strong> 이윤섭
                    <br />
                    <strong>이메일:</strong> yoon@sajuping.ai
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">공고일자: 2025년 8월 6일</p>
                <p className="text-sm text-gray-500">시행일자: 2025년 8월 6일</p>
              </div>
            </div>
          </ScrollArea>
          <div className="p-6 pt-0">
            <Button onClick={hidePrivacyTerms} className="w-full">
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showTerms) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent
          className="sm:max-w-md max-w-[90vw] rounded-3xl border-none bg-white shadow-xl"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-center mb-6">
              사주핑을 시작하기 위해
              <br />
              약관에 동의해주세요
            </h2>

            <div className="space-y-4 mb-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="agree-all"
                    checked={allAgreed}
                    onCheckedChange={handleAgreeAll}
                    className="rounded-full"
                  />
                  <label
                    htmlFor="agree-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    모두 동의합니다.
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="service-terms"
                    checked={agreedToService}
                    onCheckedChange={setAgreedToService}
                    className="mt-1 rounded-full"
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor="service-terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      [필수] 사주핑의 서비스 이용약관에 동의합니다.
                    </label>
                    <p className="text-xs text-muted-foreground">
                      사주핑 서비스 이용을 위한 기본 약관에 동의합니다.{" "}
                      <button
                        type="button"
                        onClick={showServiceTerms}
                        className="text-blue-600 hover:underline focus:outline-none focus:underline"
                      >
                        자세히 보기
                      </button>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="privacy-policy"
                    checked={agreedToPrivacy}
                    onCheckedChange={setAgreedToPrivacy}
                    className="mt-1 rounded-full"
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor="privacy-policy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      [필수] 사주핑의 개인정보 수집 및 이용에 동의합니다.
                    </label>
                    <p className="text-xs text-muted-foreground">
                      개인정보 수집 및 이용에 동의합니다.{" "}
                      <button
                        type="button"
                        onClick={showPrivacyTerms}
                        className="text-blue-600 hover:underline focus:outline-none focus:underline"
                      >
                        자세히 보기
                      </button>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="age-verification"
                    checked={agreedToAge}
                    onCheckedChange={setAgreedToAge}
                    className="mt-1 rounded-full"
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor="age-verification"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      [필수] 만 14세 이상입니다.
                    </label>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing-consent"
                    checked={agreedToMarketing}
                    onCheckedChange={setAgreedToMarketing}
                    className="mt-1 rounded-full"
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor="marketing-consent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      [선택] 서비스·이벤트 정보 제공을 위한 마케팅 이메일 수신에 동의합니다.
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleTermsAgree}
                disabled={!allRequiredAgreed || isProcessing}
                className="w-full py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isProcessing ? (
                  "처리 중..."
                ) : (
                  <>
                    {selectedProvider === "kakao" && "카카오로 시작하기"}
                    {selectedProvider === "google" && "Google로 시작하기"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToProviders}
                disabled={isProcessing}
                className="w-full py-3 rounded-full bg-transparent"
                type="button"
              >
                이전
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="sm:max-w-md max-w-[90vw] rounded-3xl border-none bg-white shadow-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              지금 계정을 연동하고
              <br />
              3초만에 사주 분석을 받아보세
              <br />
              요.
            </h1>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">SNS LOGIN</span>
            </div>
          </div>

          <div className="flex justify-center items-center gap-8">
            <button
              onClick={() => handleProviderSelect("kakao")}
              className="w-20 h-20 rounded-full bg-[#FEE500] flex items-center justify-center hover:bg-[#FEE500]/90 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FEE500]/50"
              type="button"
            >
              <div className="w-10 h-10 bg-[#3C1E1E] rounded-full flex items-center justify-center">
                <span className="text-[#FEE500] text-xs font-bold">TALK</span>
              </div>
            </button>

            <button
              onClick={() => handleProviderSelect("google")}
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              type="button"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
