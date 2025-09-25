"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PrivacyClientPage() {
  const [language, setLanguage] = useState<"ko" | "en">("ko")

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ko" ? "en" : "ko"))
  }

  return (
    <div className="min-h-screen bg-white">
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
              className="flex items-center gap-2 bg-transparent"
            >
              <Globe className="w-4 h-4" />
              {language === "ko" ? "English" : "한국어"}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-8 pr-4">
            <section>
              <h2 className="font-bold text-lg mb-4 text-blue-600">1. 사주핑 서비스 이용약관</h2>

              {language === "ko" ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제1조 (목적)</h3>
                    <p className="leading-relaxed text-gray-700">
                      본 약관은 사주핑 주식회사(이하 "회사")가 운영하는 모바일 앱·웹 기반의 사주핑 서비스(이하 "서비스")
                      이용과 관련하여, 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
                      합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제2조 (용어의 정의)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
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
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제3조 (회원가입 및 계정관리)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        회원가입은 카카오, 네이버, 구글, 애플 등 제3자 소셜 로그인 또는 이메일 가입을 통해 가능합니다.
                      </li>
                      <li>
                        가입 시 필수 입력 정보: 성별, 생년월일(음·양력 여부 포함), 태어난 도시 / 선택 입력 정보: 태어난
                        시, 추가 프로필 정보
                      </li>
                      <li>"동의하고 시작하기" 버튼 클릭 시 본 약관과 개인정보 처리방침에 동의한 것으로 간주합니다.</li>
                      <li>
                        회사는 다음에 해당하는 경우 회원가입을 제한하거나 해지할 수 있습니다.
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>타인의 개인정보 도용</li>
                          <li>허위 정보 입력</li>
                          <li>만 14세 미만 미성년자의 가입 시도</li>
                          <li>법령 또는 서비스 정책 위반 이력</li>
                          <li>서비스 운영상 중대한 장애가 예상되는 경우</li>
                        </ul>
                      </li>
                      <li>
                        회원은 본인 계정을 직접 관리해야 하며, 계정 도용이나 양도 등으로 인한 손해에 대해 회사는 책임을
                        지지 않습니다.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제4조 (회원의 의무)</h3>
                    <p className="text-gray-700 mb-2">회원은 다음 행위를 하여서는 안 됩니다.</p>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>서비스 접근 방해 또는 비정상적 사용 시도</li>
                      <li>타인의 개인정보 수집·이용·제공</li>
                      <li>음란·저작권 침해·허위 정보 게시</li>
                      <li>회사 승인 없이 서비스 또는 소프트웨어 복제·변경·판매·양도</li>
                      <li>다계정 생성, 이벤트 부정참여, 질문권 부정사용</li>
                      <li>타인의 권리 침해 또는 불법/미풍양속 위반 행위</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제5조 (비회원 서비스 이용)</h3>
                    <p className="text-gray-700">
                      비회원은 일부 무료 콘텐츠만 이용 가능하며, 회사는 정책에 따라 비회원 이용 범위를 제한할 수
                      있습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제6조 (서비스 제공 및 변경)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>회사는 연중무휴 24시간 안정적인 서비스 제공을 위해 노력합니다.</li>
                      <li>시스템점검, 천재지변 등으로 서비스가 중단될 수 있으며, 사전 또는 사후 공지합니다.</li>
                      <li>서비스 내용이 변경되는 경우 최소 7일 전 공지하며, 긴급 시 사후 공지할 수 있습니다.</li>
                      <li>
                        회사는 운영상, 기술상, 정책상 필요에 따라 서비스의 전부 또는 일부를 변경·중단할 수 있으며, 이로
                        인한 손해에 대해 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제7조 (광고 및 정보 제공)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>회사는 서비스 화면, 알림, 이메일 등을 통해 광고 및 정보를 제공할 수 있습니다.</li>
                      <li>이용자는 마케팅 수신 동의를 철회할 수 있습니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제8조 (유료콘텐츠 이용)</h3>
                    <p className="text-gray-700">
                      유료콘텐츠는 질문권 또는 인앱결제를 통해 이용할 수 있으며, 환불은 유료 이용약관에 따릅니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제8조의2 (요금제 변경 및 환불 정책)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>회원은 서비스 화면에서 요금제 변경을 요청할 수 있습니다.</li>
                      <li>
                        상위 요금제(업그레이드)로 변경 시 기존 요금제는 즉시 종료되며 남은 이용기간 및 질문권은 환불되지
                        않습니다.
                      </li>
                      <li>
                        하위 요금제(다운그레이드)는 다음 결제일부터 적용되며, 그 전까지는 기존 요금제가 유지됩니다.
                      </li>
                      <li>요금제 변경 시 일할계산 환불 및 부분 환불은 제공되지 않습니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조 (회원 탈퇴)</h3>
                    <p className="text-gray-700">
                      회원은 앱 또는 고객센터를 통해 탈퇴할 수 있으며, 법령상 보관의무를 제외하고 모든 정보가
                      삭제됩니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제10조 (책임의 제한)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>회사는 천재지변, 이용자 과실, 무료서비스 등으로 발생한 손해에 대해 책임을 지지 않습니다.</li>
                      <li>
                        회사가 제공하는 해석, 상담 및 리포트 등 모든 콘텐츠는 개인적 성찰과 자기이해를 돕기 위한 참고
                        자료일 뿐, 법률적·의료적·재정적 자문에 해당하지 않습니다. 이에 근거한 의사결정은 전적으로
                        이용자의 책임이며, 회사는 그 결과에 대해 어떠한 법적 책임도 지지 않습니다.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제11조 (약관 변경)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>회사는 본 약관을 변경할 수 있으며, 변경 시 최소 7일 전 공지합니다.</li>
                      <li>
                        이용자에게 불리한 경우 30일 전 고지하며, 변경 후 15일간 이의제기 없을 시 동의한 것으로 봅니다.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제12조 (이용제한 및 해지)</h3>
                    <p className="text-gray-700">
                      회사는 이용자가 본 약관 또는 관계 법령을 위반하거나, 서비스 운영을 고의로 방해하는 경우 즉시
                      이용계약을 해지하거나 서비스 이용을 제한할 수 있습니다. 이 경우 이미 결제된 금액은 환불되지
                      않습니다.
                    </p>
                  </div>

                  <div className="pt-2 text-gray-600">
                    <p>공고일자: 2025년 8월 22일</p>
                    <p>시행일자: 2025년 8월 22일</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 1 (Purpose)</h3>
                    <p className="leading-relaxed text-gray-700">
                      These terms and conditions aim to define the rights, obligations, and responsibilities between
                      SajuPing Co., Ltd. (the "Company") and users regarding the use of mobile app and web-based
                      SajuPing services.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 2 (Definitions)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        "Service" means the virtual business place set up by the Company to provide AI-based fortune
                        telling interpretations, emotional care consultations, fortune reports, and other content to
                        users through information and communication facilities, including the business operator that
                        operates such services.
                      </li>
                      <li>
                        "User" means members and non-members who access the Company's services and use the content and
                        related services provided by the Company in accordance with these terms.
                      </li>
                      <li>
                        "Member" means a person who agrees to these terms and registers to continuously use the services
                        provided by the Company.
                      </li>
                      <li>
                        "Non-member" means a person who uses part of the services provided by the Company without
                        membership registration.
                      </li>
                      <li>
                        "Content" means information, text, images, videos, data, etc. created and posted by the Company
                        in relation to the services provided.
                      </li>
                      <li>
                        "Paid Content" means premium fortune telling interpretations, customized consultations,
                        professional reports, and other content provided by the Company for a fee.
                      </li>
                      <li>
                        "Question Rights" means digital usage rights that are granted to members through subscriptions
                        or charged through additional payments, and are deducted when using paid content such as fortune
                        telling interpretations, consultations, and reports.
                      </li>
                      <li>
                        "Bonus Question Rights" means question rights provided free of charge by the Company through
                        events and promotions, which are non-refundable.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">
                      Article 3 (Membership Registration and Account Management)
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        Membership registration is possible through third-party social login such as Kakao, Naver,
                        Google, Apple, or email registration.
                      </li>
                      <li>
                        Required information for registration: gender, date of birth (including lunar/solar calendar),
                        city of birth / Optional information: time of birth, additional profile information
                      </li>
                      <li>
                        Clicking the "Agree and Start" button is considered consent to these terms and privacy policy.
                      </li>
                      <li>
                        The Company may restrict or terminate membership registration in the following cases:
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>Identity theft of others' personal information</li>
                          <li>Input of false information</li>
                          <li>Registration attempts by minors under 14 years of age</li>
                          <li>History of violating laws or service policies</li>
                          <li>Cases where significant service operation disruption is expected</li>
                        </ul>
                      </li>
                      <li>
                        Members must directly manage their own accounts, and the Company is not responsible for damages
                        caused by account theft or transfer.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 10 (Limitation of Liability)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        The Company is not responsible for damages caused by natural disasters, user negligence, free
                        services, etc.
                      </li>
                      <li>
                        All content provided by the Company, including interpretations, consultations, and reports, are
                        merely reference materials to help with personal reflection and self-understanding, and do not
                        constitute legal, medical, or financial advice. Decision-making based on this content is
                        entirely the user's responsibility, and the Company bears no legal responsibility for the
                        results.
                      </li>
                    </ol>
                  </div>

                  <div className="pt-2 text-gray-600">
                    <p>Announcement Date: August 22, 2025</p>
                    <p>Effective Date: August 22, 2025</p>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="font-bold text-lg mb-4 text-green-600">2. 사주핑 개인정보처리방침</h2>

              {language === "ko" ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제1조 (개인정보의 수집 및 이용)</h3>
                    <p className="text-gray-700 mb-2">
                      회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집·이용합니다.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-700">
                      <li>
                        회원가입 및 서비스 이용
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>필수항목: 이름, 성별, 음/양력 여부, 생년월일, 태어난 도시, 소셜ID</li>
                          <li>선택항목: 태어난 시</li>
                          <li>보유기간: 회원 탈퇴 시까지</li>
                        </ul>
                      </li>
                      <li>
                        민원처리
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>필수항목: 이메일, 문의내용, 앱 버전, 단말기 정보</li>
                          <li>보유기간: 처리 완료 후 3년</li>
                        </ul>
                      </li>
                      <li>
                        유료서비스 결제
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>필수항목: 결제수단 정보(카드번호, 계좌정보), 결제기록</li>
                          <li>보유기간: 전자상거래법 등 관계 법령에 따른 기간</li>
                        </ul>
                      </li>
                      <li>
                        마케팅 및 이벤트
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>
                            필수항목: 이름, 성별, 접속IP, 서비스 이용기록, 기기정보, 국가정보, 쿠키, 푸시 알림 토큰
                          </li>
                          <li>보유기간: 동의 철회 또는 탈퇴 시까지</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제2조 (민감정보 수집 제한)</h3>
                    <p className="text-gray-700">회사는 이용자의 사상, 신념, 건강 등 민감정보를 수집하지 않습니다.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제3조 (만 14세 미만 아동의 개인정보)</h3>
                    <p className="text-gray-700">
                      만 14세 미만 아동의 개인정보를 수집하지 않으며, 이와 관련하여 서비스 이용을 제한합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제4조 (가명정보 처리)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                      <li>항목: 회원ID, 생년월일, 성별</li>
                      <li>목적: 데이터 분석 및 서비스 품질 개선</li>
                      <li>보관기간: 회원 탈퇴 시까지</li>
                      <li>가명정보는 추가정보와 분리하여 안전하게 관리합니다.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제5조 (쿠키 및 행태정보 수집)</h3>
                    <p className="text-gray-700 mb-2">
                      회사는 맞춤형 운세 추천, 상담 기록 최적화를 위해 쿠키 및 광고 ID를 수집할 수 있습니다.
                    </p>
                    <p className="text-gray-700">
                      이용자는 브라우저 또는 모바일 기기 설정을 통해 저장을 거부할 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제6조 (개인정보의 보유·이용기간)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>회원 탈퇴 시 즉시 파기</li>
                      <li>
                        관련 법령에 따른 보존
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>결제기록: 5년</li>
                          <li>소비자 불만 및 분쟁 기록: 3년</li>
                          <li>접속 기록: 3개월</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제7조 (개인정보 처리 위탁)</h3>
                    <p className="text-gray-700 mb-2">
                      회사는 원활한 서비스 제공을 위해 일부 업무를 외부에 위탁할 수 있으며, 위탁사는 법령에 따라
                      관리·감독합니다.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                      <li>Supabase, AWS, Google Firebase: 데이터 저장 및 서버 운영</li>
                      <li>PG사(결제대행사): 결제 처리</li>
                      <li>Onesignal: 푸시 알림 발송</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제8조 (개인정보 제3자 제공)</h3>
                    <p className="text-gray-700">
                      회사는 이용자 동의 없이 개인정보를 제3자에게 제공하지 않으며, 법령에 근거한 경우에만 제공합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조 (국외 이전)</h3>
                    <p className="text-gray-700">
                      AWS, Firebase 등 해외 서버를 이용하여 암호화 전송·저장할 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제10조 (안전성 확보조치)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                      <li>암호화 저장</li>
                      <li>접근권한 최소화</li>
                      <li>해킹·바이러스 대비 보안시스템 적용</li>
                      <li>접속기록 위변조 방지</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제11조 (이용자 권리)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-gray-700">
                      <li>개인정보 열람·정정·삭제·처리정지 요청 가능</li>
                      <li>국외 이전 거부 가능(단, 서비스 이용이 제한될 수 있음)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제12조 (개인정보 보호책임자)</h3>
                    <div className="space-y-1 text-gray-700">
                      <p>성명: 이윤섭</p>
                      <p>이메일: yoon@sajuping.ai</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제13조 (개인정보 처리방침 변경)</h3>
                    <p className="text-gray-700">방침 변경 시 서비스 내 공지사항 및 팝업으로 사전 안내합니다.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base mb-2">
                      Article 1 (Collection and Use of Personal Information)
                    </h3>
                    <p className="text-gray-700 mb-2">
                      The Company collects and uses the following personal information for service provision:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-gray-700">
                      <li>
                        Membership registration and service use
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>
                            Required items: name, gender, lunar/solar calendar, date of birth, city of birth, social ID
                          </li>
                          <li>Optional items: time of birth</li>
                          <li>Retention period: until membership withdrawal</li>
                        </ul>
                      </li>
                      <li>
                        Complaint processing
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>Required items: email, inquiry content, app version, device information</li>
                          <li>Retention period: 3 years after processing completion</li>
                        </ul>
                      </li>
                      <li>
                        Paid service payment
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>
                            Required items: payment method information (card number, account information), payment
                            records
                          </li>
                          <li>Retention period: period according to related laws such as e-commerce law</li>
                        </ul>
                      </li>
                      <li>
                        Marketing and events
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>
                            Required items: name, gender, access IP, service usage records, device information, country
                            information, cookies, push notification tokens
                          </li>
                          <li>Retention period: until consent withdrawal or membership withdrawal</li>
                        </ul>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">
                      Article 12 (Personal Information Protection Officer)
                    </h3>
                    <div className="space-y-1 text-gray-700">
                      <p>Name: Lee Yoon Seop</p>
                      <p>Email: yoon@sajuping.ai</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 13 (Privacy Policy Changes)</h3>
                    <p className="text-gray-700">
                      Policy changes will be announced in advance through service notifications and pop-ups.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="font-bold text-lg mb-4 text-purple-600">3. 사주핑 구독 이용약관</h2>

              {language === "ko" ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제1장 총칙</h3>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제1조 (목적)</h3>
                    <p className="text-gray-700">
                      본 약관은 회원이 사주핑 서비스 내 구독서비스를 이용함에 있어 회사와 회원의 권리·의무 및 이용조건을
                      규정합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제2조 (정의)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        <strong>회원</strong>: 구독서비스를 이용하는 자
                      </li>
                      <li>
                        <strong>구독서비스</strong>: 회사가 인앱결제를 통해 유료로 제공하는 디지털콘텐츠 및 기능
                      </li>
                      <li>
                        <strong>핑(Ping)</strong>: 사주 해석·상담 등에 사용되는 디지털 질문권
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>
                            <strong>무료핑</strong>: 회원에게 매일 기본 제공되는 핑(구독 없이 1일 3핑 제공)
                          </li>
                          <li>
                            <strong>구독핑</strong>: 유료 구독 시 매일 제공되는 핑(티어별 차등 제공)
                          </li>
                          <li>
                            <strong>보너스핑</strong>: 이벤트·프로모션 등으로 무상 제공되는 핑(환불 불가)
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>인앱결제 구독서비스</strong>: Apple App Store 및 Google Play Store 인앱결제를 통해 주
                        단위(1주)로 자동 갱신되는 서비스
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제3조 (적용)</h3>
                    <p className="text-gray-700">회원이 구독서비스를 결제하면 본 약관에 동의한 것으로 봅니다.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제2장 구독서비스 이용</h3>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제4조 (서비스 안내)</h3>
                    <p className="text-gray-700">
                      회사는 구독서비스의 명칭, 가격, 이용기간, 제공 핑 수량을 앱 화면에 표시합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제5조 (계약성립)</h3>
                    <p className="text-gray-700">결제 완료 시 이용계약이 성립합니다.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제6조 (미성년자)</h3>
                    <p className="text-gray-700">미성년자 결제 시 법정대리인의 동의가 필요합니다.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제7조 (결제수단)</h3>
                    <p className="text-gray-700">
                      Apple App Store 인앱결제, Google Play Store 인앱결제, 그 외 회사가 지정한 수단
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제8조 (청약철회)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        구독서비스는 결제와 동시에 이용이 개시되므로, 결제 완료 후에는 청약철회(환불)가 불가합니다.
                      </li>
                      <li>단, 관계 법령상 환불 의무가 있는 경우(과오금 결제 등)에는 해당 법령에 따라 처리합니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조 (환불정책)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        구독은 결제 시점부터 즉시 효력이 발생하며, 결제일로부터 1일이라도 경과하거나 핑을 사용한 경우
                        환불이 불가합니다.
                      </li>
                      <li>부분 환불, 잔여기간 환불, 잔여 핑 환불은 제공되지 않습니다.</li>
                      <li>보너스핑은 환불되지 않습니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조의2 (요금제 변경에 따른 환불정책)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        상위 요금제로 변경 시 기존 요금제의 잔여기간 및 잔여 핑은 즉시 소멸되며 환불되지 않습니다.
                      </li>
                      <li>
                        하위 요금제로 변경 요청 시 변경은 다음 결제일부터 적용되며, 그 이전에 결제된 요금은 환불되지
                        않습니다.
                      </li>
                      <li>변경 신청 후 서비스 이용을 중단하더라도 이미 결제된 요금은 환불되지 않습니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제9조의3 (Apple/Google 인앱결제 특칙)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        Apple App Store 및 Google Play Store 인앱결제 정책에 따라 구독 변경 시, 일부 서비스에서는 남은
                        기간에 대해 <strong>일할 계산(Pro-rated)</strong> 되어 즉시 상위 요금제로 전환되거나, 다음
                        결제일부터 하위 요금제가 적용됩니다.
                      </li>
                      <li>인앱결제 환불 및 정산은 각 앱 마켓 사업자의 정책을 우선적으로 따릅니다.</li>
                      <li>
                        회원은 Apple 또는 Google 계정 설정을 통해 구독을 해지할 수 있으며, 해지 시 이미 결제된 금액은
                        해당 앱 마켓 정책에 따라 환불 여부가 결정됩니다.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제10조 (보너스핑)</h3>
                    <p className="text-gray-700">보너스핑은 유효기간 경과 또는 탈퇴 시 소멸되며 환불되지 않습니다.</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제11조 (과오금 처리)</h3>
                    <p className="text-gray-700">
                      과오금은 동일 결제수단으로 환불하며, 불가 시 별도 안내 후 처리합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제3장 기타</h3>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제12조 (책임 제한)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>회사는 천재지변 등 불가항력 상황에 대해 책임지지 않습니다.</li>
                      <li>
                        회사가 제공하는 모든 콘텐츠는 참고용으로 제공되는 것이며, 법적·의료적·재정적 자문에 해당하지
                        않습니다.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제13조 (콘텐츠 및 계정 소유권)</h3>
                    <p className="text-gray-700">
                      서비스 내 제공되는 모든 콘텐츠 및 데이터에 대한 저작권과 지식재산권은 회사에 귀속됩니다. 이용자가
                      서비스를 통해 작성하거나 입력한 데이터는 회사의 서비스 개선 및 연구 목적으로 활용될 수 있습니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제14조 (자동결제 및 해지)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>구독서비스는 결제일을 기준으로 1주 단위로 자동 갱신됩니다.</li>
                      <li>
                        이용자가 갱신을 원하지 않는 경우, 차기 결제일 이전에 반드시 해지 신청을 해야 하며, 결제 완료
                        후에는 환불되지 않습니다.
                      </li>
                      <li>Apple App Store 또는 Google Play Store 계정 설정에서 직접 해지가 가능합니다.</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제15조 (준거법 및 관할법원)</h3>
                    <p className="text-gray-700">
                      본 약관은 대한민국 법률을 준거법으로 하며, 서비스 이용과 관련하여 회사와 이용자 간 발생하는 분쟁은
                      민사소송법에 따른 대한민국 법원을 전속관할법원으로 합니다.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-base mb-2">Chapter 1 General Provisions</h3>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 1 (Purpose)</h3>
                    <p className="text-gray-700">
                      These terms define the rights, obligations, and conditions of use between the Company and members
                      regarding the use of subscription services within SajuPing services.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 2 (Definitions)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        <strong>Member</strong>: A person who uses subscription services
                      </li>
                      <li>
                        <strong>Subscription Service</strong>: Digital content and features provided by the Company for
                        a fee through in-app purchases
                      </li>
                      <li>
                        <strong>Ping</strong>: Digital question rights used for fortune telling interpretations and
                        consultations
                        <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                          <li>
                            <strong>Free Ping</strong>: Pings provided daily to members (3 pings per day without
                            subscription)
                          </li>
                          <li>
                            <strong>Subscription Ping</strong>: Pings provided daily with paid subscription
                            (differential provision by tier)
                          </li>
                          <li>
                            <strong>Bonus Ping</strong>: Pings provided free through events and promotions
                            (non-refundable)
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>In-app Purchase Subscription Service</strong>: Service that automatically renews weekly
                        through Apple App Store and Google Play Store in-app purchases
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 8 (Withdrawal of Subscription)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>
                        Since subscription services begin immediately upon payment, withdrawal (refund) is not possible
                        after payment completion.
                      </li>
                      <li>
                        However, in cases where refund obligations exist under relevant laws (such as erroneous
                        payments), processing will be done according to those laws.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 14 (Auto-renewal and Cancellation)</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4 text-gray-700">
                      <li>Subscription services are automatically renewed weekly from the payment date.</li>
                      <li>
                        If users do not want renewal, they must apply for cancellation before the next payment date, and
                        no refunds are provided after payment completion.
                      </li>
                      <li>
                        Direct cancellation is possible through Apple App Store or Google Play Store account settings.
                      </li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">Article 15 (Governing Law and Jurisdiction)</h3>
                    <p className="text-gray-700">
                      These terms are governed by Korean law, and disputes between the Company and users regarding
                      service use shall be subject to the exclusive jurisdiction of Korean courts according to the Civil
                      Procedure Act.
                    </p>
                  </div>
                </div>
              )}
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
      </div>
    </div>
  )
}
