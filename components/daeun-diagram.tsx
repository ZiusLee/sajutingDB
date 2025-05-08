"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Saju } from "@/lib/saju"
import {
  calculateDaeunInfo,
  calculateKoreanAge,
  getCurrentDaeunIndex,
  getStemColor,
  getBranchColor,
  debugDaeunCalculation,
  getDaeunDirection,
  calculateDaeunCycles,
} from "@/lib/daeun-calculator"
import { useEffect, useState, useRef, useCallback } from "react"
import YearlyFortuneDiagram from "./yearly-fortune-diagram"
import MonthlyFortuneDiagram from "./monthly-fortune-diagram"
import { Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateSajuDaeunAge } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

interface DaeunDiagramProps {
  saju: Saju
  gender?: string
  solarYear?: string
  solarMonth?: string
  solarDay?: string
  hour?: string
  minute?: string
  timeUnknown?: boolean
  sajuId?: string
  onDaeunAgeChange?: (newDaeunAge: number) => void
}

export default function DaeunDiagram({
  saju,
  gender = "",
  solarYear = "",
  solarMonth = "",
  solarDay = "",
  hour = "",
  minute = "",
  timeUnknown = false,
  sajuId,
  onDaeunAgeChange,
}: DaeunDiagramProps) {
  const [error, setError] = useState<string | null>(null)
  const [daeunInfo, setDaeunInfo] = useState<any>(null)
  const [currentDaeunIndex, setCurrentDaeunIndex] = useState(0)
  const [selectedDaeunIndex, setSelectedDaeunIndex] = useState<number | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [birthYear, setBirthYear] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [isEditingDaeunAge, setIsEditingDaeunAge] = useState(false)
  const [customDaeunAge, setCustomDaeunAge] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [localSaju, setLocalSaju] = useState<Saju>(saju)
  const { toast } = useToast()

  // 마지막으로 저장된 대운세수를 추적하기 위한 ref
  const lastSavedDaeunAgeRef = useRef<number | null>(null)

  // 로컬 스토리지에서 대운세수 복원 (컴포넌트 마운트 시)
  useEffect(() => {
    if (sajuId) {
      try {
        const savedDaeunAge = localStorage.getItem(`daeun_age_${sajuId}`)
        if (savedDaeunAge) {
          const parsedAge = Number.parseInt(savedDaeunAge, 10)
          if (!isNaN(parsedAge) && parsedAge > 0) {
            console.log("Restored daeun age from localStorage:", parsedAge)
            lastSavedDaeunAgeRef.current = parsedAge

            // 로컬 사주 객체 업데이트
            setLocalSaju((prev) => ({
              ...prev,
              daeunAge: parsedAge,
            }))
          }
        }
      } catch (e) {
        console.error("Failed to restore from localStorage:", e)
      }
    }
  }, [sajuId])

  // 사주 정보가 변경되면 로컬 상태 업데이트
  useEffect(() => {
    console.log("Saju prop updated:", saju.daeunAge)

    // 외부에서 전달된 대운세수가 있으면 저장
    if (saju.daeunAge) {
      lastSavedDaeunAgeRef.current = saju.daeunAge
      setLocalSaju((prev) => ({
        ...prev,
        daeunAge: saju.daeunAge,
      }))
    } else {
      setLocalSaju(saju)
    }
  }, [saju])

  // 대운 정보 계산 함수
  const calculateDaeunData = useCallback(() => {
    try {
      // 성별 정규화
      const normalizedGender =
        gender === "male" || gender === "남성" || gender === "남자"
          ? "male"
          : gender === "female" || gender === "여성" || gender === "여자"
            ? "female"
            : "male" // 기본값

      // 출생 정보 변환
      const birthYearValue = Number.parseInt(solarYear, 10) || new Date().getFullYear() - 30 // 기본값
      setBirthYear(birthYearValue)
      const birthMonth = Number.parseInt(solarMonth, 10) || 1
      const birthDay = Number.parseInt(solarDay, 10) || 1
      const birthHour = timeUnknown ? undefined : Number.parseInt(hour, 10)
      const birthMinute = timeUnknown ? undefined : Number.parseInt(minute, 10)

      // 대운 방향 결정
      const direction = getDaeunDirection(localSaju.yearStem, normalizedGender)

      // 디버그 정보 생성
      const debug = debugDaeunCalculation(birthYearValue, birthMonth, birthDay, direction)
      setDebugInfo(debug)

      // 대운 정보 계산
      const info = calculateDaeunInfo(
        localSaju,
        birthYearValue,
        birthMonth,
        birthDay,
        normalizedGender,
        birthHour,
        birthMinute,
      )

      // 사용자 지정 대운세수 적용 우선순위:
      // 1. 로컬 사주 객체의 대운세수
      // 2. 마지막으로 저장된 대운세수
      // 3. 기본 계산된 대운세수
      let effectiveDaeunAge = info.daeunAge

      if (localSaju.daeunAge) {
        console.log("Using custom daeun age from localSaju:", localSaju.daeunAge)
        effectiveDaeunAge = localSaju.daeunAge
        lastSavedDaeunAgeRef.current = localSaju.daeunAge
      } else if (lastSavedDaeunAgeRef.current) {
        console.log("Using last saved daeun age:", lastSavedDaeunAgeRef.current)
        effectiveDaeunAge = lastSavedDaeunAgeRef.current
      }

      // 대운세수 설정
      info.daeunAge = effectiveDaeunAge

      // 대운 주기 재계산 - 대운세수에 따라 동적으로 계산
      info.cycles = calculateDaeunCycles(effectiveDaeunAge)

      // 대운 기둥(pillars) 재계산 - 대운세수에 따라 나이 범위 동적 조정
      if (info.pillars && info.pillars.length > 0) {
        // 대운세수가 10인 경우 특별 처리
        const startAge = effectiveDaeunAge === 10 ? 0 : effectiveDaeunAge

        info.pillars.forEach((pillar: any, index: number) => {
          // 대운세수에 따라 시작 나이 계산
          pillar.startAge = startAge + index * 10
          // 종료 나이는 시작 나이 + 9
          pillar.endAge = pillar.startAge + 9

          // 시작 연도 계산 (출생년도 + 시작 나이)
          pillar.startYear = birthYearValue + pillar.startAge
        })
      }

      setCustomDaeunAge(effectiveDaeunAge)
      setDaeunInfo(info)

      // 현재 나이 계산 (한국식)
      const currentAge = calculateKoreanAge(birthYearValue)

      // 현재 대운 인덱스 계산 - 대운세수 변경 시 인덱스도 업데이트
      const index = getCurrentDaeunIndex(info.pillars, currentAge)
      setCurrentDaeunIndex(index)
      setSelectedDaeunIndex(index) // 기본적으로 현재 대운 선택
    } catch (err) {
      console.error("Error calculating daeun info:", err)
      setError("대운 정보를 계산하는 중 오류가 발생했습니다.")
    }
  }, [localSaju, gender, solarYear, solarMonth, solarDay, hour, minute, timeUnknown])

  // 초기 계산 및 사주 변경 시 재계산
  useEffect(() => {
    calculateDaeunData()
  }, [calculateDaeunData])

  // 대운세수 편집 시작
  const startEditingDaeunAge = () => {
    setIsEditingDaeunAge(true)
    setCustomDaeunAge(daeunInfo?.daeunAge || null)
  }

  // 대운세수 편집 취소
  const cancelEditingDaeunAge = () => {
    setIsEditingDaeunAge(false)
    setCustomDaeunAge(null)
  }

  // 대운세수 저장
  const saveDaeunAge = async () => {
    if (!customDaeunAge || !sajuId) {
      toast({
        title: "오류",
        description: "대운세수 또는 사주 ID가 유효하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      // API 호출하여 대운세수 저장
      const success = await updateSajuDaeunAge(sajuId, customDaeunAge)

      if (success) {
        // 마지막으로 저장된 대운세수 업데이트
        lastSavedDaeunAgeRef.current = customDaeunAge

        // 로컬 사주 객체 업데이트
        setLocalSaju((prev) => ({
          ...prev,
          daeunAge: customDaeunAge,
        }))

        // 편집 모드 종료
        setIsEditingDaeunAge(false)

        // 부모 컴포넌트에 변경 알림 (결과 페이지로 전달용)
        if (onDaeunAgeChange) {
          onDaeunAgeChange(customDaeunAge)
        }

        // 대운 정보 재계산
        calculateDaeunData()

        // 성공 메시지
        toast({
          title: "저장 완료",
          description: "대운세수가 성공적으로 업데이트되었습니다.",
        })

        // 이벤트 발생 - 다른 컴포넌트에 알림
        if (typeof window !== "undefined") {
          console.log("Dispatching daeunAgeUpdated event with:", { sajuId, daeunAge: customDaeunAge })
          window.dispatchEvent(
            new CustomEvent("daeunAgeUpdated", {
              detail: { sajuId, daeunAge: customDaeunAge },
            }),
          )
        }

        // 로컬 스토리지에도 저장
        try {
          localStorage.setItem(`daeun_age_${sajuId}`, customDaeunAge.toString())

          // 전체 사주 데이터도 업데이트
          const sajuKey = `saju_info_${sajuId}`
          const storedSaju = localStorage.getItem(sajuKey)
          if (storedSaju) {
            const sajuData = JSON.parse(storedSaju)
            sajuData.daeunAge = customDaeunAge
            localStorage.setItem(sajuKey, JSON.stringify(sajuData))
          }
        } catch (e) {
          console.error("Failed to save to localStorage:", e)
        }
      } else {
        throw new Error("대운세수 저장에 실패했습니다.")
      }
    } catch (err) {
      console.error("Error saving daeun age:", err)
      setError("대운세수를 저장하는 중 오류가 발생했습니다.")
      toast({
        title: "저장 오류",
        description: "대운세수를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (error) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">대운(大運) 흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-2">{error}</div>
          <div className="text-xs text-muted-foreground mt-4">
            <p>※ 대운은 10년 단위로 변화하는 큰 운의 흐름입니다.</p>
            <p>※ 대운세수는 생일과 절입일의 차이를 기준으로 계산됩니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!daeunInfo) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">대운(大運) 흐름</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-2">대운 정보를 계산 중입니다...</div>
        </CardContent>
      </Card>
    )
  }

  // 선택된 대운의 연도 범위 계산
  const getSelectedYearRange = () => {
    if (selectedDaeunIndex === null || !daeunInfo || !birthYear) return { startYear: 0, endYear: 0 }

    const selectedPillar = daeunInfo.pillars[selectedDaeunIndex]
    const startYear = birthYear + selectedPillar.startAge
    const endYear = birthYear + selectedPillar.endAge

    return { startYear, endYear }
  }

  const handleYearSelect = (year: number) => {
    setSelectedYear(year)
  }

  const { startYear, endYear } = getSelectedYearRange()

  const handleDaeunSelect = (index: number) => {
    setSelectedDaeunIndex(index)
  }

  // 현재 표시되는 대운세수 (우선순위에 따라)
  const displayDaeunAge = localSaju.daeunAge || lastSavedDaeunAgeRef.current || daeunInfo.daeunAge

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <span>대운(大運) 흐름</span>
            <div className="flex items-center text-sm font-normal text-muted-foreground">
              {daeunInfo.direction === "forward" ? "순행(→)" : "역행(←)"} · 대운세수:
              {isEditingDaeunAge ? (
                <div className="flex items-center ml-1">
                  <Input
                    type="number"
                    value={customDaeunAge || ""}
                    onChange={(e) => setCustomDaeunAge(Number(e.target.value))}
                    className="w-16 h-7 mx-1 text-center"
                    min="1"
                    max="30"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveDaeunAge} disabled={isSaving}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={cancelEditingDaeunAge}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="ml-1">{displayDaeunAge}세</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 ml-1"
                    onClick={startEditingDaeunAge}
                    title="대운세수 수정"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <div className="grid grid-cols-8 gap-1 text-center mb-2">
                {daeunInfo.pillars.map((pillar: any, index: number) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md cursor-pointer hover:bg-primary/5 ${
                      selectedDaeunIndex === index ? "bg-primary/10 border border-primary/30" : ""
                    }`}
                    onClick={() => handleDaeunSelect(index)}
                  >
                    <div className="text-lg font-semibold">
                      <span className={`${getStemColor(pillar.stem)} mr-1`}>{pillar.stemKorean}</span>
                      <span className={getBranchColor(pillar.branch)}>{pillar.branchKorean}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-8 gap-1 text-center text-sm">
                {daeunInfo.pillars.map((pillar: any, index: number) => (
                  <div
                    key={index}
                    className={`p-1 cursor-pointer hover:bg-primary/5 ${
                      selectedDaeunIndex === index ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                    onClick={() => handleDaeunSelect(index)}
                  >
                    <div>
                      {pillar.startAge}~{pillar.endAge}세
                    </div>
                    <div>{pillar.startYear}년~</div>
                    {pillar.startMonth && pillar.startDay && !timeUnknown && (
                      <div className="text-xs mt-1">
                        ({pillar.startMonth}월 {pillar.startDay}일경)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="text-xs text-muted-foreground space-y-1">
            <p>※ 대운은 10년 단위로 변화하는 큰 운의 흐름입니다.</p>
            <p>※ 대운세수는 생일과 절입일의 차이를 기준으로 계산됩니다.</p>
            <p>
              ※ 월주 간지: {localSaju.monthStem}
              {localSaju.monthBranch}에서 시작하여 {daeunInfo.direction === "forward" ? "순행" : "역행"}합니다.
            </p>
            <p>※ 대운을 클릭하면 해당 기간의 세운과 월운을 확인할 수 있습니다.</p>
            {timeUnknown && (
              <p className="text-yellow-600 dark:text-yellow-400">
                ※ 출생시간이 불확실하여 대략적인 대운 계산만 가능합니다.
              </p>
            )}
            <p className="text-blue-600 dark:text-blue-400">
              ※ 대운세수가 정확하지 않은 경우 연필 아이콘을 클릭하여 수정할 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 선택된 대운에 해당하는 세운 다이어그램 */}
      {selectedDaeunIndex !== null && startYear > 0 && (
        <YearlyFortuneDiagram
          startYear={startYear}
          endYear={endYear}
          birthYear={birthYear || undefined}
          selectedDaeunIndex={selectedDaeunIndex}
          onYearSelect={handleYearSelect}
          selectedYear={selectedYear}
        />
      )}

      {/* 현재 연도의 월운 다이어그램 */}
      {selectedDaeunIndex !== null && startYear > 0 && <MonthlyFortuneDiagram year={selectedYear} />}
    </>
  )
}
