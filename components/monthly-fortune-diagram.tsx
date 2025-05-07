"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  calculateMonthlyFortune,
  getStemElementColor,
  getBranchElementColor,
  getCurrentYear,
  getCurrentMonth,
} from "@/lib/yearly-monthly-fortune"
import { useEffect, useState } from "react"

interface MonthlyFortuneDiagramProps {
  year: number
}

export default function MonthlyFortuneDiagram({ year }: MonthlyFortuneDiagramProps) {
  const [monthlyFortunes, setMonthlyFortunes] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState<number>(getCurrentMonth())
  const [currentYear, setCurrentYear] = useState<number>(getCurrentYear())

  useEffect(() => {
    // 월운 계산
    const fortunes = calculateMonthlyFortune(year)
    setMonthlyFortunes(fortunes)
  }, [year])

  if (monthlyFortunes.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">월운(月運) 흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">월운 정보를 계산 중입니다...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>월운(月運) 흐름</span>
          <span className="text-sm font-normal text-muted-foreground">{year}년</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid grid-cols-12 gap-1 text-center mb-2">
              {monthlyFortunes.map((fortune, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md ${
                    fortune.month === currentMonth && year === currentYear
                      ? "bg-primary/10 border border-primary/30"
                      : ""
                  }`}
                >
                  <div className="text-lg font-semibold">
                    <span className={`${getStemElementColor(fortune.stem)} mr-1`}>{fortune.stemKorean}</span>
                    <span className={getBranchElementColor(fortune.branch)}>{fortune.branchKorean}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-1 text-center text-sm">
              {monthlyFortunes.map((fortune, index) => (
                <div
                  key={index}
                  className={`p-1 ${
                    fortune.month === currentMonth && year === currentYear ? "font-medium" : "text-muted-foreground"
                  }`}
                >
                  <div>{fortune.month}월</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>※ 월운은 해당 월의 세부적인 운세를 나타냅니다.</p>
          <p>※ 현재 월은 강조 표시됩니다.</p>
          <p>※ 대운, 세운, 월운을 함께 고려하면 더 정확한 운세를 파악할 수 있습니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}
