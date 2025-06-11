"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { X, Plus, Users, Edit, ChevronDown, ChevronUp } from "lucide-react"
import { calculateSaju } from "@/lib/saju"
import { fetchLunarDate } from "@/lib/api-client"
import { solarToLunar } from "@/lib/lunar-calendar"
import { getUserSajuProfiles } from "@/lib/saju-session-service"
import { compressSaju, type CompressedSaju } from "@/lib/saju-compression"

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
  isOpen: boolean
  onClose: () => void
  currentSaju: any
  currentName: string
  currentGender: string
  currentBirthInfo?: BirthInfo
  isLoggedIn?: boolean
  userId?: string | null
  onCompatibilityAnalysis: (mainPerson: CompressedSaju, selectedPeople: CompressedSaju[]) => void
}

export default function CompatibilityTool({
  isOpen,
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
    const sajuSummary = currentSaju
      ? `${currentSaju.dayStem}${currentSaju.dayBranch}일주, ${currentSaju.yearAnimal}, 오행: 목${currentSaju.elements.wood} 화${currentSaju.elements.fire} 토${currentSaju.elements.earth} 금${currentSaju.elements.metal} 수${currentSaju.elements.water}`
      : ""

    return {
      id: "current",
      name: currentName || "나",
      gender: currentGender || "unknown",
      birthYear: currentBirthInfo?.solarYear?.toString() || "",
      birthMonth: currentBirthInfo?.solarMonth?.toString().padStart(2, "0") || "",
      birthDay: currentBirthInfo?.solarDay?.toString().padStart(2, "0") || "",
      birthHour: currentBirthInfo?.solarHour?.toString().padStart(2, "0") || "12",
      birthMinute: currentBirthInfo?.solarMinute?.toString().padStart(2, "0") || "0",
      saju: currentSaju,
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

      // 가장 최근 프로필을 대표 사주로 설정 (기본값이 없는 경우)
      if (sajuPeople.length > 0 && !mainPerson) {
        const mostRecent = sajuPeople.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]
        setMainPerson(mostRecent)
      }
    } catch (error) {
      console.error("Error loading user profiles:", error)
    }
  }

  // 컴포넌트 초기화
  useEffect(() => {
    if (isOpen) {
      loadRecentPeople()

      if (isLoggedIn) {
        loadUserProfiles()
      } else {
        // 로그인하지 않은 경우 현재 사주를 대표 사주로 설정
        setMainPerson(getCurrentSajuPerson())
      }
    }
  }, [isOpen, isLoggedIn, userId])

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
    if (!mainPerson || selectedPeople.length === 0) {
      alert("대표 사주와 궁합 대상을 선택해주세요.")
      return
    }

    // 사주 데이터 압축 (시간 정보 포함)
    const compressedMainPerson = compressSaju(
      mainPerson.saju,
      mainPerson.birthYear,
      mainPerson.birthMonth,
      mainPerson.birthDay,
      mainPerson.birthHour,
      mainPerson.birthMinute,
      mainPerson.saju.timeUnknown,
    )

    // 성별 정보 추가
    compressedMainPerson.gender = mainPerson.gender as "male" | "female"
    compressedMainPerson.name = mainPerson.name

    const compressedSelectedPeople = selectedPeople.map((person) => {
      const compressed = compressSaju(
        person.saju,
        person.birthYear,
        person.birthMonth,
        person.birthDay,
        person.birthHour,
        person.birthMinute,
        person.saju.timeUnknown,
      )
      // 성별 정보 추가
      compressed.gender = person.gender as "male" | "female"
      compressed.name = person.name
      return compressed
    })

    console.log("궁합 분석 데이터:", {
      mainPerson: compressedMainPerson,
      selectedPeople: compressedSelectedPeople,
    })

    onCompatibilityAnalysis(compressedMainPerson, compressedSelectedPeople)
    onClose()
  }

  // 대표 사주 변경
  const handleMainPersonChange = (person: SajuPerson) => {
    setMainPerson(person)
    setShowMainPersonSelector(false)
  }

  const displayedRecentPeople = showAllPeople ? recentPeople : recentPeople.slice(0, 3)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-400" />
            <span>궁합 보기</span>
          </DialogTitle>
        </DialogHeader>

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
                            {person.sajuSummary && (
                              <div className="text-xs text-gray-500 mt-1">{person.sajuSummary}</div>
                            )}
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
                    <Button
                      onClick={handleAddPerson}
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
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
            disabled={!mainPerson || selectedPeople.length === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-400"
          >
            궁합 보기 ({selectedPeople.length}/3)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
