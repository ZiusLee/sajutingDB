"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SajuLogo } from "@/components/saju-logo"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CongratulationsModal } from "@/components/congratulations-modal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// 관심 서비스 옵션 - 텍스트만 수정
const interestServices = [
  {
    id: "compatibility",
    label: "정교한 궁합 해석",
    description: "두 사람의 사주를 심층 분석하여 궁합 점수와 상세한 해석을 제공합니다.",
  },
  {
    id: "love-advice",
    label: "맞춤형 연애 조언",
    description: "사주 기반으로 개인화된 연애 전략과 조언을 제공합니다.",
  },
  {
    id: "timing",
    label: "연애 시기 예측",
    description: "최적의 연애 시기와 주요해야 할 시기를 예측하여 알려드립니다.",
  },
  {
    id: "matching",
    label: "사주 기반 소개 서비스",
    description: "사주 궁합이 좋은 실제 인연을 소개해드립니다.",
  },
  // 추가된 옵션들
  {
    id: "business",
    label: "사업운 분석",
    description: "사주를 기반으로 사업 성공 가능성과 유리한 업종을 분석해 드립니다.",
  },
  {
    id: "wealth",
    label: "재물운 해석",
    description: "재물이 들어오는 시기와 효과적인 자산 관리 방법을 알려드립니다.",
  },
  {
    id: "health",
    label: "건강운 체크",
    description: "사주에 나타난 건강 취약점과 관리 방법에 대한 조언을 제공합니다.",
  },
]

// 기타 서비스 옵션
const services = [
  { id: "daily-fortune", label: "데일리 운세 뉴스레터 구독 (무료)" },
  { id: "daily-love", label: "데일리 연애운 뉴스레터 받기(무료)" },
  { id: "saju-dating", label: "사주기반 소개팅 받기 사주적 최고의 매칭이 있을때 (유료)" },
  { id: "ai-love-advice", label: "연애상담 AI 서비스 (초기무료)" },
  { id: "kakao-love-meter", label: "카톡기반 썸측정기 (무료)" },
]

export default function ActivatePage() {
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [year, setYear] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [day, setDay] = useState<string>("")
  const [time, setTime] = useState<string>("12:00")
  const [timeUnknown, setTimeUnknown] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [hasSajuData, setHasSajuData] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false)

  // 현재 연도부터 1900년까지의 연도 배열 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => (currentYear - i).toString())

  // 월 배열 생성 (01-12)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  // 일 배열 생성 (01-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  const [sajuData, setSajuData] = useState<any>(null)

  useEffect(() => {
    // Check if user came from homepage with saju data
    const tempSajuData = localStorage.getItem("tempSajuData")
    if (tempSajuData) {
      try {
        const data = JSON.parse(tempSajuData)
        console.log("Retrieved data from localStorage:", data)
        setSajuData(data)
        setHasSajuData(true)

        // 기본 정보 설정
        if (data.name) setName(data.name)

        // 생년월일 설정 - 문자열로 변환하여 설정
        if (data.year) {
          const yearStr = String(data.year)
          console.log("Setting year:", yearStr)
          setYear(yearStr)
        }

        if (data.month) {
          const monthStr = String(data.month).padStart(2, "0")
          console.log("Setting month:", monthStr)
          setMonth(monthStr)
        }

        if (data.day) {
          const dayStr = String(data.day).padStart(2, "0")
          console.log("Setting day:", dayStr)
          setDay(dayStr)
        }

        // 시간 설정
        if (data.hour !== undefined && data.minute !== undefined) {
          const timeStr = `${String(data.hour).padStart(2, "0")}:${String(data.minute).padStart(2, "0")}`
          console.log("Setting time:", timeStr)
          setTime(timeStr)
        }

        // 시간 모름 설정
        if (data.timeUnknown) {
          setTimeUnknown(true)
        }

        // 성별 설정
        if (data.gender) {
          // 성별 정보가 있으면 설정
        }
      } catch (e) {
        console.error("Error parsing saju data:", e)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Add privacy consent check
    if (!privacyConsent) {
      toast({
        title: "개인정보 동의 필요",
        description: "개인정보 수집 및 이용에 동의해주세요.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      // 로컬 스토리지에서 사주 데이터 가져오기
      const tempSajuData = localStorage.getItem("tempSajuData")
      const parsedSajuData = tempSajuData ? JSON.parse(tempSajuData) : {}

      // 사용자 데이터 준비
      const userData = {
        name,
        email,
        gender: parsedSajuData.gender || "unknown",
        relationshipStatus: parsedSajuData.relationshipStatus || "unknown",
        phone: phone || null, // 핸드폰 번호 추가
        privacyConsent: privacyConsent, // Add privacy consent field
      }

      // 핸드폰 번호를 로컬 스토리지에 저장
      if (phone) {
        parsedSajuData.phone = phone
        localStorage.setItem("tempSajuData", JSON.stringify(parsedSajuData))
      }

      // 생년월일 정보 준비
      const birthInfo = hasSajuData
        ? {
            solar_year: Number(parsedSajuData.year),
            solar_month: Number(parsedSajuData.month),
            solar_day: Number(parsedSajuData.day),
            solar_hour: parsedSajuData.hour !== undefined ? Number(parsedSajuData.hour) : null,
            solar_minute: parsedSajuData.minute !== undefined ? Number(parsedSajuData.minute) : null,
            lunar_year: Number(parsedSajuData.lunarYear || parsedSajuData.year),
            lunar_month: Number(parsedSajuData.lunarMonth || parsedSajuData.month),
            lunar_day: Number(parsedSajuData.lunarDay || parsedSajuData.day),
            is_leap_month: Boolean(parsedSajuData.isLeapMonth),
            time_unknown: Boolean(parsedSajuData.timeUnknown),
          }
        : {
            solar_year: Number(year),
            solar_month: Number(month),
            solar_day: Number(day),
            solar_hour: timeUnknown ? null : Number(time.split(":")[0]),
            solar_minute: timeUnknown ? null : Number(time.split(":")[1]),
            lunar_year: Number(year), // 간단한 예시로 양력과 동일하게 설정
            lunar_month: Number(month),
            lunar_day: Number(day),
            is_leap_month: false,
            time_unknown: timeUnknown,
          }

      // 사주 정보 준비 (있는 경우)
      let sajuInfo = null
      if (parsedSajuData.yearStem && parsedSajuData.yearBranch) {
        sajuInfo = {
          year_stem: parsedSajuData.yearStem,
          year_branch: parsedSajuData.yearBranch,
          year_stem_hanja: parsedSajuData.yearStemHanja || "",
          year_branch_hanja: parsedSajuData.yearBranchHanja || "",
          month_stem: parsedSajuData.monthStem,
          month_branch: parsedSajuData.monthBranch,
          month_stem_hanja: parsedSajuData.monthStemHanja || "",
          month_branch_hanja: parsedSajuData.monthBranchHanja || "",
          day_stem: parsedSajuData.dayStem,
          day_branch: parsedSajuData.dayBranch,
          day_stem_hanja: parsedSajuData.dayStemHanja || "",
          day_branch_hanja: parsedSajuData.dayBranchHanja || "",
          hour_stem: parsedSajuData.hourStem || "?",
          hour_branch: parsedSajuData.hourBranch || "?",
          hour_stem_hanja: parsedSajuData.hourStemHanja || "",
          hour_branch_hanja: parsedSajuData.hourBranchHanja || "",
          day_master: parsedSajuData.dayMaster || parsedSajuData.dayStem,
          day_master_hanja: parsedSajuData.dayMasterHanja || "",
          year_animal: parsedSajuData.yearAnimal || "",
        }
      }

      // 오행 정보 준비 (있는 경우)
      let elements = null
      if (parsedSajuData.elements) {
        elements = {
          wood: parsedSajuData.elements.wood || 0,
          fire: parsedSajuData.elements.fire || 0,
          earth: parsedSajuData.elements.earth || 0,
          metal: parsedSajuData.elements.metal || 0,
          water: parsedSajuData.elements.water || 0,
        }
      }

      // 해석 정보 준비 (있는 경우)
      let interpretation = null
      if (parsedSajuData.sajuInterpretation) {
        interpretation = {
          basic_interpretation: parsedSajuData.sajuInterpretation,
          model_used: parsedSajuData.model || "unknown",
          response_time: parsedSajuData.responseTime || "unknown",
        }
      }

      // API 호출
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userData,
          birthInfo,
          sajuInfo,
          elements,
          interpretation,
          selectedServices,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "베타 신청 중 오류가 발생했습니다.")
      }

      console.log("Beta signup successful:", result)

      // 성공 메시지 표시
      toast({
        title: "베타 서비스 신청 완료",
        description: "베타 서비스 신청이 성공적으로 완료되었습니다.",
      })

      // 축하 모달 표시
      setShowCongratulations(true)

      // 사용자 ID를 로컬 스토리지에 저장
      if (result.userId && tempSajuData) {
        const updatedSajuData = JSON.parse(tempSajuData)
        updatedSajuData.userId = result.userId
        localStorage.setItem("tempSajuData", JSON.stringify(updatedSajuData))
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "베타 신청 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <SajuLogo size="md" />
          </div>
          <CardTitle className="text-2xl">베타 액세스 신청</CardTitle>
          <CardDescription>사주팔자 정보와 함께 베타 서비스에 가입하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 사주 정보 표시 (이전 페이지에서 넘어온 경우) */}
          {hasSajuData && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium mb-3">사주 정보</h2>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">이름:</span>
                    <span>{sajuData.name || "미입력"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">생년월일:</span>
                    <span>
                      {sajuData.year}년 {sajuData.month}월 {sajuData.day}일
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-muted-foreground">시간:</span>
                    <span>
                      {sajuData.timeUnknown ? "시간 미상" : `${sajuData.hour || 0}시 ${sajuData.minute || 0}분`}
                    </span>
                  </div>
                  {sajuData.gender && (
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">성별:</span>
                      <span>{sajuData.gender === "male" ? "남성" : "여성"}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">이름</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div>
                <Label htmlFor="email">이메일 주소</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              {/* 핸드폰 번호 입력 필드 추가 */}
              <div>
                <Label htmlFor="phone">핸드폰 번호</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  베타 서비스 관련 안내를 받으실 핸드폰 번호를 입력하세요.
                </p>
              </div>

              {!hasSajuData && (
                <>
                  <div className="space-y-2">
                    <Label>생년월일</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="연도" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}년
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger>
                          <SelectValue placeholder="월" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m} value={m}>
                              {Number.parseInt(m)}월
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={day} onValueChange={setDay}>
                        <SelectTrigger>
                          <SelectValue placeholder="일" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((d) => (
                            <SelectItem key={d} value={d}>
                              {Number.parseInt(d)}일
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="birthtime" className={`${timeUnknown ? "text-muted-foreground" : ""}`}>
                        태어난 시간
                      </Label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="timeUnknown"
                          checked={timeUnknown}
                          onChange={(e) => setTimeUnknown(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <Label htmlFor="timeUnknown" className="text-sm font-normal cursor-pointer">
                          시간 모름
                        </Label>
                      </div>
                    </div>
                    <Input
                      id="birthtime"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full"
                      disabled={timeUnknown}
                    />
                    <p className="text-xs text-muted-foreground">
                      24시간 형식으로 입력하세요. 예) 오후 11시 30분 → 23:30
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <Label>관심 서비스 *</Label>
                {interestServices.map((service) => (
                  <div key={service.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        setSelectedServices((prev) =>
                          checked ? [...prev, service.id] : prev.filter((id) => id !== service.id),
                        )
                      }}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={service.id} className="text-sm font-medium">
                        {service.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacyConsent"
                  checked={privacyConsent}
                  onCheckedChange={(checked) => setPrivacyConsent(checked === true)}
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "처리 중..." : "베타 액세스 신청하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Toaster />
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => {
          setShowCongratulations(false)
          // Redirect to homepage after closing the modal
          router.push("/")
        }}
      />
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
                setPrivacyConsent(true)
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
    </div>
  )
}
