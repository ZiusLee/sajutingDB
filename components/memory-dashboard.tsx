"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface MemoryDashboardProps {
  userId: string
}

interface ConfigCheck {
  config: {
    supabaseUrl: boolean
    supabaseServiceKey: boolean
    openaiKey: boolean
    enableSmartMemory: boolean
    nodeEnv: string
  }
  dbTest: {
    connected: boolean
    error: string | null
    details: any
  }
  tableTest: {
    exists: boolean
    error: string | null
    details: any
  }
  functionsTest: {
    exists: boolean
    error: string | null
    details: any
  }
  openaiTest: {
    working: boolean
    error: string | null
    details: any
  }
}

export function MemoryDashboard({ userId }: MemoryDashboardProps) {
  const [configCheck, setConfigCheck] = useState<ConfigCheck | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)
  const { toast } = useToast()

  const checkConfig = async () => {
    setIsChecking(true)
    try {
      const response = await fetch("/api/debug/memory-config")
      const data = await response.json()
      setConfigCheck(data)

      if (response.ok) {
        toast({
          title: "환경 설정 확인 완료",
          description: "모든 설정을 확인했습니다.",
        })
      } else {
        toast({
          title: "환경 설정 확인 실패",
          description: data.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Config check failed:", error)
      toast({
        title: "환경 설정 확인 실패",
        description: "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const testMemorySave = async () => {
    setIsTesting(true)
    try {
      const response = await fetch("/api/smart-memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "test",
          userId: userId,
          userMessage: "저는 개발자입니다. 최근에 새로운 프로젝트를 시작했어요.",
          assistantResponse:
            "개발자로서 새로운 프로젝트를 시작하신다니 흥미롭네요! 어떤 기술 스택을 사용하실 예정인가요?",
          conversationId: "test-conversation-" + Date.now(),
        }),
      })

      const data = await response.json()
      setTestResult(data)

      if (response.ok && data.success) {
        toast({
          title: "메모리 저장 테스트 성공",
          description: `${data.savedMemories?.length || 0}개의 메모리가 저장되었습니다.`,
        })
      } else {
        toast({
          title: "메모리 저장 테스트 실패",
          description: data.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Memory test failed:", error)
      toast({
        title: "메모리 저장 테스트 실패",
        description: "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <AlertCircle className="h-4 w-4 text-gray-400" />
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button onClick={checkConfig} disabled={isChecking}>
          {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          환경 설정 확인
        </Button>
        <Button onClick={testMemorySave} disabled={isTesting} variant="outline">
          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          메모리 저장 테스트
        </Button>
      </div>

      {configCheck && (
        <Tabs defaultValue="config" className="w-full">
          <TabsList>
            <TabsTrigger value="config">환경 설정</TabsTrigger>
            <TabsTrigger value="database">데이터베이스</TabsTrigger>
            <TabsTrigger value="functions">함수</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>환경 변수 설정</CardTitle>
                <CardDescription>필수 환경 변수들의 설정 상태를 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Supabase URL</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.config.supabaseUrl} />
                    <Badge variant={configCheck.config.supabaseUrl ? "default" : "destructive"}>
                      {configCheck.config.supabaseUrl ? "설정됨" : "누락"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Supabase Service Key</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.config.supabaseServiceKey} />
                    <Badge variant={configCheck.config.supabaseServiceKey ? "default" : "destructive"}>
                      {configCheck.config.supabaseServiceKey ? "설정됨" : "누락"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>OpenAI API Key</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.config.openaiKey} />
                    <Badge variant={configCheck.config.openaiKey ? "default" : "destructive"}>
                      {configCheck.config.openaiKey ? "설정됨" : "누락"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Smart Memory 활성화</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.config.enableSmartMemory} />
                    <Badge variant={configCheck.config.enableSmartMemory ? "default" : "secondary"}>
                      {configCheck.config.enableSmartMemory ? "활성화" : "비활성화"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>환경</span>
                  <Badge variant="outline">{configCheck.config.nodeEnv}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>데이터베이스 연결</CardTitle>
                <CardDescription>Supabase 데이터베이스 연결 상태를 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>데이터베이스 연결</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.dbTest.connected} />
                    <Badge variant={configCheck.dbTest.connected ? "default" : "destructive"}>
                      {configCheck.dbTest.connected ? "연결됨" : "연결 실패"}
                    </Badge>
                  </div>
                </div>
                {configCheck.dbTest.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{configCheck.dbTest.error}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>테이블 구조</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.tableTest.exists} />
                    <Badge variant={configCheck.tableTest.exists ? "default" : "destructive"}>
                      {configCheck.tableTest.exists ? "정상" : "오류"}
                    </Badge>
                  </div>
                </div>
                {configCheck.tableTest.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{configCheck.tableTest.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="functions">
            <Card>
              <CardHeader>
                <CardTitle>데이터베이스 함수</CardTitle>
                <CardDescription>스마트 메모리에 필요한 데이터베이스 함수들을 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>메모리 함수</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.functionsTest.exists} />
                    <Badge variant={configCheck.functionsTest.exists ? "default" : "destructive"}>
                      {configCheck.functionsTest.exists ? "존재함" : "누락"}
                    </Badge>
                  </div>
                </div>
                {configCheck.functionsTest.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{configCheck.functionsTest.error}</p>
                    {configCheck.functionsTest.error.includes("function") && (
                      <p className="text-sm text-red-600 mt-2">
                        💡 해결방법: scripts/create-memory-functions-complete.sql을 실행하세요.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="openai">
            <Card>
              <CardHeader>
                <CardTitle>OpenAI API</CardTitle>
                <CardDescription>OpenAI API 연결 상태를 확인합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>API 연결</span>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={configCheck.openaiTest.working} />
                    <Badge variant={configCheck.openaiTest.working ? "default" : "destructive"}>
                      {configCheck.openaiTest.working ? "정상" : "오류"}
                    </Badge>
                  </div>
                </div>
                {configCheck.openaiTest.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{configCheck.openaiTest.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>메모리 저장 테스트 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
