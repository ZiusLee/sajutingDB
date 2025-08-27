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
import { DEFAULT_CITY_ID, getCityById, searchCities, type CityTimezoneData } from "@/lib/city-timezone-data"
import { calculateDaeunInfo } from "@/lib/daeun-calculator"
import { SajuLogo } from "./saju-logo"
import { Checkbox } from "@/components/ui/checkbox"
import { getSupabase } from "@/lib/supabase-client"
import { trackEvent } from "@/lib/analytics"

interface BirthInfo {
  name: string
  gender: "male" | "female" | ""
  birthPlace: string
  birthPlaceId: string
  birthDate: string
  birthTime: string
  timeUnknown: boolean
  concerns: string[]
}

const concernOptions = [
  { id: "love", label: "짝사랑", icon: "💕" },
  { id: "breakup", label: "이별", icon: "💔" },
  { id: "health", label: "건강", icon: "🏥" },
  { id: "marriage", label: "결혼", icon: "💍" },
  { id: "money", label: "금전", icon: "💰" },
  { id: "work", label: "학업", icon: "📚" },
  { id: "relationship", label: "연인과의 관계", icon: "💖" },
  { id: "career", label: "커리어 고민", icon: "👔" },
  { id: "job", label: "취업 준비", icon: "💼" },
  { id: "future", label: "나의 가치관", icon: "🤔" },
  { id: "workplace", label: "직장 내 관계", icon: "🏢" },
  { id: "friend", label: "친구 관계", icon: "👥" },
  { id: "family", label: "가족 관계", icon: "👨‍👩‍👧‍👦" },
]

export function SajuCreateFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [birthInfo, setBirthInfo] = useState<BirthInfo>({
    name: "",
    gender: "",
    birthPlace: "",
    birthPlaceId: DEFAULT_CITY_ID,
    birthDate: "",
    birthTime: "",
    timeUnknown: false,
    concerns: [],
  })
  const [citySearchQuery, setCitySearchQuery] = useState("")
  const [citySearchResults, setCitySearchResults] = useState<CityTimezoneData[]>([])
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const router = useRouter()
  const supabase = getSupabase()

  useState(() => {
    trackEvent("saju_create_started", {
      entry_point: "saju_create_page",
      user_type: "authenticated",
    })
  })

  const handleNext = () => {
    if (currentStep < 5) {
      trackEvent("saju_create_step_completed", {
        step: currentStep,
        step_name: getStepName(currentStep),
        data_entered: getStepData(currentStep),
      })

      setCurrentStep(currentStep + 1)

      trackEvent("saju_create_step_started", {
        step: currentStep + 1,
        step_name: getStepName(currentStep + 1),
      })
    }
  }

  const getStepName = (step: number) => {
    const stepNames = ["", "name_input", "gender_selection", "birth_place", "birth_datetime", "concerns_selection"]
    return stepNames[step] || "unknown"
  }

  const getStepData = (step: number) => {
    switch (step) {
      case 1:
        return { name_length: birthInfo.name.length }
      case 2:
        return { gender: birthInfo.gender }
      case 3:
        return { birth_place: birthInfo.birthPlace }
      case 4:
        return {
          has_date: !!birthInfo.birthDate,
          has_time: !!birthInfo.birthTime,
          time_unknown: birthInfo.timeUnknown,
        }
      case 5:
        return { concerns_count: birthInfo.concerns.length }
      default:
        return {}
    }
  }

  const handleCitySearch = (value: string) => {
    setCitySearchQuery(value)
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
    setCitySearchQuery(`${city.city}, ${city.country}`)
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

  const handleTimeUnknownToggle = (checked: boolean) => {
    setBirthInfo((prev) => ({
      ...prev,
      timeUnknown: checked,
      birthTime: checked ? "" : prev.birthTime,
    }))
  }

  const getTimeStandardFromCity = (): TimeStandard => {
    const cityData = getCityById(birthInfo.birthPlaceId)
    return cityData?.timeStandard || "동경135도"
  }

  const parseDate = (dateStr: string) => {
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
    const cleaned = timeStr.replace(/[^\d]/g, "")
    if (cleaned.length >= 3) {
      const hour = Number.parseInt(cleaned.substring(0, 2), 10)
      const minute = cleaned.length >= 4 ? Number.parseInt(cleaned.substring(2, 4), 10) : 0
      return { hour: Math.max(0, Math.min(23, hour)), minute: Math.max(0, Math.min(59, minute)) }
    }
    return { hour: 12, minute: 0 }
  }

  const handleSubmit = async () => {
    if (!birthInfo.name || !birthInfo.gender || !birthInfo.birthPlaceId || !birthInfo.birthDate) {
      toast({ title: "필수 정보를 입력해주세요", variant: "destructive" })
      return
    }
    if (!birthInfo.timeUnknown && !birthInfo.birthTime) {
      toast({ title: "태어난 시간을 입력해주세요", variant: "destructive" })
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        toast({ title: "인증이 필요합니다", variant: "destructive" })
        router.push("/login")
        return
      }

      const parsedDate = parseDate(birthInfo.birthDate)
      const parsedTime = birthInfo.timeUnknown ? { hour: 12, minute: 0 } : parseTime(birthInfo.birthTime)

      if (!parsedDate) {
        toast({ title: "날짜 형식이 올바르지 않습니다", variant: "destructive" })
        setIsLoading(false)
        return
      }

      const { year, month, day } = parsedDate
      const { hour, minute } = parsedTime
      const timeStandard = getTimeStandardFromCity()
      const localLunarDate = solarToLunar(Number.parseInt(year), Number.parseInt(month), Number.parseInt(day))
      const lunarData = {
        year: localLunarDate.year.toString(),
        month: localLunarDate.month.toString().padStart(2, "0"),
        day: localLunarDate.day.toString().padStart(2, "0"),
        isLeapMonth: localLunarDate.isLeapMonth,
        monthStem: localLunarDate.monthStem,
        monthBranch: localLunarDate.monthBranch,
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
        birthInfo.timeUnknown,
        lunarData.isLeapMonth,
        lunarData.monthStem,
        lunarData.monthBranch,
        timeStandard,
      )

      const daeunData = calculateDaeunInfo(
        { yearStem: sajuResult.yearStem, monthStem: sajuResult.monthStem, monthBranch: sajuResult.monthBranch },
        Number.parseInt(year),
        Number.parseInt(month),
        Number.parseInt(day),
        birthInfo.gender,
        hour,
        minute,
        birthInfo.timeUnknown,
      )
      sajuResult.daeun = daeunData

      const sajuDataToStore = {
        name: birthInfo.name,
        gender: birthInfo.gender,
        relationshipStatus: "solo",
        year: Number.parseInt(year),
        month: Number.parseInt(month),
        day: Number.parseInt(day),
        hour,
        minute,
        timeUnknown: birthInfo.timeUnknown,
        timeStandard,
        birthCityId: birthInfo.birthPlaceId,
        lunarYear: Number.parseInt(lunarData.year),
        lunarMonth: Number.parseInt(lunarData.month),
        lunarDay: Number.parseInt(lunarData.day),
        isLeapMonth: lunarData.isLeapMonth,
        ...sajuResult,
        concerns: birthInfo.concerns,
      }

      // Store in localStorage for later use
      localStorage.setItem("tempSajuData", JSON.stringify(sajuDataToStore))
      window.sajuInfo = sajuResult
      window.sajuFullData = sajuDataToStore

      // Prepare chat data
      const chatSajuData = {
        saju: sajuResult,
        name: birthInfo.name,
        gender: birthInfo.gender,
        interpretation: "",
        returnPath: "/",
        timeStandard: getTimeStandardFromCity(),
        birthCityId: birthInfo.birthPlaceId,
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
          timeUnknown: birthInfo.timeUnknown,
          birthCityId: birthInfo.birthPlaceId,
          timeStandard: getTimeStandardFromCity(),
        },
      }

      try {
        console.log("Creating saju_session for authenticated user with is_default: true")
        const userId = await syncLocalStorageToDatabase(session.user.id) // authenticated user

        if (userId) {
          console.log("Successfully created saju session with ID:", userId)

          trackEvent("CONVERSION_saju_profile_complete", {
            profile_name: birthInfo.name,
            gender: birthInfo.gender,
            birth_place: birthInfo.birthPlace,
            time_unknown: birthInfo.timeUnknown,
            concerns_count: birthInfo.concerns.length,
            concerns: birthInfo.concerns,
            user_type: "authenticated",
          })

          trackEvent("saju_create_completed", {
            completion_time: Date.now(),
            profile_created: true,
            session_id: userId,
          })

          // Update chat data with the session ID and user info
          const finalChatSajuData = {
            ...chatSajuData,
            sessionId: userId,
            userId: session.user.id,
            authUserId: session.user.id,
          }

          localStorage.setItem("current_saju", JSON.stringify(finalChatSajuData))
          localStorage.setItem("saju_session_id", userId)
          localStorage.removeItem("tempSajuData")

          console.log("Saju session created, redirecting to chat")
          toast({
            title: "사주 프로필 생성 완료",
            description: "사주 채팅을 시작할 수 있습니다.",
          })

          router.push("/saju-chat/sajuping")
        } else {
          console.error("Failed to create saju session")

          trackEvent("saju_create_abandoned", {
            step: 5,
            step_name: "saju_calculation",
            reason: "database_error",
          })

          toast({
            title: "데이터 저장 실패",
            description: "사주 정보 저장에 실패했습니다.",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error creating saju session:", error)

        trackEvent("saju_create_abandoned", {
          step: 5,
          step_name: "saju_calculation",
          reason: "calculation_error",
          error: error.message,
        })

        toast({
          title: "오류 발생",
          description: "사주 세션 생성 중 오류가 발생했습니다.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error in saju calculation:", error)

      trackEvent("saju_create_abandoned", {
        step: 5,
        step_name: "saju_calculation",
        reason: "calculation_error",
        error: error.message,
      })

      toast({ title: "사주 계산 중 오류가 발생했습니다.", variant: "destructive" })
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    trackEvent("saju_create_abandoned", {
      step: currentStep,
      step_name: getStepName(currentStep),
      reason: "user_closed",
    })
    router.push("/")
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return birthInfo.name.trim().length > 0
      case 2:
        return birthInfo.gender !== ""
      case 3:
        return birthInfo.birthPlaceId.trim().length > 0
      case 4:
        return (
          birthInfo.birthDate.replace(/[^\d]/g, "").length === 8 &&
          (birthInfo.timeUnknown || birthInfo.birthTime.replace(/[^\d]/g, "").length >= 3)
        )
      case 5:
        return birthInfo.concerns.length > 0
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="w-full max-w-sm flex flex-col items-center">
            <h1 className="text-3xl font-bold text-foreground mb-8">이름을 알려주세요.</h1>
            <Input
              value={birthInfo.name}
              onChange={(e) => setBirthInfo({ ...birthInfo, name: e.target.value })}
              placeholder="홍길동"
              className="h-12 text-center text-lg bg-white border-gray-300 rounded-lg w-full mb-4"
            />
            <p className="text-muted-foreground text-sm">TIP: 이름은 본명으로 작성하는 것을 추천해요.</p>
            <div className="w-full max-w-xs mt-8">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full h-12 text-lg rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                다음으로 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="w-full max-w-sm flex flex-col items-center">
            <h1 className="text-3xl font-bold text-foreground mb-8">성별을 알려주세요.</h1>
            <div className="flex gap-4 w-full">
              <Button
                onClick={() => setBirthInfo({ ...birthInfo, gender: "male" })}
                variant={birthInfo.gender === "male" ? "default" : "outline"}
                className="w-full h-12 text-lg rounded-lg"
              >
                남성
              </Button>
              <Button
                onClick={() => setBirthInfo({ ...birthInfo, gender: "female" })}
                variant={birthInfo.gender === "female" ? "default" : "outline"}
                className="w-full h-12 text-lg rounded-lg"
              >
                여성
              </Button>
            </div>
            <div className="w-full max-w-xs mt-8">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full h-12 text-lg rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                다음으로 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="w-full max-w-sm flex flex-col items-center">
            <h1 className="text-3xl font-bold text-foreground mb-8">태어난 도시를 알려주세요.</h1>
            <div className="w-full relative">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  value={citySearchQuery}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => setShowCityDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                  placeholder="ex: 서울"
                  className="h-12 text-left pl-10 pr-10 bg-white border-gray-300 rounded-lg w-full"
                />
                {birthInfo.birthPlaceId && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {showCityDropdown && citySearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-60 overflow-y-auto z-10">
                  {citySearchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => selectCity(city)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100"
                    >
                      <div className="font-medium">
                        {city.city}, {city.country}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        UTC{city.utcOffset >= 0 ? "+" : ""}
                        {city.utcOffset}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-4">정확한 시간 계산에 활용돼요.</p>
            <div className="w-full max-w-xs mt-8">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full h-12 text-lg rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                다음으로 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )
      case 4:
        return (
          <div className="w-full max-w-sm flex flex-col items-center">
            <h1 className="text-3xl font-bold text-foreground mb-8">태어난 일시를 알려주세요.</h1>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Input
                value={birthInfo.birthDate}
                onChange={(e) => setBirthInfo({ ...birthInfo, birthDate: e.target.value })}
                placeholder="생년월일 (ex: 19950505)"
                className="h-12 text-center bg-white border-gray-300 rounded-lg"
              />
              <Input
                value={birthInfo.birthTime}
                onChange={(e) => setBirthInfo({ ...birthInfo, birthTime: e.target.value })}
                placeholder="태어난 시간 (ex: 0930)"
                disabled={birthInfo.timeUnknown}
                className={cn(
                  "h-12 text-center bg-white border-gray-300 rounded-lg",
                  birthInfo.timeUnknown && "opacity-50 cursor-not-allowed",
                )}
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <Checkbox id="timeUnknown" checked={birthInfo.timeUnknown} onCheckedChange={handleTimeUnknownToggle} />
              <label
                htmlFor="timeUnknown"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer"
              >
                태어난 시간 모름
              </label>
            </div>
            <div className="w-full max-w-xs mt-8">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="w-full h-12 text-lg rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                다음으로 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )
      case 5:
        return (
          <div className="w-full max-w-sm flex flex-col items-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">마지막으로, 최근 가장 큰 고민을 알려주세요.</h1>
            <p className="text-muted-foreground text-sm mb-8">최대 3개까지 고를 수 있어요.</p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {concernOptions.map((c) => (
                <Button
                  key={c.id}
                  onClick={() => handleConcernToggle(c.id)}
                  variant={birthInfo.concerns.includes(c.id) ? "default" : "outline"}
                  className="rounded-full"
                >
                  <span className="mr-2">{c.icon}</span>
                  {c.label}
                </Button>
              ))}
            </div>
            <div className="w-full max-w-xs">
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isLoading}
                className="w-full h-12 text-lg rounded-full bg-gray-800 hover:bg-gray-700 text-white"
              >
                {isLoading ? "생성 중..." : "완료하기"} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="fixed inset-0 bg-cover bg-center bg-no-repeat z-50 flex flex-col"
      style={{ backgroundImage: "url(/images/gradient-background.jpeg)" }}
    >
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center">
        <SajuLogo size="md" />
        <div className="flex items-center gap-4"></div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-20">
        <div className="flex justify-center mb-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={cn(
                "w-2 h-2 rounded-full mx-1 transition-colors",
                step === currentStep ? "bg-gray-800" : step < currentStep ? "bg-gray-600" : "bg-gray-300",
              )}
            />
          ))}
        </div>
        {renderStepContent()}
      </main>
    </div>
  )
}
