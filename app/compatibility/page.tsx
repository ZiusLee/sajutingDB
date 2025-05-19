"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getCompatibilityAnalysis } from "@/lib/api-client"
import CompatibilityComparison from "@/components/compatibility-comparison"
import ReactMarkdown from "react-markdown"

interface SajuData {
  name: string
  gender: string
  saju: {
    yearStem: string
    yearBranch: string
    monthStem: string
    monthBranch: string
    dayStem: string
    dayBranch: string
    hourStem: string
    hourBranch: string
  }
}

interface PartnerData {
  name: string
  gender: string
  year: number
  month: number
  day: number
  hour: number | null
  minute: number | null
  timeUnknown: boolean
}

export default function CompatibilityPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [userSaju, setUserSaju] = useState<SajuData | null>(null)
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null)
  const [compatibilityResult, setCompatibilityResult] = useState<string | null>(null)
  const [partnerSaju, setPartnerSaju] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // URL 파라미터에서 데이터를 한 번만 가져오기
  useEffect(() => {
    // 이미 데이터를 로드했으면 다시 로드하지 않음
    if (isDataLoaded) return

    const userParam = searchParams.get("user")
    const partnerParam = searchParams.get("partner")

    if (!userParam || !partnerParam) {
      setError("필요한 데이터가 없습니다.")
      setIsLoading(false)
      setIsDataLoaded(true)
      return
    }

    try {
      // 데이터 파싱
      const userData: SajuData = JSON.parse(decodeURIComponent(userParam))
      const partnerInfo: PartnerData = JSON.parse(decodeURIComponent(partnerParam))

      setUserSaju(userData)
      setPartnerData(partnerInfo)
      setIsDataLoaded(true)
    } catch (error) {
      console.error("Error parsing data:", error)
      setError("데이터 파싱 중 오류가 발생했습니다.")
      setIsLoading(false)
      setIsDataLoaded(true)
    }
  }, [searchParams, isDataLoaded])

  // 데이터가 로드된 후 궁합 분석 요청
  useEffect(() => {
    if (!isDataLoaded || !userSaju || !partnerData) return

    const analyzeCompatibility = async () => {
      try {
        setIsLoading(true)
        const result = await getCompatibilityAnalysis(
          {
            name: userSaju.name,
            gender: userSaju.gender,
            saju: userSaju.saju,
          },
          partnerData,
          "unknown",
        )

        if (result && result.interpretation) {
          setCompatibilityResult(result.interpretation)

          // 파트너의 사주 정보 저장
          if (result.partnerSaju) {
            setPartnerSaju(result.partnerSaju)
          }
        } else if (result && result.fallbackInterpretation) {
          // 오류 발생 시 폴백 해석 사용
          setCompatibilityResult(result.fallbackInterpretation)
          setError(result.error || "궁합 분석 중 오류가 발생했습니다.")
        } else {
          throw new Error("궁합 분석 결과를 받지 못했습니다.")
        }
      } catch (error) {
        console.error("Error analyzing compatibility:", error)
        setError(error instanceof Error ? error.message : "궁합 분석 중 오류가 발생했습니다.")
        // 오류 발생 시 기본 메시지 설정
        setCompatibilityResult(`
# 궁합 분석 오류

궁합 분석을 가져오는 중 오류가 발생했습니다.

## 오류 정보:
- 오류 시간: ${new Date().toISOString()}
- 오류 내용: ${error instanceof Error ? error.message : "알 수 없는 오류"}

## 문제 해결 방법:
1. 페이지를 새로고침하고 다시 시도해보세요.
2. 인터넷 연결을 확인해보세요.
3. 잠시 후 다시 시도해보세요.
        `)
      } finally {
        setIsLoading(false)
      }
    }

    analyzeCompatibility()
  }, [userSaju, partnerData, isDataLoaded])

  return (
    <div className="container mx-auto pb-20 px-4">
      <div className="flex items-center mb-6 mt-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">궁합 분석</h1>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-center text-muted-foreground">
            {userSaju?.name}님과 {partnerData?.name}님의 궁합을 분석 중입니다...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {userSaju && partnerSaju && (
            <CompatibilityComparison
              userSaju={userSaju.saju}
              partnerSaju={partnerSaju}
              userName={userSaju.name}
              partnerName={partnerData?.name || "상대방"}
            />
          )}

          <Card
            className={
              error
                ? "bg-red-50 border-red-100 dark:bg-red-950 dark:border-red-800"
                : "bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100 dark:from-pink-950 dark:to-purple-950 dark:border-pink-800 dark:text-gray-100"
            }
          >
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold mb-4 text-center">
                {userSaju?.name}님과 {partnerData?.name}님의 궁합
              </h2>
              <div className="markdown-content">
                <ReactMarkdown>{compatibilityResult || ""}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => router.back()} className="mr-2">
              돌아가기
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
