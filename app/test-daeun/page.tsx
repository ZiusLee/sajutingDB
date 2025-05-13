"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { testDaeunCalculation, debugDaeunCalculation, getDaeunDirection } from "@/lib/daeun-calculator"

export default function TestDaeunPage() {
  const [birthYear, setBirthYear] = useState("1994")
  const [birthMonth, setBirthMonth] = useState("12")
  const [birthDay, setBirthDay] = useState("27")
  const [gender, setGender] = useState("male")
  const [debugInfo, setDebugInfo] = useState("")

  const handleTest = () => {
    const year = Number.parseInt(birthYear, 10)
    const month = Number.parseInt(birthMonth, 10)
    const day = Number.parseInt(birthDay, 10)

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      setDebugInfo("유효한 날짜를 입력해주세요.")
      return
    }

    const direction = getDaeunDirection("갑", gender) // 연간은 임시로 갑으로 설정
    const debug = debugDaeunCalculation(year, month, day, direction)
    setDebugInfo(debug)

    // 콘솔에도 출력
    testDaeunCalculation(year, month, day, gender)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">대운세수 계산 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="birthYear">출생년도</Label>
              <Input
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="YYYY"
              />
            </div>
            <div>
              <Label htmlFor="birthMonth">월</Label>
              <Input
                id="birthMonth"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                placeholder="MM"
              />
            </div>
            <div>
              <Label htmlFor="birthDay">일</Label>
              <Input id="birthDay" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} placeholder="DD" />
            </div>
          </div>

          <div>
            <Label>성별</Label>
            <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">남성</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">여성</Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleTest} className="w-full">
            테스트 실행
          </Button>

          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono whitespace-pre-wrap">
              {debugInfo}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
