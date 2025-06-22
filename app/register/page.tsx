"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SajuLogo } from "@/components/saju-logo"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Validation
    if (!name) {
      setError("이름을 입력해주세요.")
      setIsLoading(false)
      return
    }

    if (!email) {
      setError("이메일을 입력해주세요.")
      setIsLoading(false)
      return
    }

    if (!password) {
      setError("비밀번호를 입력해주세요.")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    try {
      // Use the existing API route for registration
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "회원가입 중 오류가 발생했습니다.")
      }

      if (data.success) {
        setSuccess("회원가입이 완료되었습니다!")

        // Redirect to the specified page or default to chat-list
        setTimeout(() => {
          router.push(data.redirectTo || "/chat-list")
        }, 2000)
      } else {
        throw new Error(data.message || "회원가입에 실패했습니다.")
      }
    } catch (err) {
      console.error("회원가입 오류:", err)
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.")
    } finally {
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
        <h1 className="text-lg font-medium ml-2">회원가입</h1>
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
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="py-5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="py-5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호 (6자 이상)"
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

                <Button type="submit" className="w-full py-5 mt-6" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "회원가입"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 로그인 링크 */}
          <div className="mt-8 text-center">
            <p className="text-center text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Button variant="link" className="p-0 h-auto font-normal" onClick={() => router.push("/login")}>
                로그인
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
