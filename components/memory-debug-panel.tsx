"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"

interface MemoryDebugPanelProps {
  userId: string
  onMemoryUpdate?: () => void
}

const memoryTypes = [
  { value: "identity", label: "신원정보" },
  { value: "goal", label: "목표/계획" },
  { value: "emotion", label: "감정상태" },
  { value: "relationship", label: "인간관계" },
  { value: "interest", label: "관심사" },
  { value: "schedule", label: "일정" },
  { value: "preference", label: "선호도" },
  { value: "situation", label: "상황" },
]

export function MemoryDebugPanel({ userId, onMemoryUpdate }: MemoryDebugPanelProps) {
  const [configStatus, setConfigStatus] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [testContent, setTestContent] = useState("")
  const [testType, setTestType] = useState("identity")
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const checkConfig = async () => {
    try {
      setConfigLoading(true)
      const response = await fetch("/api/debug/memory-config")
      const data = await response.json()
      setConfigStatus(data)

      if (data.status === "OK") {
        toast({
          title: "설정 확인 완료",
          description: "모든 설정이 정상입니다.",
        })
      } else {
        toast({
          title: "설정 문제 발견",
          description: "일부 설정에 문제가 있습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("설정 확인 실패:", error)
      toast({
        title: "설정 확인 실패",
        description: "설정을 확인하는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setConfigLoading(false)
    }
  }

  const testMemorySave = async () => {
    if (!testContent.trim()) {
      toast({
        title: "내용 입력 필요",
        description: "테스트할 메모리 내용을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    try {
      setTestLoading(true)
      const testMemory = {
        type: testType,
        content: testContent,
        importance: 0.8,
        context: "디버그 패널에서 생성된 테스트 메모리",
      }

      const response = await fetch("/api/smart-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          memories: [testMemory],
          conversationId: `debug-test-${Date.now()}`,
        }),
      })

      const data = await response.json()
      setTestResult(data)

      if (data.success) {
        toast({
          title: "메모리 저장 성공",
          description: `${data.savedMemories?.length || 0}개의 메모리가 저장되었습니다.`,
        })
        onMemoryUpdate?.()
      } else {
        toast({
          title: "메모리 저장 실패",
          description: data.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("메모리 저장 테스트 실패:", error)
      toast({
        title: "테스트 실패",
        description: "메모리 저장 테스트에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setTestLoading(false)
    }
  }

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* 환경 설정 확인 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            환경 설정 확인
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkConfig} disabled={configLoading}>
            {configLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <AlertCircle className="h-4 w-4 mr-2" />
            )}
            환경 설정 확인
          </Button>

          {configStatus && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">환경변수</h4>
                  <div className="space-y-1">
                    {Object.entries(configStatus.environment).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <StatusIcon status={value as boolean} />
                        <span>{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">데이터베이스</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <StatusIcon status={configStatus.database.connection} />
                      <span>연결</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <StatusIcon status={configStatus.database.tableExists} />
                      <span>테이블</span>
                    </div>
                    {Object.entries(configStatus.database.functions).map(([func, exists]) => (
                      <div key={func} className="flex items-center gap-2 text-sm">
                        <StatusIcon status={exists as boolean} />
                        <span>{func}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Badge variant={configStatus.status === "OK" ? "default" : "destructive"}>{configStatus.status}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 메모리 저장 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle>메모리 저장 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">메모리 타입</label>
            <Select value={testType} onValueChange={setTestType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {memoryTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">메모리 내용</label>
            <Textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="테스트할 메모리 내용을 입력하세요..."
              rows={3}
            />
          </div>

          <Button onClick={testMemorySave} disabled={testLoading}>
            {testLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            메모리 저장 테스트
          </Button>

          {testResult && (
            <div className="p-3 bg-muted rounded-lg">
              <pre className="text-xs overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 사용자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>디버그 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>사용자 ID:</strong> {userId}
            </div>
            <div>
              <strong>타임스탬프:</strong> {new Date().toISOString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
