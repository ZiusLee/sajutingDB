"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboardingStore } from "@/stores/onboarding-store"

export function StepName() {
  const { data, updateData, nextStep } = useOnboardingStore()
  const [name, setName] = useState(data.name || "")

  const handleNext = () => {
    if (name.trim()) {
      updateData({ name: name.trim() })
      nextStep()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold text-slate-800">안녕하세요! 👋</CardTitle>
        <p className="text-slate-600 mt-2">먼저 성함을 알려주세요</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-700 font-medium">
            이름
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg py-3"
            autoFocus
          />
        </div>
        <Button
          onClick={handleNext}
          disabled={!name.trim()}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 text-lg font-semibold rounded-lg"
        >
          다음 단계
        </Button>
      </CardContent>
    </Card>
  )
}
