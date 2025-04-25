"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { MessageSquare } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import type { Saju } from "@/lib/saju"
import SajuDiagram from "./saju-diagram"
import { getSajuInterpretation } from "@/lib/api-client"
import FeedbackButtons from "./feedback-buttons"
import { Progress } from "@/components/ui/progress"
import AdditionalQuestions from "./additional-questions"
// 추가: useSearchParams 임포트
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"

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
}: SajuResultClientProps) {
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingStage, setLoadingStage] = useState("사주 분석 준비")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessages, setLoadingMessages] = useState<string[]>([])
  const loadingAnimationRef = useRef<NodeJS.Timeout | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  // 컴포넌트 내부에서 searchParams 사용
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => {
    // URL 파라미터에서 탭 정보를 읽어옴
    const tabParam = searchParams.get("tab")
    return tabParam === "interpretation" ? "interpretation" : "diagram"
  })
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

  // 모바일 감지
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640)
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
      } else {
        setInterpretation(result.interpretation)
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
    // Prepare saju data for the chat list
    const sajuData = JSON.stringify(saju)

    // Navigate to chat list with all necessary parameters
    router.push(
      `/chat-list?saju=${encodeURIComponent(sajuData)}&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(normalizedGender || "")}&interpretation=${encodeURIComponent(interpretation || "")}&returnPath=/result`,
    )
  }

  // 이미지 오류 처리 함수
  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-xl font-bold">사주 결과 {name ? `- ${name}님` : ""}</h2>
      </div>

      {isMobile ? (
        <div className="sm:hidden">
          <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="flex border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setActiveTab("diagram")}
                className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                  activeTab === "diagram"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                사주 도표
              </button>
              <button
                onClick={() => setActiveTab("interpretation")}
                className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                  activeTab === "interpretation"
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                나의 총운 리포트
              </button>
            </div>

            {activeTab === "diagram" && (
              <div className="p-3">
                <h3 className="text-base font-medium mb-2">사주 도표</h3>
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

                {/* Add chat button to diagram tab - Mobile */}
                <div className="mt-6">
                  <Button className="w-full flex items-center justify-center gap-2" onClick={navigateToChatList}>
                    <MessageSquare className="h-4 w-4" />
                    <span>사주 채팅 상담 시작하기</span>
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "interpretation" && (
              <div className="p-3">
                <h3 className="text-base font-medium mb-2">나의 총운 리포트</h3>

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
                      <p className="text-xs text-center mt-1 text-muted-foreground">
                        {loadingProgress.toFixed(0)}% 완료
                      </p>
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
                    <Button onClick={fetchInterpretation} className="mt-3" variant="outline" size="sm">
                      다시 시도
                    </Button>
                  </div>
                )}

                {interpretation && !isLoading && (
                  <div className="space-y-3">
                    <div className="markdown-content text-sm prose dark:prose-invert max-w-none">
                      <ReactMarkdown>{interpretation}</ReactMarkdown>
                    </div>
                    <Separator className="my-3" />
                    <FeedbackButtons contentType="saju-interpretation" contentId={saju.dayStem + saju.dayBranch} />

                    {/* Add chat button to interpretation tab - Mobile */}
                    <Button className="w-full flex items-center justify-center gap-2 mt-4" onClick={navigateToChatList}>
                      <MessageSquare className="h-4 w-4" />
                      <span>사주 채팅 상담 시작하기</span>
                    </Button>

                    {/* 추가 질문 섹션 - 모바일 */}
                    <div id="additional-questions-mobile" className="mt-6">
                      <AdditionalQuestions
                        saju={saju}
                        name={name}
                        gender={normalizedGender}
                        model={model}
                        relationshipStatus={relationshipStatus}
                        interpretation={interpretation}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagram" data-value="diagram">
              사주 도표
            </TabsTrigger>
            <TabsTrigger value="interpretation" data-value="interpretation">
              나의 총운 리포트
            </TabsTrigger>
          </TabsList>
          <TabsContent value="diagram" className="mt-4">
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

                {/* Add chat button to diagram tab - Desktop */}
                <div className="mt-6">
                  <Button className="w-full flex items-center justify-center gap-2" onClick={navigateToChatList}>
                    <MessageSquare className="h-4 w-4" />
                    <span>사주 채팅 상담 시작하기</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="interpretation" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {!interpretation && !isLoading && !error && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <p className="text-center text-muted-foreground">AI를 통한 나의 총운 리포트를 받아보세요.</p>
                    <Button onClick={fetchInterpretation}>총운 리포트 받기</Button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="animate-float">
                      {imageError ? (
                        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-primary text-2xl">🔮</span>
                        </div>
                      ) : (
                        <Image
                          src="/images/sajuping_character.png"
                          alt="사주핑 캐릭터"
                          width={100}
                          height={100}
                          className="opacity-90"
                          onError={handleImageError}
                        />
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-medium text-primary">{loadingStage}</p>
                      <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
                    </div>
                    <div className="w-full max-w-md mt-2">
                      <Progress value={loadingProgress} className="h-2" />
                      <p className="text-xs text-center mt-1 text-muted-foreground">
                        {loadingProgress.toFixed(0)}% 완료
                      </p>
                    </div>
                    <div className="w-full max-w-md mt-2 bg-muted/30 rounded-md p-3 h-32 overflow-y-auto">
                      <div className="space-y-1.5 text-sm">
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
                    <Button onClick={fetchInterpretation} className="mt-4" variant="outline">
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

                    {/* Add chat button to interpretation tab - Desktop */}
                    <Button className="w-full flex items-center justify-center gap-2 mt-4" onClick={navigateToChatList}>
                      <MessageSquare className="h-4 w-4" />
                      <span>사주 채팅 상담 시작하기</span>
                    </Button>

                    <div id="additional-questions">
                      <AdditionalQuestions
                        saju={saju}
                        name={name}
                        gender={normalizedGender}
                        model={model}
                        relationshipStatus={relationshipStatus}
                        interpretation={interpretation} // 기존 해석 전달
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
