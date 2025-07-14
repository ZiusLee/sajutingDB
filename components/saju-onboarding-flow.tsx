"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { calculateSaju, type TimeStandard } from "@/lib/saju"
import { solarToLunar } from "@/lib/lunar-calendar"
import { syncLocalStorageToDatabase } from "@/lib/data-sync"
import { getSupabase } from "@/lib/supabase-client"
import { updateAuthUserId } from "@/lib/db-service"
import { DEFAULT_CITY_ID, getCityById, searchCities, type CityTimezoneData } from "@/lib/city-timezone-data"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"

interface SajuOnboardingFlowProps {
  onClose: () => void
}

interface BirthInfo {
  name: string
  gender: "male" | "female" | ""
  birthPlace: string
  birthPlaceId: string
  birthDate: string
  birthTime: string
  isLunar: boolean
  concerns: string[]
}

const concernOptions = [
  { id: "love", label: "짝사랑", icon: "💕" },
  { id: "breakup", label: "이별", icon: "💔" },
  { id: "health", label: "건강", icon: "🔄" },
  { id: "marriage", label: "결혼", icon: "📞" },
  { id: "money", label: "금전", icon: "💰" },
  { id: "work", label: "학업", icon: "📚" },
  { id: "relationship", label: "연인과의 관계", icon: "💖" },
  { id: "career", label: "커리어 고민", icon: "👔" },
  { id: "job", label: "취업 준비", icon: "📋" },
  { id: "future", label: "나의 가치관", icon: "👤" },
  { id: "workplace", label: "직장 내 관계", icon: "🏢" },
  { id: "friend", label: "친구 관계", icon: "😊" },
  { id: "family", label: "가족 관계", icon: "🏠" },
]

export function SajuOnboardingFlow({ onClose }: SajuOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [birthInfo, setBirthInfo] = useState<BirthInfo>({
    name: "",
    gender: "",
    birthPlace: "",
    birthPlaceId: DEFAULT_CITY_ID,
    birthDate: "",
    birthTime: "",
    isLunar: false,
    concerns: [],
  })
  const [citySearchResults, setCitySearchResults] = useState<CityTimezoneData[]>([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleCitySearch = (value: string) => {
    setBirthInfo({ ...birthInfo, birthPlace: value })
    if (value.trim()) {
      const filtered = searchCities(value)
      setCitySearchResults(filtered)
      setShowCityDropdown(true)
    } else {
      setCitySearchResults([])
      setShowCityDropdown(false)
    }
  }

  const selectCity = (city: CityTimezoneData) => {
    setBirthInfo({
      ...birthInfo,
      birthPlace: `${city.city}, ${city.country}`,
      birthPlaceId: city.id,
    })
    setShowCityDropdown(false)
    setCitySearchResults([])
  }

  const handleConcernToggle = (concernId: string) => {
    setBirthInfo((prev) => ({
      ...prev,
      concerns: prev.concerns.includes(concernId)
        ? prev.concerns.filter((id) => id !== concernId)
        : prev.concerns.length < 3
          ? [...prev.concerns, concernId]
          : prev.concerns,
    }))
  }

  const getTimeStandardFromCity = (): TimeStandard => {
    const cityData = getCityById(birthInfo.birthPlaceId)
    return cityData?.timeStandard || "동경135도"
  }

  const parseDate = (dateStr: string) => {
    // Handle various date formats: YYYYMMDD, YYYY-MM-DD, YYYY.MM.DD, etc.
    const cleaned = dateStr.replace(/[^\d]/g, "")
    if (cleaned.length === 8) {
      const year = cleaned.substring(0, 4)
      const month = cleaned.substring(4, 6)
      const day = cleaned.substring(6, 8)
      return { year, month, day }
    }
    return null
  }

  const parseTime = (timeStr: string) => {
    // Handle various time formats: HHMM, HH:MM, etc.
    const cleaned = timeStr.replace(/[^\d]/g, "")
    if (cleaned.length >= 3) {
      const hour = Number.parseInt(cleaned.substring(0, 2), 10)
      const minute = cleaned.length >= 4 ? Number.parseInt(cleaned.substring(2, 4), 10) : 0
      return { hour: Math.max(0, Math.min(23, hour)), minute: Math.max(0, Math.min(59, minute)) }
    }
    return { hour: 12, minute: 0 }
  }

  const updateUserAuthId = async (sessionId: string) => {
    try {
      const supabaseClient = getSupabase()
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (session && session.user) {
        const authUserId = session.user.id
        const success = await updateAuthUserId(sessionId, authUserId)
        if (success) {
          console.log("Successfully updated auth_user_id for saju session:", sessionId)
        }
      }
    } catch (error) {
      console.error("Error updating auth_user_id:", error)
    }
  }

  const handleSubmit = async () => {
    if (!birthInfo.name || !birthInfo.gender || !birthInfo.birthPlace || !birthInfo.birthDate || !birthInfo.birthTime) {
      toast({
        title: "필수 정보를 입력해주세요",
        description: "모든 정보를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const parsedDate = parseDate(birthInfo.birthDate)
      const parsedTime = parseTime(birthInfo.birthTime)

      if (!parsedDate) {
        toast({
          title: "날짜 형식이 올바르지 않습니다",
          description: "YYYYMMDD 형식으로 입력해주세요 (예: 19950505)",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const { year, month, day } = parsedDate
      const { hour, minute } = parsedTime

      const timeStandard = getTimeStandardFromCity()
      const birthCityId = birthInfo.birthPlaceId

      let lunarData: any = null

      try {
        const response = await fetch("/api/lunar-date", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ year, month, day }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Response is not JSON")
        }

        lunarData = await response.json()
      } catch (apiError) {
        console.error("API error, falling back to local calculation:", apiError)
        const localLunarDate = solarToLunar(Number.parseInt(year), Number.parseInt(month), Number.parseInt(day))
        lunarData = {
          year: localLunarDate.year.toString(),
          month: localLunarDate.month.toString().padStart(2, "0"),
          day: localLunarDate.day.toString().padStart(2, "0"),
          isLeapMonth: localLunarDate.isLeapMonth,
          monthStem: localLunarDate.monthStem,
          monthBranch: localLunarDate.monthBranch,
        }
      }

      const sajuResult = calculateSaju(
        lunarData.year,
        lunarData.month,
        lunarData.day,
        hour,
        minute,
        Number.parseInt(year),
        Number.parseInt(month),
        Number.parseInt(day),
        birthInfo.gender,
        birthInfo.name,
        false,
        lunarData.isLeapMonth,
        lunarData.monthStem,
        lunarData.monthBranch,
        timeStandard,
      )

      const daeunData = calculateDaeunInfo(
        {
          yearStem: sajuResult.yearStem,
          monthStem: sajuResult.monthStem,
          monthBranch: sajuResult.monthBranch,
        },
        Number.parseInt(year),
        Number.parseInt(month),
        Number.parseInt(day),
        birthInfo.gender,
        hour,
        minute,
        false,
      )

      sajuResult.daeun = daeunData

      // Create separate saju and daeun objects
      const sajuData = {
        yearStem: sajuResult.yearStem,
        yearBranch: sajuResult.yearBranch,
        yearStemHanja: sajuResult.yearStemHanja,
        yearBranchHanja: sajuResult.yearBranchHanja,
        monthStem: sajuResult.monthStem,
        monthBranch: sajuResult.monthBranch,
        monthStemHanja: sajuResult.monthStemHanja,
        monthBranchHanja: sajuResult.monthBranchHanja,
        dayStem: sajuResult.dayStem,
        dayBranch: sajuResult.dayBranch,
        dayStemHanja: sajuResult.dayStemHanja,
        dayBranchHanja: sajuResult.dayBranchHanja,
        hourStem: sajuResult.hourStem,
        hourBranch: sajuResult.hourBranch,
        hourStemHanja: sajuResult.hourStemHanja,
        hourBranchHanja: sajuResult.hourBranchHanja,
        dayMaster: sajuResult.dayMaster,
        dayMasterHanja: sajuResult.dayMasterHanja,
        yearAnimal: sajuResult.yearAnimal,
        elements: sajuResult.elements,
        yearStemSibseong: sajuResult.yearStemSibseong,
        monthStemSibseong: sajuResult.monthStemSibseong,
        dayStemSibseong: "본원",
        hourStemSibseong: sajuResult.hourStemSibseong,
        yearBranchSibseong: sajuResult.yearBranchSibseong,
        monthBranchSibseong: sajuResult.monthBranchSibseong,
        dayBranchSibseong: sajuResult.dayBranchSibseong,
        hourBranchSibseong: sajuResult.hourBranchSibseong,
      }

      const sajuDataToStore = {
        name: birthInfo.name,
        gender: birthInfo.gender,
        relationshipStatus: "solo",
        year: Number.parseInt(year),
        month: Number.parseInt(month),
        day: Number.parseInt(day),
        hour,
        minute,
        timeUnknown: false,
        timeStandard,
        birthCityId,
        lunarYear: Number.parseInt(lunarData.year),
        lunarMonth: Number.parseInt(lunarData.month),
        lunarDay: Number.parseInt(lunarData.day),
        isLeapMonth: lunarData.isLeapMonth,
        saju: sajuData, // Store saju data as nested object
        daeun: daeunData, // Store daeun data separately
        interpretation: sajuResult.interpretation,
        concerns: birthInfo.concerns,
      }

      localStorage.setItem("tempSajuData", JSON.stringify(sajuDataToStore))
      window.sajuInfo = sajuResult
      window.sajuFullData = sajuDataToStore

      let userId: string | null = null

      try {
        const supabaseClient = getSupabase()
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()
        const authUserId = session?.user?.id || null

        userId = await syncLocalStorageToDatabase(authUserId)

        if (userId) {
          const storedData = JSON.parse(localStorage.getItem("tempSajuData") || "{}")
          storedData.userId = userId
          storedData.sessionId = userId
          localStorage.setItem("tempSajuData", JSON.stringify(storedData))
          localStorage.setItem("user_id", userId)
        }
      } catch (dbError) {
        console.error("Failed to save saju data to database:", dbError)
      }

      try {
        localStorage.setItem(
          "current_saju",
          JSON.stringify({
            saju: sajuResult,
            name: birthInfo.name,
            gender: birthInfo.gender,
            interpretation: "",
            returnPath: "/",
            timeStandard: getTimeStandardFromCity(),
            birthCityId,
            daeun: daeunData,
            concerns: birthInfo.concerns,
            birthInfo: {
              solarYear: Number.parseInt(year),
              solarMonth: Number.parseInt(month),
              solarDay: Number.parseInt(day),
              solarHour: hour,
              solarMinute: minute,
              lunarYear: Number.parseInt(lunarData.year),
              lunarMonth: Number.parseInt(lunarData.month),
              lunarDay: Number.parseInt(lunarData.day),
              timeUnknown: false,
              birthCityId: birthCityId,
              timeStandard: timeStandard,
            },
          }),
        )

        if (userId) {
          updateUserAuthId(userId)
        }

        // Go directly to saju-chat without showing toast or going to homepage
        if (sajuResult) {
          // Don't call onComplete - go directly to avoid URL flashing
          window.location.href = "/saju-chat/sajuping"
        }
      } catch (e) {
        console.error("Error storing saju data:", e)
      }
    } catch (error) {
      console.error("Error in saju calculation:", error)
      toast({
        title: "오류가 발생했습니다",
        description: "사주 계산 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return birthInfo.name.trim().length > 0
      case 2:
        return birthInfo.gender !== ""
      case 3:
        return birthInfo.birthPlace.trim().length > 0
      case 4:
        return birthInfo.birthDate.trim().length >= 8 && birthInfo.birthTime.trim().length >= 3
      case 5:
        return birthInfo.concerns.length > 0
      default:
        return false
    }
  }

  const getSelectedCityInfo = () => {
    const cityData = getCityById(birthInfo.birthPlaceId)
    if (cityData) {
      return `현재 선택: ${cityData.city}, ${cityData.country} (UTC${cityData.utcOffset >= 0 ? "+" : ""}${cityData.utcOffset})`
    }
    return ""
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
            <div className="flex justify-center mb-8">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-2 h-2 rounded-full mx-1",
                    step === currentStep ? "bg-blue-500" : step < currentStep ? "bg-blue-300" : "bg-gray-300",
                  )}
                />
              ))}
            </div>

            <h1 className="text-3xl font-bold text-blue-600 mb-12">이름을 알려주세요.</h1>

            <div className="w-full max-w-md mb-4 relative">
              <Input
                value={birthInfo.name}
                onChange={(e) => setBirthInfo({ ...birthInfo, name: e.target.value })}
                placeholder="홍길동"
                className="text-center text-lg py-4 border-2 border-dashed border-blue-300 bg-white/90 backdrop-blur-sm text-gray-800 placeholder:text-gray-500"
                style={{ borderStyle: "dotted" }}
              />
              {birthInfo.name && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>

            <p className="text-gray-500 text-sm mb-12">TIP 이름은 본명으로 작성하는 것을 추천해요.</p>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full"
            >
              다음으로 <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
            <div className="flex justify-center mb-8">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-2 h-2 rounded-full mx-1",
                    step === currentStep ? "bg-blue-500" : step < currentStep ? "bg-blue-300" : "bg-gray-300",
                  )}
                />
              ))}
            </div>

            <h1 className="text-3xl font-bold text-blue-600 mb-12">성별을 알려주세요.</h1>

            <div className="flex gap-4 mb-12">
              <button
                onClick={() => setBirthInfo({ ...birthInfo, gender: "male" })}
                className={cn(
                  "px-8 py-4 rounded-lg border-2 transition-all text-lg font-medium",
                  birthInfo.gender === "male"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-50",
                )}
              >
                남성
              </button>
              <button
                onClick={() => setBirthInfo({ ...birthInfo, gender: "female" })}
                className={cn(
                  "px-8 py-4 rounded-lg border-2 transition-all text-lg font-medium",
                  birthInfo.gender === "female"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white/80 text-gray-700 border-gray-200 hover:bg-gray-50",
                )}
              >
                여성
              </button>
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full"
            >
              다음으로 <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )

      case 3:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
            <div className="flex justify-center mb-8">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-2 h-2 rounded-full mx-1",
                    step === currentStep ? "bg-blue-500" : step < currentStep ? "bg-blue-300" : "bg-gray-300",
                  )}
                />
              ))}
            </div>

            <h1 className="text-3xl font-bold text-blue-600 mb-12">태어난 도시를 알려주세요.</h1>

            <div className="w-full max-w-md mb-4 relative">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  value={birthInfo.birthPlace ? birthInfo.birthPlace : ""}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => {
                    if (birthInfo.birthPlace.trim()) {
                      const filtered = searchCities(birthInfo.birthPlace)
                      setCitySearchResults(filtered)
                      setShowCityDropdown(true)
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding dropdown to allow for clicks
                    setTimeout(() => setShowCityDropdown(false), 200)
                  }}
                  placeholder="ex: 서울"
                  className="text-left text-lg py-4 pl-10 pr-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full text-gray-800 placeholder:text-gray-500"
                />
                {birthInfo.birthPlace && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                )}
              </div>

              {showCityDropdown && citySearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto z-10">
                  {citySearchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => selectCity(city)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-800">
                        {city.city}, {city.country}
                      </div>
                      <div className="text-sm text-gray-500">
                        UTC{city.utcOffset >= 0 ? "+" : ""}
                        {city.utcOffset}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {birthInfo.birthPlace && <p className="text-gray-500 text-sm mb-8">{getSelectedCityInfo()}</p>}

            <p className="text-gray-500 text-sm mb-12">이거는 시간 조정에 활용됩니다</p>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full"
            >
              다음으로 <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )

      case 4:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
            <div className="flex justify-center mb-8">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-2 h-2 rounded-full mx-1",
                    step === currentStep ? "bg-blue-500" : step < currentStep ? "bg-blue-300" : "bg-gray-300",
                  )}
                />
              ))}
            </div>

            <h1 className="text-3xl font-bold text-blue-600 mb-12">태어난 일시를 알려주세요.</h1>

            <div className="flex gap-4 mb-4 max-w-md w-full">
              <Input
                value={birthInfo.birthDate}
                onChange={(e) => setBirthInfo({ ...birthInfo, birthDate: e.target.value })}
                placeholder="생년월일: ex: 19950505"
                className="flex-1 text-center bg-white/90 backdrop-blur-sm rounded-full py-4 text-gray-800 placeholder:text-gray-500"
              />

              <Input
                value={birthInfo.birthTime}
                onChange={(e) => setBirthInfo({ ...birthInfo, birthTime: e.target.value })}
                placeholder="태어난 시간: ex: 0930"
                className="flex-1 text-center bg-white/90 backdrop-blur-sm rounded-full py-4 text-gray-800 placeholder:text-gray-500"
              />
            </div>

            <div className="flex items-center gap-2 mb-12">
              <input
                type="checkbox"
                id="isLunar"
                checked={birthInfo.isLunar}
                onChange={(e) => setBirthInfo({ ...birthInfo, isLunar: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isLunar" className="text-gray-600">
                태어난 시간 모름 ☐
              </label>
            </div>

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full"
            >
              다음으로 <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )

      case 5:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
            <div className="flex justify-center mb-8">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-2 h-2 rounded-full mx-1",
                    step === currentStep ? "bg-blue-500" : step < currentStep ? "bg-blue-300" : "bg-gray-300",
                  )}
                />
              ))}
            </div>

            <h1 className="text-3xl font-bold text-blue-600 mb-4">마지막으로, 최근 가장 큰 고민을 알려주세요</h1>

            <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-4xl">
              {concernOptions.map((concern) => (
                <button
                  key={concern.id}
                  onClick={() => handleConcernToggle(concern.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                    birthInfo.concerns.includes(concern.id)
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <span>{concern.icon}</span>
                  <span>{concern.label}</span>
                </button>
              ))}
            </div>

            <p className="text-gray-500 text-sm mb-12">TIP 최대 3개까지 고를 수 있어요.</p>

            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
              className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-full"
            >
              {isLoading ? "생성 중..." : "완료하기"} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-200 via-pink-200 via-blue-200 to-green-200"
        style={{
          background: "linear-gradient(135deg, #e0c3fc 0%, #9bb5ff 25%, #a8edea 50%, #fed6e3 75%, #d299c2 100%)",
        }}
      />

      {/* Logo */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg"></div>
          <span className="font-bold text-lg">SAJUPING</span>
        </div>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 bg-gray-800 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-700 transition-colors"
      >
        로그인
      </button>

      {/* Content */}
      <div className="relative z-10">{renderStep()}</div>
    </div>
  )
}
