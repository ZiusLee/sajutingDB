"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SajuLogo } from "@/components/saju-logo"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getSupabase } from "@/lib/supabase-client"
import { trackIntegratedEvents, trackAuthEvents, trackError } from "@/lib/analytics"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isResetMode, setIsResetMode] = useState(false)
  // Use our singleton Supabase instance
  const supabase = getSupabase()

  // Check for error params
  useEffect(() => {
    trackIntegratedEvents.pageView("login")

    const errorParam = searchParams.get("error")
    if (errorParam) {
      trackError(`Login callback error: ${errorParam}`, "login_page")

      switch (errorParam) {
        case "callback_error":
          setError("로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.")
          break
        case "no_user":
          setError("사용자 정보를 찾을 수 없습니다. 다시 시도해주세요.")
          break
        case "no_code":
          setError("인증 코드가 없습니다. 다시 시도해주세요.")
          break
        default:
          setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
      }
    }
  }, [searchParams])

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log("Checking if user is already logged in...")
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking session:", error)
          return
        }

        if (data.session) {
          console.log("User already logged in, redirecting...")
          router.push("/saju-chat/sajuping")
        } else {
          console.log("No active session found")
        }
      } catch (err) {
        console.error("Error checking user:", err)
      }
    }

    checkUser()
  }, [router, supabase.auth])

  // Handle Kakao login
  const handleKakaoLogin = async () => {
    setIsLoading(true)
    setError("")

    trackIntegratedEvents.loginClick("kakao")
    trackAuthEvents.signIn("kakao")

    try {
      console.log("Starting Kakao login...")

      localStorage.setItem("auth_flow_type", "login")

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/saju-chat/sajuping`,
        },
      })

      if (error) {
        console.error("Kakao login error:", error)
        trackError(`Kakao login error: ${error.message}`, "login_page")
        throw error
      }

      console.log("Kakao login initiated, waiting for redirect...")
      // The redirect will be handled by Supabase
    } catch (err) {
      console.error("카카오 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "카카오 로그인 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    trackIntegratedEvents.loginClick("google")
    trackAuthEvents.signIn("google")

    try {
      console.log("Starting Google login...")

      localStorage.setItem("auth_flow_type", "login")

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/saju-chat/sajuping`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("Google login error:", error)
        trackError(`Google login error: ${error.message}`, "login_page")
        throw error
      }

      console.log("Google login initiated, waiting for redirect...")
      // The redirect will be handled by Supabase
    } catch (err) {
      console.error("구글 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "구글 로그인 중 오류가 발생했습니다.")
      setIsLoading(false)
    }
  }

  // Handle Email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    trackIntegratedEvents.loginClick("email")
    trackIntegratedEvents.formSubmit("login")
    trackAuthEvents.signIn("email")

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
      console.log("Starting email login...")
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Email login error:", error)
        trackError(`Email login error: ${error.message}`, "login_page")

        if (error.message.includes("Invalid login credentials") || error.message.includes("User not found")) {
          setError("계정을 찾을 수 없습니다. 먼저 사주프로필을 생성해주세요.")
          setTimeout(() => {
            router.push("/?showOnboarding=true")
          }, 2000)
          return
        }
        throw error
      }

      console.log("Email login successful:", data.user?.id)
      // Store user info in localStorage for compatibility with existing code
      if (data.user) {
        localStorage.setItem("user_authenticated", "true")
        localStorage.setItem("user_id", data.user.id)
        localStorage.setItem("user_email", data.user.email || "")
        // Extract name from metadata if available
        const userName = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User"
        localStorage.setItem("user_name", userName)
      }

      router.push("/saju-chat/sajuping")
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

    trackIntegratedEvents.formSubmit("password_reset")

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
      trackError(`Password reset error: ${err instanceof Error ? err.message : "Unknown error"}`, "login_page")
      setError(err instanceof Error ? err.message : "비밀번호 재설정 요청 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
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

                  {/* 구글 로그인 버튼 */}
                  <Button
                    className="w-full py-5 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center justify-center"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    구글로 로그인
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
                  <Button
                    variant="outline"
                    className="w-full py-5 bg-transparent"
                    onClick={() => setShowEmailForm(true)}
                  >
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
                            type="button"
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
        </div>
      </div>
    </div>
  )
}
