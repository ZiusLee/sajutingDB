"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  calculateYearlyFortune,
  getStemElementColor,
  getBranchElementColor,
  getCurrentYear,
} from "@/lib/yearly-monthly-fortune"
import { useEffect, useState } from "react"

interface YearlyFortuneDiagramProps {
  startYear: number
  endYear: number
  birthYear?: number
  selectedDaeunIndex?: number
  onYearSelect?: (year: number) => void
  selectedYear?: number
}

export default function YearlyFortuneDiagram({
  startYear,
  endYear,
  birthYear,
  selectedDaeunIndex = 0,
  onYearSelect,
  selectedYear = getCurrentYear(),
}: YearlyFortuneDiagramProps) {
  const [yearlyFortunes, setYearlyFortunes] = useState<any[]>([])
  const [currentYear, setCurrentYear] = useState<number>(getCurrentYear())

  useEffect(() => {
    // 세운 계산
    const fortunes = calculateYearlyFortune(startYear, endYear)
    setYearlyFortunes(fortunes)
  }, [startYear, endYear])

  const handleYearClick = (year: number) => {
    if (onYearSelect) {
      onYearSelect(year)
    }
  }

  if (yearlyFortunes.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">세운(年運) 흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">세운 정보를 계산 중입니다...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>세운(年運) 흐름</span>
          <span className="text-sm font-normal text-muted-foreground">
            {startYear}년 ~ {endYear}년
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div className="grid grid-cols-10 gap-1 text-center mb-2">
              {yearlyFortunes.map((fortune, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md cursor-pointer hover:bg-primary/5 ${
                    fortune.year === selectedYear ? "bg-primary/10 border border-primary/30" : ""
                  }`}
                  onClick={() => handleYearClick(fortune.year)}
                >
                  <div className="text-lg font-semibold">
                    <span className={`${getStemElementColor(fortune.stem)} mr-1`}>{fortune.stemKorean}</span>
                    <span className={getBranchElementColor(fortune.branch)}>{fortune.branchKorean}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-10 gap-1 text-center text-sm">
              {yearlyFortunes.map((fortune, index) => (
                <div
                  key={index}
                  className={`p-1 cursor-pointer hover:bg-primary/5 ${
                    fortune.year === selectedYear ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => handleYearClick(fortune.year)}
                >
                  <div>{fortune.year}년</div>
                  <div className="text-xs">{birthYear ? `${fortune.year - birthYear}세` : ""}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>※ 세운은 해당 연도의 운세를 나타냅니다.</p>
          <p>※ 연도를 클릭하면 해당 연도의 월운을 확인할 수 있습니다.</p>
          <p>※ 대운과 세운을 함께 고려하면 더 정확한 운세를 파악할 수 있습니다.</p>
        </div>
      </CardContent>
    </Card>
  )
}
