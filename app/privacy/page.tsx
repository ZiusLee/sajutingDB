import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "개인정보처리방침 | 사주핑",
  description: "사주핑의 개인정보처리방침을 확인하세요.",
}

export default function PrivacyPage() {
  return (
    <div className="h-full bg-white scroll-smooth overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">개인정보처리방침</h1>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">제1조 (개인정보의 수집 및 이용)</h2>
            <div className="space-y-3 text-sm">
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
              <p className="text-gray-600">보유기간: 회원 탈퇴 시까지</p>
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
              <p className="text-gray-600">이용자는 브라우저 또는 모바일 기기 설정을 통해 저장을 거부할 수 있습니다.</p>
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

          <Separator />

          <div className="pt-4">
            <p className="text-sm text-gray-500">공고일자: 2025년 8월 22일</p>
            <p className="text-sm text-gray-500">시행일자: 2025년 8월 22일</p>
          </div>
        </div>
      </div>
    </div>
  )
}
