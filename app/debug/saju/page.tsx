"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { calculateSaju } from "@/lib/saju-calculator"

export default function SajuDebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testData, setTestData] = useState({
    year: 1993,
    month: 4,
    day: 18,
    hour: 1,
    minute: 45,
    city: "서울",
    gender: "male" as "male" | "female",
  })

  const testLibrary = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const birthData = {
        name: "테스트",
        birthDate: new Date(testData.year, testData.month - 1, testData.day),
        birthTime: `${testData.hour.toString().padStart(2, "0")}:${testData.minute.toString().padStart(2, "0")}`,
        isLunar: false,
        gender: testData.gender,
        birthPlace: testData.city,
        interests: ["career", "love"],
      }

      const sajuResult = await calculateSaju(birthData)
      setResult(sajuResult)
    } catch (err) {
      console.error("테스트 오류:", err)
      setError(err instanceof Error ? err.message : "알 수 없는 오류")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">🔥 실제 사주 계산 테스트</h1>

        {/* 테스트 입력 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {process.env.NEXT_PUBLIC_USE_MOCK_API === "true"
                ? "🧪 모의 사주 계산 테스트"
                : "🔥 실제 사주 계산 테스트"}
            </CardTitle>
            <div className="text-sm text-slate-600">
              현재 모드:{" "}
              <Badge variant={process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ? "secondary" : "default"}>
                {process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ? "MOCK API" : "REAL LIBRARY"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NEXT_PUBLIC_USE_MOCK_API === "true" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 현재 모의 API 모드입니다. 실제 라이브러리를 사용하려면 .env.local에서
                  NEXT_PUBLIC_USE_MOCK_API=false로 설정하세요.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="year">연도</Label>
                <Input
                  id="year"
                  type="number"
                  value={testData.year}
                  onChange={(e) => setTestData({ ...testData, year: Number.parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="month">월</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={testData.month}
                  onChange={(e) => setTestData({ ...testData, month: Number.parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="day">일</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  max="31"
                  value={testData.day}
                  onChange={(e) => setTestData({ ...testData, day: Number.parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="hour">시</Label>
                <Input
                  id="hour"
                  type="number"
                  min="0"
                  max="23"
                  value={testData.hour}
                  onChange={(e) => setTestData({ ...testData, hour: Number.parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="minute">분</Label>
                <Input
                  id="minute"
                  type="number"
                  min="0"
                  max="59"
                  value={testData.minute}
                  onChange={(e) => setTestData({ ...testData, minute: Number.parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="city">도시</Label>
                <Input
                  id="city"
                  value={testData.city}
                  onChange={(e) => setTestData({ ...testData, city: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>성별</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={testData.gender === "male"}
                    onChange={(e) => setTestData({ ...testData, gender: e.target.value as "male" | "female" })}
                  />
                  남성
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={testData.gender === "female"}
                    onChange={(e) => setTestData({ ...testData, gender: e.target.value as "male" | "female" })}
                  />
                  여성
                </label>
              </div>
            </div>

            <Button onClick={testLibrary} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ? "모의 계산 중..." : "실제 라이브러리로 계산 중..."}
                </>
              ) : process.env.NEXT_PUBLIC_USE_MOCK_API === "true" ? (
                "🧪 모의 사주 계산 테스트"
              ) : (
                "🚀 실제 사주 계산 테스트"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 에러 표시 */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold">오류 발생</h3>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 결과 표시 */}
        {result && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <h3 className="font-bold">🎉 실제 라이브러리 계산 성공!</h3>
                  <Badge variant="default">@pragcode/saju-calculator</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 사주팔자 표시 */}
            <Card>
              <CardHeader>
                <CardTitle>사주팔자 (四柱八字)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg">년주</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {result.pillars.year.heavenly}
                      {result.pillars.year.earthly}
                    </div>
                    <div className="text-sm text-gray-600">{result.pillars.year.element}</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">월주</div>
                    <div className="text-2xl font-bold text-green-600">
                      {result.pillars.month.heavenly}
                      {result.pillars.month.earthly}
                    </div>
                    <div className="text-sm text-gray-600">{result.pillars.month.element}</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">일주</div>
                    <div className="text-2xl font-bold text-red-600">
                      {result.pillars.day.heavenly}
                      {result.pillars.day.earthly}
                    </div>
                    <div className="text-sm text-gray-600">{result.pillars.day.element}</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">시주</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {result.pillars.hour?.heavenly || "?"}
                      {result.pillars.hour?.earthly || "?"}
                    </div>
                    <div className="text-sm text-gray-600">{result.pillars.hour?.element || "미상"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 오행 분석 */}
            <Card>
              <CardHeader>
                <CardTitle>오행 분석 (五行)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="font-bold text-green-600">목(木)</div>
                    <div className="text-2xl font-bold">{result.elements.wood}</div>
                  </div>
                  <div>
                    <div className="font-bold text-red-600">화(火)</div>
                    <div className="text-2xl font-bold">{result.elements.fire}</div>
                  </div>
                  <div>
                    <div className="font-bold text-amber-600">토(土)</div>
                    <div className="text-2xl font-bold">{result.elements.earth}</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-600">금(金)</div>
                    <div className="text-2xl font-bold">{result.elements.metal}</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-600">수(水)</div>
                    <div className="text-2xl font-bold">{result.elements.water}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI 해석 */}
            <Card>
              <CardHeader>
                <CardTitle>AI 해석</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{result.interpretation}</p>
              </CardContent>
            </Card>

            {/* 강점과 주의사항 */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">💪 강점</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((strength: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-amber-700">⚠️ 주의사항</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.challenges.map((challenge: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
