"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon, Loader2, AlertCircle } from "lucide-react"
import { fetchLunarDate } from "@/lib/api-client"
import { calculateSaju, type TimeStandard } from "@/lib/saju"
import { solarToLunar } from "@/lib/lunar-calendar"
import { syncLocalStorageToDatabase } from "@/lib/data-sync"
import { useToast } from "@/components/ui/use-toast"
import { getSupabase } from "@/lib/supabase-client"
import { updateAuthUserId } from "@/lib/db-service"
import { CitySearch } from "@/components/city-search"
import { DEFAULT_CITY_ID, getCityById } from "@/lib/city-timezone-data"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function BirthDateFormClient() {
  const [birthdate, setBirthdate] = useState("")
  const [time, setTime] = useState<string>("")
  const [timeUnknown, setTimeUnknown] = useState(false)
  const [name, setName] = useState<string>("")
  const [gender, setGender] = useState<string>("female")
  const [relationshipStatus, setRelationshipStatus] = useState<string>("solo")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saju, setSaju] = useState<any>(null)
  const [lunarDate, setLunarDate] = useState<any>(null)
  const [detailedInterpretation, setDetailedInterpretation] = useState<string | null>(null)
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false)
  const [loadingStage, setLoadingStage] = useState("준비 중")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedModel, setSelectedModel] = useState<string>("openai")
  const [interpretationResults, setInterpretationResults] = useState<{
    interpretation: string | null
    model: string
    responseTime: string
    fallbackFromOpenAI?: boolean
  } | null>(null)
  const [loadingTimeLeft, setLoadingTimeLeft] = useState<number>(60)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [authUser, setAuthUser] = useState<any>(null) // Add authUser state
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(false)
  const [isBetaSubmitting, setIsBetaSubmitting] = useState<boolean>(false)
  const [betaEmail, setBetaEmail] = useState<string>("")
  const [betaPhone, setBetaPhone] = useState<string>("")
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false)
  const [birthCityId, setBirthCityId] = useState<string>(DEFAULT_CITY_ID) // 기본값: 서울

  const { toast } = useToast()
  const router = useRouter()

  // 선택된 도시에 따른 시간 기준 가져오기
  const getTimeStandardFromCity = (): TimeStandard => {
    const cityData = getCityById(birthCityId)
    return cityData?.timeStandard || "동경135도" // 기본값: 동경135도
  }

  // Find the useEffect hook that checks authentication or add it if it doesn't exist
  // Add this useEffect after the state declarations and before the handleSubmit function

  useEffect(() => {
    // Check if user is authenticated with Supabase
    const checkAuthAndLinkData = async () => {
      try {
        console.log("Checking authentication status...")
        const supabaseClient = getSupabase()
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (session && session.user) {
          console.log("User is authenticated with Supabase:", session.user.id)
          setAuthUser(session.user)
        } else {
          console.log("User is not authenticated with Supabase")
        }
      } catch (error) {
        console.error("Error checking auth and linking data:", error)
      }
    }

    checkAuthAndLinkData()
  }, [])

  // This part is different.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!birthdate) {
      setError("생년월일을 입력해주세요 (YYYYMMDD 형식).")
      return
    }

    // Verify the basic YYYYMMDD format
    const datePattern = /^\d{8}$/ // Regular expression to match YYYYMMDD format
    if (!datePattern.test(birthdate)) {
      setError("생년월일 형식이 올바르지 않습니다. YYYYMMDD 형식으로 입력해주세요.")
      return
    }

    const year = birthdate.substring(0, 4)
    const month = birthdate.substring(4, 6)
    const day = birthdate.substring(6, 8)

    if (!year || !month || !day) return

    setIsSubmitting(true)
    setError(null)
    setSaju(null)
    setLunarDate(null)
    setDetailedInterpretation(null)
    setIsLoadingInterpretation(false)

    // 선택된 도시에 따른 시간 기준 가져오기
    const timeStandard = getTimeStandardFromCity()
    const cityData = getCityById(birthCityId)

    // Declare sajuResult outside the try block
    let sajuResult: any
    let userId: string | null = null

    try {
      // 시간 파싱 - 시간을 모르는 경우 기본값 사용
      let hour = 0
      let minute = 0

      if (!timeUnknown) {
        const parsedTime = parseTimeInput(time)
        hour = parsedTime.hour
        minute = parsedTime.minute
      }

      let lunarData

      try {
        // 음력 날짜 정보 가져오기 (API 호출)
        lunarData = await fetchLunarDate(year, month, day)
      } catch (apiError) {
        console.error("API error, falling back to local calculation:", apiError)

        // API 호출 실패 시 로컬 계산으로 대체
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

      setLunarDate(lunarData)

      // 사주 계산 - 성별 정보 추가
      sajuResult = calculateSaju(
        lunarData.year,
        lunarData.month,
        lunarData.day,
        hour,
        minute,
        Number.parseInt(year),
        Number.parseInt(month),
        Number.parseInt(day),
        gender,
        name,
        timeUnknown,
        lunarData.isLeapMonth,
        lunarData.monthStem,
        lunarData.monthBranch,
        timeStandard,
      )

      // handleSubmit 함수 내에서 사주 계산 후 데이터베이스에 저장하는 코드 추가
      // setSaju(sajuResult) 바로 다음에 추가:

      setSaju(sajuResult)

      // Store calculation data in localStorage for later use
      const sajuDataToStore = {
        name,
        gender,
        relationshipStatus,
        year: Number.parseInt(year),
        month: Number.parseInt(month),
        day: Number.parseInt(day),
        hour,
        minute,
        timeUnknown,
        timeStandard,
        birthCityId,
        lunarYear: Number.parseInt(lunarData.year),
        lunarMonth: Number.parseInt(lunarData.month),
        lunarDay: Number.parseInt(lunarData.day),
        yearStem: sajuResult.yearStem,
        yearBranch: sajuResult.yearBranch,
        monthStem: sajuResult.monthStem,
        monthBranch: sajuResult.monthBranch,
        dayStem: sajuResult.dayStem,
        dayBranch: sajuResult.dayBranch,
        hourStem: sajuResult.hourStem,
        hourBranch: sajuResult.hourBranch,
        elements: sajuResult.elements,
        interpretation: sajuResult.interpretation,
        yearStemSibseong: sajuResult.yearStemSibseong,
        monthStemSibseong: sajuResult.monthStemSibseong,
        dayStemSibseong: sajuResult.dayStemSibseong,
        hourStemSibseong: sajuResult.hourStemSibseong,
      }

      console.log("Storing saju data to localStorage:", sajuDataToStore)
      localStorage.setItem("tempSajuData", JSON.stringify(sajuDataToStore))

      // Add a flag to indicate we should auto-fetch the interpretation
      localStorage.setItem("autoFetchInterpretation", "true")

      // 전역 변수에도 저장
      window.sajuInfo = sajuResult
      window.sajuFullData = sajuDataToStore

      // 데이터베이스에 즉시 저장 시도
      try {
        console.log("Attempting to save saju data to database...")

        // Pass authUserId to syncLocalStorageToDatabase
        const authUserId = authUser?.id || null
        userId = await syncLocalStorageToDatabase(authUserId)

        if (userId) {
          console.log("Successfully saved saju data to database with user ID:", userId)
          // 사용자 ID를 localStorage에 저장
          const storedData = JSON.parse(localStorage.getItem("tempSajuData") || "{}")
          storedData.userId = userId
          localStorage.setItem("tempSajuData", JSON.stringify(storedData))
          localStorage.setItem("user_id", userId) // Store user ID in standard location
        } else {
          console.warn("Failed to get user ID when saving saju data")
        }
      } catch (dbError) {
        console.error("Failed tosave saju data to database:", dbError)
        // 실패해도 계속 진행 (나중에 다시 시도)
      }

      // Construct the URL with the required parameters
      // const url = `/result?date=${birthdate}&hour=${hour}&minute=${minute}&timeUnknown=${timeUnknown}&name=${encodeURIComponent(name || "")}&gender=${encodeURIComponent(gender || "")}&birthCityId=${encodeURIComponent(birthCityId)}`

      // Navigate directly to saju chat
      router.push("/saju-chat/sajuping")
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
      console.error("Error:", err)
    } finally {
      setIsSubmitting(false)
      // Store the current saju data in localStorage for later use
      try {
        localStorage.setItem(
          "current_saju",
          JSON.stringify({
            saju: sajuResult,
            name: name,
            gender: gender,
            interpretation: detailedInterpretation || "",
            returnPath: router.asPath,
            timeStandard: getTimeStandardFromCity(),
            birthCityId,
          }),
        )

        // After successfully retrieving all results, update the auth_user_id if we have a userId
        if (userId && authUser) {
          updateUserAuthId(userId)
        }
      } catch (e) {
        console.error("Error storing saju data:", e)
      }
    }
  }

  const handleBetaSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!privacyConsent) {
      toast({
        title: "개인정보 동의 필요",
        description: "개인정보 수집 및 이용에 동의해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsBetaSubmitting(true)

    try {
      // Get the current saju data from localStorage or create a new object
      const tempSajuData = localStorage.getItem("tempSajuData")
      const sajuData = tempSajuData ? JSON.parse(tempSajuData) : {}

      // Update with email and phone
      sajuData.email = betaEmail
      sajuData.phone = betaPhone

      // Save back to localStorage
      localStorage.setItem("tempSajuData", JSON.stringify(sajuData))

      // Prepare user data for API
      const userData = {
        name: name || "Anonymous User",
        email: betaEmail,
        phone: betaPhone,
        gender: gender || "unknown",
        relationshipStatus: relationshipStatus || "unknown",
        privacyConsent: privacyConsent,
        selectedServices: ["사주 분석"],
      }

      // Call the beta signup API
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userData }),
      })

      const betaResult = await response.json()

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "베타 신청 중 오류가 발생했습니다.")
      }

      // Show success dialog
      setShowSuccessDialog(true)

      // Update user ID in localStorage if available
      if (betaResult.userId) {
        const storedData = JSON.parse(localStorage.getItem("tempSajuData") || "{}")
        storedData.userId = betaResult.userId
        localStorage.setItem("tempSajuData", JSON.stringify(storedData))

        // Also update auth_user_id if the user is authenticated
        updateUserAuthId(betaResult.userId)
      }

      // Reset form
      setBetaEmail("")
      setBetaPhone("")
      setPrivacyConsent(false)
    } catch (error: any) {
      console.error("Error submitting beta signup:", error)
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsBetaSubmitting(false)
    }
  }

  // 현재 연도부터 1900년까지의 연도 배열 생성
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => (currentYear - i).toString())

  // 월 배열 생성 (01-12)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  // 일 배열 생성 (01-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"))

  // 시간 입력값 파싱 함수
  const parseTimeInput = (input: string): { hour: number; minute: number } => {
    // 기본값
    let hour = 0
    let minute = 0

    // 입력값이 없는 경우
    if (!input.trim()) {
      return { hour, minute }
    }

    // 콜론(:)이 포함된 경우 (예: "23:30")
    if (input.includes(":")) {
      const [hourStr, minuteStr] = input.split(":")
      hour = Number.parseInt(hourStr, 10)
      minute = Number.parseInt(minuteStr, 10)
    }
    // 4자리 숫자인 경우 (예: "2330")
    else if (input.length === 4) {
      hour = Number.parseInt(input.substring(0, 2), 10)
      minute = Number.parseInt(input.substring(2), 10)
    }
    // 1-2자리 숫자인 경우 (예: "23")
    else {
      hour = Number.parseInt(input, 10)
      minute = 0
    }

    // 유효성 검사
    if (isNaN(hour)) hour = 0
    if (isNaN(minute)) minute = 0

    // 범위 제한
    hour = Math.max(0, Math.min(23, hour))
    minute = Math.max(0, Math.min(59, minute))

    return { hour, minute }
  }

  // Function to update auth_user_id in the database
  const updateUserAuthId = async (sessionId: string) => {
    try {
      // Check if user is authenticated with Supabase Auth
      const supabaseClient = getSupabase()
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (session && session.user) {
        const authUserId = session.user.id
        console.log("Updating saju session auth_user_id:", sessionId, "with auth user ID:", authUserId)

        // Update the saju_sessions record with the auth_user_id
        const success = await updateAuthUserId(sessionId, authUserId)

        if (success) {
          console.log("Successfully updated auth_user_id for saju session:", sessionId)
          toast({
            title: "계정 연결 완료",
            description: "사용자 계정이 성공적으로 연결되었습니다.",
            duration: 3000,
          })

          // Verify the update was successful by checking the database
          const { data, error } = await supabaseClient
            .from("saju_sessions")
            .select("auth_user_id")
            .eq("id", sessionId)
            .single()

          if (error) {
            console.error("Error verifying auth_user_id update:", error)
          } else if (data && data.auth_user_id === authUserId) {
            console.log("Verified auth_user_id was updated correctly in database")
          } else {
            console.warn(
              "auth_user_id may not have been updated correctly. Expected:",
              authUserId,
              "Got:",
              data?.auth_user_id,
            )
          }
        } else {
          console.error("Failed to update auth_user_id for saju session:", sessionId)
        }
      } else {
        console.log("User not authenticated with Supabase Auth, skipping auth_user_id update")
      }
    } catch (error) {
      console.error("Error updating auth_user_id:", error)
    }
  }

  // 선택된 도시 정보 가져오기
  const selectedCity = getCityById(birthCityId)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Add name input field */}
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full"
          />
        </div>

        {/* Add gender toggle */}
        <div className="space-y-2">
          <Label>성별</Label>
          <RadioGroup value={gender} onValueChange={setGender} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer">
                여성
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer">
                남성
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* 태어난 도시 선택 */}
        <div className="space-y-2">
          <Label htmlFor="birthCity">태어난 도시</Label>
          <CitySearch value={birthCityId} onChange={setBirthCityId} />
          <div className="flex items-center mt-1 text-xs text-muted-foreground">
            {selectedCity && (
              <>
                <span>
                  현재 선택: {selectedCity.city}, {selectedCity.country} (UTC{selectedCity.utcOffset >= 0 ? "+" : ""}
                  {selectedCity.utcOffset})
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                      <InfoIcon className="h-4 w-4" />
                      <span className="sr-only">도시 선택 안내</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3 text-sm">
                    <p>태어난 도시를 선택하면 해당 지역의 시간대에 맞게 사주가 계산됩니다.</p>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthdate">생년월일 (양력)</Label>
          <Input
            type="text"
            id="birthdate"
            placeholder="19980407"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="w-full"
            maxLength={8}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="birthtime" className={`${timeUnknown ? "text-muted-foreground" : ""}`}>
              태어난 시간
            </Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="timeUnknown"
                checked={timeUnknown}
                onChange={(e) => setTimeUnknown(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary"
              />
              <Label htmlFor="timeUnknown" className="text-sm font-normal cursor-pointer">
                시간 모름
              </Label>
            </div>
          </div>
          <Input
            id="birthtime"
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="2330 또는 23:30 형식으로 입력"
            className="w-full"
            disabled={timeUnknown}
          />
        </div>

        <Button type="submit" className="w-full py-2.5 text-base" disabled={!birthdate || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              계산 중...
            </>
          ) : (
            "사주팔자 보기"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saju && lunarDate && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                양력: {birthdate.substring(0, 4)}년 {birthdate.substring(4, 6)}월 {birthdate.substring(6, 8)}일{" "}
                {timeUnknown ? "(시간 미상)" : ""}
                <br />
                {/* 음력: {lunarDate.year}년 {lunarDate.month}월 {lunarDate.day}일 */}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
