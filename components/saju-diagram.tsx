import type { Saju } from "@/lib/saju"

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
  location = "서울특별시",
}: SajuDiagramProps) {
  // 오행 색상 매핑
  const elementColors = {
    wood: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-300",
    fire: "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-400 dark:text-rose-300",
    earth: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-400 dark:text-amber-300",
    metal: "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-400 dark:text-slate-300",
    water: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-300",
    unknown: "bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-700 dark:border-gray-300 dark:text-gray-100",
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

  return (
    <div className="space-y-4">
      {/* 상단 정보 섹션 */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-100 dark:border-blue-800">
        <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xl">
          {branchAnimals[saju.yearBranch as keyof typeof branchAnimals] || "?"}
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h2>
          {dayMasterInfo.ilju && (
            <div className="flex flex-col space-y-1">
              <span className={`text-sm font-medium ${dayMasterTextColor}`}>
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
          {gender === "male" ? "남자" : gender === "female" ? "여자" : ""} {location}
        </p>
        <p className="text-blue-500">
          음(평달) {lunarYear}/{lunarMonth}/{lunarDay} {hour}:{minute}{" "}
          {gender === "male" ? "남자" : gender === "female" ? "여자" : ""} {location}
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          양 {solarYear}/{solarMonth}/{solarDay} {Number(hour) - 1}:{Number(minute) + 28}{" "}
          {gender === "male" ? "남자" : gender === "female" ? "여자" : ""} {location} (지역시 -32분)
        </p>
      </div>

      {/* 사주 표 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="p-3 border-r border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300"></th>
              <th className="p-3 border-r border-gray-200 dark:border-gray-700 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                생시
              </th>
              <th className="p-3 border-r border-gray-200 dark:border-gray-700 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                생일
              </th>
              <th className="p-3 border-r border-gray-200 dark:border-gray-700 text-center text-sm font-medium text-gray-600 dark:text-gray-300">
                생월
              </th>
              <th className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-300">생년</th>
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
                <div className={`text-xl font-bold`}>{timeUnknown ? "?" : saju.hourStem}</div>
                <div className={`text-[10px] ${timeUnknown ? "text-gray-400" : getStemTextColor(saju.hourStem)}`}>
                  {timeUnknown ? "" : saju.hourStemHanja}
                </div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getStemColor(saju.dayStem)}`}
              >
                <div className={`text-xl font-bold`}>{saju.dayStem}</div>
                <div className={`text-[10px] ${getStemTextColor(saju.dayStem)}`}>{saju.dayStemHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getStemColor(saju.monthStem)}`}
              >
                <div className={`text-xl font-bold`}>{saju.monthStem}</div>
                <div className={`text-[10px] ${getStemTextColor(saju.monthStem)}`}>{saju.monthStemHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 text-center ${getStemColor(saju.yearStem)}`}
              >
                <div className={`text-xl font-bold`}>{saju.yearStem}</div>
                <div className={`text-[10px] ${getStemTextColor(saju.yearStem)}`}>{saju.yearStemHanja}</div>
              </td>
            </tr>

            {/* 십성 행 */}
            <tr className="bg-gray-25 dark:bg-gray-850">
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 font-medium bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                십성
              </td>
              <td
                className={`p-3 border-r border-gray-200 dark:border-gray-700 text-center ${timeUnknown ? "text-gray-400 dark:text-gray-500" : ""}`}
              >
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {timeUnknown ? "" : saju.hourStemSibseong}
                </div>
              </td>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {saju.dayStemSibseong}
                </div>
              </td>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {saju.monthStemSibseong}
                </div>
              </td>
              <td className="p-3 text-center">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {saju.yearStemSibseong}
                </div>
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
                <div className={`text-xl font-bold`}>{timeUnknown ? "?" : saju.hourBranch}</div>
                <div className={`text-[10px] ${timeUnknown ? "text-gray-400" : getBranchTextColor(saju.hourBranch)}`}>
                  {timeUnknown ? "" : saju.hourBranchHanja}
                </div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getBranchColor(saju.dayBranch)}`}
              >
                <div className={`text-xl font-bold`}>{saju.dayBranch}</div>
                <div className={`text-[10px] ${getBranchTextColor(saju.dayBranch)}`}>{saju.dayBranchHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-r-2 border-gray-300 dark:border-gray-600 text-center ${getBranchColor(saju.monthBranch)}`}
              >
                <div className={`text-xl font-bold`}>{saju.monthBranch}</div>
                <div className={`text-[10px] ${getBranchTextColor(saju.monthBranch)}`}>{saju.monthBranchHanja}</div>
              </td>
              <td
                className={`p-3 border-b-2 border-gray-300 dark:border-gray-600 text-center ${getBranchColor(saju.yearBranch)}`}
              >
                <div className={`text-xl font-bold`}>{saju.yearBranch}</div>
                <div className={`text-[10px] ${getBranchTextColor(saju.yearBranch)}`}>{saju.yearBranchHanja}</div>
              </td>
            </tr>

            {/* 십성 행 */}
            <tr className="bg-gray-25 dark:bg-gray-850">
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 font-medium bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300">
                십성
              </td>
              <td
                className={`p-3 border-r border-gray-200 dark:border-gray-700 text-center ${timeUnknown ? "text-gray-400 dark:text-gray-500" : ""}`}
              >
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {timeUnknown ? "" : saju.hourBranchSibseong}
                </div>
              </td>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {saju.dayBranchSibseong}
                </div>
              </td>
              <td className="p-3 border-r border-gray-200 dark:border-gray-700 text-center">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {saju.monthBranchSibseong}
                </div>
              </td>
              <td className="p-3 text-center">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  {saju.yearBranchSibseong}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
