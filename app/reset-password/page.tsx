"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SajuLogo } from "@/components/saju-logo"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const supabase = createClientComponentClient()

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!password) {
      setError("새 비밀번호를 입력해주세요.")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6��� 이상이어야 합니다.")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess("비밀번호가 성공적으로 변경되었습니다.")

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      console.error("비밀번호 변경 오류:", err)
      setError(err instanceof Error ? err.message : "비밀번호 변경 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 헤더 */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => router.push("/login")} className="p-2 -ml-2" aria-label="뒤로 가기">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-medium ml-2">비밀번호 재설정</h1>
      </div>

      {/* 컨텐츠 */}
      <div className="flex flex-col items-center justify-center flex-1 p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* 로고 */}
          <div className="flex justify-center items-center mb-8">
            <SajuLogo size="lg" showText={false} />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 성공 메시지 */}
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>새 비밀번호 설정</CardTitle>
              <CardDescription>새로운 비밀번호를 입력해주세요. 비밀번호는 최소 6자 이상이어야 합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">새 비밀번호</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="새 비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="py-5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="py-5"
                  />
                </div>

                <Button type="submit" className="w-full py-5" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "비밀번호 변경"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
