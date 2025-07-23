"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, RefreshCw, TestTube, Database, Settings, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DebugResult {
  config?: any
  dbTest?: any
  tableTest?: any
  functionsTest?: any
  openaiTest?: any
  memoryTest?: any
  error?: string
  timestamp?: string
}

interface MemoryDebugPanelProps {
  userId: string
}

export function MemoryDebugPanel({ userId }: MemoryDebugPanelProps) {
  const [result, setResult] = useState<DebugResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [testMessage, setTestMessage] = useState("안녕하세요, 저는 개발자로 일하고 있습니다.")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const runConfigTest = async () => {
    setLoading(true)
    try {
      console.log("🔍 Starting config test...")
      const response = await fetch("/api/debug/memory-config")
      const data = await response.json()
      console.log("🔍 Config test result:", data)
      setResult(data)
    } catch (error) {
      console.error("🔍 Config test error:", error)
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
      console.log("🔍 Starting memory test...")
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
      console.log("🔍 Memory test result:", data)
      setResult((prev) => ({ ...prev, memoryTest: data }))
    } catch (error) {
      console.error("🔍 Memory test error:", error)
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

  const runDebugTest = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/smart-memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "debug",
          userId: userId,
          userMessage: "디버그 테스트: 저는 프론트엔드 개발자입니다.",
          assistantResponse: "프론트엔드 개발자시군요! 어떤 프레임워크를 주로 사용하시나요?",
          conversationId: `debug-${Date.now()}`,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "디버그 테스트 성공",
          description: "메모리 시스템이 정상적으로 작동합니다.",
        })
      } else {
        toast({
          title: "디버그 테스트 실패",
          description: data.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Debug test failed:", error)
      toast({
        title: "디버그 테스트 실패",
        description: "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const StatusBadge = ({ status, label }: { status: boolean | null; label: string }) => (
    <Badge variant={status === true ? "default" : status === false ? "destructive" : "secondary"}>
      {status === true ? "✅" : status === false ? "❌" : "⏳"} {label}
    </Badge>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />🧠 스마트 메모리 디버그 패널
          </CardTitle>
          <CardDescription>스마트 메모리 시스템의 작동 상태를 테스트합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={runConfigTest} disabled={loading} className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
              환경 설정 확인
            </Button>
            <Button onClick={runDebugTest} disabled={loading} className="flex items-center gap-2">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              디버그 테스트 실행
            </Button>
            {userId && (
              <Button onClick={runMemoryTest} disabled={loading} className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
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
                className="mt-1"
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

              {result.timestamp && (
                <div className="text-xs text-gray-500">마지막 확인: {new Date(result.timestamp).toLocaleString()}</div>
              )}

              {/* 환경 설정 */}
              {result.config && (
                <Collapsible>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    onClick={() => toggleSection("config")}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">환경 설정</span>
                    </div>
                    {expandedSections.config ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <StatusBadge status={result.config.supabaseUrl} label="Supabase URL" />
                        <StatusBadge status={result.config.supabaseServiceKey} label="Service Key" />
                      </div>
                      <div className="space-y-2">
                        <StatusBadge status={result.config.openaiKey} label="OpenAI Key" />
                        <StatusBadge status={result.config.enableSmartMemory} label="Smart Memory" />
                      </div>
                    </div>
                    {result.config.urls && (
                      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                        <div>Supabase URL: {result.config.urls.supabaseUrl}</div>
                        <div>Environment: {result.config.nodeEnv}</div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 데이터베이스 연결 */}
              {result.dbTest && (
                <Collapsible>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    onClick={() => toggleSection("db")}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="font-medium">데이터베이스 연결</span>
                      <StatusBadge status={result.dbTest.connected} label="" />
                    </div>
                    {expandedSections.db ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
                    {result.dbTest.error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{result.dbTest.error}</AlertDescription>
                      </Alert>
                    )}
                    {result.dbTest.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.dbTest.details, null, 2)}
                      </pre>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 테이블 구조 */}
              {result.tableTest && (
                <Collapsible>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    onClick={() => toggleSection("table")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">테이블 구조</span>
                      <StatusBadge status={result.tableTest.exists} label="" />
                    </div>
                    {expandedSections.table ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
                    {result.tableTest.error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{result.tableTest.error}</AlertDescription>
                      </Alert>
                    )}
                    {result.tableTest.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.tableTest.details, null, 2)}
                      </pre>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 함수 확인 */}
              {result.functionsTest && (
                <Collapsible>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    onClick={() => toggleSection("functions")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">데이터베이스 함수</span>
                      <StatusBadge status={result.functionsTest.exists} label="" />
                    </div>
                    {expandedSections.functions ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
                    {result.functionsTest.error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{result.functionsTest.error}</AlertDescription>
                      </Alert>
                    )}
                    {result.functionsTest.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.functionsTest.details, null, 2)}
                      </pre>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* OpenAI API */}
              {result.openaiTest && (
                <Collapsible>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    onClick={() => toggleSection("openai")}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">OpenAI API</span>
                      <StatusBadge status={result.openaiTest.working} label="" />
                    </div>
                    {expandedSections.openai ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
                    {result.openaiTest.error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{result.openaiTest.error}</AlertDescription>
                      </Alert>
                    )}
                    {result.openaiTest.details && (
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.openaiTest.details, null, 2)}
                      </pre>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 메모리 저장 테스트 */}
              {result.memoryTest && (
                <Collapsible>
                  <CollapsibleTrigger
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    onClick={() => toggleSection("memory")}
                  >
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      <span className="font-medium">메모리 저장 테스트</span>
                    </div>
                    {expandedSections.memory ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 border border-gray-200 rounded-b-lg">
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
                      {JSON.stringify(result.memoryTest, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* 디버그 테스트 결과 */}
              {result && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">디버그 테스트 결과:</h4>
                  <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
