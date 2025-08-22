"use client"

import type React from "react"

import type { ReactElement } from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Shield } from "lucide-react"
import { trackIntegratedEvents, trackAuthEvents, trackError, trackUserEvents } from "@/lib/analytics"

export default function RegisterPage(): ReactElement {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    trackIntegratedEvents.registerClick()
    trackIntegratedEvents.formSubmit("register")
    trackAuthEvents.signUp("email")

    // Validation
    if (!email || !password || !confirmPassword || !name) {
      const errorMsg = "모든 필드를 입력해주세요."
      setError(errorMsg)
      trackError(`Registration validation error: ${errorMsg}`, "register_page")
      return
    }

    if (password !== confirmPassword) {
      const errorMsg = "비밀번호가 일치하지 않습니다."
      setError(errorMsg)
      trackError(`Registration validation error: ${errorMsg}`, "register_page")
      return
    }

    if (password.length < 6) {
      const errorMsg = "비밀번호는 최소 6자 이상이어야 합니다."
      setError(errorMsg)
      trackError(`Registration validation error: ${errorMsg}`, "register_page")
      return
    }

    if (!privacyConsent) {
      const errorMsg = "개인정보 처리방침에 동의해주세요."
      setError(errorMsg)
      trackError(`Registration validation error: ${errorMsg}`, "register_page")
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (error) {
        trackError(`Registration error: ${error.message}`, "register_page")
        setError(error.message)
        return
      }

      if (data.user) {
        // Store user name in localStorage for immediate use
        localStorage.setItem("user_name", name)

        trackUserEvents.profileCreated()
        trackIntegratedEvents.apiCall("user_register")

        setSuccess("회원가입이 완료되었습니다! 사주 프로필을 생성해주세요.")

        // Redirect to home page with onboarding trigger after a short delay
        setTimeout(() => {
          router.push("/?showOnboarding=true")
        }, 2000)
      }
    } catch (err) {
      const errorMsg = "회원가입 중 오류가 발생했습니다."
      trackError(`Registration exception: ${err instanceof Error ? err.message : "Unknown error"}`, "register_page")
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const privacyPolicyContent = `
사주핑 개인정보 처리방침

제1조 (개인정보의 수집 및 이용)
회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집·이용합니다.

1. 회원가입 및 서비스 이용
- 필수항목: 이름, 성별, 음/양력 여부, 생년월일, 태어난 도시, 소셜ID
- 선택항목: 태어난 시
- 보유기간: 회원 탈퇴 시까지

2. 민원처리
- 필수항목: 이메일, 문의내용, 앱 버전, 단말기 정보
- 보유기간: 처리 완료 후 3년

3. 유료서비스 결제
- 필수항목: 결제수단 정보(카드번호, 계좌정보), 결제기록
- 보유기간: 전자상거래법 등 관계 법령에 따른 기간

4. 마케팅 및 이벤트
- 필수항목: 이름, 성별, 접속IP, 서비스 이용기록, 기기정보, 국가정보, 쿠키, 푸시 알림 토큰
- 보유기간: 동의 철회 또는 탈퇴 시까지

제2조 (민감정보 수집 제한)
회사는 이용자의 사상, 신념, 건강 등 민감정보를 수집하지 않습니다.

제3조 (만 14세 미만 아동의 개인정보)
만 14세 미만 아동의 개인정보를 수집하지 않으며, 이와 관련하여 서비스 이용을 제한합니다.

제7조 (개인정보 처리 위탁)
회사는 원활한 서비스 제공을 위해 일부 업무를 외부에 위탁할 수 있으며, 위탁사는 법령에 따라 관리·감독합니다.
- Supabase, AWS, Google Firebase: 데이터 저장 및 서버 운영
- PG사(결제대행사): 결제 처리
- Onesignal: 푸시 알림 발송

제10조 (안전성 확보조치)
- 암호화 저장
- 접근권한 최소화
- 해킹·바이러스 대비 보안시스템 적용
- 접속기록 위변조 방지

제11조 (이용자 권리)
- 개인정보 열람·정정·삭제·처리정지 요청 가능
- 국외 이전 거부 가능(단, 서비스 이용이 제한될 수 있음)

제12조 (개인정보 보호책임자)
- 성명: 이윤섭
- 이메일: yoon@sajuping.ai

공고일자: 2025년 8월 22일
시행일자: 2025년 8월 22일
  `

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">회원가입</CardTitle>
          <CardDescription className="text-center">사주핑에 오신 것을 환영합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="privacy"
                checked={privacyConsent}
                onCheckedChange={(checked) => setPrivacyConsent(checked as boolean)}
              />
              <div className="flex items-center space-x-1 text-sm">
                <Label htmlFor="privacy" className="cursor-pointer">
                  개인정보 처리방침에 동의합니다
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-blue-600 hover:text-blue-800">
                      <Shield className="h-3 w-3 mr-1" />
                      보기
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>개인정보 처리방침</DialogTitle>
                      <DialogDescription>사주핑의 개인정보 처리방침을 확인해주세요.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
                      <pre className="whitespace-pre-wrap text-sm">{privacyPolicyContent}</pre>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "가입 중..." : "회원가입"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
