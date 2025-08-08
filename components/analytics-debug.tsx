'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { trackEvent, trackSajuEvents, trackAuthEvents } from '@/lib/analytics'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export default function AnalyticsDebug() {
  const [gtagLoaded, setGtagLoaded] = useState(false)
  const [dataLayerExists, setDataLayerExists] = useState(false)
  const [cookies, setCookies] = useState<string[]>([])
  const [networkRequests, setNetworkRequests] = useState<string[]>([])

  useEffect(() => {
    // Check if gtag is loaded
    const checkGtag = () => {
      setGtagLoaded(typeof window.gtag === 'function')
      setDataLayerExists(Array.isArray(window.dataLayer))
    }

    // Check GA cookies
    const checkCookies = () => {
      const allCookies = document.cookie.split(';')
      const gaCookies = allCookies
        .filter(cookie => cookie.trim().startsWith('_ga'))
        .map(cookie => cookie.trim())
      setCookies(gaCookies)
    }

    // Initial check
    checkGtag()
    checkCookies()

    // Recheck after a delay to allow scripts to load
    const timer = setTimeout(() => {
      checkGtag()
      checkCookies()
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const testEvents = [
    {
      name: '페이지 조회 테스트',
      action: () => trackEvent('test_page_view', 'debug', 'analytics_debug_page')
    },
    {
      name: '사주 계산 시작 테스트',
      action: () => trackSajuEvents.startCalculation(1990, 'male')
    },
    {
      name: '로그인 테스트',
      action: () => trackAuthEvents.signIn('email')
    },
    {
      name: '궁합 확인 테스트',
      action: () => trackSajuEvents.checkCompatibility('male', 'female')
    }
  ]

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? 'default' : 'destructive'}>
        {status ? '정상' : '오류'}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Google Analytics 디버그</h1>
        <p className="text-muted-foreground">
          Google Analytics 설정 상태를 확인하고 테스트할 수 있습니다.
        </p>
      </div>

      {/* 기본 상태 확인 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            기본 상태 확인
          </CardTitle>
          <CardDescription>
            Google Analytics 스크립트와 기본 설정 상태를 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>gtag 함수 로드됨</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(gtagLoaded)}
              {getStatusBadge(gtagLoaded)}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span>dataLayer 존재함</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(dataLayerExists)}
              {getStatusBadge(dataLayerExists)}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>GA 쿠키 설정됨</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(cookies.length > 0)}
              {getStatusBadge(cookies.length > 0)}
            </div>
          </div>

          {cookies.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">발견된 GA 쿠키:</h4>
              <div className="space-y-1">
                {cookies.map((cookie, index) => (
                  <code key={index} className="block text-sm bg-muted p-2 rounded">
                    {cookie}
                  </code>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GA 설정 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>설정 정보</CardTitle>
          <CardDescription>
            현재 적용된 Google Analytics 설정 정보입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">측정 ID:</span>
            <code className="bg-muted px-2 py-1 rounded">G-YFCCKXZDEN</code>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">환경:</span>
            <Badge variant="outline">
              {process.env.NODE_ENV === 'production' ? '프로덕션' : '개발'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">도메인:</span>
            <span>{typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>이벤트 테스트</CardTitle>
          <CardDescription>
            다양한 이벤트를 테스트하여 추적이 정상적으로 작동하는지 확인합니다.
            브라우저 개발자 도구의 Network 탭에서 요청을 확인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testEvents.map((test, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={test.action}
                className="h-auto p-4 text-left justify-start"
              >
                {test.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 실시간 확인 방법 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>실시간 확인 방법:</strong>
          <br />
          1. Google Analytics → 보고서 → 실시간에서 활성 사용자 확인
          <br />
          2. 브라우저 개발자 도구 → Network 탭에서 'google-analytics.com' 요청 확인
          <br />
          3. Console에서 'window.gtag' 입력하여 함수 정의 확인
        </AlertDescription>
      </Alert>
    </div>
  )
}
