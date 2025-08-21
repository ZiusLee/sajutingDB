"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { getUserId } from "@/lib/auth-utils"
import { getSupabase } from "@/lib/supabase-client"

export function LoginFormClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const router = useRouter()

  const handleOAuthLogin = async (provider: "google" | "kakao") => {
    setIsOAuthLoading(true)
    setError("")

    try {
      const supabase = getSupabase()

      localStorage.setItem("auth_flow_type", "login")
      localStorage.removeItem("auth_return_action")

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error(`${provider} 로그인 에러:`, error)
        setError(`${provider === "google" ? "구글" : "카카오"} 로그인에 실패했습니다.`)
        setIsOAuthLoading(false)
      }
    } catch (err) {
      console.error(`${provider} 로그인 에러:`, err)
      setError("로그인 중 오류가 발생했습니다.")
      setIsOAuthLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const localUserId = getUserId()

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          localUserId,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || "로그인에 실패했습니다.")
        setIsLoading(false)
        return
      }

      localStorage.setItem("user_authenticated", "true")
      localStorage.setItem("user_id", data.user.id)
      localStorage.setItem("user_token", data.user.id)
      localStorage.setItem("user_email", data.user.email)
      localStorage.setItem("user_name", data.user.name || data.user.email.split("@")[0])

      router.push(data.redirectTo || "/")
    } catch (err) {
      console.error("로그인 에러:", err)
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4 p-4 md:p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="text-sm text-muted-foreground mt-2">계정에 로그인하세요</p>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-transparent"
          onClick={() => handleOAuthLogin("google")}
          disabled={isLoading || isOAuthLoading}
        >
          {isOAuthLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          구글로 로그인
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
          onClick={() => handleOAuthLogin("kakao")}
          disabled={isLoading || isOAuthLoading}
        >
          {isOAuthLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
            </svg>
          )}
          카카오로 로그인
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">또는</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">비밀번호</Label>
            <Link href="/reset-password" className="text-xs text-primary hover:underline">
              비밀번호 찾기
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 로그인 중...
            </>
          ) : (
            "로그인"
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <p>
          계정이 없으신가요?{" "}
          <Link href="/?showOnboarding=true" className="text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
