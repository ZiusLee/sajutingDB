"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { SajuLogo } from "./saju-logo"

interface AnimatedLoadingProps {
  progress: number
  stage: string
  detailedStage: string
}

export function AnimatedLoading({ progress, stage, detailedStage }: AnimatedLoadingProps) {
  const [showDetailedStage, setShowDetailedStage] = useState(true)

  // 상세 단계 메시지를 번갈아가며 표시하는 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setShowDetailedStage((prev) => !prev)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      {/* 둥둥 떠 있는 사주핑 캐릭터 */}
      <div className="relative w-24 h-24 animate-bounce-slow">
        <SajuLogo size="lg" showText={false} />
      </div>

      {/* 분석 단계 메시지 */}
      <div className="text-center space-y-2">
        <p className="font-medium text-primary text-lg">{stage}</p>
        <div className="h-6">
          {showDetailedStage ? (
            <p className="text-sm text-muted-foreground animate-fade-in">{detailedStage}</p>
          ) : (
            <p className="text-sm text-muted-foreground animate-fade-in">AI가 사주를 심층 분석하고 있습니다</p>
          )}
        </div>
      </div>

      {/* 진행 상황 표시 */}
      <div className="w-full max-w-xs space-y-2">
        <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </Progress>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>분석 시작</span>
          <span>{progress}% 완료</span>
          <span>분석 완료</span>
        </div>
      </div>

      {/* 분석 단계 아이콘 */}
      <div className="flex justify-center space-x-4 mt-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 20 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}
        >
          <span className="text-xs font-bold">천간</span>
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 40 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}
        >
          <span className="text-xs font-bold">지지</span>
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 60 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}
        >
          <span className="text-xs font-bold">용신</span>
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${progress >= 80 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-gray-100 text-gray-400 dark:bg-gray-800"}`}
        >
          <span className="text-xs font-bold">운세</span>
        </div>
      </div>
    </div>
  )
}
