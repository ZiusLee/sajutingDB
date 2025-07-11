"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SajuDiagram } from "./saju-diagram"
import { ElementsChart } from "./elements-chart"
import { MessageCircle, Sparkles, TrendingUp, AlertTriangle } from "lucide-react"
import type { SajuResult, CustomQuestion } from "@/types/saju"

interface SajuResultProps {
  result: SajuResult
  questions: CustomQuestion[]
  userName: string
  onStartChat: () => void
}

export function SajuResultComponent({ result, questions, userName, onStartChat }: SajuResultProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-blue-50">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{userName}님의 사주가 완성되었습니다! 🎉</h2>
          <p className="text-slate-600">천년의 지혜로 분석한 당신만의 특별한 이야기를 확인해보세요</p>
        </CardContent>
      </Card>

      {/* 사주 다이어그램 */}
      <SajuDiagram pillars={result.pillars} />

      {/* 오행 분석 */}
      <ElementsChart elements={result.elements} />

      {/* AI 해석 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            AI 사주 해석
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed text-lg">{result.interpretation}</p>
        </CardContent>
      </Card>

      {/* 장점과 특성 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-5 h-5" />
              강점과 특성
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-slate-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              주의사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-slate-700">{challenge}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 맞춤 질문 */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800">{userName}님을 위한 맞춤 질문</CardTitle>
          <p className="text-sm text-slate-600">관심사를 바탕으로 준비한 질문들입니다. 궁금한 것을 선택해보세요!</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {questions.map((question) => (
              <Card
                key={question.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedQuestion === question.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
                }`}
                onClick={() => setSelectedQuestion(question.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">Q</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 font-medium">{question.question}</p>
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {getCategoryLabel(question.category)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA 버튼 */}
      <div className="text-center space-y-4">
        <Button
          onClick={onStartChat}
          size="lg"
          className="bg-gradient-to-r from-amber-600 to-blue-600 hover:from-amber-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MessageCircle className="w-5 h-5 mr-2" />더 자세히 알아보기
        </Button>
        <p className="text-sm text-slate-600">AI 상담사와 대화하며 더 깊이 있는 해석을 받아보세요</p>
      </div>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    career: "취업/직업",
    love: "연애/사랑",
    marriage: "결혼/가정",
    business: "사업/투자",
    health: "건강/운동",
    study: "학업/시험",
    general: "일반",
  }
  return labels[category] || "일반"
}
