"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, CheckCircle, XCircle, AlertCircle, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MemoryDebugPanelProps {
  userId: string
}

interface DebugResult {
  section: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

export function MemoryDebugPanel({ userId }: MemoryDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [debugResults, setDebugResults] = useState<DebugResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { toast } = useToast()

  const runDebugCheck = async () => {
    setIsRunning(true)
    setDebugResults([])

    try {
      const response = await fetch("/api/debug/memory-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        const data = await response.json()
        setDebugResults(data.results || [])

        const hasErrors = data.results?.some((r: DebugResult) => r.status === "error")
        toast({
          title: hasErrors ? "디버그 완료 (문제 발견)" : "디버그 완료",
          description: hasErrors
            ? "일부 문제가 발견되었습니다. 결과를 확인해주세요."
            : "모든 시스템이 정상 작동 중입니다.",
          variant: hasErrors ? "destructive" : "default",
        })
      } else {
        throw new Error("Debug check failed")
      }
    } catch (error) {
      console.error("Debug check error:", error)
      toast({
        title: "디버그 실패",
        description: "시스템 점검 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const testMemorySave = async () => {
    setIsRunning(true)

    try {
      const response = await fetch("/api/smart-memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          memories: [
            {
              content: "테스트 메모리 - " + new Date().toISOString(),
              type: "test",
              importance_score: 0.5,
            },
          ],
        }),
      })

      if (response.ok) {
        toast({
          title: "메모리 저장 테스트 성공",
          description: "테스트 메모리가 성공적으로 저장되었습니다.",
        })
      } else {
        const errorData = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorData}`)
      }
    } catch (error) {
      console.error("Memory test failed:", error)
      toast({
        title: "메모리 저장 테스트 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">정상</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">오류</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">경고</Badge>
      default:
        return <Badge variant="secondary">알 수 없음</Badge>
    }
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  시스템 디버그 패널
                </CardTitle>
                <CardDescription>스마트 메모리 시스템의 상태를 확인하고 테스트합니다.</CardDescription>
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={runDebugCheck} disabled={isRunning} variant="outline">
                  {isRunning ? "점검 중..." : "환경 설정 확인"}
                </Button>
                <Button onClick={testMemorySave} disabled={isRunning} variant="outline">
                  {isRunning ? "테스트 중..." : "메모리 저장 테스트"}
                </Button>
              </div>

              {debugResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">점검 결과</h4>
                  {debugResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(result.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{result.section}</span>
                                {getStatusBadge(result.status)}
                              </div>
                              <p className="text-sm text-gray-600">{result.message}</p>
                              {result.details && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-500 cursor-pointer">자세한 정보</summary>
                                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                    {JSON.stringify(result.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-4">
                <p>• 환경 설정 확인: 필요한 환경변수와 데이터베이스 연결을 확인합니다.</p>
                <p>• 메모리 저장 테스트: 실제 메모리 저장 프로세스를 테스트합니다.</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
