"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import type { Saju } from "@/lib/saju"
import SajuDiagram from "./saju-diagram"
import { getSajuInterpretation } from "@/lib/api-client"
import FeedbackButtons from "./feedback-buttons"
import { Progress } from "@/components/ui/progress"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import DaeunDiagram from "./daeun-diagram"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"

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
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingStage, setLoadingStage] = useState("사주 분석 준비")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessages, setLoadingMessages] = useState<string[]>([])
  const loadingAnimationRef = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [questionSet, setQuestionSet] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const { toast } = useToast()

  // 성별 정보 정규화
  const normalizedGender =
    gender === "male" || gender === "남성" || gender === "남자"
      ? "male"
      : gender === "female" || gender === "여성" || gender === "여자"
        ? "female"
        : ""

  // Generate a unique key for this saju to use in localStorage
  const sajuKey = `${saju.yearStem}${saju.yearBranch}${saju.monthStem}${saju.monthBranch}${saju.dayStem}${saju.dayBranch}${saju.hourStem || ""}${saju.hourBranch || ""}`
  const storageKey = `saju_interpretation_${sajuKey}`

  // Calculate daeun info
  const daeunInfo =
    solarYear && solarMonth && solarDay
      ? calculateDaeunInfo(
          saju,
          Number.parseInt(solarYear),
          Number.parseInt(solarMonth),
          Number.parseInt(solarDay),
          normalizedGender,
        )
      : null

  // 모바일 감지
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Check for stored interpretation on mount
  useEffect(() => {
    const storedInterpretation = localStorage.getItem(storageKey)
    if (storedInterpretation && !interpretation) {
      setInterpretation(storedInterpretation)
    }
  }, [storageKey, interpretation])

  // Add a new useEffect to auto-fetch interpretation
  useEffect(() => {
    // Check if we should auto-fetch the interpretation
    const shouldAutoFetch = localStorage.getItem("autoFetchInterpretation") === "true"

    if (shouldAutoFetch && !interpretation && !isLoading) {
      // Clear the flag so it doesn't auto-fetch on subsequent visits
      localStorage.removeItem("autoFetchInterpretation")

      // Trigger the interpretation fetch
      fetchInterpretation()
    }
  }, [interpretation, isLoading])

  const fetchInterpretation = async () => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)
    setLoadingStage("사주 분석 준비")
    setLoadingMessages([])

    // 로딩 메시지 배열
    const loadingStages = [
      "사주 정보 확인 중...",
      "사주팔자 분석 시작...",
      "십성(十星) 분석 중...",
      "일간(日干) 분석 중...",
      "월지(月支) 확인 중...",
      "오행(五行) 분석 중...",
      "육친(六親) 관계 분석 중...",
      "대운(大運) 계산 중...",
      "신살(神殺) 확인 중...",
      "사주 격국(格局) 분석 중...",
      "명주(命主) 분석 중...",
      "재성(財星) 분석 중...",
      "관성(官星) 분석 중...",
      "인성(印星) 분석 중...",
      "식상(食傷) 분석 중...",
      "비견(比肩) 분석 중...",
      "사주 통합 분석 중...",
      "운세 해석 생성 중...",
      "최종 결과 정리 중...",
    ]

    // 메시지 추가 함수
    const addLoadingMessage = (message: string) => {
      setLoadingMessages((prev) => [...prev.slice(-4), message]) // 최대 5개 메시지만 유지
    }

    // 초기 메시지 추가
    addLoadingMessage("사주 분석을 시작합니다...")

    // 60초 동안 진행되는 로딩 바
    const totalDuration = 60000 // 60초
    const updateInterval = 500 // 0.5초마다 업데이트
    const progressIncrement = (updateInterval / totalDuration) * 100
    const messageInterval = 3000 // 3초마다 메시지 변경

    let lastMessageTime = Date.now()
    let currentMessageIndex = 0

    const loadingInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + progressIncrement

        // 진행 단계에 따라 메시지 업데이트
        if (newProgress >= 20 && newProgress < 40) {
          setLoadingStage("사주 정보 분석 중")
        } else if (newProgress >= 40 && newProgress < 70) {
          setLoadingStage("운세 해석 생성 중")
        } else if (newProgress >= 70) {
          setLoadingStage("결과 정리 중")
        }

        // 주기적으로 메시지 추가
        const now = Date.now()
        if (now - lastMessageTime > messageInterval) {
          lastMessageTime = now
          const message = loadingStages[currentMessageIndex % loadingStages.length]
          addLoadingMessage(message)
          currentMessageIndex++
        }

        return Math.min(newProgress, 95) // 최대 95%까지만 진행 (API 응답 전)
      })
    }, updateInterval)

    loadingAnimationRef.current = loadingInterval

    try {
      const result = await getSajuInterpretation(saju, name, normalizedGender, relationshipStatus, questionSet)

      // 폴백 해석이 있는 경우 처리
      if (result.fallbackInterpretation) {
        setInterpretation(result.fallbackInterpretation)
        toast({
          title: "사주 해석 제한 시간 초과",
          description: "기본 해석으로 대체되었습니다. 잠시 후 다시 시도해주세요.",
          variant: "destructive",
        })
      } else if (result.interpretation) {
        setInterpretation(result.interpretation)
      } else {
        // No interpretation found
        throw new Error("사주 해석 결과를 받지 못했습니다.")
      }

      // Store the interpretation in localStorage
      if (result.interpretation || result.fallbackInterpretation) {
        localStorage.setItem(storageKey, result.interpretation || result.fallbackInterpretation)
      }

      setLoadingProgress(100) // 완료 시 100%로 설정
      addLoadingMessage("분석 완료! 결과를 표시합니다.")
    } catch (err) {
      console.error("Error fetching interpretation:", err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")

      // 오류 발생 시 사용자에게 알림
      toast({
        title: "사주 해석 오류",
        description: "서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      if (loadingAnimationRef.current) {
        clearInterval(loadingAnimationRef.current)
        loadingAnimationRef.current = null
      }
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (loadingAnimationRef.current) {
        clearInterval(loadingAnimationRef.current)
      }
    }
  }, [])

  const handleCopyClick = () => {
    if (!interpretation) return

    // 사주 정보 텍스트 구성
    const sajuInfo = `
사주 정보:
${timeUnknown ? "시간 미상" : ""}
양력: ${solarYear}년 ${solarMonth}월 ${solarDay}일 ${hour ? `${hour}시 ${minute}분` : ""}
음력: ${lunarYear}년 ${lunarMonth}월 ${lunarDay}일
천간: ${saju.yearStem} ${saju.monthStem} ${saju.dayStem} ${saju.hourStem || ""}
지지: ${saju.yearBranch} ${saju.monthBranch} ${saju.dayBranch} ${saju.hourBranch || ""}

사주 해석:
${interpretation}
`

    navigator.clipboard.writeText(sajuInfo.trim())
    toast({
      title: "복사 완료",
      description: "사주 정보가 클립보드에 복사되었습니다.",
    })
  }

  // 채팅방 목록으로 이동
  const navigateToChatList = () => {
    // 사주 데이터를 로컬 스토리지에 저장
    const sajuData = {
      saju: saju,
      name: name || "사용자",
      gender: normalizedGender || "male",
      interpretation: interpretation || "",
      birthInfo: {
        solarYear: Number.parseInt(solarYear),
        solarMonth: Number.parseInt(solarMonth),
        solarDay: Number.parseInt(solarDay),
        solarHour: Number.parseInt(hour || "12"),
        solarMinute: Number.parseInt(minute || "0"),
        timeUnknown: timeUnknown,
      },
    }

    localStorage.setItem("current_saju", JSON.stringify(sajuData))

    // 바로 사주핑 채팅방으로 이동
    router.push("/saju-chat/sajuping")
  }

  // 이미지 오류 처리 함수
  const handleImageError = () => {
    setImageError(true)
  }

  const sajuParam = JSON.stringify(saju)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl font-bold">사주 결과 {name ? `- ${name}님` : ""}</h2>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Desktop: Side by side layout */}
          {!isMobile ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                variant="chat"
              />

              {daeunInfo && (
                <DaeunDiagram
                  daeun={daeunInfo.pillars}
                  birthInfo={{
                    solarYear: Number.parseInt(solarYear),
                    solarMonth: Number.parseInt(solarMonth),
                    solarDay: Number.parseInt(solarDay),
                    solarHour: Number.parseInt(hour || "12"),
                    solarMinute: Number.parseInt(minute || "0"),
                    timeUnknown: timeUnknown,
                  }}
                  name={name}
                  gender={normalizedGender}
                />
              )}
            </div>
          ) : (
            /* Mobile: Stacked layout */
            <div className="space-y-6">
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
                variant="card"
              />

              {daeunInfo && (
                <DaeunDiagram
                  daeun={daeunInfo.pillars}
                  birthInfo={{
                    solarYear: Number.parseInt(solarYear),
                    solarMonth: Number.parseInt(solarMonth),
                    solarDay: Number.parseInt(solarDay),
                    solarHour: Number.parseInt(hour || "12"),
                    solarMinute: Number.parseInt(minute || "0"),
                    timeUnknown: timeUnknown,
                  }}
                  name={name}
                  gender={normalizedGender}
                />
              )}
            </div>
          )}

          {/* 총운 리포트 섹션 */}
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">나의 총운 리포트</h3>

            {!interpretation && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <p className="text-center text-muted-foreground">AI를 통한 나의 총운 리포트를 받아보세요.</p>
                <Button onClick={fetchInterpretation}>총운 리포트 받기</Button>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="animate-float">
                  {imageError ? (
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xl">🔮</span>
                    </div>
                  ) : (
                    <Image
                      src="/images/sajuping_character.png"
                      alt="사주핑 캐릭터"
                      width={80}
                      height={80}
                      className="opacity-90"
                      onError={handleImageError}
                    />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="font-medium text-primary">{loadingStage}</p>
                  <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
                </div>
                <div className="w-full max-w-xs mt-1">
                  <Progress value={loadingProgress} className="h-1.5" />
                  <p className="text-xs text-center mt-1 text-muted-foreground">{loadingProgress.toFixed(0)}% 완료</p>
                </div>
                <div className="w-full max-w-xs mt-2 bg-muted/30 rounded-md p-2 h-24 overflow-y-auto">
                  <div className="space-y-1 text-xs">
                    {loadingMessages.map((message, index) => (
                      <p key={index} className="text-muted-foreground">
                        {message}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-500 text-center py-4">
                <p>오류가 발생했습니다: {error}</p>
                <Button onClick={fetchInterpretation} className="mt-3 bg-transparent" variant="outline" size="sm">
                  다시 시도
                </Button>
              </div>
            )}

            {interpretation && !isLoading && (
              <div className="space-y-4">
                <div className="markdown-content prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{interpretation}</ReactMarkdown>
                </div>
                <Separator className="my-4" />
                <FeedbackButtons contentType="saju-interpretation" contentId={saju.dayStem + saju.dayBranch} />

                {/* Donation Section */}
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg shadow-sm">
                  <div className="flex flex-col items-center">
                    <h3 className="text-xl font-bold mb-3">복채 주면 운이 더 ��아진다냥!</h3>
                    <img src="/images/donation-cat.png" alt="복채 고양이" className="w-32 h-32 object-contain mb-3" />
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
              </div>
            )}
          </div>

          {/* 채팅 버튼 */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button className="flex-1 flex items-center justify-center gap-2" onClick={navigateToChatList}>
              <MessageSquare className="h-4 w-4" />
              <span>사주 채팅 상담 시작하기</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
