"use client"

import type React from "react"

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

export default function RegisterPage() {
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

    // Validation
    if (!email || !password || !confirmPassword || !name) {
      setError("모든 필드를 입력해주세요.")
      return
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.")
      return
    }

    if (!privacyConsent) {
      setError("개인정보 처리방침에 동의해주세요.")
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
        setError(error.message)
        return
      }

      if (data.user) {
        // Store user name in localStorage for immediate use
        localStorage.setItem("user_name", name)

        setSuccess("회원가입이 완료되었습니다! 사주 프로필을 생성해주세요.")

        // Redirect to home page with onboarding trigger after a short delay
        setTimeout(() => {
          router.push("/?showOnboarding=true")
        }, 2000)
      }
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const privacyPolicyContent = `
사주핑 이용약관 및 개인정보 처리방침

1. 사주핑 서비스 이용약관

제1조 (목적)
본 약관은 사주핑 주식회사(이하 "회사")가 운영하는 모바일 앱·웹 기반의 사주핑 서비스(이하 "서비스") 이용과 관련하여, 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 이용자에게 사주 기반 AI 해석, 감정케어 상담, 운세 리포트 등 콘텐츠를 제공하기 위해 정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 의미하며, 해당 서비스를 운영하는 사업자도 포함합니다.
2. "이용자"란 회사의 서비스에 접속하여 본 약관에 따라 회사가 제공하는 콘텐츠와 제반 서비스를 이용하는 회원 및 비회원을 말합니다.
3. "회원"이란 본 약관에 동의하고 가입하여 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를 말합니다.

제3조 (회원가입 및 계정관리)
1. 회원가입은 카카오, 네이버, 구글, 애플 등 제3자 소셜 로그인 또는 이메일 가입을 통해 가능합니다.
2. 가입 시 필수 입력 정보: 성별, 생년월일(음·양력 여부 포함), 태어난 도시
   선택 입력 정보: 태어난 시, 추가 프로필 정보

2. 사주핑 개인정보 처리방침

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

제12조 (개인정보 보호책임자)
- 성명: 이윤섭
- 이메일: yoon@sajuping.ai

공고일자: 2025년 8월 11일
시행일자: 2025년 8월 11일
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
