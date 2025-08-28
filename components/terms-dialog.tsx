"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

export interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgree: () => void
}

export function TermsDialog({ open, onOpenChange, onAgree }: TermsDialogProps) {
  const [allAgreed, setAllAgreed] = useState(false)
  const [serviceTermsChecked, setServiceTermsChecked] = useState(false)
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [ageChecked, setAgeChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)
  const [showTermsDetails, setShowTermsDetails] = useState(false)

  const canProceed = serviceTermsChecked && privacyChecked && ageChecked

  const handleAllAgree = (checked: boolean) => {
    setAllAgreed(checked)
    setServiceTermsChecked(checked)
    setPrivacyChecked(checked)
    setAgeChecked(checked)
    setMarketingChecked(checked)
  }

  const updateAllAgreedState = () => {
    const allChecked = serviceTermsChecked && privacyChecked && ageChecked && marketingChecked
    setAllAgreed(allChecked)
  }

  const handleServiceTermsChange = (checked: boolean) => {
    setServiceTermsChecked(checked)
    setTimeout(updateAllAgreedState, 0)
  }

  const handlePrivacyChange = (checked: boolean) => {
    setPrivacyChecked(checked)
    setTimeout(updateAllAgreedState, 0)
  }

  const handleAgeChange = (checked: boolean) => {
    setAgeChecked(checked)
    setTimeout(updateAllAgreedState, 0)
  }

  const handleMarketingChange = (checked: boolean) => {
    setMarketingChecked(checked)
    setTimeout(updateAllAgreedState, 0)
  }

  const handleAgree = () => {
    if (canProceed) {
      onAgree()
      onOpenChange(false)
      // Reset state
      setAllAgreed(false)
      setServiceTermsChecked(false)
      setPrivacyChecked(false)
      setAgeChecked(false)
      setMarketingChecked(false)
      setShowTermsDetails(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state
    setAllAgreed(false)
    setServiceTermsChecked(false)
    setPrivacyChecked(false)
    setAgeChecked(false)
    setMarketingChecked(false)
    setShowTermsDetails(false)
  }

  return (
    <>
      <Dialog open={open && !showTermsDetails} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              사주핑을 시작하기 위해
              <br />
              약관에 동의해주세요
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Checkbox id="all-agree" checked={allAgreed} onCheckedChange={handleAllAgree} className="rounded-full" />
              <label htmlFor="all-agree" className="text-base font-medium cursor-pointer flex-1">
                모두 동의합니다.
              </label>
            </div>

            <div className="space-y-3 pl-2">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="service-terms"
                  checked={serviceTermsChecked}
                  onCheckedChange={handleServiceTermsChange}
                  className="rounded-full"
                />
                <label htmlFor="service-terms" className="text-sm cursor-pointer flex-1">
                  [필수] 사주핑의 서비스 이용약관에 동의합니다.
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="privacy-terms"
                  checked={privacyChecked}
                  onCheckedChange={handlePrivacyChange}
                  className="rounded-full"
                />
                <label htmlFor="privacy-terms" className="text-sm cursor-pointer flex-1">
                  [필수] 사주핑의 개인정보 수집 및 이용에 동의합니다.
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="age-terms"
                  checked={ageChecked}
                  onCheckedChange={handleAgeChange}
                  className="rounded-full"
                />
                <label htmlFor="age-terms" className="text-sm cursor-pointer flex-1">
                  [필수] 만 14세 이상입니다.
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="marketing-terms"
                  checked={marketingChecked}
                  onCheckedChange={handleMarketingChange}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <label htmlFor="marketing-terms" className="text-sm cursor-pointer">
                    [선택] 서비스·이벤트 정보 제공을 위한 마케팅 이메일 수신에 동의합니다.
                  </label>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setShowTermsDetails(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleAgree} disabled={!canProceed} className="w-full bg-blue-600 hover:bg-blue-700">
              완료
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTermsDetails} onOpenChange={setShowTermsDetails}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-semibold">사주핑 이용약관 및 개인정보 처리방침</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowTermsDetails(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-8 text-sm">
              {/* 서비스 이용약관 */}
              <section>
                <h2 className="font-bold text-lg mb-4 text-blue-600">1. 사주핑 서비스 이용약관</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제1조 (목적)</h3>
                    <p className="leading-relaxed">
                      본 약관은 사주핑 주식회사(이하 "회사")가 운영하는 모바일 앱·웹 기반의 사주핑 서비스(이하 "서비스")
                      이용과 관련하여, 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
                      합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제2조 (용어의 정의)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        "서비스"란 회사가 이용자에게 사주 기반 AI 해석, 감정케어 상담, 운세 리포트 등 콘텐츠를 제공하기
                        위해 정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 의미하며, 해당 서비스를
                        운영하는 사업자도 포함합니다.
                      </li>
                      <li>
                        "이용자"란 회사의 서비스에 접속하여 본 약관에 따라 회사가 제공하는 콘텐츠와 제반 서비스를
                        이용하는 회원 및 비회원을 말합니다.
                      </li>
                      <li>
                        "회원"이란 본 약관에 동의하고 가입하여 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를
                        말합니다.
                      </li>
                      <li>"비회원"이란 회원 가입 없이 회사가 제공하는 서비스 일부를 이용하는 자를 말합니다.</li>
                      <li>
                        "콘텐츠"란 회사가 제공하는 서비스와 관련하여 생성·게시하는 정보, 텍스트, 이미지, 영상, 데이터
                        등을 의미합니다.
                      </li>
                      <li>
                        "유료콘텐츠"란 회사가 유료로 제공하는 프리미엄 사주 해석, 맞춤형 상담, 전문 리포트 등 콘텐츠를
                        의미합니다.
                      </li>
                      <li>
                        "질문권"이란 회원이 구독을 통해 부여받거나 추가 결제를 통해 충전하여, 사주 해석·상담·리포트 등
                        유료콘텐츠 이용 시 차감되는 디지털 이용권을 의미합니다.
                      </li>
                      <li>
                        "보너스 질문권"이란 회사가 이벤트·프로모션 등을 통해 무상 제공하는 질문권을 의미하며 환불되지
                        않습니다.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제8조의2 (요금제 변경 및 환불 정책)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>회원은 서비스 화면에서 요금제 변경을 요청할 수 있습니다.</li>
                      <li>
                        상위 요금제(업그레이드)로 변경 시 기존 요금제는 즉시 종료되며 남은 이용기간 및 질문권은 환불되지
                        않습니다.
                      </li>
                      <li>
                        하위 요금제(다운그레이드)는 다음 결제일부터 적용되며, 그 전까지는 기존 요금제가 유지됩니다.
                      </li>
                      <li>요금제 변경 시 일할계산 환불 및 부분 환불은 제공되지 않습니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제10조 (책임의 제한)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>회사는 천재지변, 이용자 과실, 무료서비스 등으로 발생한 손해에 대해 책임을 지지 않습니다.</li>
                      <li>
                        회사가 제공하는 해석, 상담 및 리포트 등 모든 콘텐츠는 개인적 성찰과 자기이해를 돕기 위한 참고
                        자료일 뿐, 법률적·의료적·재정적 자문에 해당하지 않습니다. 이에 근거한 의사결정은 전적으로
                        이용자의 책임이며, 회사는 그 결과에 대해 어떠한 법적 책임도 지지 않습니다.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 유료 이용약관 */}
              <section>
                <h2 className="font-bold text-lg mb-4 text-purple-600">3. 사주핑 유료 이용약관</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제8조 (청약철회)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        구독형 유료서비스는 결제와 동시에 이용이 개시되므로, 결제 완료 후에는 청약철회(환불)가
                        불가합니다.
                      </li>
                      <li>단, 관계 법령상 환불 의무가 있는 경우(과오금 결제 등)에는 해당 법령에 따라 처리합니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조 (환불정책)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        구독은 결제 시점부터 즉시 효력이 발생하며, 결제일로부터 1일이라도 경과하거나 질문권을 사용한
                        경우 환불이 불가합니다.
                      </li>
                      <li>부분 환불, 잔여기간 환불, 잔여 질문권 환불은 제공되지 않습니다.</li>
                      <li>보너스 질문권은 환불되지 않습니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조의2 (요금제 변경에 따른 환불정책)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        상위 요금제로 변경 시 기존 요금제의 잔여기간 및 잔여 질문권은 즉시 소멸되며 환불되지 않습니다.
                      </li>
                      <li>
                        하위 요금제로 변경 요청 시 변경은 다음 결제일부터 적용되며 그 이전에 결제된 요금은 환불되지
                        않습니다.
                      </li>
                      <li>변경 신청 후 서비스 이용을 중단하더라도 이미 결제된 요금은 환불되지 않습니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제13조 (콘텐츠 및 계정 소유권)</h3>
                    <p>
                      서비스 내에서 제공되는 모든 콘텐츠 및 데이터에 대한 저작권과 지식재산권은 회사에 귀속됩니다.
                      이용자가 서비스를 통해 작성하거나 입력한 데이터는 회사의 서비스 개선 및 연구 목적으로 활용될 수
                      있습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제14조 (자동결제 및 해지)</h3>
                    <p>
                      구독 서비스는 결제일을 기준으로 매월/매년 자동 갱신됩니다. 이용자가 갱신을 원하지 않는 경우, 차기
                      결제일 이전에 반드시 해지 신청을 해야 하며, 결제 완료 후에는 환불되지 않습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제15조 (준거법 및 관할법원)</h3>
                    <p>
                      본 약관은 대한민국 법률을 준거법으로 하며, 서비스 이용과 관련하여 회사와 이용자 간 발생하는 분쟁은
                      민사소송법에 따른 대한민국 법원을 전속관할법원으로 합니다.
                    </p>
                  </div>
                </div>
              </section>

              <section className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>공고일자:</strong> 2025년 8월 22일
                  <br />
                  <strong>시행일자:</strong> 2025년 8월 22일
                </p>
              </section>
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowTermsDetails(false)}>확인</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
