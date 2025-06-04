"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Saju } from "@/lib/saju"
import SajuDiagram from "./saju-diagram"
// 추가: useSearchParams 임포트
import { useRouter } from "next/navigation"
import { saveRecentSajuProfile } from "@/lib/saju-storage"
import DaeunDiagram from "./daeun-diagram"

interface SajuResultClientProps {
  saju: Saju
  timeUnknown?: boolean
  solarYear?: string
  solarMonth?: string
  solarDay?: string
  hour?: string
  minute?: string
  lunarYear?: string
  lunarMonth?: string
  lunarDay?: string
  name?: string
  gender?: string
  model?: string
  relationshipStatus?: string
  location?: string
  uuid?: string
}

export default function SajuResultClient({
  saju,
  timeUnknown = false,
  solarYear = "",
  solarMonth = "",
  solarDay = "",
  hour = "",
  minute = "",
  lunarYear = "",
  lunarMonth = "",
  lunarDay = "",
  name = "",
  gender = "",
  model = "",
  relationshipStatus = "",
  location = "서울특별시",
  uuid = "",
}: SajuResultClientProps) {
  const [imageError, setImageError] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // 성별 정보 정규화
  const normalizedGender =
    gender === "male" || gender === "남성" || gender === "남자"
      ? "male"
      : gender === "female" || gender === "여성" || gender === "여자"
        ? "female"
        : ""

  // 사주 결과를 볼 때 최근 본 사주로 저장
  useEffect(() => {
    if (saju && name) {
      // 현재 보고 있는 사주를 최근 본 사주로 저장
      const currentProfile = {
        id: uuid || `temp-${Date.now()}`,
        name,
        gender: normalizedGender,
        birthYear: solarYear,
        birthMonth: solarMonth,
        birthDay: solarDay,
        birthHour: hour,
        birthMinute: minute,
        timeUnknown,
        lunarYear,
        lunarMonth,
        lunarDay,
        createdAt: new Date().toISOString(),
        saju: {
          yearStem: saju.yearStem,
          yearBranch: saju.yearBranch,
          monthStem: saju.monthStem,
          monthBranch: saju.dayBranch,
          dayStem: saju.dayStem,
          hourStem: saju.hourStem,
          hourBranch: saju.hourBranch,
          elements: saju.elements || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 },
        },
      }

      saveRecentSajuProfile(currentProfile)
      console.log("현재 사주를 최근 본 사주로 저장했습니다:", name)
    }
  }, [
    saju,
    name,
    normalizedGender,
    solarYear,
    solarMonth,
    solarDay,
    hour,
    minute,
    timeUnknown,
    lunarYear,
    lunarMonth,
    lunarDay,
    uuid,
  ])

  // AI 상담 시작하기 버튼 클릭 핸들러
  const handleStartAIConsultation = () => {
    // 사주 데이터를 준비
    const sajuData = JSON.stringify(saju)

    // 사주핑 채팅으로 바로 이동
    router.push(
      `/saju-chat/sajuping?saju=${encodeURIComponent(sajuData)}&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(normalizedGender || "")}&interpretation=${encodeURIComponent("")}&returnPath=/result`,
    )
  }

  // 이미지 오류 처리 함수
  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl font-bold">사주 결과 {name ? `- ${name}님` : ""}</h2>
      </div>

      <Card>
        <CardContent className="p-4">
          <SajuDiagram
            saju={saju}
            timeUnknown={timeUnknown}
            name={name}
            gender={normalizedGender}
            solarYear={solarYear}
            solarMonth={solarMonth}
            solarDay={solarDay}
            hour={hour}
            minute={minute}
            lunarYear={lunarYear}
            lunarMonth={lunarMonth}
            lunarDay={lunarDay}
            location={location}
          />

          {/* AI 상담 시작 섹션 */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">🔮 사주핑과 AI 상담하기</h3>

            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="animate-float">
                {imageError ? (
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary text-4xl">🔮</span>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary text-4xl">🔮</span>
                  </div>
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium text-primary">안녕하세요! 저는 사주핑이에요 🌟</p>
                <p className="text-sm text-muted-foreground">
                  {name ? `${name}님의` : "당신의"} 사주를 바탕으로 인생의 모든 영역에 대해 상담해드릴게요!
                </p>
                <p className="text-xs text-muted-foreground">
                  직업운, 연애운, 건강운, 재물운 등 궁금한 모든 것을 물어보세요.
                </p>
              </div>
              <Button onClick={handleStartAIConsultation} size="lg" className="mt-4">
                <MessageSquare className="h-4 w-4 mr-2" />
                AI 상담 시작하기
              </Button>
            </div>
          </div>

          {/* 대운 다이어그램 */}
          <div className="mt-8">
            <DaeunDiagram
              saju={saju}
              gender={normalizedGender}
              solarYear={solarYear}
              solarMonth={solarMonth}
              solarDay={solarDay}
              hour={hour}
              minute={minute}
              timeUnknown={timeUnknown}
            />
          </div>

          {/* Donation Section */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg shadow-sm">
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-bold mb-3">복채 주면 운이 더 좋아진다냥!</h3>
              <div className="w-32 h-32 flex items-center justify-center mb-3">
                <span className="text-6xl">🐱</span>
              </div>
              <div className="text-center space-y-1 text-xs dark:text-gray-200">
                <p>사주 다 보고 나면,오늘 운이 조금 더 잘 풀렸으면 좋겠다냥~ 🐾</p>
                <p>복채를 살짝 내면, 진짜 조~용히 복 하나가 따라붙는다냥. 🎁</p>
                <p>아무도 모르게, 딱! 오늘 하루, 좋은 기운이 너랑 함께할 거다냥! 🍀😽</p>
                <div className="mt-3 font-medium text-sm">
                  <p className="text-base">토스뱅크</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("1001-8576-5363")
                        const copyBtn = document.getElementById("copy-account-btn-mobile")
                        if (copyBtn) {
                          copyBtn.classList.add("text-green-600")
                          copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>`
                          setTimeout(() => {
                            copyBtn.classList.remove("text-green-600")
                            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`
                          }, 2000)
                        }
                        toast({
                          title: "계좌번호 복사 완료",
                          description: "계좌번호가 클립보드에 복사되었습니다.",
                        })
                      }}
                      className="text-base font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                      aria-label="계좌번호 복사"
                    >
                      1001-8576-5363
                      <span id="copy-account-btn-mobile" className="ml-1 inline-flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-copy"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </span>
                    </button>
                  </div>
                  <p className="text-base mt-1">사주핑 (선현국)</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
