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

export function LoginFormClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // 로컬스토리지에서 유저 ID 가져오기
      const localUserId = getUserId()

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          localUserId, // 로컬스토리지의 유저 ID 전달
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message || "로그인에 ��패했습니다.")
        setIsLoading(false)
        return
      }

      // 사용자 정보 저장
      localStorage.setItem("user_authenticated", "true")
      localStorage.setItem("user_id", data.user.id)
      localStorage.setItem("user_token", data.user.id)
      localStorage.setItem("user_email", data.user.email)
      localStorage.setItem("user_name", data.user.name || data.user.email.split("@")[0])

      // 리디렉션
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
          <Link href="/register" className="text-primary hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
