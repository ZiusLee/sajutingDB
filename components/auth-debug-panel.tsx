"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { debugAuthState } from "@/lib/supabase-client"
import { smartMemoryService } from "@/lib/smart-memory-service"
import { useAuth } from "@/hooks/use-auth"

export function AuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [testContent, setTestContent] = useState("테스트 메모리 내용")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleAuthDebug = async () => {
    setLoading(true)
    try {
      const info = await debugAuthState()

      // 추가 브라우저 정보
      const browserInfo = {
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        currentUrl: window.location.href,
        origin: window.location.origin,
        allCookies: document.cookie,
        localStorage: Object.keys(localStorage).map((key) => ({
          key,
          value: localStorage.getItem(key)?.substring(0, 50) + "...",
        })),
        sessionStorage: Object.keys(sessionStorage).map((key) => ({
          key,
          value: sessionStorage.getItem(key)?.substring(0, 50) + "...",
        })),
      }

      setDebugInfo({ ...info, browserInfo })
    } catch (error) {
      console.error("Debug failed:", error)
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSmartMemoryAPITest = async () => {
    setLoading(true)
    try {
      console.log("🧪 Starting Smart Memory API Test...")

      // 1. GET 테스트
      console.log("🧪 Testing GET /api/smart-memory")
      const getResponse = await fetch("/api/smart-memory", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const getResult = await getResponse.json()
      console.log("GET Result:", { status: getResponse.status, result: getResult })

      // 2. POST 테스트 (인증된 경우에만)
      let postResult = null
      if (getResponse.status === 200) {
        console.log("🧪 Testing POST /api/smart-memory")
        const postResponse = await fetch("/api/smart-memory", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `테스트 메모리 - ${new Date().toISOString()}`,
            type: "test",
            keywords: ["test", "debug"],
            importance: 0.8,
            is_pinned: false,
          }),
        })
        postResult = await postResponse.json()
        console.log("POST Result:", { status: postResponse.status, result: postResult })
      }

      // 3. 직접 서비스 테스트 (user ID가 있는 경우)
      let directTest = null
      if (user?.id) {
        try {
          console.log("🧪 Testing direct service call")
          directTest = await smartMemoryService.testSaveMemory(user.id, testContent, "test")
          console.log("Direct Test Result:", directTest)
        } catch (error) {
          console.error("Direct test failed:", error)
          directTest = { error: error.message }
        }
      }

      // 4. 메모리 통계
      let stats = null
      if (user?.id) {
        try {
          stats = await smartMemoryService.getMemoryStats(user.id)
          console.log("Memory Stats:", stats)
        } catch (error) {
          console.error("Stats failed:", error)
          stats = { error: error.message }
        }
      }

      setTestResult({
        timestamp: new Date().toISOString(),
        apiTests: {
          get: {
            status: getResponse.status,
            result: getResult,
          },
          post: postResult
            ? {
                status: 200,
                result: postResult,
              }
            : null,
        },
        directTest,
        stats,
        userInfo: {
          hasUser: !!user,
          userId: user?.id,
          email: user?.email,
        },
      })
    } catch (error) {
      console.error("Smart Memory test failed:", error)
      setTestResult({ error: error.message, stack: error.stack })
    } finally {
      setLoading(false)
    }
  }

  const handleProcessConversationTest = async () => {
    if (!user?.id) {
      setTestResult({ error: "User not authenticated" })
      return
    }

    setLoading(true)
    try {
      console.log("🧪 Testing conversation processing...")
      const result = await smartMemoryService.processConversation(
        user.id,
        "test-conversation-id",
        "안녕하세요, 저는 개발자입니다. 최근에 이직을 준비하고 있어요.",
        "안녕하세요! 개발자시군요. 이직 준비를 하고 계시는군요. 어떤 분야로 이직을 생각하고 계신가요?",
      )

      console.log("Conversation test result:", result)
      setTestResult({ conversationTest: result })
    } catch (error) {
      console.error("Conversation test failed:", error)
      setTestResult({ error: error.message, stack: error.stack })
    } finally {
      setLoading(false)
    }
  }

  const handleClearResults = () => {
    setDebugInfo(null)
    setTestResult(null)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-[500px] max-h-[600px] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-sm flex justify-between items-center">
            🔧 Smart Memory Debug Panel
            <Button onClick={handleClearResults} size="sm" variant="outline">
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Button onClick={handleAuthDebug} disabled={loading} size="sm" className="w-full">
              {loading ? "디버깅 중..." : "인증 상태 확인"}
            </Button>

            <div className="space-y-2">
              <Input
                placeholder="테스트 메모리 내용"
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="text-xs"
              />
              <Button onClick={handleSmartMemoryAPITest} disabled={loading} size="sm" className="w-full">
                Smart Memory API 전체 테스트
              </Button>
              <Button onClick={handleProcessConversationTest} disabled={loading} size="sm" className="w-full">
                대화 처리 테스트
              </Button>
            </div>
          </div>

          {debugInfo && (
            <div className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
              <strong>인증 정보:</strong>
              <Textarea value={JSON.stringify(debugInfo, null, 2)} readOnly className="mt-1 text-xs h-32" />
            </div>
          )}

          {testResult && (
            <div className="text-xs bg-blue-50 p-2 rounded max-h-40 overflow-y-auto">
              <strong>테스트 결과:</strong>
              <Textarea value={JSON.stringify(testResult, null, 2)} readOnly className="mt-1 text-xs h-32" />
            </div>
          )}

          <div className="text-xs text-gray-500 border-t pt-2">
            <p>
              <strong>현재 사용자:</strong> {user?.id || "없음"}
            </p>
            <p>
              <strong>이메일:</strong> {user?.email || "없음"}
            </p>
            <p>
              <strong>환경:</strong> {process.env.NODE_ENV}
            </p>
            <p>
              <strong>URL:</strong> {typeof window !== "undefined" ? window.location.href : "서버"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
