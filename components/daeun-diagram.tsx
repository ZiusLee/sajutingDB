"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DaeunPeriod {
  period: string
  ages: string
  start: string
  stem: string
  branch: string
  stemHanja: string
  branchHanja: string
  startAge: number
  endAge: number
}

interface DaeunDiagramProps {
  daeun: DaeunPeriod[]
  birthInfo?: {
    solarYear: number
    solarMonth: number
    solarDay: number
    solarHour?: number
    solarMinute?: number
    timeUnknown?: boolean
  }
  name?: string
  gender?: string
}

const DaeunDiagram: React.FC<DaeunDiagramProps> = ({ daeun, birthInfo, name, gender }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DaeunPeriod | null>(null)
  const currentYear = new Date().getFullYear()

  // 안전한 대운 데이터 처리
  const safeDaeun = useMemo(() => {
    if (!daeun || !Array.isArray(daeun)) {
      console.log("대운 데이터가 없거나 배열이 아닙니다:", daeun)
      return []
    }

    // 유효한 대운 데이터만 필터링
    const validDaeun = daeun.filter(
      (period) =>
        period &&
        typeof period.startAge === "number" &&
        period.stem &&
        period.branch &&
        period.stemHanja &&
        period.branchHanja,
    )

    console.log("유효한 대운 데이터:", validDaeun)
    return validDaeun
  }, [daeun])

  // 현재 대운 찾기
  const currentDaeun = useMemo(() => {
    if (!safeDaeun.length || !birthInfo?.solarYear) return null

    const currentAge = currentYear - birthInfo.solarYear
    console.log("현재 나이:", currentAge)

    const current = safeDaeun.find((period) => {
      const isInRange = currentAge >= period.startAge && currentAge <= period.endAge
      console.log(
        `대운 ${period.stem}${period.branch} (${period.startAge}-${period.endAge}세): ${isInRange ? "현재" : "아님"}`,
      )
      return isInRange
    })

    console.log("현재 대운:", current)
    return current || null
  }, [safeDaeun, currentYear, birthInfo?.solarYear])

  // 대운 설명 정보
  const daeunExplanation = useMemo(() => {
    const currentDaeunText = currentDaeun
      ? `${currentDaeun.stem}${currentDaeun.branch} (${currentDaeun.startAge}-${currentDaeun.endAge}세)`
      : "해당 없음"

    return `대운(大運)은 10년 단위로 변화하는 인생의 큰 흐름을 나타냅니다.

• **현재 대운**: ${currentDaeunText}
• **대운의 의미**: 각 10년마다 다른 천간지지가 영향을 미쳐 운세의 흐름이 바뀝니다
• **활용법**: 대운을 통해 인생의 전환점과 중요한 시기를 파악할 수 있습니다

각 대운 기간을 클릭하면 상세 정보를 확인할 수 있습니다.`
  }, [currentDaeun])

  if (!safeDaeun.length) {
    console.log("대운 데이터가 없어서 빈 상태 표시")
    return (
      <div className="w-full bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{name || "사용자"}님의 현재 대운</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 p-1">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-gray-800">대운표란?</DialogTitle>
              </DialogHeader>
              <div className="text-gray-700 whitespace-pre-line text-sm">{daeunExplanation}</div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-gray-400 text-center py-8">대운 정보를 불러올 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">
          {name || "사용자"}님의 현재 대운: {currentDaeun ? `${currentDaeun.stem}${currentDaeun.branch}` : "미상"}
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 p-1">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-800">대운표란?</DialogTitle>
            </DialogHeader>
            <div className="text-gray-700 whitespace-pre-line text-sm">{daeunExplanation}</div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 대운 기간들을 2x4 그리드로 표시 */}
      <div className="space-y-4">
        {/* 첫 번째 줄 - 처음 4개 */}
        <div className="grid grid-cols-4 gap-4">
          {safeDaeun.slice(0, 4).map((period, index) => {
            const currentAge = birthInfo?.solarYear ? currentYear - birthInfo.solarYear : 0
            const isCurrent = currentAge >= period.startAge && currentAge <= period.endAge

            return (
              <div key={`age-${index}`} className="text-center">
                <div className="text-sm text-gray-600 mb-2">{period.startAge}세</div>
                <div
                  onClick={() => setSelectedPeriod(period)}
                  className={`
                    w-full h-20 rounded-xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-md
                    ${isCurrent ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}
                  `}
                >
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className={`text-lg font-bold ${isCurrent ? "text-blue-600" : "text-gray-800"}`}>
                      {period.stem}
                      {period.branch}
                    </div>
                    <div className={`text-xs ${isCurrent ? "text-blue-500" : "text-gray-500"}`}>
                      {period.stemHanja}
                      {period.branchHanja}
                    </div>
                    <div className={`text-xs mt-1 ${isCurrent ? "text-blue-500" : "text-gray-500"}`}>
                      {period.startAge}-{period.endAge}세
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 두 번째 줄 - 나머지 4개 */}
        {safeDaeun.length > 4 && (
          <div className="grid grid-cols-4 gap-4">
            {safeDaeun.slice(4, 8).map((period, index) => {
              const currentAge = birthInfo?.solarYear ? currentYear - birthInfo.solarYear : 0
              const isCurrent = currentAge >= period.startAge && currentAge <= period.endAge

              return (
                <div key={`age-${index + 4}`} className="text-center">
                  <div className="text-sm text-gray-600 mb-2">{period.startAge}세</div>
                  <div
                    onClick={() => setSelectedPeriod(period)}
                    className={`
                      w-full h-20 rounded-xl border-2 cursor-pointer transition-all shadow-sm hover:shadow-md
                      ${isCurrent ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}
                    `}
                  >
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className={`text-lg font-bold ${isCurrent ? "text-blue-600" : "text-gray-800"}`}>
                        {period.stem}
                        {period.branch}
                      </div>
                      <div className={`text-xs ${isCurrent ? "text-blue-500" : "text-gray-500"}`}>
                        {period.stemHanja}
                        {period.branchHanja}
                      </div>
                      <div className={`text-xs mt-1 ${isCurrent ? "text-blue-500" : "text-gray-500"}`}>
                        {period.startAge}-{period.endAge}세
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 선택된 대운 상세 정보 모달 */}
      {selectedPeriod && (
        <Dialog open={!!selectedPeriod} onOpenChange={() => setSelectedPeriod(null)}>
          <DialogContent className="bg-white border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-gray-800">
                {selectedPeriod.stem}
                {selectedPeriod.branch} 대운 ({selectedPeriod.startAge}-{selectedPeriod.endAge}세)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-gray-700">
              <div>
                <div className="text-sm text-gray-500">나이</div>
                <div className="font-medium">
                  {selectedPeriod.startAge}세 ~ {selectedPeriod.endAge}세
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">기간</div>
                <div className="font-medium">{selectedPeriod.ages}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">천간지지</div>
                <div className="font-medium">
                  {selectedPeriod.stem}
                  {selectedPeriod.branch}
                  <span className="ml-2 text-gray-500">
                    ({selectedPeriod.stemHanja}
                    {selectedPeriod.branchHanja})
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">시작일</div>
                <div className="text-sm">{selectedPeriod.start}</div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DaeunDiagram
