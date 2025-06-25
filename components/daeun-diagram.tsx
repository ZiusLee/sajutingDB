"use client"

import type React from "react"
import { useState } from "react"
import { Info } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DaeunPeriod {
  age: number
  start: string // "2001.1.6" 형태의 날짜 문자열
  startYear?: number
  endYear?: number
  stem: string
  branch: string
  stemHanja?: string
  branchHanja?: string
  description?: string
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

// 대운 기간 파싱 함수
const parseDaeunPeriod = (period: DaeunPeriod) => {
  if (period.startYear && period.endYear) {
    return { startYear: period.startYear, endYear: period.endYear }
  }

  // start 필드에서 연도 파싱 (예: "2001.1.6" -> 2001)
  if (period.start) {
    const startYear = Number.parseInt(period.start.split(".")[0])
    const endYear = startYear + 9 // 대운은 10년 단위
    return { startYear, endYear }
  }

  return { startYear: 0, endYear: 0 }
}

const DaeunDiagram: React.FC<DaeunDiagramProps> = ({ daeun, birthInfo, name, gender }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<DaeunPeriod | null>(null)
  const currentYear = new Date().getFullYear()

  // 현재 대운 찾기
  const getCurrentDaeun = () => {
    if (!Array.isArray(daeun)) return null
    return daeun.find((period) => {
      const { startYear, endYear } = parseDaeunPeriod(period)
      return currentYear >= startYear && currentYear <= endYear
    })
  }

  const currentDaeun = getCurrentDaeun()

  // 대운 설명 정보
  const daeunExplanation = `
대운(大運)은 10년 단위로 변화하는 인생의 큰 흐름을 나타냅니다.

• **현재 대운**: ${currentDaeun ? `${currentDaeun.stem}${currentDaeun.branch} (${parseDaeunPeriod(currentDaeun).startYear}-${parseDaeunPeriod(currentDaeun).endYear})` : "해당 없음"}
• **대운의 의미**: 각 10년마다 다른 천간지지가 영향을 미쳐 운세의 흐름이 바뀝니다
• **활용법**: 대운을 통해 인생의 전환점과 중요한 시기를 파악할 수 있습니다

각 대운 기간을 클릭하면 상세 정보를 확인할 수 있습니다.
  `

  if (!daeun || !Array.isArray(daeun) || daeun.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">대운표 (大運表)</h3>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white p-1">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">대운표란?</DialogTitle>
              </DialogHeader>
              <div className="text-white/90 whitespace-pre-line text-sm">{daeunExplanation}</div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="text-white/60 text-center py-8">대운 정보를 불러올 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">대운표 (大運表)</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white p-1">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">대운표란?</DialogTitle>
            </DialogHeader>
            <div className="text-white/90 whitespace-pre-line text-sm">{daeunExplanation}</div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 대운 기간들을 가로 스크롤로 표시 */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {daeun.slice(0, 8).map((period, index) => {
            const { startYear, endYear } = parseDaeunPeriod(period)
            const isCurrent = currentYear >= startYear && currentYear <= endYear
            const isPast = currentYear > endYear
            const isFuture = currentYear < startYear

            return (
              <div
                key={index}
                onClick={() => setSelectedPeriod(period)}
                className={`
                  flex-shrink-0 w-24 h-32 border rounded-lg p-2 cursor-pointer transition-all
                  ${
                    isCurrent
                      ? "border-yellow-400 bg-yellow-400/20 shadow-lg"
                      : isPast
                        ? "border-gray-500 bg-gray-500/10"
                        : "border-white/30 bg-white/10 hover:bg-white/20"
                  }
                `}
              >
                <div className="text-center h-full flex flex-col justify-between">
                  <div>
                    <div className={`text-xs ${isCurrent ? "text-yellow-200" : "text-white/60"}`}>{period.age}세</div>
                    <div className={`text-lg font-bold ${isCurrent ? "text-yellow-100" : "text-white"}`}>
                      {period.stem}
                      {period.branch}
                    </div>
                    {period.stemHanja && period.branchHanja && (
                      <div className={`text-xs ${isCurrent ? "text-yellow-200" : "text-white/60"}`}>
                        {period.stemHanja}
                        {period.branchHanja}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs ${isCurrent ? "text-yellow-200" : "text-white/60"}`}>
                    {startYear}-{endYear}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 현재 대운 강조 표시 */}
      {currentDaeun && (
        <div className="mt-4 p-3 bg-yellow-400/20 border border-yellow-400/30 rounded-lg">
          <div className="text-yellow-200 text-sm font-medium">
            현재 대운: {currentDaeun.stem}
            {currentDaeun.branch} ({parseDaeunPeriod(currentDaeun).startYear}-{parseDaeunPeriod(currentDaeun).endYear})
          </div>
          <div className="text-yellow-100/80 text-xs mt-1">{currentDaeun.age}세부터 시작된 10년 운세 기간</div>
        </div>
      )}

      {/* 선택된 대운 상세 정보 모달 */}
      {selectedPeriod && (
        <Dialog open={!!selectedPeriod} onOpenChange={() => setSelectedPeriod(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {selectedPeriod.stem}
                {selectedPeriod.branch} 대운 ({parseDaeunPeriod(selectedPeriod).startYear}-
                {parseDaeunPeriod(selectedPeriod).endYear})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-white/90">
              <div>
                <div className="text-sm text-white/60">나이</div>
                <div className="font-medium">
                  {selectedPeriod.age}세 ~ {selectedPeriod.age + 9}세
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60">기간</div>
                <div className="font-medium">
                  {parseDaeunPeriod(selectedPeriod).startYear}년 ~ {parseDaeunPeriod(selectedPeriod).endYear}년
                </div>
              </div>
              <div>
                <div className="text-sm text-white/60">천간지지</div>
                <div className="font-medium">
                  {selectedPeriod.stem}
                  {selectedPeriod.branch}
                  {selectedPeriod.stemHanja && selectedPeriod.branchHanja && (
                    <span className="ml-2 text-white/60">
                      ({selectedPeriod.stemHanja}
                      {selectedPeriod.branchHanja})
                    </span>
                  )}
                </div>
              </div>
              {selectedPeriod.description && (
                <div>
                  <div className="text-sm text-white/60">특징</div>
                  <div className="text-sm">{selectedPeriod.description}</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DaeunDiagram
