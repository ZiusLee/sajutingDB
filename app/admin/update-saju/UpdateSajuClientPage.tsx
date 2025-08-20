"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, RefreshCw, TestTube } from "lucide-react"

interface UpdateStats {
  total: number
  processed: number
  updated: number
  errors: number
}

export default function UpdateSajuClientPage() {
  const router = useRouter()
  const supabase = getSupabase()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testSessionId, setTestSessionId] = useState("b4ac1ab4-b9ff-4786-81cd-6c7263afbcb7")
  const [stats, setStats] = useState<UpdateStats>({ total: 0, processed: 0, updated: 0, errors: 0 })
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setLoading(true)
        const { data } = await supabase.auth.getSession()

        if (!data.session) {
          router.push("/login?redirect=/admin/update-saju")
          return
        }
      } catch (error) {
        console.error("세션 확인 오류:", error)
        router.push("/login?redirect=/admin/update-saju")
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [router, supabase])

  const handleUpdateSaju = async () => {
    setUpdating(true)
    setResult(null)
    setStats({ total: 0, processed: 0, updated: 0, errors: 0 })

    try {
      const response = await fetch("/api/admin/update-saju", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("업데이트 요청 실패")
      }

      // Server-Sent Events로 진행 상황 받기
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.type === "progress") {
                  setStats(data.stats)
                } else if (data.type === "complete") {
                  setResult({
                    success: true,
                    message: `업데이트 완료: ${data.stats.updated}개 세션 업데이트, ${data.stats.errors}개 오류`,
                  })
                }
              } catch (e) {
                // JSON 파싱 오류 무시
              }
            }
          }
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: "업데이트 중 오류가 발생했습니다.",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleTestSession = async () => {
    if (!testSessionId.trim()) {
      setTestResult({ success: false, message: "세션 ID를 입력해주세요." })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/admin/test-saju-calculation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: testSessionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "테스트 요청 실패")
      }

      setTestResult({
        success: true,
        message: "테스트 완료",
        data: data,
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `테스트 중 오류가 발생했습니다: ${error.message}`,
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">로그인 상태를 확인하는 중입니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold">사주 데이터 업데이트</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            사주 계산 테스트
          </CardTitle>
          <CardDescription>특정 세션 ID의 사주 계산 결과를 미리 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionId">세션 ID</Label>
            <Input
              id="sessionId"
              value={testSessionId}
              onChange={(e) => setTestSessionId(e.target.value)}
              placeholder="세션 ID를 입력하세요"
            />
          </div>

          <Button onClick={handleTestSession} disabled={testing} variant="outline" className="w-full bg-transparent">
            {testing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                테스트 중...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                사주 계산 테스트
              </>
            )}
          </Button>

          {testResult && (
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{testResult.success ? "테스트 성공" : "테스트 실패"}</AlertTitle>
              <AlertDescription>
                {testResult.message}
                {testResult.success && testResult.data && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <pre>{JSON.stringify(testResult.data, null, 2)}</pre>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>사주 세션 데이터 업데이트</CardTitle>
          <CardDescription>
            생년월일을 기반으로 사주와 대운 데이터를 다시 계산하여 업데이트합니다.
            <br />
            <strong>주의:</strong> 모든 세션의 사주와 대운 데이터를 새로 계산된 값으로 업데이트합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {updating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>진행 상황</span>
                <span>
                  {stats.processed} / {stats.total}
                </span>
              </div>
              <Progress value={stats.total > 0 ? (stats.processed / stats.total) * 100 : 0} />
              <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>업데이트: {stats.updated}</div>
                <div>오류: {stats.errors}</div>
                <div>처리됨: {stats.processed}</div>
              </div>
            </div>
          )}

          <Button onClick={handleUpdateSaju} disabled={updating} className="w-full">
            {updating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                업데이트 중...
              </>
            ) : (
              "사주 데이터 업데이트 시작"
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "성공" : "오류"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
