import type { Saju } from "@/lib/saju"
import { InfoIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface SajuDiagramProps {
  saju: Saju
  timeUnknown?: boolean
  size?: "sm" | "md" | "lg"
  name?: string
  gender?: string
  solarYear?: string
  solarMonth?: string
  solarDay?: string
  hour?: string
  minute?: string
  lunarYear?: string
  lunarMonth?: string
  lunarDay?: string
  location?: string
}

export default function SajuDiagram({
  saju,
  timeUnknown = false,
  size = "md",
  name = "",
  gender = "",
  solarYear = "",
  solarMonth = "",
  solarDay = "",
  hour = "",
  minute = "",
  lunarYear = "",
  lunarMonth = "",
  lunarDay = "",
  location,
}: SajuDiagramProps) {
  // 오행 색상 매핑
  const elementColors = {
    wood: "bg-green-100 border-green-500 text-green-800 dark:bg-green-950 dark:border-green-400 dark:text-green-300",
    fire: "bg-red-100 border-red-500 text-red-800 dark:bg-red-950 dark:border-red-400 dark:text-red-300",
    earth:
      "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-300",
    metal: "bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-800 dark:border-gray-400 dark:text-gray-300",
    water: "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-300",
    unknown: "bg-gray-100 border-gray-400 text-gray-800 dark:bg-gray-700 dark:border-gray-300 dark:text-gray-100",
  }

  // 텍스트 색상 추출하는 함수
  const getTextColorClass = (elementColorClass: string) => {
    // Check if elementColorClass is undefined or null
    if (!elementColorClass) {
      return "text-gray-800 dark:text-gray-300"
    }

    // 텍스트 색상 클래스만 추출 (text-xxx-xxx 형식)
    const textColorMatch = elementColorClass.match(/text-[a-z]+-[0-9]+/)
    return textColorMatch ? textColorMatch[0] : "text-gray-800 dark:text-gray-300"
  }

  // 간의 오행 매핑
  const stemElements = {
    갑: "wood",
    을: "wood",
    병: "fire",
    정: "fire",
    무: "earth",
    기: "earth",
    경: "metal",
    신: "metal",
    임: "water",
    계: "water",
  }

  // 지의 오행 매핑
  const branchElements = {
    자: "water",
    축: "earth",
    인: "wood",
    묘: "wood",
    진: "earth",
    사: "fire",
    오: "fire",
    미: "earth",
    신: "metal",
    유: "metal",
    술: "earth",
    해: "water",
  }

  // 간의 오행 색상 가져오기
  const getStemColor = (stem: string) => {
    if (stem === "?" || !stem) return elementColors.unknown
    return elementColors[stemElements[stem as keyof typeof stemElements] || "unknown"]
  }

  // 지의 오행 색상 가져오기
  const getBranchColor = (branch: string) => {
    if (branch === "?" || !branch) return elementColors.unknown
    return elementColors[branchElements[branch as keyof typeof branchElements] || "unknown"]
  }

  // 간의 오행 텍스트 색상 가져오기
  const getStemTextColor = (stem: string) => {
    if (stem === "?" || !stem) return getTextColorClass(elementColors.unknown)
    const element = stemElements[stem as keyof typeof stemElements]
    return getTextColorClass(elementColors[element || "unknown"])
  }

  // 지의 오행 텍스트 색상 가져오기
  const getBranchTextColor = (branch: string) => {
    if (branch === "?" || !branch) return getTextColorClass(elementColors.unknown)
    const element = branchElements[branch as keyof typeof branchElements]
    return getTextColorClass(elementColors[element || "unknown"])
  }

  // 십이지지 동물 이름
  const branchAnimals = {
    자: "쥐",
    축: "소",
    인: "호랑이",
    묘: "토끼",
    진: "용",
    사: "뱀",
    오: "말",
    미: "양",
    신: "원숭이",
    유: "닭",
    술: "개",
    해: "돼지",
  }

  // 천간 색상 이름
  const stemColorNames = {
    갑: "푸른",
    을: "푸른",
    병: "붉은",
    정: "붉은",
    무: "황색",
    기: "황색",
    경: "하얀",
    신: "하얀",
    임: "검은",
    계: "검은",
  }

  // 오행 이름
  const elementNames = {
    wood: "목(木)",
    fire: "화(火)",
    earth: "토(土)",
    metal: "금(金)",
    water: "수(水)",
  }

  // 일주 정보 가져오기
  const getDayMasterInfo = () => {
    if (saju.dayStem === "?" || saju.dayBranch === "?") return { colorName: "", animalName: "", element: "", ilju: "" }

    const colorName = stemColorNames[saju.dayStem as keyof typeof stemColorNames] || ""
    const animalName = branchAnimals[saju.dayBranch as keyof typeof branchAnimals] || ""
    const element = stemElements[saju.dayStem as keyof typeof stemElements] || ""
    const elementName = elementNames[element as keyof typeof elementNames] || ""
    const ilju = `${saju.dayStem}${saju.dayBranch}`

    return { colorName, animalName, element, elementName, ilju }
  }

  // 일주 정보
  const dayMasterInfo = getDayMasterInfo()

  // 일주 텍스트 색상
  const dayMasterTextColor = saju.dayStem !== "?" ? getStemTextColor(saju.dayStem) : ""

  // 성별에 따른 텍스트 색상
  const genderColor = gender === "male" ? "text-blue-500" : gender === "female" ? "text-pink-500" : "text-gray-500"

  // 이름 처리 로직 개선
  const displayName = name || "사용자"

  const adjustedTime = (() => {
    const totalMinutes = Number(hour) * 60 + Number(minute) - 32
    const adjustedHour = Math.floor(totalMinutes / 60)
    const adjustedMinute = totalMinutes % 60
    return {
      hour: adjustedHour < 0 ? adjustedHour + 24 : adjustedHour,
      minute: adjustedMinute < 0 ? adjustedMinute + 60 : adjustedMinute,
    }
  })()

  return (
    <div className="space-y-4">
      {/* 상단 정보 섹션 */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
          {gender === "male" ? "👨" : gender === "female" ? "👩" : "👤"}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{displayName}의 사주</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  <InfoIcon className="h-4 w-4" />
                  <span className="sr-only">사주 설명</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">사주란?</p>
                  <p>사주는 태어난 년, 월, 일, 시의 천간과 지지를 나타내는 8개의 글자로 구성됩니다.</p>
                  <p>• 천간: 갑을병정무기경신임계 (10개)</p>
                  <p>• 지지: 자축인묘진사오미신유술해 (12개)</p>
                  <p>• 십성: 각 글자가 일간(나)과의 관계를 나타냅니다.</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {dayMasterInfo.ilju && (
            <div className="flex flex-col">
              <span className={`text-sm ${dayMasterTextColor}`}>
                {dayMasterInfo.ilju}일주 ({dayMasterInfo.elementName})
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {dayMasterInfo.colorName}
                {dayMasterInfo.animalName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 날짜 정보 */}
      <div className="space-y-1 text-base">
        <p className="text-gray-700 dark:text-gray-300">
          양 {solarYear}/{solarMonth}/{solarDay} {hour}:{minute}{" "}
          {gender === "male" ? "남자" : gender === "female" ? "여자" : ""} {location || "위치 미상"}
        </p>
        <p className="text-blue-500">
          음(평달) {lunarYear}/{lunarMonth}/{lunarDay} {hour}:{minute}{" "}
          {gender === "male" ? "남자" : gender === "female" ? "여자" : ""} {location || "위치 미상"}
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          만세력 {solarYear}/{solarMonth}/{solarDay} {adjustedTime.hour.toString().padStart(2, "0")}:
          {adjustedTime.minute.toString().padStart(2, "0")}{" "}
          {gender === "male" ? "남자" : gender === "female" ? "여자" : ""} {location || "위치 미상"} (지역시 -32분)
        </p>
      </div>

      {/* 사주 표 */}
      <div className="border rounded-lg overflow-hidden shadow-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600"></th>
              <th className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center">생시</th>
              <th className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center">생일</th>
              <th className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center">생월</th>
              <th className="p-3 border-b-2 border-gray-300 dark:border-gray-600 text-center">생년</th>
            </tr>
          </thead>
          <tbody>
            {/* 천간 행 */}
            <tr>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 font-medium bg-gray-100 dark:bg-gray-800">
                천간
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${
                  timeUnknown ? "text-gray-400" : getStemColor(saju.hourStem)
                }`}
              >
                <div className={`text-2xl font-bold`}>{timeUnknown ? "?" : saju.hourStem}</div>
                <div className={`text-xs ${timeUnknown ? "text-gray-400" : getStemTextColor(saju.hourStem)}`}>
                  {timeUnknown ? "" : saju.hourStemHanja}
                </div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getStemColor(saju.dayStem)}`}
              >
                <div className={`text-2xl font-bold`}>{saju.dayStem}</div>
                <div className={`text-xs ${getStemTextColor(saju.dayStem)}`}>{saju.dayStemHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getStemColor(saju.monthStem)}`}
              >
                <div className={`text-2xl font-bold`}>{saju.monthStem}</div>
                <div className={`text-xs ${getStemTextColor(saju.monthStem)}`}>{saju.monthStemHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 text-center ${getStemColor(saju.yearStem)}`}
              >
                <div className={`text-2xl font-bold`}>{saju.yearStem}</div>
                <div className={`text-xs ${getStemTextColor(saju.yearStem)}`}>{saju.yearStemHanja}</div>
              </td>
            </tr>

            {/* 십성 행 */}
            <tr>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 font-medium bg-gray-100 dark:bg-gray-800">
                십성
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${timeUnknown ? "text-gray-400" : ""}`}
              >
                <div>{timeUnknown ? "" : saju.hourStemSibseong}</div>
              </td>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center">
                <div>{saju.dayStemSibseong || "비견"}</div>
              </td>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center">
                <div>{saju.monthStemSibseong}</div>
              </td>
              <td className="p-3 border-b-2 border-gray-300 dark:border-gray-600 text-center">
                <div>{saju.yearStemSibseong}</div>
              </td>
            </tr>

            {/* 지지 행 */}
            <tr>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 font-medium bg-gray-100 dark:bg-gray-800">
                지지
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${
                  timeUnknown ? "text-gray-400" : getBranchColor(saju.hourBranch)
                }`}
              >
                <div className={`text-2xl font-bold`}>{timeUnknown ? "?" : saju.hourBranch}</div>
                <div className={`text-xs ${timeUnknown ? "text-gray-400" : getBranchTextColor(saju.hourBranch)}`}>
                  {timeUnknown ? "" : saju.hourBranchHanja}
                </div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getBranchColor(saju.dayBranch)}`}
              >
                <div className={`text-2xl font-bold`}>{saju.dayBranch}</div>
                <div className={`text-xs ${getBranchTextColor(saju.dayBranch)}`}>{saju.dayBranchHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getBranchColor(saju.monthBranch)}`}
              >
                <div className={`text-2xl font-bold`}>{saju.monthBranch}</div>
                <div className={`text-xs ${getBranchTextColor(saju.monthBranch)}`}>{saju.monthBranchHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 text-center ${getBranchColor(saju.yearBranch)}`}
              >
                <div className={`text-2xl font-bold`}>{saju.yearBranch}</div>
                <div className={`text-xs ${getBranchTextColor(saju.yearBranch)}`}>{saju.yearBranchHanja}</div>
              </td>
            </tr>

            {/* 십성 행 */}
            <tr>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 font-medium bg-gray-100 dark:bg-gray-800">
                십성
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${timeUnknown ? "text-gray-400" : ""}`}
              >
                <div>{timeUnknown ? "" : saju.hourBranchSibseong}</div>
              </td>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center">
                <div>{saju.dayBranchSibseong}</div>
              </td>
              <td className="p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center">
                <div>{saju.monthBranchSibseong}</div>
              </td>
              <td className="p-3 border-b-2 border-gray-300 dark:border-gray-600 text-center">
                <div>{saju.yearBranchSibseong}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
