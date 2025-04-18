"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SajuLogo } from "@/components/saju-logo"
import { Card, CardContent } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  const supabase = createClientComponentClient()

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        router.push("/")
      }
    }

    checkUser()
  }, [router, supabase.auth])

  // Handle Kakao login
  const handleKakaoLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // The redirect will be handled by Supabase
    } catch (err) {
      console.error("카카오 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "카카오 로그인 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  // Handle Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Store user info in localStorage for compatibility with existing code
      if (data.user) {
        localStorage.setItem("user_authenticated", "true")
        localStorage.setItem("user_id", data.user.id)
        localStorage.setItem("user_email", data.user.email || "")
        // Extract name from metadata if available
        const userName = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User"
        localStorage.setItem("user_name", userName)
      }

      router.push("/")
    } catch (err) {
      console.error("이메일 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "로그인 중 오류가 발생했습니다. 이메일과 비밀번호를 확인해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle password reset request
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (!email) {
      setError("이메일을 입력해주세요.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess("비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.")
    } catch (err) {
      console.error("비밀번호 재설정 오류:", err)
      setError(err instanceof Error ? err.message : "비밀번호 재설정 요청 중 오류가 발생했습니다.")
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
        <h1 className="text-lg font-medium ml-2">{isResetMode ? "비밀번호 재설정" : "로그인"}</h1>
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
            <CardContent className="pt-6 space-y-4">
              {!showEmailForm ? (
                <>
                  {/* 카카오 로그인 버튼 */}
                  <Button
                    className="w-full py-5 bg-[#FEE500] text-black hover:bg-[#E6CF00] flex items-center justify-center"
                    onClick={handleKakaoLogin}
                    disabled={isLoading}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2"
                    >
                      <path
                        d="M12 3C6.48 3 2 6.48 2 10.8C2 13.8 3.92 16.44 6.76 17.88L5.6 21.48C5.52 21.72 5.76 21.96 6 21.84L10.32 19.2C10.88 19.28 11.44 19.32 12 19.32C17.52 19.32 22 15.84 22 10.8C22 6.48 17.52 3 12 3Z"
                        fill="black"
                      />
                    </svg>
                    카카오톡으로 로그인
                  </Button>

                  {/* 구분선과 "또는" 텍스트 */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">또는</span>
                    </div>
                  </div>

                  {/* 이메일 로그인 버튼 */}
                  <Button variant="outline" className="w-full py-5" onClick={() => setShowEmailForm(true)}>
                    이메일로 로그인
                  </Button>
                </>
              ) : (
                <>
                  {isResetMode ? (
                    // 비밀번호 재설정 폼
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">이메일</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="example@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="py-5"
                        />
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full py-5" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              처리 중...
                            </>
                          ) : (
                            "비밀번호 재설정 링크 받기"
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="text-sm text-muted-foreground"
                          onClick={() => {
                            setIsResetMode(false)
                            setSuccess("")
                          }}
                        >
                          로그인으로 돌아가기
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // 이메일 로그인 폼
                    <form onSubmit={handleEmailLogin} className="space-y-4">
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
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">비밀번호</Label>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm"
                            onClick={(e) => {
                              e.preventDefault()
                              setIsResetMode(true)
                            }}
                          >
                            비밀번호 찾기
                          </Button>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          placeholder="비밀번호"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="py-5"
                        />
                      </div>

                      <div className="flex flex-col space-y-2">
                        <Button type="submit" className="w-full py-5" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              로그인 중...
                            </>
                          ) : (
                            "로그인"
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="text-sm text-muted-foreground"
                          onClick={() => setShowEmailForm(false)}
                        >
                          다른 방법으로 로그인
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* 회원가입 링크 */}
          <div className="mt-8 text-center">
            <p className="text-center text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Button variant="link" className="p-0 h-auto font-normal" onClick={() => router.push("/register")}>
                회원가입
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
