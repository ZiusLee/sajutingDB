"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"

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
  const [stats, setStats] = useState<UpdateStats>({ total: 0, processed: 0, updated: 0, errors: 0 })
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

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
          <CardTitle>사주 세션 데이터 업데이트</CardTitle>
          <CardDescription>
            생년월일을 기반으로 사주와 대운 데이터를 다시 계산하여 업데이트합니다.
            <br />
            <strong>주의:</strong> saju 또는 daeun 컬럼이 비어있는 세션만 업데이트됩니다.
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
