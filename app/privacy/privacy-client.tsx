"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function PrivacyClientPage() {
  const [language, setLanguage] = useState<"ko" | "en">("ko")

  useEffect(() => {
    console.log("[v0] Privacy page component mounted successfully")
    console.log("[v0] Current language state:", language)
  }, [language])

  console.log("[v0] Privacy page component rendering")

  const toggleLanguage = () => {
    console.log("[v0] Toggle language clicked, current:", language)
    setLanguage((prev) => (prev === "ko" ? "en" : "ko"))
  }

  return (
    <div className="h-full bg-white scroll-smooth overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "ko" ? "홈으로 돌아가기" : "Back to Home"}
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {language === "ko" ? "서비스 이용약관 및 개인정보처리방침" : "Terms of Service & Privacy Policy"}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2 bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Globe className="w-4 h-4" />
              {language === "ko" ? "English" : "한국어"}
            </Button>
          </div>
        </div>

        {language === "ko" ? (
          // Korean Content
          <div className="space-y-8">
            <section>
              <h1 className="text-xl font-bold text-gray-900 mb-6">1. 사주핑 서비스 이용약관</h1>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">제1조 (목적)</h2>
                  <p className="text-gray-600 text-sm">
                    본 약관은 사주핑 주식회사(이하 "회사")가 운영하는 모바일 앱·웹 기반의 사주핑 서비스(이하 "서비스")
                    이용과 관련하여, 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제2조 (용어의 정의)</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">1. "서비스"</p>
                      <p className="text-gray-600">
                        회사가 이용자에게 사주 기반 AI 해석, 감정케어 상담, 운세 리포트 등 콘텐츠를 제공하기 위해
                        정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 의미하며, 해당 서비스를 운영하는
                        사업자도 포함합니다.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">2. "이용자"</p>
                      <p className="text-gray-600">
                        회사의 서비스에 접속하여 본 약관에 따라 회사가 제공하는 콘텐츠와 제반 서비스를 이용하는 회원 및
                        비회원을 말합니다.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">3. "회원"</p>
                      <p className="text-gray-600">
                        본 약관에 동의하고 가입하여 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를 말합니다.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">4. "비회원"</p>
                      <p className="text-gray-600">
                        회원 가입 없이 회사가 제공하는 서비스 일부를 이용하는 자를 말합니다.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">5. "콘텐츠"</p>
                      <p className="text-gray-600">
                        회사가 제공하는 서비스와 관련하여 생성·게시하는 정보, 텍스트, 이미지, 영상, 데이터 등을
                        의미합니다.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">6. "유료콘텐츠"</p>
                      <p className="text-gray-600">
                        회사가 유료로 제공하는 프리미엄 사주 해석, 맞춤형 상담, 전문 리포트 등 콘텐츠를 의미합니다.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">7. "질문권"</p>
                      <p className="text-gray-600">
                        회원이 구독을 통해 부여받거나 추가 결제를 통해 충전하여, 사주 해석·상담·리포트 등 유료콘텐츠
                        이용 시 차감되는 디지털 이용권을 의미합니다.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">8. "보너스 질문권"</p>
                      <p className="text-gray-600">
                        회사가 이벤트·프로모션 등을 통해 무상 제공하는 질문권을 의미하며 환불되지 않습니다.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제3조 (회원가입 및 계정관리)</h2>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600">
                      1. 회원가입은 카카오, 네이버, 구글, 애플 등 제3자 소셜 로그인 또는 이메일 가입을 통해 가능합니다.
                    </p>
                    <p className="text-gray-600">
                      2. 가입 시 필수 입력 정보: 성별, 생년월일(음·양력 여부 포함), 태어난 도시 / 선택 입력 정보: 태어난
                      시, 추가 프로필 정보
                    </p>
                    <p className="text-gray-600">
                      3. "동의하고 시작하기" 버튼 클릭 시 본 약관과 개인정보 처리방침에 동의한 것으로 간주합니다.
                    </p>
                    <div>
                      <p className="text-gray-600">
                        4. 회사는 다음에 해당하는 경우 회원가입을 제한하거나 해지할 수 있습니다.
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                        <li>타인의 개인정보 도용</li>
                        <li>허위 정보 입력</li>
                        <li>만 14세 미만 미성년자의 가입 시도</li>
                        <li>법령 또는 서비스 정책 위반 이력</li>
                        <li>서비스 운영상 중대한 장애가 예상되는 경우</li>
                      </ul>
                    </div>
                    <p className="text-gray-600">
                      5. 회원은 본인 계정을 직접 관리해야 하며, 계정 도용이나 양도 등으로 인한 손해에 대해 회사는 책임을
                      지지 않습니다.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제4조 (회원의 의무)</h2>
                  <div className="text-sm">
                    <p className="text-gray-600 mb-3">회원은 다음 행위를 하여서는 안 됩니다.</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>서비스 접근 방해 또는 비정상적 사용 시도</li>
                      <li>타인의 개인정보 수집·이용·제공</li>
                      <li>음란·저작권 침해·허위 정보 게시</li>
                      <li>회사 승인 없이 서비스 또는 소프트웨어 복제·변경·판매·양도</li>
                      <li>다계정 생성, 이벤트 부정참여, 질문권 부정사용</li>
                      <li>타인의 권리 침해 또는 불법/미풍양속 위반 행위</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제5조 (비회원 서비스 이용)</h2>
                  <p className="text-gray-600 text-sm">
                    비회원은 일부 무료 콘텐츠만 이용 가능하며, 회사는 정책에 따라 비회원 이용 범위를 제한할 수 있습니다.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제6조 (서비스 제공 및 변경)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">1. 회사는 연중무휴 24시간 안정적인 서비스 제공을 위해 노력합니다.</p>
                    <p className="text-gray-600">
                      2. 시스템점검, 천재지변 등으로 서비스가 중단될 수 있으며, 사전 또는 사후 공지합니다.
                    </p>
                    <p className="text-gray-600">
                      3. 서비스 내용이 변경되는 경우 최소 7일 전 공지하며, 긴급 시 사후 공지할 수 있습니다.
                    </p>
                    <p className="text-gray-600">
                      4. 회사는 운영상, 기술상, 정책상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 이로
                      인한 손해에 대해 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제7조 (광고 및 정보 제공)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      1. 회사는 서비스 화면, 알림, 이메일 등을 통해 광고 및 정보를 제공할 수 있습니다.
                    </p>
                    <p className="text-gray-600">2. 이용자는 마케팅 수신 동의를 철회할 수 있습니다.</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제8조 (유료콘텐츠 이용)</h2>
                  <p className="text-gray-600 text-sm">
                    유료콘텐츠는 질문권 또는 인앱결제를 통해 이용할 수 있으며, 환불은 유료 이용약관에 따릅니다.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제8조의2 (요금제 변경 및 환불 정책)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">1. 회원은 서비스 화면에서 요금제 변경을 요청할 수 있습니다.</p>
                    <p className="text-gray-600">
                      2. 상위 요금제(업그레이드)로 변경 시 기존 요금제는 즉시 종료되며 남은 이용기간 및 질문권은
                      환불되지 않습니다.
                    </p>
                    <p className="text-gray-600">
                      3. 하위 요금제(다운그레이드)는 다음 결제일부터 적용되며, 그 전까지는 기존 요금제가 유지됩니다.
                    </p>
                    <p className="text-gray-600">4. 요금제 변경 시 일할계산 환불 및 부분 환불은 제공되지 않습니다.</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제9조 (회원 탈퇴)</h2>
                  <p className="text-gray-600 text-sm">
                    회원은 앱 또는 고객센터를 통해 탈퇴할 수 있으며, 법령상 보관의무를 제외하고 모든 정보가 삭제됩니다.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제10조 (책임의 제한)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      1. 회사는 천재지변, 이용자 과실, 무료서비스 등으로 발생한 손해에 대해 책임을 지지 않습니다.
                    </p>
                    <p className="text-gray-600">
                      2. 회사가 제공하는 해석, 상담 및 리포트 등 모든 콘텐츠는 개인적 성찰과 자기이해를 돕기 위한 참고
                      자료일 뿐, 법률적·의료적·재정적 자문에 해당하지 않습니다. 이에 근거한 의사결정은 전적으로 이용자의
                      책임이며, 회사는 그 결과에 대해 어떠한 법적 책임도 지지 않습니다.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제11조 (약관 변경)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      1. 회사는 본 약관을 변경할 수 있으며, 변경 시 최소 7일 전 공지합니다.
                    </p>
                    <p className="text-gray-600">
                      2. 이용자에게 불리한 경우 30일 전 고지하며, 변경 후 15일간 이의제기 없을 시 동의한 것으로 봅니다.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제12조 (이용제한 및 해지)</h2>
                  <p className="text-gray-600 text-sm">
                    회사는 이용자가 본 약관 또는 관계 법령을 위반하거나, 서비스 운영을 고의로 방해하는 경우 즉시
                    이용계약을 해지하거나 서비스 이용을 제한할 수 있습니다. 이 경우 이미 결제된 금액은 환불되지
                    않습니다.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t-4 border-gray-200 pt-8">
              <h1 className="text-xl font-bold text-gray-900 mb-6">2. 사주핑 개인정보 처리방침</h1>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">제1조 (개인정보의 수집 및 이용)</h2>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600 mb-3">
                      회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집·이용합니다.
                    </p>
                    <div>
                      <p className="font-medium text-gray-700">1. 회원가입 및 서비스 이용</p>
                      <p className="text-gray-600">필수항목: 이름, 성별, 음/양력 여부, 생년월일, 태어난 도시, 소셜ID</p>
                      <p className="text-gray-600">선택항목: 태어난 시</p>
                      <p className="text-gray-600">보유기간: 회원 탈퇴 시까지</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">2. 민원처리</p>
                      <p className="text-gray-600">필수항목: 이메일, 문의내용, 앱 버전, 단말기 정보</p>
                      <p className="text-gray-600">보유기간: 처리 완료 후 3년</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">3. 유료서비스 결제</p>
                      <p className="text-gray-600">필수항목: 결제수단 정보(카드번호, 계좌정보), 결제기록</p>
                      <p className="text-gray-600">보유기간: 전자상거래법 등 관계 법령에 따른 기간</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">4. 마케팅 및 이벤트</p>
                      <p className="text-gray-600">
                        필수항목: 이름, 성별, 접속IP, 서비스 이용기록, 기기정보, 국가정보, 쿠키, 푸시 알림 토큰
                      </p>
                      <p className="text-gray-600">보유기간: 동의 철회 또는 탈퇴 시까지</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제2조 (민감정보 수집 제한)</h2>
                  <p className="text-gray-600">회사는 이용자의 사상, 신념, 건강 등 민감정보를 수집하지 않습니다.</p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제3조 (만 14세 미만 아동의 개인정보)</h2>
                  <p className="text-gray-600">
                    만 14세 미만 아동의 개인정보를 수집하지 않으며, 이와 관련하여 서비스 이용을 제한합니다.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제4조 (가명정보 처리)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">항목: 회원ID, 생년월일, 성별</p>
                    <p className="text-gray-600">목적: 데이터 분석 및 서비스 품질 개선</p>
                    <p className="text-gray-600">보관기간: 회원 탈퇴 시까지</p>
                    <p className="text-gray-600">가명정보는 추가정보와 분리하여 안전하게 관리합니다.</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제5조 (쿠키 및 행태정보 수집)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      회사는 맞춤형 운세 추천, 상담 기록 최적화를 위해 쿠키 및 광고 ID를 수집할 수 있습니다.
                    </p>
                    <p className="text-gray-600">
                      이용자는 브라우저 또는 모바일 기기 설정을 통해 저장을 거부할 수 있습니다.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제6조 (개인정보의 보유·이용기간)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">1. 회원 탈퇴 시 즉시 파기</p>
                    <p className="text-gray-600">2. 관련 법령에 따른 보존</p>
                    <div className="ml-4 space-y-1">
                      <p className="text-gray-600">- 결제기록: 5년</p>
                      <p className="text-gray-600">- 소비자 불만 및 분쟁 기록: 3년</p>
                      <p className="text-gray-600">- 접속 기록: 3개월</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제7조 (개인정보 처리 위탁)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      회사는 원활한 서비스 제공을 위해 일부 업무를 외부에 위탁할 수 있으며, 위탁사는 법령에 따라
                      관리·감독합니다.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                      <li>Supabase, AWS, Google Firebase: 데이터 저장 및 서버 운영</li>
                      <li>PG사(결제대행사): 결제 처리</li>
                      <li>Onesignal: 푸시 알림 발송</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제8조 (개인정보 제3자 제공)</h2>
                  <p className="text-gray-600">
                    회사는 이용자 동의 없이 개인정보를 제3자에게 제공하지 않으며, 법령에 근거한 경우에만 제공합니다.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제9조 (국외 이전)</h2>
                  <p className="text-gray-600">AWS, Firebase 등 해외 서버를 이용하여 암호화 전송·저장할 수 있습니다.</p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제10조 (안전성 확보조치)</h2>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>암호화 저장</li>
                    <li>접근권한 최소화</li>
                    <li>해킹·바이러스 대비 보안시스템 적용</li>
                    <li>접속기록 위변조 방지</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제11조 (이용자 권리)</h2>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>개인정보 열람·정정·삭제·처리정지 요청 가능</li>
                    <li>국외 이전 거부 가능(단, 서비스 이용이 제한될 수 있음)</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제12조 (개인정보 보호책임자)</h2>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>성명:</strong> 이윤섭
                    </p>
                    <p className="text-sm">
                      <strong>이메일:</strong> yoon@sajuping.ai
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">제13조 (개인정보 처리방침 변경)</h2>
                  <p className="text-gray-600">방침 변경 시 서비스 내 공지사항 및 팝업으로 사전 안내합니다.</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="pt-4">
              <p className="text-sm text-gray-500">공고일자: 2025년 8월 22일</p>
              <p className="text-sm text-gray-500">시행일자: 2025년 8월 22일</p>
            </div>
          </div>
        ) : (
          // English Content
          <div className="space-y-8">
            <section>
              <h1 className="text-xl font-bold text-gray-900 mb-6">1. SajuPing Terms of Service</h1>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 1 (Purpose)</h2>
                  <p className="text-gray-600 text-sm">
                    These Terms of Service ("Terms") govern the use of the SajuPing mobile app and web-based services
                    ("Service") operated by SajuPing Inc. ("Company", "we", "us", or "our"), and establish the rights,
                    obligations, and responsibilities between the Company and users, as well as other necessary matters.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 2 (Definitions)</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">1. "Service"</p>
                      <p className="text-gray-600">
                        Refers to the virtual marketplace established by the Company using information and communication
                        facilities to provide users with AI-based fortune telling interpretations, emotional care
                        consultations, fortune reports, and other content, including the business operator that runs
                        such services.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">2. "User"</p>
                      <p className="text-gray-600">
                        Refers to members and non-members who access the Company's Service and use the content and
                        related services provided by the Company in accordance with these Terms.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">3. "Member"</p>
                      <p className="text-gray-600">
                        Refers to a person who agrees to these Terms and registers to continuously use the services
                        provided by the Company.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">4. "Non-member"</p>
                      <p className="text-gray-600">
                        Refers to a person who uses part of the services provided by the Company without membership
                        registration.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">5. "Content"</p>
                      <p className="text-gray-600">
                        Refers to information, text, images, videos, data, etc. created and posted by the Company in
                        relation to the services provided.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">6. "Premium Content"</p>
                      <p className="text-gray-600">
                        Refers to paid content provided by the Company, such as premium fortune interpretations,
                        personalized consultations, and professional reports.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">7. "Question Credits"</p>
                      <p className="text-gray-600">
                        Refers to digital usage rights that members receive through subscriptions or purchase through
                        additional payments, which are deducted when using premium content such as fortune
                        interpretations, consultations, and reports.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">8. "Bonus Question Credits"</p>
                      <p className="text-gray-600">
                        Refers to question credits provided free of charge by the Company through events and promotions,
                        which are non-refundable.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Article 3 (Membership Registration and Account Management)
                  </h2>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600">
                      1. Membership registration is available through third-party social login (Kakao, Naver, Google,
                      Apple) or email registration.
                    </p>
                    <p className="text-gray-600">
                      2. Required information upon registration: Gender, date of birth (including lunar/solar calendar),
                      city of birth / Optional information: Time of birth, additional profile information.
                    </p>
                    <p className="text-gray-600">
                      3. Clicking the "Agree and Start" button is deemed as consent to these Terms and Privacy Policy.
                    </p>
                    <div>
                      <p className="text-gray-600">
                        4. The Company may restrict or terminate membership registration in the following cases:
                      </p>
                      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-600">
                        <li>Identity theft of others' personal information</li>
                        <li>Entering false information</li>
                        <li>Registration attempts by minors under 14 years of age</li>
                        <li>History of violating laws or service policies</li>
                        <li>Cases where significant service disruption is expected</li>
                      </ul>
                    </div>
                    <p className="text-gray-600">
                      5. Members must manage their own accounts directly, and the Company is not responsible for damages
                      caused by account theft or transfer.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 4 (Member Obligations)</h2>
                  <div className="text-sm">
                    <p className="text-gray-600 mb-3">Members must not engage in the following activities:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Interfering with service access or attempting abnormal usage</li>
                      <li>Collecting, using, or providing others' personal information</li>
                      <li>Posting obscene, copyright-infringing, or false information</li>
                      <li>
                        Copying, modifying, selling, or transferring services or software without Company approval
                      </li>
                      <li>Creating multiple accounts, fraudulent event participation, or misusing question credits</li>
                      <li>Infringing on others' rights or engaging in illegal/immoral activities</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 5 (Non-member Service Usage)</h2>
                  <p className="text-gray-600 text-sm">
                    Non-members can only access limited free content, and the Company may restrict the scope of
                    non-member usage according to policy.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 6 (Service Provision and Changes)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">1. The Company strives to provide stable service 24/7 year-round.</p>
                    <p className="text-gray-600">
                      2. Service may be interrupted due to system maintenance, natural disasters, etc., with advance or
                      post notification.
                    </p>
                    <p className="text-gray-600">
                      3. When service content changes, notice will be given at least 7 days in advance, or post-notice
                      in emergency situations.
                    </p>
                    <p className="text-gray-600">
                      4. The Company may change or discontinue all or part of the service as needed for operational,
                      technical, or policy reasons, and shall not be liable for damages unless there is intentional or
                      gross negligence.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 7 (Advertising and Information Provision)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      1. The Company may provide advertisements and information through service screens, notifications,
                      emails, etc.
                    </p>
                    <p className="text-gray-600">2. Users may withdraw consent for marketing communications.</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 8 (Premium Content Usage)</h2>
                  <p className="text-gray-600 text-sm">
                    Premium content can be accessed through question credits or in-app purchases, and refunds are
                    subject to the paid service terms.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 8-2 (Plan Changes and Refund Policy)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">1. Members may request plan changes through the service interface.</p>
                    <p className="text-gray-600">
                      2. When upgrading to a higher plan, the existing plan terminates immediately and remaining usage
                      periods and question credits are non-refundable.
                    </p>
                    <p className="text-gray-600">
                      3. Downgrading to a lower plan takes effect from the next billing date, with the existing plan
                      maintained until then.
                    </p>
                    <p className="text-gray-600">
                      4. Pro-rated refunds and partial refunds are not provided for plan changes.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 9 (Member Withdrawal)</h2>
                  <p className="text-gray-600 text-sm">
                    Members may withdraw through the app or customer service, and all information will be deleted except
                    for legally required retention.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 10 (Limitation of Liability)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      1. The Company is not liable for damages caused by natural disasters, user negligence, free
                      services, etc.
                    </p>
                    <p className="text-gray-600">
                      2. <strong>IMPORTANT DISCLAIMER:</strong> All interpretations, consultations, and reports provided
                      by the Company are for personal reflection and self-understanding purposes only and do not
                      constitute legal, medical, or financial advice. Decision-making based on this content is entirely
                      the user's responsibility, and the Company assumes no legal liability for the consequences. The
                      Service is provided "AS IS" without warranties of any kind, express or implied.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 11 (Terms Amendment)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      1. The Company may amend these Terms, with at least 7 days' advance notice.
                    </p>
                    <p className="text-gray-600">
                      2. For unfavorable changes to users, 30 days' advance notice will be given, and lack of objection
                      within 15 days after the change will be deemed as consent.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 12 (Service Restrictions and Termination)</h2>
                  <p className="text-gray-600 text-sm">
                    The Company may immediately terminate the service contract or restrict service usage if users
                    violate these Terms or related laws, or intentionally interfere with service operations. In such
                    cases, already paid amounts are non-refundable.
                  </p>
                </div>
              </div>
            </section>

            <div className="border-t-4 border-gray-200 pt-8">
              <h1 className="text-xl font-bold text-gray-900 mb-6">2. SajuPing Privacy Policy</h1>

              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 1 (Collection and Use of Personal Information)</h2>
                  <div className="space-y-3 text-sm">
                    <p className="text-gray-600 mb-3">
                      The Company collects and uses the following personal information to provide services:
                    </p>
                    <div>
                      <p className="font-medium text-gray-700">1. Membership Registration and Service Use</p>
                      <p className="text-gray-600">
                        Required: Name, gender, lunar/solar calendar, date of birth, city of birth, social ID
                      </p>
                      <p className="text-gray-600">Optional: Time of birth</p>
                      <p className="text-gray-600">Retention period: Until membership withdrawal</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">2. Customer Service</p>
                      <p className="text-gray-600">Required: Email, inquiry content, app version, device information</p>
                      <p className="text-gray-600">Retention period: 3 years after completion</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">3. Paid Service Payment</p>
                      <p className="text-gray-600">
                        Required: Payment method information (card number, account info), payment records
                      </p>
                      <p className="text-gray-600">
                        Retention period: As required by e-commerce laws and related regulations
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">4. Marketing and Events</p>
                      <p className="text-gray-600">
                        Required: Name, gender, access IP, service usage records, device information, country
                        information, cookies, push notification tokens
                      </p>
                      <p className="text-gray-600">Retention period: Until consent withdrawal or account deletion</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Article 2 (Sensitive Information Collection Restrictions)
                  </h2>
                  <p className="text-gray-600">
                    The Company does not collect sensitive information such as users' thoughts, beliefs, or health
                    information.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 3 (Personal Information of Children Under 14)</h2>
                  <p className="text-gray-600">
                    We do not collect personal information from children under 14 years of age and restrict service
                    usage accordingly. In compliance with COPPA (Children's Online Privacy Protection Act), parental
                    consent would be required for any data collection from children under 13.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 4 (Pseudonymized Information Processing)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">Items: Member ID, date of birth, gender</p>
                    <p className="text-gray-600">Purpose: Data analysis and service quality improvement</p>
                    <p className="text-gray-600">Retention period: Until membership withdrawal</p>
                    <p className="text-gray-600">
                      Pseudonymized information is securely managed separately from additional information.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Article 5 (Cookies and Behavioral Information Collection)
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      The Company may collect cookies and advertising IDs for personalized fortune recommendations and
                      consultation record optimization.
                    </p>
                    <p className="text-gray-600">
                      Users may refuse storage through browser or mobile device settings. We comply with applicable
                      state privacy laws including CCPA (California Consumer Privacy Act) regarding such data
                      collection.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Article 6 (Personal Information Retention and Usage Period)
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">1. Immediate deletion upon membership withdrawal</p>
                    <p className="text-gray-600">2. Retention according to related laws:</p>
                    <div className="ml-4 space-y-1">
                      <p className="text-gray-600">- Payment records: 5 years</p>
                      <p className="text-gray-600">- Consumer complaints and dispute records: 3 years</p>
                      <p className="text-gray-600">- Access logs: 3 months</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Article 7 (Personal Information Processing Consignment)
                  </h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      The Company may outsource some operations to external parties for smooth service provision, and
                      consignees are managed and supervised according to law.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                      <li>Supabase, AWS, Google Firebase: Data storage and server operations</li>
                      <li>Payment Gateway Companies: Payment processing</li>
                      <li>OneSignal: Push notification delivery</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">
                    Article 8 (Third-Party Provision of Personal Information)
                  </h2>
                  <p className="text-gray-600">
                    The Company does not provide personal information to third parties without user consent, except when
                    required by law. We comply with applicable data sharing restrictions under state and federal privacy
                    laws.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 9 (International Transfer)</h2>
                  <p className="text-gray-600">
                    Data may be transmitted and stored in encrypted form using overseas servers such as AWS and
                    Firebase. We implement appropriate safeguards for international data transfers as required by
                    applicable privacy laws.
                  </p>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 10 (Security Measures)</h2>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Encrypted storage</li>
                    <li>Minimized access permissions</li>
                    <li>Security systems against hacking and viruses</li>
                    <li>Prevention of access log forgery and alteration</li>
                    <li>Regular security audits and updates</li>
                    <li>Employee training on data protection</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 11 (User Rights)</h2>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">Users have the right to:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4">
                      <li>Request access, correction, deletion, and processing suspension of personal information</li>
                      <li>Refuse international transfer (service usage may be restricted)</li>
                      <li>Withdraw consent for data processing at any time</li>
                      <li>Request information about data sharing and processing activities</li>
                      <li>File complaints with relevant privacy authorities</li>
                    </ul>
                    <p className="text-gray-600 mt-2">
                      <strong>California Residents:</strong> Under CCPA, you have additional rights including the right
                      to know what personal information is collected, the right to delete personal information, and the
                      right to opt-out of the sale of personal information. We do not sell personal information.
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 12 (Privacy Officer)</h2>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>Name:</strong> Yoon Seop Lee
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> yoon@sajuping.ai
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-lg font-semibold mb-4">Article 13 (Privacy Policy Changes)</h2>
                  <p className="text-gray-600">
                    Changes to this policy will be notified in advance through service announcements and pop-ups.
                    Material changes will be notified at least 30 days in advance.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="pt-4">
              <p className="text-sm text-gray-500">Announcement Date: August 22, 2025</p>
              <p className="text-sm text-gray-500">Effective Date: August 22, 2025</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
