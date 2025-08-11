"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import confetti from "canvas-confetti"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { BirthDateInfo } from "@/types/birth-date"

export function BetaSignupForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    privacyConsent: false,
  })
  const [birthInfo, setBirthInfo] = useState<BirthDateInfo | null>(null)

  // localStorage에서 사용자 정보 가져오기
  useEffect(() => {
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setFormData((prev) => ({ ...prev, name: storedName }))
    }

    // 생년월일 정보 가져오기
    const storedBirthInfo = localStorage.getItem("birthDateInfo")
    if (storedBirthInfo) {
      setBirthInfo(JSON.parse(storedBirthInfo))
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, privacyConsent: checked }))
  }

  // 폭죽 효과 함수
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })
  }

  // Update the form submission handler to ensure it handles privacy consent properly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.privacyConsent) {
      toast({
        title: "개인정보 동의 필요",
        description: "개인정보 수집 및 이용에 동의해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // localStorage에서 사용자 정보 가져오기
      const tempSajuData = localStorage.getItem("tempSajuData")
      const sajuData = tempSajuData ? JSON.parse(tempSajuData) : {}

      // Update with email and phone
      if (formData.email) sajuData.email = formData.email
      if (formData.phone) sajuData.phone = formData.phone

      // Save back to localStorage
      localStorage.setItem("tempSajuData", JSON.stringify(sajuData))

      // 사용자 정보 객체 생성
      const userData = {
        name: formData.name || sajuData.name || "Anonymous User",
        email: formData.email,
        phone: formData.phone,
        gender: sajuData.gender || localStorage.getItem("userGender") || "unknown",
        relationshipStatus: sajuData.relationshipStatus || "unknown",
        privacyConsent: formData.privacyConsent,
        selectedServices: ["사주 분석"],
        birthInfo: sajuData.year
          ? {
              solarYear: Number(sajuData.year),
              solarMonth: Number(sajuData.month),
              solarDay: Number(sajuData.day),
              solarHour: sajuData.hour !== undefined ? Number(sajuData.hour) : null,
              solarMinute: sajuData.minute !== undefined ? Number(sajuData.minute) : null,
              lunarYear: Number(sajuData.lunarYear || sajuData.year),
              lunarMonth: Number(sajuData.lunarMonth || sajuData.month),
              lunarDay: Number(sajuData.lunarDay || sajuData.day),
              isLeapMonth: Boolean(sajuData.isLeapMonth),
              timeUnknown: sajuData.timeUnknown || false,
            }
          : undefined,
      }

      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userData }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "베타 신청 중 오류가 발생했습니다.")
      }

      // 폭죽 효과 표시
      triggerConfetti()

      // 성공 다이얼로그 표시
      setShowSuccessDialog(true)

      // Update user ID in localStorage if available
      if (data.userId) {
        const storedData = JSON.parse(localStorage.getItem("tempSajuData") || "{}")
        storedData.userId = data.userId
        localStorage.setItem("tempSajuData", JSON.stringify(storedData))
      }

      // 폼 초기화
      setFormData({
        name: formData.name, // 이름은 유지
        email: "",
        phone: "",
        privacyConsent: false,
      })
    } catch (error: any) {
      console.error("Error submitting form:", error)
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold mb-2">더욱더 업그레이드 된 사주핑 베타 출시 예정입니다.</h2>
        <p className="text-gray-600">
          아래에 메일주소와 입력한 개인 사주정보 공유하신분 선착순 100명에게 베타버젼 무료이용권을 드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">메일주소</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="010-1234-5678"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacyConsent"
              checked={formData.privacyConsent}
              onCheckedChange={handleCheckboxChange}
              required
            />
            <div className="flex items-center">
              <Label
                htmlFor="privacyConsent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <span className="mr-1">개인정보 동의</span>
              </Label>
              <button
                type="button"
                className="text-blue-500 font-medium text-sm hover:underline focus:outline-none"
                onClick={() => setShowPrivacyDialog(true)}
              >
                [자세히 보기]
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "처리 중..." : "신청하기"}
        </Button>
      </form>

      {/* 성공 다이얼로그 */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 축하합니다! 🎉</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-2">
            <p>베타 서비스 신청이 성공적으로 완료되었습니다.</p>
            <p>서비스 출시 시 가장 먼저 알려드리겠습니다.</p>
            <p>사주핑과 함께 당신의 운명을 탐색해보세요!</p>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowSuccessDialog(false)}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 개인정보 수집·이용 동의서 다이얼로그 */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>사주핑 이용약관 및 개인정보 처리방침</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-8 text-sm">
              {/* 서비스 이용약관 */}
              <section>
                <h2 className="font-bold text-lg mb-4 text-blue-600">1. 사주핑 서비스 이용약관</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제1조 (목적)</h3>
                    <p className="leading-relaxed">
                      본 약관은 사주핑 주식회사(이하 "회사")가 운영하는 모바일 앱·웹 기반의 사주핑 서비스(이하 "서비스")
                      이용과 관련하여, 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
                      합니다.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제2조 (용어의 정의)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        "서비스"란 회사가 이용자에게 사주 기반 AI 해석, 감정케어 상담, 운세 리포트 등 콘텐츠를 제공하기
                        위해 정보통신설비를 이용하여 거래할 수 있도록 설정한 가상의 영업장을 의미하며, 해당 서비스를
                        운영하는 사업자도 포함합니다.
                      </li>
                      <li>
                        "이용자"란 회사의 서비스에 접속하여 본 약관에 따라 회사가 제공하는 콘텐츠와 제반 서비스를
                        이용하는 회원 및 비회원을 말합니다.
                      </li>
                      <li>
                        "회원"이란 본 약관에 동의하고 가입하여 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를
                        말합니다.
                      </li>
                      <li>"비회원"이란 회원 가입 없이 회사가 제공하는 서비스 일부를 이용하는 자를 말합니다.</li>
                      <li>
                        "콘텐츠"란 회사가 제공하는 서비스와 관련하여 생성·게시하는 정보, 텍스트, 이미지, 영상, 데이터
                        등을 의미합니다.
                      </li>
                      <li>
                        "유료콘텐츠"란 회사가 유료로 제공하는 프리미엄 사주 해석, 맞춤형 상담, 전문 리포트 등 콘텐츠를
                        의미합니다.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제3조 (회원가입 및 계정관리)</h3>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>
                        회원가입은 카카오, 네이버, 구글, 애플 등 제3자 소셜 로그인 또는 이메일 가입을 통해 가능합니다.
                      </li>
                      <li>
                        가입 시 필수 입력 정보: 성별, 생년월일(음·양력 여부 포함), 태어난 도시
                        <br />
                        선택 입력 정보: 태어난 시, 추가 프로필 정보
                      </li>
                      <li>"동의하고 시작하기" 버튼 클릭 시 본 약관과 개인정보 처리방침에 동의한 것으로 간주합니다.</li>
                      <li>
                        회사는 다음의 경우 회원가입을 제한하거나 해지할 수 있습니다.
                        <br />- 타인의 개인정보 도용
                        <br />- 허위 정보 입력
                        <br />- 만 14세 미만 미성년자
                        <br />- 법령 또는 서비스 정책 위반 이력
                        <br />- 기술적·운영상 현저한 지장이 예상되는 경우
                      </li>
                      <li>
                        회원은 본인 계정을 직접 관리해야 하며, 타인 사용을 허용하거나 계정 보안을 소홀히 하여 발생한
                        손해에 대해 회사는 책임지지 않습니다.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제4조 (회원의 의무)</h3>
                    <p className="mb-2">회원은 다음 행위를 하여서는 안 됩니다.</p>
                    <ul className="list-decimal list-inside space-y-1 ml-4">
                      <li>서비스 접근 방해 또는 비정상적 사용 시도</li>
                      <li>타인의 개인정보 수집·이용·제공</li>
                      <li>음란·저작권 침해·허위 정보 게시</li>
                      <li>회사 승인 없이 서비스 또는 소프트웨어 복제·변경·판매·양도</li>
                      <li>다계정 생성, 이벤트 부정참여, 포인트·사이버머니 부정사용</li>
                      <li>서비스 이용 중 타인 명예훼손, 불법·미풍양속 위반 행위</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 개인정보 처리방침 */}
              <section>
                <h2 className="font-bold text-lg mb-4 text-green-600">2. 사주핑 개인정보 처리방침</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-base mb-2">제1조 (개인정보의 수집 및 이용)</h3>
                    <p className="mb-2">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집·이용합니다.</p>
                    <ul className="list-decimal list-inside space-y-2 ml-4">
                      <li>
                        <strong>회원가입 및 서비스 이용</strong>
                        <br />- 필수항목: 이름, 성별, 음/양력 여부, 생년월일, 태어난 도시, 소셜ID
                        <br />- 선택항목: 태어난 시<br />- 보유기간: 회원 탈퇴 시까지
                      </li>
                      <li>
                        <strong>민원처리</strong>
                        <br />- 필수항목: 이메일, 문의내용, 앱 버전, 단말기 정보
                        <br />- 보유기간: 처리 완료 후 3년
                      </li>
                      <li>
                        <strong>유료서비스 결제</strong>
                        <br />- 필수항목: 결제수단 정보(카드번호, 계좌정보), 결제기록
                        <br />- 보유기간: 전자상거래법 등 관계 법령에 따른 기간
                      </li>
                      <li>
                        <strong>마케팅 및 이벤트</strong>
                        <br />- 필수항목: 이름, 성별, 접속IP, 서비스 이용기록, 기기정보, 국가정보, 쿠키, 푸시 알림 토큰
                        <br />- 보유기간: 동의 철회 또는 탈퇴 시까지
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base mb-2">제12조 (개인정보 보호책임자)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>성명: 이윤섭</li>
                      <li>이메일: yoon@sajuping.ai</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>공고일자:</strong> 2025년 8월 11일
                  <br />
                  <strong>시행일자:</strong> 2025년 8월 11일
                </p>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowPrivacyDialog(false)
                setFormData((prev) => ({ ...prev, privacyConsent: true }))
              }}
            >
              동의합니다
            </Button>
            <Button variant="outline" onClick={() => setShowPrivacyDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
