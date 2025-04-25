"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function ManualDataLink() {
  const [anonymousUserId, setAnonymousUserId] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleLinkData = async () => {
    if (!anonymousUserId) {
      setError("익명 사용자 ID를 입력해주세요.")
      return
    }

    setIsLinking(true)
    setError(null)
    setSuccess(null)

    try {
      // Get the current authenticated user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session || !session.user) {
        setError("로그인이 필요합니다.")
        return
      }

      const authUserId = session.user.id

      // Call the API to link the data
      const response = await fetch("/api/manual-link-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anonymousUserId,
          authUserId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "데이터 연결 중 오류가 발생했습니다.")
      }

      // Update localStorage
      localStorage.setItem("user_id", anonymousUserId)

      setSuccess(`사용자 데이터가 성공적으로 연결되었습니다. 페이지를 새로고침하세요.`)
    } catch (error) {
      console.error("Error linking data:", error)
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>데이터 수동 연결</CardTitle>
        <CardDescription>
          익명 사용자 데이터를 현재 로그인된 계정과 연결합니다. 이전에 생성한 사주 데이터의 ID를 입력하세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="anonymousUserId" className="text-sm font-medium">
              익명 사용자 ID
            </label>
            <Input
              id="anonymousUserId"
              value={anonymousUserId}
              onChange={(e) => setAnonymousUserId(e.target.value)}
              placeholder="예: daa9c782-a1b2-4561-aa8f-dcdefe33d22b"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              이전에 생성한 사주 데이터의 ID를 입력하세요. 이 ID는 사주 계산 후 콘솔 로그에서 확인할 수 있습니다.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle>성공</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleLinkData} disabled={isLinking} className="w-full">
          {isLinking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              연결 중...
            </>
          ) : (
            "데이터 연결하기"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
