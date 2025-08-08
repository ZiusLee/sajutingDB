'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { sendGAEvent } from '@next/third-parties/google'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

interface GAStatus {
  gtagLoaded: boolean
  cookiesSet: boolean
  dataLayerExists: boolean
  measurementId: string | null
}

export function AnalyticsDebug() {
  const [status, setStatus] = useState<GAStatus>({
    gtagLoaded: false,
    cookiesSet: false,
    dataLayerExists: false,
    measurementId: null
  })
  const [isLoading, setIsLoading] = useState(true)

  const checkGAStatus = () => {
    setIsLoading(true)
    
    setTimeout(() => {
      const gtagLoaded = typeof window !== 'undefined' && typeof window.gtag === 'function'
      const dataLayerExists = typeof window !== 'undefined' && Array.isArray(window.dataLayer)
      
      // 쿠키 확인
      const cookies = typeof document !== 'undefined' ? document.cookie : ''
      const cookiesSet = cookies.includes('_ga') || cookies.includes('_gid')
      
      // Measurement ID 확인
      let measurementId = 'G-YFCCKXZDEN'
      if (dataLayerExists && window.dataLayer) {
        const configEvent = window.dataLayer.find((item: any) => 
          Array.isArray(item) && item[0] === 'config'
        )
        if (configEvent) {
          measurementId = configEvent[1]
        }
      }

      setStatus({
        gtagLoaded,
        cookiesSet,
        dataLayerExists,
        measurementId
      })
      setIsLoading(false)
    }, 1000)
  }

  useEffect(() => {
    checkGAStatus()
  }, [])

  const sendTestEvent = () => {
    try {
      sendGAEvent('event', 'test_event', {
        event_category: 'debug',
        event_label: 'analytics_debug_page',
        value: 1
      })
      alert('테스트 이벤트가 전송되었습니다. Google Analytics 실시간 보고서에서 확인해보세요.')
    } catch (error) {
      console.error('GA Event error:', error)
      alert('이벤트 전송 중 오류가 발생했습니다.')
    }
  }

  const sendSajuTestEvent = () => {
    try {
      sendGAEvent('event', 'saju_calculation_start', {
        event_category: 'saju',
        event_label: 'debug_test',
        birth_year: 1990,
        birth_month: 1,
        birth_day: 1
      })
      alert('사주 계산 테스트 이벤트가 전송되었습니다.')
    } catch (error) {
      console.error('GA Event error:', error)
      alert('이벤트 전송 중 오류가 발생했습니다.')
    }
  }

  const StatusIcon = ({ condition }: { condition: boolean }) => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
    }
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Google Analytics 상태
          </CardTitle>
          <CardDescription>
            현재 Google Analytics 설정 상태를 확인합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">gtag 함수 로드</div>
                <div className="text-sm text-muted-foreground">
                  window.gtag 함수가 정의되어 있는지 확인
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon condition={status.gtagLoaded} />
                <Badge variant={status.gtagLoaded ? "default" : "destructive"}>
                  {isLoading ? "확인 중..." : status.gtagLoaded ? "정상" : "오류"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">DataLayer 존재</div>
                <div className="text-sm text-muted-foreground">
                  window.dataLayer 배열이 존재하는지 확인
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon condition={status.dataLayerExists} />
                <Badge variant={status.dataLayerExists ? "default" : "destructive"}>
                  {isLoading ? "확인 중..." : status.dataLayerExists ? "정상" : "오류"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">GA 쿠키 설정</div>
                <div className="text-sm text-muted-foreground">
                  _ga, _gid 쿠키가 설정되어 있는지 확인
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon condition={status.cookiesSet} />
                <Badge variant={status.cookiesSet ? "default" : "destructive"}>
                  {isLoading ? "확인 중..." : status.cookiesSet ? "정상" : "오류"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Measurement ID</div>
                <div className="text-sm text-muted-foreground">
                  설정된 Google Analytics Measurement ID
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={status.measurementId ? "default" : "secondary"}>
                  {isLoading ? "확인 중..." : status.measurementId || "G-YFCCKXZDEN"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={checkGAStatus} variant="outline" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              다시 확인
            </Button>
            <Button onClick={sendTestEvent} disabled={!status.gtagLoaded}>
              테스트 이벤트 전송
            </Button>
            <Button onClick={sendSajuTestEvent} disabled={!status.gtagLoaded} variant="secondary">
              사주 이벤트 테스트
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>실시간 디버그 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono bg-muted p-4 rounded-lg">
            <div>gtag 함수: {status.gtagLoaded ? '✅ 로드됨' : '❌ 로드되지 않음'}</div>
            <div>dataLayer: {status.dataLayerExists ? '✅ 존재함' : '❌ 존재하지 않음'}</div>
            <div>GA 쿠키: {status.cookiesSet ? '✅ 설정됨' : '❌ 설정되지 않음'}</div>
            <div>Measurement ID: {status.measurementId || 'G-YFCCKXZDEN'}</div>
            <div>현재 시간: {new Date().toLocaleString('ko-KR')}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDebug
