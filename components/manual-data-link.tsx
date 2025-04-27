"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Link, Loader2 } from "lucide-react"
import { getSupabase } from "@/lib/supabase-client"

export default function ManualDataLink() {
  const [sessionId, setSessionId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!sessionId.trim()) {
        setError("세션 ID를 입력해주세요.")
        return
      }

      // Get the current auth user
      const supabase = getSupabase()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        setError("로그인이 필요합니다.")
        return
      }

      const authUserId = userData.user.id

      // Check if the session exists
      const { data: sessionData, error: sessionError } = await supabase
        .from("saju_sessions")
        .select("id, auth_user_id")
        .eq("id", sessionId)
        .single()

      if (sessionError) {
        console.error("Error checking session:", sessionError)
        setError("해당 세션 ID를 찾을 수 없습니다.")
        return
      }

      // Check if the session is already linked to another user
      if (sessionData.auth_user_id && sessionData.auth_user_id !== authUserId) {
        setError("이 세션은 이미 다른 사용자와 연결되어 있습니다.")
        return
      }

      // Link the session to the current user
      const { error: updateError } = await supabase
        .from("saju_sessions")
        .update({ auth_user_id: authUserId })
        .eq("id", sessionId)

      if (updateError) {
        console.error("Error linking session:", updateError)
        setError("데이터 연결에 실패했습니다.")
        return
      }

      setSuccess("데이터가 성공적으로 연결되었습니다. 페이지를 새로고침하여 확인하세요.")
      // Clear the input
      setSessionId("")

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error("Error linking data:", error)
      setError("데이터 연결 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>데이터 수동 연결</CardTitle>
        <CardDescription>이전에 생성한 사주 데이터를 현재 계정에 연결하려면 세션 ID를 입력하세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionId">세션 ID</Label>
            <Input
              id="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="예: 550e8400-e29b-41d4-a716-446655440000"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              세션 ID는 사주 결과 페이지 URL의 uuid 파라미터에서 찾을 수 있습니다.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                연결 중...
              </>
            ) : (
              <>
                <Link className="mr-2 h-4 w-4" />
                데이터 연결하기
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <AlertTitle>성공</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
