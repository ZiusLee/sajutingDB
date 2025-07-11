"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Clock } from "lucide-react"

export function StepBirthTime() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [birthTime, setBirthTime] = useState(data.birthTime || "")
  const [isUnknown, setIsUnknown] = useState(!data.birthTime)

  const handleNext = () => {
    updateData({
      birthTime: isUnknown ? undefined : birthTime,
    })
    nextStep()
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">출생시간을 알려주세요</CardTitle>
        <p className="text-slate-600 mt-2">더 정확한 분석을 위해 필요합니다</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="birthtime" className="text-slate-700 font-medium">
            출생시간
          </Label>
          <Input
            id="birthtime"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            disabled={isUnknown}
            className="text-lg py-3"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="unknown"
            checked={isUnknown}
            onCheckedChange={(checked) => {
              setIsUnknown(checked as boolean)
              if (checked) setBirthTime("")
            }}
          />
          <Label htmlFor="unknown" className="text-slate-600 cursor-pointer">
            출생시간을 모르겠어요
          </Label>
        </div>

        {isUnknown && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              💡 출생시간을 모르셔도 기본적인 사주 분석이 가능합니다. 다만 시주(時柱) 분석은 제외됩니다.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={prevStep} variant="outline" className="flex-1 py-3 bg-transparent">
            이전
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 font-semibold"
          >
            다음
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
