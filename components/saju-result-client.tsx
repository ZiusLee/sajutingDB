"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2, MessageSquare } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import ReactMarkdown from "react-markdown"
import type { Saju } from "@/lib/saju"
import SajuDiagram from "./saju-diagram"
import { getSajuInterpretation } from "@/lib/api-client"
import FeedbackButtons from "./feedback-buttons"
import { Progress } from "@/components/ui/progress"
import AdditionalQuestions from "./additional-questions"
import { useRouter } from "next/navigation"

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
}: SajuResultClientProps) {
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingStage, setLoadingStage] = useState("사주 분석 준비")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState("diagram")
  const router = useRouter()

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

    // 로딩 진행 상태 시뮬레이션
    const loadingInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + 1

        // 진행 단계에 따라 메시지 업데이트
        if (newProgress === 20) {
          setLoadingStage("사주 정보 확인 중")
        } else if (newProgress === 40) {
          setLoadingStage("운세 분석 중")
        } else if (newProgress === 70) {
          setLoadingStage("운세 분석 마무리")
        }

        return Math.min(newProgress, 95) // 최대 95%까지만 진행 (API 응답 전)
      })
    }, 300)

    try {
      const result = await getSajuInterpretation(saju)
      setInterpretation(result.interpretation)

      // Store the interpretation in localStorage
      localStorage.setItem(storageKey, result.interpretation)

      setLoadingProgress(100) // 완료 시 100%로 설정
    } catch (err) {
      console.error("Error fetching interpretation:", err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      clearInterval(loadingInterval)
      setIsLoading(false)
    }
  }

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
      `/chat-list?saju=${encodeURIComponent(sajuData)}&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(gender || "")}&interpretation=${encodeURIComponent(interpretation || "")}&returnPath=/result`,
    )
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
                상세 해석 (AI)
              </button>
            </div>

            {activeTab === "diagram" && (
              <div className="p-3">
                <h3 className="text-base font-medium mb-2">사주 도표</h3>
                <SajuDiagram saju={saju} timeUnknown={timeUnknown} />
                {/* Add 십성 table below SajuDiagram */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div>
                    <h4 className="font-semibold text-sm">천간(天干)</h4>
                    <div className="grid grid-cols-2 gap-1">
                      <div>년주:</div>
                      <div>{saju.yearStemSibseong}</div>
                      <div>월주:</div>
                      <div>{saju.monthStemSibseong}</div>
                      <div>일주:</div>
                      <div>{saju.dayStemSibseong}</div>
                      <div>시주:</div>
                      <div>{saju.hourStemSibseong}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">지지(地支)</h4>
                    <div className="grid grid-cols-2 gap-1">
                      <div>년주:</div>
                      <div>{saju.yearBranchSibseong}</div>
                      <div>월주:</div>
                      <div>{saju.monthBranchSibseong}</div>
                      <div>일주:</div>
                      <div>{saju.dayBranchSibseong}</div>
                      <div>시주:</div>
                      <div>{saju.hourBranchSibseong}</div>
                    </div>
                  </div>
                </div>

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
                <h3 className="text-base font-medium mb-2">상세 해석 (AI)</h3>

                {!interpretation && !isLoading && !error && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <p className="text-center text-muted-foreground">AI를 통한 상세 사주 해석을 받아보세요.</p>
                    <Button onClick={fetchInterpretation}>상세 해석 받기</Button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div className="text-center space-y-1">
                      <p className="font-medium text-primary">{loadingStage}</p>
                      <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
                    </div>
                    <div className="w-full max-w-xs mt-1">
                      <Progress value={loadingProgress} className="h-1.5" />
                      <p className="text-xs text-center mt-1 text-muted-foreground">{loadingProgress}% 완료</p>
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
                    <div className="markdown-content text-sm">
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
                        gender={gender}
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
        <Tabs defaultValue="diagram" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagram" data-value="diagram">
              사주 도표
            </TabsTrigger>
            <TabsTrigger value="interpretation" data-value="interpretation">
              상세 해석 (AI)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="diagram" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <SajuDiagram saju={saju} timeUnknown={timeUnknown} />
                {/* Add 십성 table below SajuDiagram */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div>
                    <h4 className="font-semibold text-sm">천간(天干)</h4>
                    <div className="grid grid-cols-2 gap-1">
                      <div>년주:</div>
                      <div>{saju.yearStemSibseong}</div>
                      <div>월주:</div>
                      <div>{saju.monthStemSibseong}</div>
                      <div>일주:</div>
                      <div>{saju.dayStemSibseong}</div>
                      <div>시주:</div>
                      <div>{saju.hourStemSibseong}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">지지(地支)</h4>
                    <div className="grid grid-cols-2 gap-1">
                      <div>년주:</div>
                      <div>{saju.yearBranchSibseong}</div>
                      <div>월주:</div>
                      <div>{saju.monthBranchSibseong}</div>
                      <div>일주:</div>
                      <div>{saju.dayBranchSibseong}</div>
                      <div>시주:</div>
                      <div>{saju.hourBranchSibseong}</div>
                    </div>
                  </div>
                </div>

                {/* Add this after the Heavenly Stems Sibseong display section */}
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">지지 십성</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-gray-100 rounded">
                      <div className="font-medium">연지</div>
                      <div>{saju.yearBranchSibseong}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-100 rounded">
                      <div className="font-medium">월지</div>
                      <div>{saju.monthBranchSibseong}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-100 rounded">
                      <div className="font-medium">일지</div>
                      <div>{saju.dayBranchSibseong}</div>
                    </div>
                    <div className="text-center p-2 bg-gray-100 rounded">
                      <div className="font-medium">시지</div>
                      <div>{saju.timeUnknown ? "-" : saju.hourBranchSibseong}</div>
                    </div>
                  </div>
                </div>

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
                    <p className="text-center text-muted-foreground">AI를 통한 상세 사주 해석을 받아보세요.</p>
                    <Button onClick={fetchInterpretation}>상세 해석 받기</Button>
                  </div>
                )}

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center space-y-2">
                      <p className="font-medium text-primary">분석 중...</p>
                      <p className="text-sm text-muted-foreground">AI가 사주를 심층 분석하고 있습니다.</p>
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
                    <div className="markdown-content">
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
                        gender={gender}
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
