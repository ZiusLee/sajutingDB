"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { SajuResultComponent } from "@/components/saju/saju-result"
import { calculateSaju, generateCustomQuestions } from "@/lib/saju-calculator"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SajuResult, CustomQuestion } from "@/types/saju"

export default function ResultPage() {
  const router = useRouter()
  const { data, reset } = useOnboardingStore()
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null)
  const [questions, setQuestions] = useState<CustomQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const calculateResult = async () => {
      try {
        // 필수 데이터 검증 및 변환
        if (!data.name || !data.birthDate || !data.gender) {
          setError("필수 정보가 누락되었습니다. 다시 입력해주세요.")
          return
        }

        // birthDate가 문자열인 경우 Date 객체로 변환
        const birthDate = typeof data.birthDate === "string" ? new Date(data.birthDate) : data.birthDate

        // 유효한 날짜인지 확인
        if (!birthDate || isNaN(birthDate.getTime())) {
          setError("올바르지 않은 생년월일입니다. 다시 입력해주세요.")
          return
        }

        setLoading(true)
        setError(null)

        // 사주 계산 - 변환된 데이터 사용
        const result = await calculateSaju({
          name: data.name,
          birthDate: birthDate,
          birthTime: data.birthTime,
          isLunar: data.isLunar || false,
          gender: data.gender,
          birthPlace: data.birthPlace || "서울특별시",
          interests: data.interests || [],
        })

        // 맞춤 질문 생성
        const customQuestions = generateCustomQuestions(data.interests || [], result)

        setSajuResult(result)
        setQuestions(customQuestions)
      } catch (err) {
        console.error("사주 계산 오류:", err)
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    calculateResult()
  }, [data])

  const handleStartChat = () => {
    // 채팅 페이지로 이동 (추후 구현)
    router.push("/dashboard")
  }

  const handleRetry = () => {
    router.push("/onboarding")
  }

  const handleRestart = () => {
    reset()
    router.push("/onboarding")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">사주를 분석하고 있습니다</h2>
            <p className="text-slate-600 mb-4">
              {data.name}님의 생년월일과 시간을 바탕으로
              <br />
              정확한 사주를 계산하고 있어요
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-amber-500 to-blue-500 h-2 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-sm text-slate-500 mt-4">잠시만 기다려주세요...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">오류가 발생했습니다</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                다시 시도
              </Button>
              <Button onClick={handleRestart} variant="outline" className="w-full bg-transparent">
                처음부터 다시 시작
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sajuResult) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <SajuResultComponent
          result={sajuResult}
          questions={questions}
          userName={data.name || ""}
          onStartChat={handleStartChat}
        />
      </div>
    </div>
  )
}
