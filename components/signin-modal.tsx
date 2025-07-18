"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void
  title?: string
  description?: string
}

export function SignInModal({
  isOpen,
  onClose,
  onAuthSuccess,
  title = "로그인",
  description = "계속하려면 로그인해주세요.",
}: SignInModalProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)

  const supabase = createClient()

  // 인증 상태 변경 감지
  useEffect(() => {
    if (isAuthenticated && !isProcessingAuth) {
      console.log("🔐 Authentication detected, calling success callback")
      setIsProcessingAuth(true)

      // 약간의 지연을 두어 인증 상태가 완전히 안정화되도록 함
      setTimeout(() => {
        onAuthSuccess?.()
        onClose()
        setIsProcessingAuth(false)
      }, 1000)
    }
  }, [isAuthenticated, onAuthSuccess, onClose, isProcessingAuth])

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    if (isLoading) return

    setIsLoading(true)
    try {
      console.log(`🔐 Starting ${provider} login`)

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error(`❌ ${provider} login error:`, error)
        toast.error(`${provider === "google" ? "구글" : "카카오"} 로그인에 실패했습니다.`)
      }
    } catch (error) {
      console.error(`❌ ${provider} login error:`, error)
      toast.error("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !email || !password) return

    setIsLoading(true)
    try {
      console.log(`🔐 Starting email ${isSignUp ? "signup" : "login"}`)

      let result
      if (isSignUp) {
        result = await supabase.auth.signUp({
          email,
          password,
        })
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }

      if (result.error) {
        console.error(`❌ Email ${isSignUp ? "signup" : "login"} error:`, result.error)
        toast.error(result.error.message)
      } else if (isSignUp && !result.data.user?.email_confirmed_at) {
        toast.success("회원가입이 완료되었습니다. 이메일을 확인해주세요.")
        setShowEmailForm(false)
      } else {
        console.log(`✅ Email ${isSignUp ? "signup" : "login"} successful`)
        toast.success(`${isSignUp ? "회원가입" : "로그인"}이 완료되었습니다.`)
      }
    } catch (error) {
      console.error(`❌ Email ${isSignUp ? "signup" : "login"} error:`, error)
      toast.error("인증 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailButtonClick = () => {
    router.push("/login?mode=email")
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setIsSignUp(false)
    setShowEmailForm(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showEmailForm ? (
            <>
              {/* 소셜 로그인 버튼들 */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleSocialLogin("kakao")}
                  disabled={isLoading}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
                >
                  {isLoading ? "로그인 중..." : "카카오로 로그인"}
                </Button>

                <Button
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? "로그인 중..." : "구글로 로그인"}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              <Button
                onClick={handleEmailButtonClick}
                variant="outline"
                className="w-full bg-transparent"
                disabled={isLoading}
              >
                이메일로 로그인
              </Button>
            </>
          ) : (
            <>
              {/* 이메일 로그인 폼 */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
                </Button>
              </form>

              <div className="text-center">
                <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} disabled={isLoading}>
                  {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
                </Button>
              </div>

              <Button variant="outline" onClick={() => setShowEmailForm(false)} className="w-full" disabled={isLoading}>
                소셜 로그인으로 돌아가기
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
