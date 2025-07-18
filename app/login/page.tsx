"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getSupabase } from "@/lib/supabase-client"
import Link from "next/link"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  const [isLoading, setIsLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(mode === "email")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const supabase = getSupabase()

  // Auto-show email form if mode=email in URL
  useEffect(() => {
    if (mode === "email") {
      setShowEmailForm(true)
    }
  }, [mode])

  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        toast({
          title: "로그인 성공",
          description: "환영합니다!",
        })
        router.push("/mypage")
      }
    } catch (err: any) {
      console.error("이메일 로그인 오류:", err)
      setError(err.message || "로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Kakao login
  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true)
    setError("")

    try {
      console.log("Starting Kakao login...")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/mypage`,
        },
      })

      if (error) {
        console.error("Kakao login error:", error)
        throw error
      }

      console.log("Kakao login initiated, waiting for redirect...")
    } catch (err) {
      console.error("카카오 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "카카오 로그인 중 오류가 발생했습니다.")
      setIsKakaoLoading(false)
    }
  }

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError("")

    try {
      console.log("Starting Google login...")
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/mypage`,
        },
      })

      if (error) {
        console.error("Google login error:", error)
        throw error
      }

      console.log("Google login initiated, waiting for redirect...")
    } catch (err) {
      console.error("구글 로그인 오류:", err)
      setError(err instanceof Error ? err.message : "구글 로그인 중 오류가 발생했습니다.")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {showEmailForm && (
              <Button variant="ghost" size="icon" onClick={() => setShowEmailForm(false)} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="text-2xl font-bold">{showEmailForm ? "이메일 로그인" : "로그인"}</CardTitle>
              <CardDescription>
                {showEmailForm ? "이메일과 비밀번호를 입력해주세요" : "계정에 로그인하여 사주핑을 이용해보세요"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {showEmailForm ? (
            // Email Login Form
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  계정이 없으신가요?{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    회원가입
                  </Link>
                </p>
              </div>
            </form>
          ) : (
            // Social Login Options
            <div className="space-y-4">
              <Button
                onClick={handleKakaoLogin}
                disabled={isKakaoLoading || isGoogleLoading}
                className="w-full bg-[#FEE500] hover:bg-[#E6CF00] text-black"
              >
                {isKakaoLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.48 2 10.8C2 13.8 3.92 16.44 6.76 17.88L5.6 21.48C5.52 21.72 5.76 21.96 6 21.84L10.32 19.2C10.88 19.28 11.44 19.32 12 19.32C17.52 19.32 22 15.84 22 10.8C22 6.48 17.52 3 12 3Z" />
                  </svg>
                )}
                카카오로 로그인
              </Button>

              <Button
                onClick={handleGoogleLogin}
                disabled={isKakaoLoading || isGoogleLoading}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
                )}
                구글로 로그인
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              <Button onClick={() => setShowEmailForm(true)} variant="outline" className="w-full">
                이메일로 로그인
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  계정이 없으신가요?{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    회원가입
                  </Link>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
