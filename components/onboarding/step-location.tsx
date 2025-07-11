"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { MapPin } from "lucide-react"

const POPULAR_LOCATIONS = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원도",
  "충청북도",
  "충청남도",
  "전라북도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
]

export function StepLocation() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [birthPlace, setBirthPlace] = useState(data.birthPlace || "")
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredLocations = POPULAR_LOCATIONS.filter((location) =>
    location.toLowerCase().includes(birthPlace.toLowerCase()),
  )

  const handleNext = () => {
    if (birthPlace.trim()) {
      updateData({ birthPlace: birthPlace.trim() })
      nextStep()
    }
  }

  const selectLocation = (location: string) => {
    setBirthPlace(location)
    setShowSuggestions(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-800">출생지역을 알려주세요</CardTitle>
        <p className="text-slate-600 mt-2">지역별 시차 보정을 위해 필요합니다</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 relative">
          <Label htmlFor="location" className="text-slate-700 font-medium">
            출생지역
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="예: 서울특별시, 부산광역시"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="text-lg py-3"
          />

          {showSuggestions && filteredLocations.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredLocations.map((location) => (
                <button
                  key={location}
                  onClick={() => selectLocation(location)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700"
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {POPULAR_LOCATIONS.slice(0, 6).map((location) => (
            <Button
              key={location}
              variant="outline"
              size="sm"
              onClick={() => selectLocation(location)}
              className="text-xs"
            >
              {location}
            </Button>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={prevStep} variant="outline" className="flex-1 py-3 bg-transparent">
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={!birthPlace.trim()}
            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 font-semibold"
          >
            다음
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
