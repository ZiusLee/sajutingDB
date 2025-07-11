"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Heart, Briefcase, GraduationCap, Building, Activity, Users } from "lucide-react"
import { useRouter } from "next/navigation"

const INTEREST_OPTIONS = [
  { id: "career", label: "취업/직업", icon: Briefcase, color: "blue" },
  { id: "love", label: "연애/사랑", icon: Heart, color: "pink" },
  { id: "marriage", label: "결혼/가정", icon: Users, color: "purple" },
  { id: "business", label: "사업/투자", icon: Building, color: "green" },
  { id: "health", label: "건강/운동", icon: Activity, color: "red" },
  { id: "study", label: "학업/시험", icon: GraduationCap, color: "amber" },
]

export function StepInterests() {
  const router = useRouter()
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [interests, setInterests] = useState<string[]>(data.interests || [])

  const toggleInterest = (interestId: string) => {
    setInterests((prev) => (prev.includes(interestId) ? prev.filter((id) => id !== interestId) : [...prev, interestId]))
  }

  const handleNext = () => {
    updateData({ interests })
    // 결과 페이지로 이동
    router.push("/onboarding/result")
  }

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors = {
      blue: isSelected ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-blue-50",
      pink: isSelected ? "ring-2 ring-pink-500 bg-pink-50" : "hover:bg-pink-50",
      purple: isSelected ? "ring-2 ring-purple-500 bg-purple-50" : "hover:bg-purple-50",
      green: isSelected ? "ring-2 ring-green-500 bg-green-50" : "hover:bg-green-50",
      red: isSelected ? "ring-2 ring-red-500 bg-red-50" : "hover:bg-red-50",
      amber: isSelected ? "ring-2 ring-amber-500 bg-amber-50" : "hover:bg-amber-50",
    }
    return colors[color as keyof typeof colors] || ""
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800">관심 있는 주제를 선택해주세요</CardTitle>
        <p className="text-slate-600 mt-2">맞춤형 상담을 위해 알려주세요 (복수 선택 가능)</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {INTEREST_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = interests.includes(option.id)

            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${getColorClasses(option.color, isSelected)}`}
                onClick={() => toggleInterest(option.id)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 text-${option.color}-600`} />
                  <p className="text-sm font-medium text-slate-800">{option.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center text-sm text-slate-500">
          {interests.length > 0 && <p>{interests.length}개 주제를 선택했습니다</p>}
        </div>

        <div className="flex gap-3">
          <Button onClick={prevStep} variant="outline" className="flex-1 py-3 bg-transparent">
            이전
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 font-semibold"
          >
            완료
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
