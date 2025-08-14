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
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제3조 (회원가입 및 계정관리)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        회원가입은 카카오, 네이버, 구글, 애플 등 제3자 소셜 로그인 또는 이메일 가입을 통해 가능합니다.
                      </li>
                      <li>
                        가입 시 필수 입력 정보: 성별, 생년월일(음·양력 여부 포함), 태어난 도시
                        <br />
                        선택 입력 정보: 태어난 시, 추가 프로필 정보
                      </li>
                      <li>"동의하고 시작하기" 버튼 클릭 시 본 약관과 개인정보 처리방침에 동의한 것으로 간주합니다.</li>
                      <li>
                        회사는 다음의 경우 회원가입을 제한하거나 해지할 수 있습니다.
                        <br />- 타인의 개인정보 도용
                        <br />- 허위 정보 입력
                        <br />- 만 14세 미만 미성년자
                        <br />- 법령 또는 서비스 정책 위반 이력
                        <br />- 기술적·운영상 현저한 지장이 예상되는 경우
                      </li>
                      <li>
                        회원은 본인 계정을 직접 관리해야 하며, 타인 사용을 허용하거나 계정 보안을 소홀히 하여 발생한
                        손해에 대해 회사는 책임지지 않습니다.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제4조 (회원의 의무)</h3>
                    <p className="mb-2">회원은 다음 행위를 하여서는 안 됩니다.</p>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>서비스 접근 방해 또는 비정상적 사용 시도</li>
                      <li>타인의 개인정보 수집·이용·제공</li>
                      <li>음란·저작권 침해·허위 정보 게시</li>
                      <li>회사 승인 없이 서비스 또는 소프트웨어 복제·변경·판매·양도</li>
                      <li>다계정 생성, 이벤트 부정참여, 포인트·사이버머니 부정사용</li>
                      <li>서비스 이용 중 타인 명예훼손, 불법·미풍양속 위반 행위</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 개인정보 처리방침 */}
              <section>
                <h2 className="font-bold text-lg mb-4 text-green-600">2. 사주핑 개인정보 처리방침</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제1조 (개인정보의 수집 및 이용)</h3>
                    <p className="mb-2">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집·이용합니다.</p>
                    <ul className="list-decimal list-inside space-y-2 ml-4">
                      <li>
                        <strong>회원가입 및 서비스 이용</strong>
                        <br />- 필수항목: 이름, 성별, 음/양력 여부, 생년월일, 태어난 도시, 소셜ID
                        <br />- 선택항목: 태어난 시<br />- 보유기간: 회원 탈퇴 시까지
                      </li>
                      <li>
                        <strong>민원처리</strong>
                        <br />- 필수항목: 이메일, 문의내용, 앱 버전, 단말기 정보
                        <br />- 보유기간: 처리 완료 후 3년
                      </li>
                      <li>
                        <strong>유료서비스 결제</strong>
                        <br />- 필수항목: 결제수단 정보(카드번호, 계좌정보), 결제기록
                        <br />- 보유기간: 전자상거래법 등 관계 법령에 따른 기간
                      </li>
                      <li>
                        <strong>마케팅 및 이벤트</strong>
                        <br />- 필수항목: 이름, 성별, 접속IP, 서비스 이용기록, 기기정보, 국가정보, 쿠키, 푸시 알림 토큰
                        <br />- 보유기간: 동의 철회 또는 탈퇴 시까지
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제2조 (민감정보 수집 제한)</h3>
                    <p>회사는 이용자의 사상, 신념, 건강 등 민감정보를 수집하지 않습니다.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제3조 (만 14세 미만 아동의 개인정보)</h3>
                    <p>만 14세 미만 아동의 개인정보를 수집하지 않으며, 이와 관련하여 서비스 이용을 제한합니다.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제7조 (개인정보 처리 위탁)</h3>
                    <p className="mb-2">
                      회사는 원활한 서비스 제공을 위해 일부 업무를 외부에 위탁할 수 있으며, 위탁사는 법령에 따라
                      관리·감독합니다.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Supabase, AWS, Google Firebase: 데이터 저장 및 서버 운영</li>
                      <li>PG사(결제대행사): 결제 처리</li>
                      <li>Onesignal: 푸시 알림 발송</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제10조 (안전성 확보조치)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>암호화 저장</li>
                      <li>접근권한 최소화</li>
                      <li>해킹·바이러스 대비 보안시스템 적용</li>
                      <li>접속기록 위변조 방지</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제11조 (이용자 권리)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>개인정보 열람·정정·삭제·처리정지 요청 가능</li>
                      <li>국외 이전 거부 가능(단, 서비스 이용이 제한될 수 있음)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제12조 (개인정보 보호책임자)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>성명: 이윤섭</li>
                      <li>이메일: yoon@sajuping.ai</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 유료 이용약관 */}
              <section>
                <h2 className="font-bold text-lg mb-4 text-purple-600">3. 사주핑 유료 이용약관</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제2조 (정의)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        <strong>핑:</strong> 회원이 유료서비스 또는 콘텐츠 구매 시 사용할 수 있도록 유상으로 충전하는
                        사이버머니를 말합니다. 핑은 마지막 이용일로부터 5년 동안 사용하지 않을 경우 「상사소멸시효」에
                        따라 소멸될 수 있습니다.
                      </li>
                      <li>
                        <strong>보너스핑:</strong> 회사가 이벤트, 프로모션 등으로 무상 지급하는 가상의 데이터를
                        말합니다. 보너스핑은 환불되지 않으며, 유효기간은 회사 정책에 따릅니다. 유효기간 경과 시 자동
                        소멸되며, 소멸된 보너스핑은 환불 불가합니다.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제5조 (이용계약의 성립)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>결제가 완료되는 시점에 계약이 성립합니다.</li>
                      <li>핑과 보너스핑을 모두 보유한 경우, 유효기간이 먼저 도래하는 보너스핑이 우선 차감됩니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제8조 (청약철회 및 해지)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>결제일로부터 7일 이내, 미사용 유료콘텐츠는 환불 가능합니다.</li>
                      <li>콘텐츠 사용이 시작된 경우 환불이 제한됩니다.</li>
                      <li>일부 사용한 핑은 기존 규정에 따라 처리하며, 제9조 환불정책에 따른다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조 (환불정책 및 유효기간)</h3>
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium">제1항 (전액 환불)</h4>
                        <ul className="list-decimal list-inside space-y-1 ml-4">
                          <li>
                            구매한 핑(포인트)은 1회도 사용하지 않은 경우에 한하여, 구매일로부터 7일 이내 전액 환불이
                            가능합니다.
                          </li>
                          <li>전액 환불 시, 결제 대행 수수료 등 환불 처리에 소요되는 실비가 공제될 수 있습니다.</li>
                          <li>환불은 결제 시 사용한 동일한 결제 수단으로만 진행됩니다.</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">제2항 (부분 사용 후 환불 불가 및 유효기간)</h4>
                        <ul className="list-decimal list-inside space-y-1 ml-4">
                          <li>구매한 핑(포인트)을 1회 이상 사용한 경우, 잔여 핑에 대해서는 환불이 불가합니다.</li>
                          <li>구매한 핑(포인트)의 이용기간과 환불 가능 기간은 결제일로부터 1년입니다.</li>
                          <li>유효기간이 경과하면 잔여 핑은 자동 소멸되며, 소멸된 핑은 환불되지 않습니다.</li>
                          <li>
                            서비스 이용 중 이용자의 귀책사유로 계정이 정지·탈퇴된 경우 잔여 핑은 환불되지 않습니다.
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">제3항 (보너스핑 환불 불가)</h4>
                        <ul className="list-decimal list-inside space-y-1 ml-4">
                          <li>보너스핑은 환불 대상이 아니며, 유효기간 내 미사용 시 자동 소멸됩니다.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제10조 (보너스핑)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>부정 취득 시 회수됩니다.</li>
                      <li>유효기간 경과 또는 계정 해지 시 소멸됩니다.</li>
                      <li>양도·매매는 불가합니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제11조 (과오금)</h3>
                    <p>
                      과오금 발생 시 결제와 동일한 방법으로 환불하며, 동일 방법 불가 시 사전 안내 후 다른 방법으로
                      환불합니다.
                    </p>
                  </div>
                </div>
              </section>

              <section className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>공고일자:</strong> 2025년 8월 6일
                  <br />
                  <strong>시행일자:</strong> 2025년 8월 6일
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
