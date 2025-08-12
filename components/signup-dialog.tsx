"use client"

import { useState } from "react"
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
  const [selectedProvider, setSelectedProvider] = useState<"kakao" | "google" | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  // Force dialog to stay open - prevent closing
  const handleOpenChange = (newOpen: boolean) => {
    // Do nothing - force dialog to stay open
    return
  }

  const handleProviderSelect = (provider: "kakao" | "google") => {
    setSelectedProvider(provider)
    setShowTerms(true)
  }

  const handleTermsAgree = () => {
    if (selectedProvider && agreedToTerms && agreedToPrivacy) {
      onSelectProvider(selectedProvider)
    }
  }

  const handleBackToProviders = () => {
    setShowTerms(false)
    setSelectedProvider(null)
    setAgreedToTerms(false)
    setAgreedToPrivacy(false)
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
            <Button variant="ghost" size="icon" onClick={() => setShowPrivacyDetails(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-96 w-full px-6">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. 개인정보의 처리목적</h4>
                <p className="text-gray-600">사주핑은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                  <li>회원 가입 및 관리</li>
                  <li>사주 분석 서비스 제공</li>
                  <li>고객 상담 및 불만 처리</li>
                  <li>서비스 개선 및 맞춤형 서비스 제공</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. 처리하는 개인정보 항목</h4>
                <p className="text-gray-600">사주핑은 다음의 개인정보 항목을 처리합니다:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                  <li>필수항목: 이름, 생년월일, 성별, 출생시간</li>
                  <li>선택항목: 출생지역, 연락처</li>
                  <li>자동수집: 서비스 이용기록, 접속로그</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. 개인정보의 처리 및 보유기간</h4>
                <p className="text-gray-600">
                  개인정보는 수집·이용에 관한 동의일로부터 개인정보의 수집·이용목적을 달성할 때까지 보유·이용됩니다.
                  회원 탈퇴 시 지체없이 파기하며, 관련 법령에 따라 보존이 필요한 경우에는 해당 기간 동안 보관합니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. 개인정보의 제3자 제공</h4>
                <p className="text-gray-600">
                  사주핑은 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 법령의 규정에 의거하거나 수사
                  목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우에는 제공할 수 있습니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">5. 개인정보 처리의 위탁</h4>
                <p className="text-gray-600">
                  사주핑은 서비스 향상을 위해 개인정보 처리업무를 외부 전문업체에 위탁할 수 있으며, 위탁 시에는 관련
                  법령에 따라 위탁계약서에 개인정보 보호 관련 사항을 명시하고 안전하게 관리하도록 감독합니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">6. 정보주체의 권리·의무 및 행사방법</h4>
                <p className="text-gray-600">
                  이용자는 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있으며, 고객센터를 통해
                  요청하실 수 있습니다.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">7. 개인정보의 안전성 확보조치</h4>
                <p className="text-gray-600">
                  사주핑은 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                  <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
                  <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치</li>
                  <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">8. 개인정보 보호책임자</h4>
                <p className="text-gray-600">
                  개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및
                  피해구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <p className="text-sm">
                    <strong>개인정보 보호책임자</strong>
                    <br />
                    이메일: privacy@sajuping.com
                    <br />
                    연락처: 02-1234-5678
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">9. 개인정보 처리방침 변경</h4>
                <p className="text-gray-600">
                  이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는
                  경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">시행일자: 2024년 1월 1일</p>
              </div>
            </div>
          </ScrollArea>
          <div className="p-6 pt-0">
            <Button onClick={() => setShowPrivacyDetails(false)} className="w-full">
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
            <h2 className="text-lg font-semibold text-center mb-6">약관 동의</h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} className="mt-1" />
                <div className="space-y-1 flex-1">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    서비스 이용약관 동의 (필수)
                  </label>
                  <p className="text-xs text-muted-foreground">사주핑 서비스 이용을 위한 기본 약관에 동의합니다.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={agreedToPrivacy}
                  onCheckedChange={setAgreedToPrivacy}
                  className="mt-1"
                />
                <div className="space-y-1 flex-1">
                  <label
                    htmlFor="privacy"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    개인정보 처리방침 동의 (필수)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    개인정보 수집 및 이용에 동의합니다.{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDetails(true)}
                      className="text-blue-600 hover:underline"
                    >
                      자세히 보기
                    </button>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleTermsAgree}
                disabled={!agreedToTerms || !agreedToPrivacy}
                className="w-full py-3 rounded-full"
              >
                {selectedProvider === "kakao" && "카카오로 시작하기"}
                {selectedProvider === "google" && "Google로 시작하기"}
              </Button>
              <Button
                variant="outline"
                onClick={handleBackToProviders}
                className="w-full py-3 rounded-full bg-transparent"
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
          {/* Main heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              지금 계정을 연동하고
              <br />
              3초만에 사주 분석을 받아보세
              <br />
              요.
            </h1>
          </div>

          {/* SNS LOGIN separator */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">SNS LOGIN</span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="flex justify-center items-center gap-8">
            {/* Kakao Talk Button */}
            <button
              onClick={() => handleProviderSelect("kakao")}
              className="w-20 h-20 rounded-full bg-[#FEE500] flex items-center justify-center hover:bg-[#FEE500]/90 transition-colors shadow-lg"
            >
              <div className="w-10 h-10 bg-[#3C1E1E] rounded-full flex items-center justify-center">
                <span className="text-[#FEE500] text-xs font-bold">TALK</span>
              </div>
            </button>

            {/* Google Button */}
            <button
              onClick={() => handleProviderSelect("google")}
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-lg"
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
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
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
