import { AnalyticsDebug } from '@/components/analytics-debug'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Google Analytics 디버그 - 사주핑',
  description: 'Google Analytics 설정 상태를 확인하고 테스트합니다.',
  robots: 'noindex, nofollow', // 검색엔진에서 제외
}

export default function AnalyticsDebugPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Google Analytics 디버그</h1>
          <p className="text-muted-foreground">
            Google Analytics (G-YFCCKXZDEN)가 제대로 설정되었는지 확인해보세요
          </p>
        </div>

        <AnalyticsDebug />

        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold mb-2">확인 단계:</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <strong>실시간 보고서:</strong> 
              <a 
                href="https://analytics.google.com/analytics/web/#/p123456789/reports/realtime" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                Google Analytics → 보고서 → 실시간
              </a>
              에서 현재 활성 사용자 확인
            </li>
            <li>
              <strong>브라우저 개발자 도구 (F12):</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Network 탭에서 google-analytics.com 또는 googletagmanager.com 요청 확인</li>
                <li>Console에서 `window.gtag` 입력 (함수가 정의되어 있어야 함)</li>
                <li>Application 탭 → Cookies에서 _ga, _gid 쿠키 확인</li>
              </ul>
            </li>
            <li>
              <strong>Google Tag Assistant:</strong> Chrome 확장 프로그램을 설치하여 
              실시간 태그 동작 확인
            </li>
            <li>
              <strong>테스트 이벤트:</strong> 위의 "테스트 이벤트 전송" 버튼을 클릭하고 
              GA 실시간 보고서에서 이벤트 수신 확인
            </li>
          </ol>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">정상 작동 시 확인되는 것들:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Network 탭에서 gtag/js?id=G-YFCCKXZDEN 요청</li>
            <li>• _ga, _gid 쿠키 생성</li>
            <li>• window.gtag 함수 정의</li>
            <li>• GA 실시간 보고서에서 활성 사용자 1명 표시</li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">주의사항:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 개발 환경(localhost)에서도 데이터가 전송됩니다</li>
            <li>• 데이터가 GA에 나타나기까지 1-2분 정도 걸릴 수 있습니다</li>
            <li>• 광고 차단기(AdBlock 등)가 GA 스크립트를 차단할 수 있습니다</li>
            <li>• 시크릿 모드에서는 일부 기능이 제한될 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
