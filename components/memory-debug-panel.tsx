"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface DebugResult {
  config?: any
  dbTest?: any
  tablesTest?: any
  memoryTest?: any
  error?: string
}

export function MemoryDebugPanel({ userId }: { userId?: string }) {
  const [result, setResult] = useState<DebugResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [testMessage, setTestMessage] = useState("안녕하세요, 저는 개발자로 일하고 있습니다.")

  const runConfigTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/memory-config")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const runMemoryTest = async () => {
    if (!userId) {
      setResult({ error: "User ID required for memory test" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/smart-memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          conversationId: "debug-test-" + Date.now(),
          userMessage: testMessage,
          assistantResponse: "네, 개발자로 일하고 계시는군요. 어떤 분야의 개발을 하고 계신가요?",
        }),
      })

      const data = await response.json()
      setResult((prev) => ({ ...prev, memoryTest: data }))
    } catch (error) {
      setResult((prev) => ({
        ...prev,
        memoryTest: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🧠 스마트 메모리 디버그 패널</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runConfigTest} disabled={loading}>
              환경 설정 확인
            </Button>
            {userId && (
              <Button onClick={runMemoryTest} disabled={loading}>
                메모리 저장 테스트
              </Button>
            )}
          </div>

          {userId && (
            <div>
              <label className="text-sm font-medium">테스트 메시지:</label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="테스트할 메시지를 입력하세요"
              />
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.error && (
                <Alert variant="destructive">
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}

              {result.config && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">환경 설정</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        Supabase URL:{" "}
                        <Badge variant={result.config.supabaseUrl ? "default" : "destructive"}>
                          {result.config.supabaseUrl ? "✅" : "❌"}
                        </Badge>
                      </div>
                      <div>
                        Service Key:{" "}
                        <Badge variant={result.config.supabaseServiceKey ? "default" : "destructive"}>
                          {result.config.supabaseServiceKey ? "✅" : "❌"}
                        </Badge>
                      </div>
                      <div>
                        OpenAI Key:{" "}
                        <Badge variant={result.config.openaiKey ? "default" : "destructive"}>
                          {result.config.openaiKey ? "✅" : "❌"}
                        </Badge>
                      </div>
                      <div>
                        Smart Memory:{" "}
                        <Badge variant={result.config.enableSmartMemory ? "default" : "secondary"}>
                          {result.config.enableSmartMemory ? "ON" : "OFF"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.dbTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">데이터베이스 연결</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      연결:{" "}
                      <Badge variant={result.dbTest.connected ? "default" : "destructive"}>
                        {result.dbTest.connected ? "✅" : "❌"}
                      </Badge>
                      {result.dbTest.error && <p className="text-sm text-red-600 mt-1">{result.dbTest.error}</p>}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.tablesTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">테이블/함수 설정</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      함수:{" "}
                      <Badge variant={result.tablesTest.exists ? "default" : "destructive"}>
                        {result.tablesTest.exists ? "✅" : "❌"}
                      </Badge>
                      {result.tablesTest.error && (
                        <p className="text-sm text-red-600 mt-1">{result.tablesTest.error}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.memoryTest && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">메모리 저장 테스트</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.memoryTest, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
