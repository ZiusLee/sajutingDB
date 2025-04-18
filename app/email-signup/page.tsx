"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SajuLogo } from "@/components/saju-logo"
import { Card, CardContent } from "@/components/ui/card"

export default function EmailSignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("이메일을 입력해주세요.")
      return
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.")
      return
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.")
      return
    }

    setIsLoading(true)

    try {
      // 이메일 중복 확인 등의 검증 후 약관 동의 페이지로 이동
      router.push(`/register?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`)
    } catch (err) {
      console.error("가입 오류:", err)
      setError(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 헤더 */}
      <div className="flex items-center p-4 border-b">
        <button onClick={() => router.back()} className="p-2 -ml-2" aria-label="뒤로 가기">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-medium ml-2">이메일로 가입</h1>
      </div>

      {/* 컨텐츠 */}
      <div className="flex flex-col items-center justify-center flex-1 p-4 md:p-8">
        <div className="w-full max-w-md mx-auto">
          {/* 로고 */}
          <div className="flex justify-center items-center mb-8">
            <SajuLogo size="lg" showText={false} />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="py-5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호 (영문, 숫자 조합 8자 이상)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호 (영문, 숫자 조합 8자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="py-5"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isLoading} className="w-full py-5">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      "다음"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
