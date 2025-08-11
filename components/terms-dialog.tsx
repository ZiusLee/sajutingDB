"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

export interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providerLabel: string
  onAgree: () => void
}

export function TermsDialog({ open, onOpenChange, providerLabel, onAgree }: TermsDialogProps) {
  const [serviceTermsChecked, setServiceTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)

  const canProceed = serviceTermsChecked && privacyChecked

  const handleAgree = () => {
    if (canProceed) {
      onAgree()
      onOpenChange(false)
      // Reset state
      setServiceTermsChecked(false)
      setPrivacyChecked(false)
      setShowPrivacyDetails(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state
    setServiceTermsChecked(false)
    setPrivacyChecked(false)
    setShowPrivacyDetails(false)
  }

  return (
    <>
      <Dialog open={open && !showPrivacyDetails} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
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
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              취소
            </Button>
            <Button onClick={handleAgree} disabled={!canProceed} className="flex-1">
              동의하고 {providerLabel} 로그인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 개인정보 처리방침 상세 다이얼로그 */}
      <Dialog open={showPrivacyDetails} onOpenChange={setShowPrivacyDetails}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">개인정보 처리방침</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowPrivacyDetails(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
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
