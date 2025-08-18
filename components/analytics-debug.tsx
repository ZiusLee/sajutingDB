"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity, Eye } from "lucide-react"
import { sendGAEvent } from "@next/third-parties/google"

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

const PAGE_EVENTS = {
  home: ["page_view", "login_click", "register_click", "button_click"],
  login: ["page_view", "form_submit", "login_click", "api_call"],
  register: ["page_view", "form_submit", "register_click", "api_call"],
  onboarding: [
    "onboarding_started",
    "onboarding_completed",
    "onboarding_abandoned",
    "input_interaction",
    "gender_interaction",
    "city_interaction",
    "birth_info_interaction",
    "concern_interaction",
    "api_status",
  ],
  chat: [
    "chat_start",
    "message_send",
    "chat_feedback",
    "AI_message_sent",
    "USER_chat_session_start",
    "form_submit",
    "api_call",
  ],
  mypage: ["page_view", "USER_memory_bank_accessed", "button_click"],
  charge: ["page_view", "begin_checkout", "purchase", "button_click"],
  saju: [
    "saju_calculation_start",
    "saju_result_view",
    "compatibility_check",
    "daeun_analysis",
    "daily_fortune_check",
    "CONVERSION_saju_profile_complete",
  ],
  admin: ["page_view", "api_call", "form_submit", "button_click"],
}

const EVENT_CATEGORIES = {
  user: [
    "USER_session_start",
    "USER_first_visit",
    "USER_return_visit",
    "USER_profile_created",
    "USER_engagement_high",
    "USER_chat_session_start",
    "USER_memory_bank_accessed",
  ],
  conversion: ["CONVERSION_saju_profile_complete", "CONVERSION_first_chat_complete", "CONVERSION_user_retention_day7"],
  behavior: ["BEHAVIOR_scroll_depth_75", "BEHAVIOR_time_on_page_5min", "BEHAVIOR_multiple_questions"],
  performance: ["PERFORMANCE_page_load_slow", "page_load_time", "api_response_time"],
  ai: ["AI_message_sent"],
  integrated: ["page_view", "login_click", "register_click", "button_click", "form_submit", "api_call"],
}

export function AnalyticsDebug() {
  const [status, setStatus] = useState<GAStatus>({
    gtagLoaded: false,
    cookiesSet: false,
    dataLayerExists: false,
    measurementId: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [eventLog, setEventLog] = useState<Array<{ timestamp: string; event: string; parameters: any }>>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [selectedPage, setSelectedPage] = useState<keyof typeof PAGE_EVENTS>("home")

  useEffect(() => {
    if (isMonitoring && typeof window !== "undefined") {
      const originalGtag = window.gtag

      window.gtag = (...args: any[]) => {
        if (args[0] === "event") {
          setEventLog((prev) => [
            ...prev.slice(-19),
            {
              timestamp: new Date().toLocaleTimeString("ko-KR"),
              event: args[1],
              parameters: args[2] || {},
            },
          ])
        }

        if (originalGtag) {
          return originalGtag.apply(window, args)
        }
      }

      return () => {
        window.gtag = originalGtag
      }
    }
  }, [isMonitoring])

  const checkGAStatus = () => {
    setIsLoading(true)

    setTimeout(() => {
      const gtagLoaded = typeof window !== "undefined" && typeof window.gtag === "function"
      const dataLayerExists = typeof window !== "undefined" && Array.isArray(window.dataLayer)

      const cookies = typeof document !== "undefined" ? document.cookie : ""
      const cookiesSet = cookies.includes("_ga") || cookies.includes("_gid")

      let measurementId = "G-YFCCKXZDEN"
      if (dataLayerExists && window.dataLayer) {
        const configEvent = window.dataLayer.find((item: any) => Array.isArray(item) && item[0] === "config")
        if (configEvent) {
          measurementId = configEvent[1]
        }
      }

      setStatus({
        gtagLoaded,
        cookiesSet,
        dataLayerExists,
        measurementId,
      })
      setIsLoading(false)
    }, 1000)
  }

  useEffect(() => {
    checkGAStatus()
  }, [])

  const sendTestEvent = () => {
    try {
      sendGAEvent("event", "test_event", {
        event_category: "debug",
        event_label: "analytics_debug_page",
        value: 1,
      })
      alert("테스트 이벤트가 전송되었습니다. Google Analytics 실시간 보고서에서 확인해보세요.")
    } catch (error) {
      console.error("GA Event error:", error)
      alert("이벤트 전송 중 오류가 발생했습니다.")
    }
  }

  const sendSajuTestEvent = () => {
    try {
      sendGAEvent("event", "saju_calculation_start", {
        event_category: "saju",
        event_label: "debug_test",
        birth_year: 1990,
        birth_month: 1,
        birth_day: 1,
      })
      alert("사주 계산 테스트 이벤트가 전송되었습니다.")
    } catch (error) {
      console.error("GA Event error:", error)
      alert("이벤트 전송 중 오류가 발생했습니다.")
    }
  }

  const sendPageSpecificEvent = (eventName: string) => {
    try {
      const testParameters = {
        page: selectedPage,
        test_mode: true,
        timestamp: new Date().toISOString(),
      }

      sendGAEvent("event", eventName, testParameters)
      alert(`${eventName} 이벤트가 전송되었습니다.`)
    } catch (error) {
      console.error("GA Event error:", error)
      alert("이벤트 전송 중 오류가 발생했습니다.")
    }
  }

  const StatusIcon = ({ condition }: { condition: boolean }) => {
    if (isLoading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-gray-500" />
    }
    return condition ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Google Analytics 상태
          </CardTitle>
          <CardDescription>현재 Google Analytics 설정 상태를 확인합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">gtag 함수 로드</div>
                <div className="text-sm text-muted-foreground">window.gtag 함수가 정의되어 있는지 확인</div>
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
                <div className="text-sm text-muted-foreground">window.dataLayer 배열이 존재하는지 확인</div>
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
                <div className="text-sm text-muted-foreground">_ga, _gid 쿠키가 설정되어 있는지 확인</div>
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
                <div className="text-sm text-muted-foreground">설정된 Google Analytics Measurement ID</div>
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
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
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
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            페이지별 커스텀 이벤트 모니터링
          </CardTitle>
          <CardDescription>각 페이지에서 발생하는 커스텀 이벤트를 실시간으로 모니터링하고 테스트합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsMonitoring(!isMonitoring)} variant={isMonitoring ? "destructive" : "default"}>
              <Eye className="h-4 w-4 mr-2" />
              {isMonitoring ? "모니터링 중지" : "이벤트 모니터링 시작"}
            </Button>
            {isMonitoring && (
              <Badge variant="secondary" className="animate-pulse">
                실시간 모니터링 중...
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">페이지 선택</label>
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value as keyof typeof PAGE_EVENTS)}
                className="w-full p-2 border rounded-md"
              >
                {Object.keys(PAGE_EVENTS).map((page) => (
                  <option key={page} value={page}>
                    {page === "home"
                      ? "홈"
                      : page === "login"
                        ? "로그인"
                        : page === "register"
                          ? "회원가입"
                          : page === "onboarding"
                            ? "온보딩"
                            : page === "chat"
                              ? "채팅"
                              : page === "mypage"
                                ? "마이페이지"
                                : page === "charge"
                                  ? "충전"
                                  : page === "saju"
                                    ? "사주"
                                    : page === "admin"
                                      ? "관리자"
                                      : page}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">해당 페이지 이벤트</label>
              <div className="flex flex-wrap gap-1">
                {PAGE_EVENTS[selectedPage].map((event) => (
                  <Badge key={event} variant="outline" className="text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PAGE_EVENTS[selectedPage].slice(0, 8).map((event) => (
              <Button
                key={event}
                size="sm"
                variant="outline"
                onClick={() => sendPageSpecificEvent(event)}
                disabled={!status.gtagLoaded}
                className="text-xs"
              >
                {event}
              </Button>
            ))}
          </div>

          {eventLog.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">실시간 이벤트 로그</h4>
                <Button size="sm" variant="ghost" onClick={() => setEventLog([])}>
                  로그 지우기
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-lg max-h-60 overflow-y-auto">
                {eventLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono mb-2 last:mb-0">
                    <span className="text-muted-foreground">[{log.timestamp}]</span>{" "}
                    <span className="font-semibold text-blue-600">{log.event}</span>
                    {Object.keys(log.parameters).length > 0 && (
                      <span className="text-muted-foreground ml-2">{JSON.stringify(log.parameters, null, 0)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>이벤트 카테고리별 분류</CardTitle>
          <CardDescription>전체 커스텀 이벤트를 카테고리별로 분류하여 확인합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(EVENT_CATEGORIES).map(([category, events]) => (
              <div key={category} className="border rounded-lg p-3">
                <h4 className="font-medium mb-2 capitalize">
                  {category === "user"
                    ? "사용자"
                    : category === "conversion"
                      ? "전환"
                      : category === "behavior"
                        ? "행동"
                        : category === "performance"
                          ? "성능"
                          : category === "ai"
                            ? "AI"
                            : category === "integrated"
                              ? "통합"
                              : category}{" "}
                  이벤트
                </h4>
                <div className="flex flex-wrap gap-1">
                  {events.map((event) => (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>실시간 디버그 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono bg-muted p-4 rounded-lg">
            <div>gtag 함수: {status.gtagLoaded ? "✅ 로드됨" : "❌ 로드되지 않음"}</div>
            <div>dataLayer: {status.dataLayerExists ? "✅ 존재함" : "❌ 존재하지 않음"}</div>
            <div>GA 쿠키: {status.cookiesSet ? "✅ 설정됨" : "❌ 설정되지 않음"}</div>
            <div>Measurement ID: {status.measurementId || "G-YFCCKXZDEN"}</div>
            <div>현재 시간: {new Date().toLocaleString("ko-KR")}</div>
            <div>모니터링 상태: {isMonitoring ? "✅ 활성" : "❌ 비활성"}</div>
            <div>이벤트 로그: {eventLog.length}개</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsDebug
