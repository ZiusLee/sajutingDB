"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { User } from "lucide-react"

export function StepGender() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [gender, setGender] = useState<"male" | "female" | null>(data.gender || null)

  const handleNext = () => {
    if (gender) {
      updateData({ gender })
      nextStep()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-purple-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">성별을 선택해주세요</CardTitle>
        <p className="text-slate-600 mt-2">사주 해석에 필요한 정보입니다</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              gender === "male" ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-slate-50"
            }`}
            onClick={() => setGender("male")}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">👨</div>
              <p className="font-semibold text-slate-800">남성</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              gender === "female" ? "ring-2 ring-pink-500 bg-pink-50" : "hover:bg-slate-50"
            }`}
            onClick={() => setGender("female")}
          >
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">👩</div>
              <p className="font-semibold text-slate-800">여성</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button onClick={prevStep} variant="outline" className="flex-1 py-3 bg-transparent">
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={!gender}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 font-semibold"
          >
            다음
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
