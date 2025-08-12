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
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>개인정보 수집·이용 동의서</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>[사주핑]은 다음과 같이 개인정보를 수집 및 이용합니다.</p>
            <p>
              고객님의 개인정보는 사주 분석 및 상담 서비스를 위한 용도로만 사용되며, 동의 없이는 절대 제3자에게 제공되지
              않습니다.
            </p>

            <div>
              <h3 className="font-bold mb-1">1. 수집하는 개인정보 항목</h3>
              <p>필수 항목: 이름, 생년월일(양력/음력 구분 포함), 성별, 이메일, 전화번호</p>
              <p>선택 항목: 태어난 시간, 출생지(도시/지역 단위), 카카오톡 ID 또는 상담 채널 아이디</p>
            </div>

            <div>
              <h3 className="font-bold mb-1">2. 수집 및 이용 목적</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>사주 및 운세 분석을 통한 개인 맞춤형 연애 상담 서비스 제공</li>
                <li>고객 맞춤 리포트 제공 및 콘텐츠 발송</li>
                <li>고객 응대 및 상담 진행</li>
                <li>이벤트 안내 및 소통(선택 항목 활용 시)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-1">3. 보유 및 이용 기간</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>수집일로부터 1년간 보관 후 파기</li>
                <li>고객이 삭제 요청 시 즉시 파기 가능</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-1">4. 동의 거부 권리 안내</h3>
              <p>위 개인정보 제공에 동의하지 않으실 수 있습니다.</p>
              <p>단, 동의하지 않으실 경우 서비스 이용이 제한될 수 있습니다.</p>
            </div>

            <p className="font-medium">위 내용을 충분히 이해하였으며, 개인정보 수집 및 이용에 동의합니다.</p>
          </div>
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
