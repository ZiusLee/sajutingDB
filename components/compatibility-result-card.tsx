"use client"

import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface CompatibilityResultCardProps {
  result: string | null
  onReset: () => void
}

export default function CompatibilityResultCard({ result, onReset }: CompatibilityResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!result) return null

  // 결과 텍스트에서 궁합 점수 추출
  const scoreMatch =
    result.match(/궁합\s*점수[^\d]*(\d+)[^\d]*점/i) ||
    result.match(/(\d+)[^\d]*점[^\d]*만점/i) ||
    result.match(/점수[^\d]*(\d+)/i)

  const score = scoreMatch ? scoreMatch[1] : null

  // 결과 텍스트에서 첫 번째 섹션만 추출 (축소 모드용)
  const firstSection = result.split(/(?=##\s)/)[0]

  return (
    <div className="space-y-4">
      {/* 궁합 점수 표시 */}
      {score && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl p-4 shadow-sm">
          <div className="text-center">
            <div className="text-sm font-medium mb-1">궁합 점수</div>
            <div className="text-4xl font-bold">
              {score}
              <span className="text-xl">점</span>
            </div>
          </div>
        </div>
      )}

      {/* 결과 내용 */}
      <div
        className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 
                    dark:text-gray-100 rounded-xl p-3 sm:p-4 shadow-sm"
      >
        <div className="markdown-content">
          <ReactMarkdown>{isExpanded ? result : firstSection}</ReactMarkdown>
        </div>

        {/* 더보기/접기 버�� */}
        {result.length > 500 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-2 text-muted-foreground hover:text-foreground flex items-center justify-center"
          >
            {isExpanded ? (
              <>
                접기 <ChevronUp className="ml-1 h-4 w-4" />
              </>
            ) : (
              <>
                더보기 <ChevronDown className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>

      <Button onClick={onReset} className="w-full sm:w-auto" variant="outline">
        다시 분석하기
      </Button>
    </div>
  )
}
