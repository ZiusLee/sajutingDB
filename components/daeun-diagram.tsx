"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Saju } from "@/lib/saju"
import {
  calculateDaeunInfo,
  calculateKoreanAge,
  getCurrentDaeunIndex,
  getStemColor,
  getBranchColor,
  getDaeunDirection,
} from "@/lib/daeun-calculator"
import { useEffect, useState } from "react"

interface DaeunDiagramProps {
  saju: Saju
  gender?: string
  solarYear?: string
  solarMonth?: string
  solarDay?: string
  hour?: string
  minute?: string
  timeUnknown?: boolean
}

export default function DaeunDiagram({
  saju,
  gender = "",
  solarYear = "",
  solarMonth = "",
  solarDay = "",
  hour = "",
  minute = "",
  timeUnknown = false,
}: DaeunDiagramProps) {
  const [error, setError] = useState<string | null>(null)
  const [daeunInfo, setDaeunInfo] = useState<any>(null)
  const [currentDaeunIndex, setCurrentDaeunIndex] = useState(0)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    try {
      // 성별 정규화
      const normalizedGender =
        gender === "male" || gender === "남성" || gender === "남자"
          ? "male"
          : gender === "female" || gender === "여성" || gender === "여자"
            ? "female"
            : "male" // 기본값

      // 출생 정보 변환
      const birthYear = Number.parseInt(solarYear, 10) || new Date().getFullYear() - 30 // 기본값
      const birthMonth = Number.parseInt(solarMonth, 10) || 1
      const birthDay = Number.parseInt(solarDay, 10) || 1
      const birthHour = timeUnknown ? undefined : Number.parseInt(hour, 10)
      const birthMinute = timeUnknown ? undefined : Number.parseInt(minute, 10)

      // 대운 방향 결정
      const direction = getDaeunDirection(saju.yearStem, normalizedGender)

      // 대운 정보 계산
      const info = calculateDaeunInfo(saju, birthYear, birthMonth, birthDay, normalizedGender, birthHour, birthMinute)
      setDaeunInfo(info)

      // 현재 나이 계산 (한국식)
      const currentAge = calculateKoreanAge(birthYear)

      // 현재 대운 인덱스 계산
      const index = getCurrentDaeunIndex(info.pillars, currentAge)
      setCurrentDaeunIndex(index)
    } catch (err) {
      console.error("Error calculating daeun info:", err)
      setError("대운 정보를 계산하는 중 오류가 발생했습니다.")
    }
  }, [saju, gender, solarYear, solarMonth, solarDay, hour, minute, timeUnknown])

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">대운(大運) 흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-2">{error}</div>
          <div className="text-xs text-muted-foreground mt-4">
            <p>※ 대운은 10년 단위로 변화하는 큰 운의 흐름입니다.</p>
            <p>※ 대운세수는 생일과 절입일의 차이를 기준으로 계산됩니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!daeunInfo) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">대운(大運) 흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">대운 정보를 계산 중입니다...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>대운(大運) 흐름</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {daeunInfo.direction === "forward" ? "순행(→)" : "역행(←)"} · 대운세수: {daeunInfo.daeunAge}세
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid grid-cols-8 gap-1 text-center mb-2">
              {daeunInfo.pillars.map((pillar: any, index: number) => (
                <div
                  key={index}
                  className={`p-2 rounded-md ${
                    index === currentDaeunIndex ? "bg-primary/10 border border-primary/30" : ""
                  }`}
                >
                  <div className="text-lg font-semibold">
                    <span className={`${getStemColor(pillar.stem)} mr-1`}>{pillar.stemKorean}</span>
                    <span className={getBranchColor(pillar.branch)}>{pillar.branchKorean}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-8 gap-1 text-center text-sm">
              {daeunInfo.pillars.map((pillar: any, index: number) => (
                <div
                  key={index}
                  className={`p-1 ${index === currentDaeunIndex ? "font-medium" : "text-muted-foreground"}`}
                >
                  <div>
                    {pillar.startAge}~{pillar.endAge}세
                  </div>
                  <div>{pillar.startYear}년~</div>
                  {pillar.startMonth && pillar.startDay && !timeUnknown && (
                    <div className="text-xs mt-1">
                      ({pillar.startMonth}월 {pillar.startDay}일경)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>※ 대운은 10년 단위로 변화하는 큰 운의 흐름입니다.</p>
          <p>※ 대운세수는 생일과 절입일의 차이를 기준으로 계산됩니다.</p>
          {timeUnknown && (
            <p className="text-yellow-600 dark:text-yellow-400">
              ※ 출생시간이 불확실하여 대략적인 대운 계산만 가능합니다.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
