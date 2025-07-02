"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Edit, ChevronDown, ChevronUp } from "lucide-react"
import { calculateSaju } from "@/lib/saju"
import { fetchLunarDate } from "@/lib/api-client"
import { solarToLunar } from "@/lib/lunar-calendar"
import { getUserSajuProfiles } from "@/lib/saju-session-service"
import { compressSaju } from "@/lib/saju-compression"

interface BirthInfo {
  solarYear: number
  solarMonth: number
  solarDay: number
  solarHour?: number
  solarMinute?: number
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  timeUnknown?: boolean
  birthCityId?: string
  timeStandard?: string
}

interface SajuPerson {
  id: string
  name: string
  gender: string
  birthYear: string
  birthMonth: string
  birthDay: string
  birthHour: string
  birthMinute: string
  saju: any // 완전한 사주 정보
  sajuSummary?: string // 사주 요약 정보
  createdAt: string
}

interface CompatibilityToolProps {
  currentUserSaju: {
    name: string
    gender: string
    saju: any
    birthInfo?: BirthInfo
  }
  onAnalyze: (mainPerson: any, selectedPeople: any[]) => void
  onClose: () => void
  currentSaju?: any
  currentName?: string
  currentGender?: string
  currentBirthInfo?: BirthInfo
  isLoggedIn?: boolean
  userId?: string | null
  onCompatibilityAnalysis?: (mainPerson: any, selectedPeople: any[]) => void
}

export default function CompatibilityTool({
  currentUserSaju,
  onAnalyze,
  onClose,
  currentSaju,
  currentName,
  currentGender,
  currentBirthInfo,
  isLoggedIn = false,
  userId,
  onCompatibilityAnalysis,
}: CompatibilityToolProps) {
  const [mainPerson, setMainPerson] = useState<SajuPerson | null>(null)
  const [recentPeople, setRecentPeople] = useState<SajuPerson[]>([])
  const [selectedPeople, setSelectedPeople] = useState<SajuPerson[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAllPeople, setShowAllPeople] = useState(false)
  const [showMainPersonSelector, setShowMainPersonSelector] = useState(false)
  const [availableMainPeople, setAvailableMainPeople] = useState<SajuPerson[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // 새 사람 추가 폼 상태
  const [newPersonForm, setNewPersonForm] = useState({
    name: "",
    gender: "male",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    birthHour: "12",
    birthMinute: "0",
    timeUnknown: false,
  })

  // 현재 사주를 SajuPerson 형태로 변환
  const getCurrentSajuPerson = (): SajuPerson => {
    const saju = currentUserSaju?.saju || currentSaju
    const name = currentUserSaju?.name || currentName || "나"
    const gender = currentUserSaju?.gender || currentGender || "unknown"
    const birthInfo = currentUserSaju?.birthInfo || currentBirthInfo

    const sajuSummary = saju
      ? `${saju.dayStem}${saju.dayBranch}일주, ${saju.yearAnimal || "띠정보없음"}, 오행: 목${saju.elements?.wood || 0} 화${saju.elements?.fire || 0} 토${saju.elements?.earth || 0} 금${saju.elements?.metal || 0} 수${saju.elements?.water || 0}`
      : ""

    return {
      id: "current",
      name: name,
      gender: gender,
      birthYear: birthInfo?.solarYear?.toString() || "",
      birthMonth: birthInfo?.solarMonth?.toString().padStart(2, "0") || "",
      birthDay: birthInfo?.solarDay?.toString().padStart(2, "0") || "",
      birthHour: birthInfo?.solarHour?.toString().padStart(2, "0") || "12",
      birthMinute: birthInfo?.solarMinute?.toString().padStart(2, "0") || "0",
      saju: saju,
      sajuSummary: sajuSummary,
      createdAt: new Date().toISOString(),
    }
  }

  // 로컬 스토리지에서 최근 사람들 불러오기
  const loadRecentPeople = () => {
    try {
      const stored = localStorage.getItem("compatibility_recent_people")
      if (stored) {
        const people = JSON.parse(stored)
        setRecentPeople(people)
      }
    } catch (error) {
      console.error("Error loading recent people:", error)
    }
  }

  // 로그인된 사용자의 사주 프로필들 불러오기
  const loadUserProfiles = async () => {
    if (!isLoggedIn || !userId) return

    try {
      const { profiles } = await getUserSajuProfiles()
      const sajuPeople: SajuPerson[] = profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        gender: profile.gender,
        birthYear: profile.birthYear,
        birthMonth: profile.birthMonth,
        birthDay: profile.birthDay,
        birthHour: profile.birthHour,
        birthMinute: profile.birthMinute,
        saju: profile.saju,
        createdAt: profile.createdAt,
      }))

      setAvailableMainPeople(sajuPeople)

      // 현재 채팅 중인 사주가 이미 mainPerson으로 설정되어 있으므로
      // 여기서는 추가 설정하지 않음
    } catch (error) {
      console.error("Error loading user profiles:", error)
    }
  }

  // 컴포넌트 초기화
  useEffect(() => {
    loadRecentPeople()

    // 현재 채팅 중인 사주를 우선적으로 대표사주로 설정
    const currentSajuPerson = getCurrentSajuPerson()
    setMainPerson(currentSajuPerson)

    if (isLoggedIn) {
      loadUserProfiles()
    }
  }, [isLoggedIn, userId])

  // 로컬 스토리지에 최근 사람들 저장
  const saveRecentPeople = (people: SajuPerson[]) => {
    try {
      localStorage.setItem("compatibility_recent_people", JSON.stringify(people))
    } catch (error) {
      console.error("Error saving recent people:", error)
    }
  }

  // 새 사람 추가
  const handleAddPerson = async () => {
    if (!newPersonForm.name || !newPersonForm.birthYear || !newPersonForm.birthMonth || !newPersonForm.birthDay) {
      alert("필수 정보를 모두 입력해주세요.")
      return
    }

    setIsLoading(true)

    try {
      const year = newPersonForm.birthYear
      const month = newPersonForm.birthMonth.padStart(2, "0")
      const day = newPersonForm.birthDay.padStart(2, "0")

      const hour = newPersonForm.timeUnknown ? 12 : Number.parseInt(newPersonForm.birthHour)
      const minute = newPersonForm.timeUnknown ? 0 : Number.parseInt(newPersonForm.birthMinute)

      // 음력 날짜 계산
      let lunarData
      try {
        lunarData = await fetchLunarDate(year, month, day)
      } catch (error) {
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

      // 완전한 사주 계산
      const saju = calculateSaju(
        lunarData.year,
        lunarData.month,
        lunarData.day,
        hour,
        minute,
        Number.parseInt(year),
        Number.parseInt(month),
        Number.parseInt(day),
        newPersonForm.gender,
        newPersonForm.name,
        newPersonForm.timeUnknown,
        lunarData.isLeapMonth,
        lunarData.monthStem,
        lunarData.monthBranch,
        "동경135도",
      )

      console.log(`${newPersonForm.name} 사주 계산 완료:`, saju)

      // 사주 요약 생성
      const sajuSummary = `${saju.dayStem}${saju.dayBranch}일주, ${saju.yearAnimal}, 오행: 목${saju.elements.wood} 화${saju.elements.fire} 토${saju.elements.earth} 금${saju.elements.metal} 수${saju.elements.water}`

      const newPerson: SajuPerson = {
        id: `person_${Date.now()}`,
        name: newPersonForm.name,
        gender: newPersonForm.gender,
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        birthHour: newPersonForm.timeUnknown ? "00" : newPersonForm.birthHour.padStart(2, "0"),
        birthMinute: newPersonForm.timeUnknown ? "00" : newPersonForm.birthMinute.padStart(2, "0"),
        saju: saju,
        sajuSummary: sajuSummary,
        createdAt: new Date().toISOString(),
      }

      // 최근 사람들 목록에 추가 (최대 10명)
      const updatedRecentPeople = [newPerson, ...recentPeople.filter((p) => p.id !== newPerson.id)].slice(0, 10)
      setRecentPeople(updatedRecentPeople)
      saveRecentPeople(updatedRecentPeople)

      // 폼 초기화
      setNewPersonForm({
        name: "",
        gender: "male",
        birthYear: "",
        birthMonth: "",
        birthDay: "",
        birthHour: "12",
        birthMinute: "0",
        timeUnknown: false,
      })
      setShowAddForm(false)
    } catch (error) {
      console.error("Error calculating saju:", error)
      alert("사주 계산 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  // 사람 선택/해제
  const togglePersonSelection = (person: SajuPerson) => {
    setSelectedPeople((prev) => {
      const isSelected = prev.some((p) => p.id === person.id)
      if (isSelected) {
        return prev.filter((p) => p.id !== person.id)
      } else if (prev.length < 3) {
        return [...prev, person]
      } else {
        alert("최대 3명까지 선택할 수 있습니다.")
        return prev
      }
    })
  }

  // 궁합 분석 실행 - 개선된 버전
  const handleAnalyze = () => {
    console.log("handleAnalyze called")
    console.log("mainPerson:", mainPerson)
    console.log("selectedPeople:", selectedPeople)

    if (!mainPerson || selectedPeople.length === 0) {
      alert("대표 사주와 궁합 대상을 선택해주세요.")
      return
    }

    try {
      // 기존 로직 유지...
      const compressedMainPerson = compressSaju(
        mainPerson.saju,
        mainPerson.birthYear,
        mainPerson.birthMonth,
        mainPerson.birthDay,
        mainPerson.birthHour,
        mainPerson.birthMinute,
        mainPerson.saju?.timeUnknown || false,
      )

      // 성별과 이름 정보 정확히 설정
      compressedMainPerson.gender =
        mainPerson.gender === "male" || mainPerson.gender === "female" ? mainPerson.gender : "male"
      compressedMainPerson.name = mainPerson.name

      // 전체 사주 정보 추가
      compressedMainPerson.fullSaju = mainPerson.saju

      // 생년월일 정보 추가
      compressedMainPerson.birthYear = mainPerson.birthYear
      compressedMainPerson.birthMonth = mainPerson.birthMonth
      compressedMainPerson.birthDay = mainPerson.birthDay
      compressedMainPerson.birthHour = mainPerson.birthHour
      compressedMainPerson.birthMinute = mainPerson.birthMinute
      compressedMainPerson.timeUnknown = mainPerson.saju?.timeUnknown || false

      // 오행 정보 명시적으로 추가
      if (mainPerson.saju && mainPerson.saju.elements) {
        compressedMainPerson.elements = {
          wood: mainPerson.saju.elements.wood || 0,
          fire: mainPerson.saju.elements.fire || 0,
          earth: mainPerson.saju.elements.earth || 0,
          metal: mainPerson.saju.elements.metal || 0,
          water: mainPerson.saju.elements.water || 0,
        }
      }

      const compressedSelectedPeople = selectedPeople.map((person) => {
        const compressed = compressSaju(
          person.saju,
          person.birthYear,
          person.birthMonth,
          person.birthDay,
          person.birthHour,
          person.birthMinute,
          person.saju?.timeUnknown || false,
        )

        // 성별과 이름 정보 정확히 설정
        compressed.gender = person.gender === "male" || person.gender === "female" ? person.gender : "male"
        compressed.name = person.name

        // 전체 사주 정보 추가
        compressed.fullSaju = person.saju

        // 생년월일 정보 추가
        compressed.birthYear = person.birthYear
        compressed.birthMonth = person.birthMonth
        compressed.birthDay = person.birthDay
        compressed.birthHour = person.birthHour
        compressed.birthMinute = person.birthMinute
        compressed.timeUnknown = person.saju?.timeUnknown || false

        // 오행 정보 명시적으로 추가
        if (person.saju && person.saju.elements) {
          compressed.elements = {
            wood: person.saju.elements.wood || 0,
            fire: person.saju.elements.fire || 0,
            earth: person.saju.elements.earth || 0,
            metal: person.saju.elements.metal || 0,
            water: person.saju.elements.water || 0,
          }
        }

        return compressed
      })

      console.log("궁합 분석 데이터 (상세):", {
        mainPerson: compressedMainPerson,
        selectedPeople: compressedSelectedPeople,
      })

      // 로컬 스토리지에 상세 데이터 저장
      try {
        const compatibilityData = {
          mainPerson: compressedMainPerson,
          selectedPeople: compressedSelectedPeople,
          timestamp: new Date().toISOString(),
          fullSajuData: {
            main: mainPerson,
            selected: selectedPeople,
          },
        }
        localStorage.setItem(`compatibility_latest`, JSON.stringify(compatibilityData))
        console.log("궁합 분석 데이터 로컬 스토리지 저장 완료:", compatibilityData)
      } catch (error) {
        console.error("Error saving compatibility data to localStorage:", error)
      }

      // onAnalyze 콜백 호출 (기존 방식)
      if (typeof onAnalyze === "function") {
        onAnalyze(mainPerson, selectedPeople)
      }

      // onCompatibilityAnalysis 콜백 호출 (새로운 방��)
      if (typeof onCompatibilityAnalysis === "function") {
        onCompatibilityAnalysis(compressedMainPerson, compressedSelectedPeople)
      }

      console.log("Closing compatibility tool")
      onClose()
    } catch (error) {
      console.error("Error in handleAnalyze:", error)
      alert("궁합 분석 중 오류가 발생했습니다: " + error.message)
    }
  }

  // 대표 사주 변경
  const handleMainPersonChange = (person: SajuPerson) => {
    setMainPerson(person)
    setShowMainPersonSelector(false)
  }

  const displayedRecentPeople = showAllPeople ? recentPeople : recentPeople.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* 대표 사주 영역 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">🪪 대표 사주</h3>
          {isLoggedIn && availableMainPeople.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMainPersonSelector(!showMainPersonSelector)}
              className="text-gray-400 hover:text-white p-1"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>

        {mainPerson && (
          <Card className="bg-gray-700/50 border-gray-600">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{mainPerson.name}</div>
                  <div className="text-sm text-gray-400">
                    {mainPerson.birthYear}년 {mainPerson.birthMonth}월 {mainPerson.birthDay}일
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {mainPerson.gender === "male" ? "남" : mainPerson.gender === "female" ? "여" : ""}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 대표 사주 선택 드롭다운 */}
        {showMainPersonSelector && isLoggedIn && (
          <div className="bg-gray-700 rounded-lg border border-gray-600 max-h-40 overflow-y-auto">
            {availableMainPeople.map((person) => (
              <button
                key={person.id}
                onClick={() => handleMainPersonChange(person)}
                className={`w-full p-3 text-left hover:bg-gray-600 transition-colors ${
                  mainPerson?.id === person.id ? "bg-gray-600" : ""
                }`}
              >
                <div className="font-medium">{person.name}</div>
                <div className="text-sm text-gray-400">
                  {person.birthYear}년 {person.birthMonth}월 {person.birthDay}일
                </div>
              </button>
            ))}
            {/* 현재 사주도 선택 가능하도록 추가 */}
            <button
              onClick={() => handleMainPersonChange(getCurrentSajuPerson())}
              className={`w-full p-3 text-left hover:bg-gray-600 transition-colors ${
                mainPerson?.id === "current" ? "bg-gray-600" : ""
              }`}
            >
              <div className="font-medium">{getCurrentSajuPerson().name} (현재 채팅)</div>
              <div className="text-sm text-gray-400">
                {getCurrentSajuPerson().birthYear}년 {getCurrentSajuPerson().birthMonth}월{" "}
                {getCurrentSajuPerson().birthDay}일
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 선택된 사람들 표시 */}
      {selectedPeople.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-300">선택된 궁합 대상</h3>
          <div className="flex flex-wrap gap-2">
            {selectedPeople.map((person) => (
              <Badge
                key={person.id}
                variant="secondary"
                className="bg-blue-600/20 text-blue-300 border-blue-600/30 flex items-center space-x-1"
              >
                <span>{person.name}</span>
                <button
                  onClick={() => togglePersonSelection(person)}
                  className="ml-1 hover:bg-blue-600/30 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 궁합 대상 선택 영역 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-300">🧑‍🤝‍🧑 궁합 대상 선택</h3>

        {/* 최근 사주 본 사람들 */}
        {recentPeople.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400">최근 사주 본 사람들</div>
            <div className="space-y-2">
              {displayedRecentPeople.map((person) => (
                <Card
                  key={person.id}
                  className={`cursor-pointer transition-colors ${
                    selectedPeople.some((p) => p.id === person.id)
                      ? "bg-blue-600/20 border-blue-600/50"
                      : "bg-gray-700/50 border-gray-600 hover:bg-gray-600/50"
                  }`}
                  onClick={() => togglePersonSelection(person)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{person.name}</div>
                        <div className="text-sm text-gray-400">
                          {person.birthYear}년 {person.birthMonth}월 {person.birthDay}일
                          {!person.saju?.timeUnknown && ` ${person.birthHour}:${person.birthMinute}`}
                        </div>
                        {person.sajuSummary && <div className="text-xs text-gray-500 mt-1">{person.sajuSummary}</div>}
                      </div>
                      <div className="text-xs text-gray-500 ml-2">
                        {person.gender === "male" ? "남성" : person.gender === "female" ? "여성" : ""}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {recentPeople.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllPeople(!showAllPeople)}
                className="w-full text-gray-400 hover:text-white"
              >
                {showAllPeople ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    더보기 ({recentPeople.length - 3}명)
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* 사람 추가하기 버튼 */}
        <Button
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          사람 추가하기
        </Button>

        {/* 새 사람 추가 폼 */}
        {showAddForm && (
          <Card className="bg-gray-700/50 border-gray-600">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name" className="text-sm text-gray-300">
                    이름
                  </Label>
                  <Input
                    id="name"
                    value={newPersonForm.name}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, name: e.target.value })}
                    className="bg-gray-600 border-gray-500 text-white"
                    placeholder="이름"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300">성별</Label>
                  <RadioGroup
                    value={newPersonForm.gender}
                    onValueChange={(value) => setNewPersonForm({ ...newPersonForm, gender: value })}
                    className="flex space-x-4 mt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" className="w-4 h-4" />
                      <Label htmlFor="male" className="text-sm">
                        남자
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" className="w-4 h-4" />
                      <Label htmlFor="female" className="text-sm">
                        여자
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="birthYear" className="text-sm text-gray-300">
                    년
                  </Label>
                  <Input
                    id="birthYear"
                    type="number"
                    value={newPersonForm.birthYear}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, birthYear: e.target.value })}
                    className="bg-gray-600 border-gray-500 text-white"
                    placeholder="1990"
                  />
                </div>
                <div>
                  <Label htmlFor="birthMonth" className="text-sm text-gray-300">
                    월
                  </Label>
                  <Input
                    id="birthMonth"
                    type="number"
                    min="1"
                    max="12"
                    value={newPersonForm.birthMonth}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, birthMonth: e.target.value })}
                    className="bg-gray-600 border-gray-500 text-white"
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDay" className="text-sm text-gray-300">
                    일
                  </Label>
                  <Input
                    id="birthDay"
                    type="number"
                    min="1"
                    max="31"
                    value={newPersonForm.birthDay}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, birthDay: e.target.value })}
                    className="bg-gray-600 border-gray-500 text-white"
                    placeholder="1"
                  />
                </div>
              </div>

              {!newPersonForm.timeUnknown && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="birthHour" className="text-sm text-gray-300">
                      시
                    </Label>
                    <Input
                      id="birthHour"
                      type="number"
                      min="0"
                      max="23"
                      value={newPersonForm.birthHour}
                      onChange={(e) => setNewPersonForm({ ...newPersonForm, birthHour: e.target.value })}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthMinute" className="text-sm text-gray-300">
                      분
                    </Label>
                    <Input
                      id="birthMinute"
                      type="number"
                      min="0"
                      max="59"
                      value={newPersonForm.birthMinute}
                      onChange={(e) => setNewPersonForm({ ...newPersonForm, birthMinute: e.target.value })}
                      className="bg-gray-600 border-gray-500 text-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="timeUnknown"
                  checked={newPersonForm.timeUnknown}
                  onChange={(e) => setNewPersonForm({ ...newPersonForm, timeUnknown: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="timeUnknown" className="text-sm text-gray-300">
                  시간 미상
                </Label>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleAddPerson} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "계산 중..." : "추가"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 border-gray-600 text-gray-300"
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 궁합 보기 버튼 */}
      <Button
        onClick={handleAnalyze}
        disabled={!mainPerson || selectedPeople.length === 0 || isLoading}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-400"
      >
        {isLoading ? "분석 중..." : `궁합 보기 (${selectedPeople.length}/3)`}
      </Button>
    </div>
  )
}
