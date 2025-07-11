"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Calendar, Sun, Moon } from "lucide-react"

export function StepBirthDate() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [birthDate, setBirthDate] = useState(data.birthDate ? data.birthDate.toISOString().split("T")[0] : "")
  const [isLunar, setIsLunar] = useState(data.isLunar || false)

  const handleNext = () => {
    if (birthDate) {
      updateData({
        birthDate: new Date(birthDate),
        isLunar,
      })
      nextStep()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-amber-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">생년월일을 알려주세요</CardTitle>
        <p className="text-slate-600 mt-2">정확한 사주 분석을 위해 필요합니다</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="birthdate" className="text-slate-700 font-medium">
            생년월일
          </Label>
          <Input
            id="birthdate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="text-lg py-3"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-slate-700 font-medium">달력 구분</Label>
          <RadioGroup
            value={isLunar ? "lunar" : "solar"}
            onValueChange={(value) => setIsLunar(value === "lunar")}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
              <RadioGroupItem value="solar" id="solar" />
              <Label htmlFor="solar" className="flex items-center gap-2 cursor-pointer">
                <Sun className="w-4 h-4 text-amber-500" />
                양력
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-slate-50 cursor-pointer">
              <RadioGroupItem value="lunar" id="lunar" />
              <Label htmlFor="lunar" className="flex items-center gap-2 cursor-pointer">
                <Moon className="w-4 h-4 text-blue-500" />
                음력
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-3">
          <Button onClick={prevStep} variant="outline" className="flex-1 py-3 bg-transparent">
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={!birthDate}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 font-semibold"
          >
            다음
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
