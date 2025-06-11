interface SajuDiagramProps {
  saju: any
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
  timeUnknown?: boolean
  location?: string
  showSibseong?: boolean
  showYearAnimal?: boolean
}

export default function SajuDiagram({
  saju,
  size = "md",
  name,
  gender,
  solarYear,
  solarMonth,
  solarDay,
  hour,
  minute,
  lunarYear,
  lunarMonth,
  lunarDay,
  timeUnknown = false,
  location = "서울특별시",
  showSibseong = false,
  showYearAnimal = false,
}: SajuDiagramProps) {
  const cellClass = `w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 flex items-center justify-center`
  const stemClass = `text-xl md:text-2xl lg:text-3xl`
  const branchClass = `text-sm md:text-base lg:text-lg`

  let cellBgClass = "bg-gray-100"
  let stemColorClass = "text-black"
  let branchColorClass = "text-gray-700"
  let dayMasterBorderClass = "border-blue-500"

  if (size === "sm") {
    cellBgClass = "bg-gray-50"
    stemColorClass = "text-gray-800"
    branchColorClass = "text-gray-600"
    dayMasterBorderClass = "border-blue-400"
  } else if (size === "lg") {
    cellBgClass = "bg-gray-200"
    stemColorClass = "text-gray-900"
    branchColorClass = "text-gray-800"
    dayMasterBorderClass = "border-blue-600"
  }

  const hourDisplay = {
    stem: saju.hourStem || "?",
    branch: saju.hourBranch || "?",
  }

  return (
    <div>
      {name && (
        <div className="text-center mb-2">
          {name} ({gender === "male" ? "남" : "여"})
        </div>
      )}
      {(solarYear || lunarYear) && (
        <div className="text-center mb-2">
          {solarYear && `양력: ${solarYear}년 ${solarMonth}월 ${solarDay}일 `}
          {lunarYear && `음력: ${lunarYear}년 ${lunarMonth}월 ${lunarDay}일`}
          {!timeUnknown && hour && minute && `${hour}시 ${minute}분 `}
          {!timeUnknown && `(${location})`}
          {timeUnknown && "(시간 불명)"}
        </div>
      )}
      <div className="flex justify-center space-x-2 md:space-x-4 mb-2">
        <div className={`${cellClass} ${cellBgClass}`}>
          <div className="text-center">
            <div className={`${stemClass} ${stemColorClass}`}>{saju.yearStem}</div>
            <div className={`${branchClass} ${branchColorClass}`}>{saju.yearBranch}</div>
            {showSibseong && saju.yearStemSibseong && (
              <div className="text-xs text-yellow-400 mt-1">{saju.yearStemSibseong}</div>
            )}
            {showYearAnimal && saju.yearAnimal && <div className="text-xs text-blue-300 mt-1">{saju.yearAnimal}</div>}
          </div>
        </div>
        <div className={`${cellClass} ${cellBgClass}`}>
          <div className="text-center">
            <div className={`${stemClass} ${stemColorClass}`}>{saju.monthStem}</div>
            <div className={`${branchClass} ${branchColorClass}`}>{saju.monthBranch}</div>
            {showSibseong && saju.monthStemSibseong && (
              <div className="text-xs text-yellow-400 mt-1">{saju.monthStemSibseong}</div>
            )}
          </div>
        </div>
        <div className={`${cellClass} ${cellBgClass} border-2 ${dayMasterBorderClass}`}>
          <div className="text-center">
            <div className={`${stemClass} ${stemColorClass} font-bold`}>{saju.dayStem}</div>
            <div className={`${branchClass} ${branchColorClass}`}>{saju.dayBranch}</div>
            {showSibseong && saju.dayStemSibseong && (
              <div className="text-xs text-yellow-400 mt-1">{saju.dayStemSibseong}</div>
            )}
          </div>
        </div>
        <div className={`${cellClass} ${cellBgClass}`}>
          <div className="text-center">
            <div className={`${stemClass} ${stemColorClass}`}>{hourDisplay.stem}</div>
            <div className={`${branchClass} ${branchColorClass}`}>{hourDisplay.branch}</div>
            {showSibseong && saju.hourStemSibseong && !timeUnknown && (
              <div className="text-xs text-yellow-400 mt-1">{saju.hourStemSibseong}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
