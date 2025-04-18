"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Sparkles } from "lucide-react"
import Link from "next/link"

export default function BetaSignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const services = [
    {
      id: "detailed-compatibility",
      label: "정교한 궁합 해석",
      description: "두 사람의 사주를 심층 분석하여 궁합 점수와 상세한 해석을 제공합니다.",
    },
    {
      id: "dating-advice",
      label: "맞춤형 연애 조언",
      description: "사주 기반으로 개인화된 연애 전략과 조언을 제공합니다.",
    },
    {
      id: "timing-prediction",
      label: "연애 시기 예측",
      description: "최적의 연애 시기와 주의해야 할 시기를 예측하여 알려드립니다.",
    },
    {
      id: "saju-matching",
      label: "사주 기반 소개 서비스",
      description: "사주 궁합이 좋은 실제 인연을 소개해드립니다.",
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || selectedServices.length === 0) {
      toast({
        title: "필수 정보 누락",
        description: "이름과 최소 하나의 서비스를 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 로컬 스토리지에서 사주 데이터 가져오기
      const tempSajuData = localStorage.getItem("tempSajuData")
      const sajuData = tempSajuData ? JSON.parse(tempSajuData) : {}

      // 핸드폰 번호를 로컬 스토리지에 저장
      if (phone) {
        sajuData.phone = phone
        localStorage.setItem("tempSajuData", JSON.stringify(sajuData))
      }

      // 베타 신청 정보 추가
      const userData = {
        name,
        email,
        gender: sajuData.gender || "unknown",
        relationshipStatus: sajuData.relationshipStatus || "unknown",
        phone: phone || null, // 핸드폰 번호 추가
      }

      // API 호출하여 베타 신청 정보 저장
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userData,
          birthInfo: sajuData.year
            ? {
                solarYear: Number(sajuData.year),
                solarMonth: Number(sajuData.month),
                solarDay: Number(sajuData.day),
                solarHour: sajuData.hour ? Number(sajuData.hour) : null,
                solarMinute: sajuData.minute ? Number(sajuData.minute) : null,
                lunarYear: Number(sajuData.lunarYear || sajuData.year),
                lunarMonth: Number(sajuData.lunarMonth || sajuData.month),
                lunarDay: Number(sajuData.lunarDay || sajuData.day),
                isLeapMonth: Boolean(sajuData.isLeapMonth),
                timeUnknown: sajuData.timeUnknown,
              }
            : null,
          sajuInfo: sajuData.yearStem
            ? {
                yearStem: sajuData.yearStem,
                yearBranch: sajuData.yearBranch,
                yearStemHanja: sajuData.yearStemHanja || "",
                yearBranchHanja: sajuData.yearBranchHanja || "",
                monthStem: sajuData.monthStem,
                monthBranch: sajuData.monthBranch,
                monthStemHanja: sajuData.monthStemHanja || "",
                monthBranchHanja: sajuData.monthBranchHanja || "",
                dayStem: sajuData.dayStem,
                dayBranch: sajuData.dayBranch,
                dayStemHanja: sajuData.dayStemHanja || "",
                dayBranchHanja: sajuData.dayBranchHanja || "",
                hourStem: sajuData.hourStem || "?",
                hourBranch: sajuData.hourBranch || "?",
                hourStemHanja: sajuData.hourStemHanja || "",
                hourBranchHanja: sajuData.hourBranchHanja || "",
                dayMaster: sajuData.dayMaster || sajuData.dayStem,
                dayMasterHanja: sajuData.dayMasterHanja || "",
                yearAnimal: sajuData.yearAnimal || "",
              }
            : null,
          elements: sajuData.elements,
          interpretation: sajuData.sajuInterpretation
            ? {
                basicInterpretation: sajuData.sajuInterpretation,
                modelUsed: sajuData.model || "unknown",
                responseTime: sajuData.responseTime || "unknown",
              }
            : null,
          selectedServices,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "베타 신청에 실패했습니다.")
      }

      // 성공 시 활성화 페이지로 이동
      router.push("/activate?success=true")
    } catch (error) {
      console.error("Error submitting beta application:", error)
      toast({
        title: "베타 신청 오류",
        description: error instanceof Error ? error.message : "베타 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-center text-2xl">베타��비스 신청</CardTitle>
          </div>
          <CardDescription className="text-center">
            사주핑의 프리미엄 베타서비스에 참여하고 더 정교한 사주 해석과 맞춤형 연애 조언을 받아보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 베타서비스 설명 추가 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 p-4 rounded-lg border border-purple-100 dark:border-purple-800 mb-6">
            <h3 className="font-medium text-base mb-2">베타서비스 특별 혜택</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1.5">
              <li>베타 테스터 전용 프리미엄 기능 무료 이용</li>
              <li>정식 출시 전 서비스 먼저 경험하기</li>
              <li>서비스 개선에 참여하고 의견 반영</li>
              <li>정식 출시 시 특별 할인 혜택</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                />
                <p className="text-xs text-muted-foreground">베타서비스 소식을 받아보실 이메일을 입력하세요.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                />
                <p className="text-xs text-muted-foreground">베타서비스 관련 안내를 받으실 전화번호를 입력하세요.</p>
              </div>

              <div className="space-y-3">
                <Label>관심 서비스 *</Label>
                <div className="space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id])
                          } else {
                            setSelectedServices(selectedServices.filter((id) => id !== service.id))
                          }
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor={service.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {service.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    신청 중...
                  </>
                ) : (
                  "베타서비스 신청하기"
                )}
              </Button>

              <Button asChild variant="outline" className="w-full">
                <Link href="/">돌아가기</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
