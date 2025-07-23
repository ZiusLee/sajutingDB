"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
      setDebugInfo(info)
    } catch (error) {
      console.error("Debug failed:", error)
      setDebugInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSmartMemoryTest = async () => {
    if (!user?.id) {
      setTestResult({ error: "User not authenticated" })
      return
    }

    setLoading(true)
    try {
      // API 테스트
      const apiResponse = await fetch("/api/smart-memory")
      const apiResult = await apiResponse.json()

      // 직접 저장 테스트
      const directSave = await smartMemoryService.testSaveMemory(user.id, testContent, "test")

      // 메모리 통계 테스트
      const stats = await smartMemoryService.getMemoryStats(user.id)

      setTestResult({
        apiTest: {
          status: apiResponse.status,
          result: apiResult,
        },
        directSave,
        stats,
      })
    } catch (error) {
      console.error("Smart Memory test failed:", error)
      setTestResult({ error: error.message })
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
      const result = await smartMemoryService.processConversation(
        user.id,
        "test-conversation-id",
        "안녕하세요, 저는 개발자입니다.",
        "안녕하세요! 개발자시군요. 어떤 분야에서 일하고 계신가요?",
      )

      setTestResult({ conversationTest: result })
    } catch (error) {
      console.error("Conversation test failed:", error)
      setTestResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-96 max-h-96 overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-sm">🔧 Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Button onClick={handleAuthDebug} disabled={loading} size="sm" className="w-full">
              인증 상태 확인
            </Button>

            <div className="space-y-2">
              <Input
                placeholder="테스트 메모리 내용"
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="text-xs"
              />
              <Button onClick={handleSmartMemoryTest} disabled={loading} size="sm" className="w-full">
                Smart Memory API 테스트
              </Button>
              <Button onClick={handleProcessConversationTest} disabled={loading} size="sm" className="w-full">
                대화 처리 테스트
              </Button>
            </div>
          </div>

          {debugInfo && (
            <div className="text-xs bg-gray-100 p-2 rounded">
              <strong>인증 정보:</strong>
              <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          {testResult && (
            <div className="text-xs bg-blue-50 p-2 rounded">
              <strong>테스트 결과:</strong>
              <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>현재 사용자: {user?.id || "없음"}</p>
            <p>환경: {process.env.NODE_ENV}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
