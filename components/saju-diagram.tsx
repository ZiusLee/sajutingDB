"use client"

import type { Saju } from "@/lib/saju"
import { InfoIcon, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

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
  variant?: "chat" | "sidebar" | "card"
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
  variant = "chat",
}: SajuDiagramProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Theme-aware element colors for backgrounds
  const elementColors = {
    wood: isDark ? "bg-green-600" : "bg-green-500", // 목 - 녹색
    fire: isDark ? "bg-orange-600" : "bg-red-500", // 화 - 다크에서는 오렌지, 라이트에서는 빨간색
    earth: isDark ? "bg-amber-700" : "bg-yellow-500", // 토 - 다크에서는 앰버, 라이트에서는 노란색
    metal: isDark ? "bg-slate-500" : "bg-gray-400", // 금 - 회색
    water: isDark ? "bg-blue-600" : "bg-blue-500", // 수 - 파란색
    unknown: isDark ? "bg-gray-600" : "bg-gray-300",
  }

  // Theme-aware text colors for sidebar
  const elementTextColors = {
    wood: isDark ? "text-green-400" : "text-green-600", // 목 - 녹색
    fire: isDark ? "text-orange-400" : "text-red-600", // 화 - 다크에서는 오렌지, 라이트에서는 빨간색
    earth: isDark ? "text-amber-400" : "text-yellow-600", // 토 - 다크에서는 앰버, 라이트에서는 노란색
    metal: isDark ? "text-slate-400" : "text-gray-600", // 금 - 회색
    water: isDark ? "text-blue-400" : "text-blue-600", // 수 - 파란색
    unknown: isDark ? "text-gray-400" : "text-gray-400",
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

  // 색상 가져오기 함수들
  const getStemColor = (stem: string, isText = false) => {
    if (stem === "?" || !stem) return isText ? elementTextColors.unknown : elementColors.unknown
    const element = stemElements[stem as keyof typeof stemElements] || "unknown"
    return isText ? elementTextColors[element] : elementColors[element]
  }

  const getBranchColor = (branch: string, isText = false) => {
    if (branch === "?" || !branch) return isText ? elementTextColors.unknown : elementColors.unknown
    const element = branchElements[branch as keyof typeof branchElements] || "unknown"
    return isText ? elementTextColors[element] : elementColors[element]
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

  const dayMasterInfo = getDayMasterInfo()
  const displayName = name || "사용자"

  // Card layout for mobile chat
  if (variant === "card") {
    return (
      <div className="bg-background rounded-2xl border border-border p-4 shadow-sm">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-foreground">
            {displayName}님의 사주: {dayMasterInfo.ilju}일주
          </h3>
        </div>

        {/* 4-pillar grid */}
        <div className="space-y-3">
          {/* Headers */}
          <div className="grid grid-cols-4 gap-2 text-center text-sm text-muted-foreground mb-2">
            <div>시주</div>
            <div>일주</div>
            <div>월주</div>
            <div>년주</div>
          </div>

          {/* Stems */}
          <div className="grid grid-cols-4 gap-2">
            <div
              className={`${timeUnknown ? elementColors.unknown : getStemColor(saju.hourStem)} text-white rounded-lg p-3 text-center shadow-sm`}
            >
              <div className="text-xl font-bold">{timeUnknown ? "?" : saju.hourStem}</div>
              <div className="text-xs">{timeUnknown ? "" : saju.hourStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.dayStem)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.dayStem}</div>
              <div className="text-xs">{saju.dayStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.monthStem)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.monthStem}</div>
              <div className="text-xs">{saju.monthStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.yearStem)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.yearStem}</div>
              <div className="text-xs">{saju.yearStemHanja}</div>
            </div>
          </div>

          {/* Sibseong for stems - increased height */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">
              {timeUnknown ? "" : saju.hourStemSibseong}
            </div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">
              {saju.dayStemSibseong || "본원"}
            </div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.monthStemSibseong}</div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.yearStemSibseong}</div>
          </div>

          {/* Branches */}
          <div className="grid grid-cols-4 gap-2">
            <div
              className={`${timeUnknown ? elementColors.unknown : getBranchColor(saju.hourBranch)} text-white rounded-lg p-3 text-center shadow-sm`}
            >
              <div className="text-xl font-bold">{timeUnknown ? "?" : saju.hourBranch}</div>
              <div className="text-xs">{timeUnknown ? "" : saju.hourBranchHanja}</div>
            </div>
            <div className={`${getBranchColor(saju.dayBranch)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.dayBranch}</div>
              <div className="text-xs">{saju.dayBranchHanja}</div>
            </div>
            <div className={`${getBranchColor(saju.monthBranch)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.monthBranch}</div>
              <div className="text-xs">{saju.monthBranchHanja}</div>
            </div>
            <div className={`${getBranchColor(saju.yearBranch)} text-white rounded-lg p-3 text-center shadow-sm`}>
              <div className="text-xl font-bold">{saju.yearBranch}</div>
              <div className="text-xs">{saju.yearBranchHanja}</div>
            </div>
          </div>

          {/* Sibseong for branches - increased height */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">
              {timeUnknown ? "" : saju.hourBranchSibseong}
            </div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.dayBranchSibseong}</div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.monthBranchSibseong}</div>
            <div className="bg-muted rounded p-2 h-8 flex items-center justify-center">{saju.yearBranchSibseong}</div>
          </div>
        </div>
      </div>
    )
  }

  // Sidebar compact layout with text colors
  if (variant === "sidebar") {
    return (
      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs">👤</span>
          </div>
          <div className="flex-1">
            <span className="text-sm text-muted-foreground">사주 프로필</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground float-right" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-400 flex items-center justify-center text-white font-bold">
              {displayName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-foreground">{displayName}의 사주 ⭐</h3>
              <p className="text-sm text-red-500">
                {dayMasterInfo.ilju}일주 ({dayMasterInfo.elementName}) {dayMasterInfo.colorName}
                {dayMasterInfo.animalName}
              </p>
            </div>
          </div>

          {/* Birth Info */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-start gap-2">
              <span>생일</span>
              <span>
                {solarYear}. {solarMonth}. {solarDay}(양력)
              </span>
            </div>
            <div className="flex justify-start gap-2">
              <span>생시</span>
              <span>
                오전 {hour}시 {minute}분, {location || "서울특별시"}
              </span>
            </div>
            <div className="flex justify-start gap-2">
              <span>성별</span>
              <span>{gender === "male" ? "남성" : gender === "female" ? "여성" : "미상"}</span>
            </div>
          </div>
        </div>

        {/* Saju Chart Header */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-sm font-medium">사주팔자 상세</span>
          <InfoIcon className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Compact 4-pillar chart with text colors */}
        <div className="space-y-2">
          {/* Headers */}
          <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
            <div>시주</div>
            <div>일주</div>
            <div>월주</div>
            <div>년주</div>
          </div>

          {/* Stems with text colors */}
          <div className="grid grid-cols-4 gap-1">
            <div
              className={`${timeUnknown ? "text-muted-foreground" : getStemColor(saju.hourStem, true)} bg-muted rounded p-2 text-center font-bold border`}
            >
              <div className="text-sm font-bold">{timeUnknown ? "?" : saju.hourStem}</div>
              <div className="text-xs text-muted-foreground">{timeUnknown ? "" : saju.hourStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.dayStem, true)} bg-muted rounded p-2 text-center font-bold border`}>
              <div className="text-sm font-bold">{saju.dayStem}</div>
              <div className="text-xs text-muted-foreground">{saju.dayStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.monthStem, true)} bg-muted rounded p-2 text-center font-bold border`}>
              <div className="text-sm font-bold">{saju.monthStem}</div>
              <div className="text-xs text-muted-foreground">{saju.monthStemHanja}</div>
            </div>
            <div className={`${getStemColor(saju.yearStem, true)} bg-muted rounded p-2 text-center font-bold border`}>
              <div className="text-sm font-bold">{saju.yearStem}</div>
              <div className="text-xs text-muted-foreground">{saju.yearStemHanja}</div>
            </div>
          </div>

          {/* Sibseong for stems - increased height */}
          <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {timeUnknown ? "" : saju.hourStemSibseong}
            </div>
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {saju.dayStemSibseong || "본원"}
            </div>
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {saju.monthStemSibseong}
            </div>
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {saju.yearStemSibseong}
            </div>
          </div>

          {/* Branches with text colors */}
          <div className="grid grid-cols-4 gap-1">
            <div
              className={`${timeUnknown ? "text-muted-foreground" : getBranchColor(saju.hourBranch, true)} bg-muted rounded p-2 text-center font-bold border`}
            >
              <div className="text-sm font-bold">{timeUnknown ? "?" : saju.hourBranch}</div>
              <div className="text-xs text-muted-foreground">{timeUnknown ? "" : saju.hourBranchHanja}</div>
            </div>
            <div
              className={`${getBranchColor(saju.dayBranch, true)} bg-muted rounded p-2 text-center font-bold border`}
            >
              <div className="text-sm font-bold">{saju.dayBranch}</div>
              <div className="text-xs text-muted-foreground">{saju.dayBranchHanja}</div>
            </div>
            <div
              className={`${getBranchColor(saju.monthBranch, true)} bg-muted rounded p-2 text-center font-bold border`}
            >
              <div className="text-sm font-bold">{saju.monthBranch}</div>
              <div className="text-xs text-muted-foreground">{saju.monthBranchHanja}</div>
            </div>
            <div
              className={`${getBranchColor(saju.yearBranch, true)} bg-muted rounded p-2 text-center font-bold border`}
            >
              <div className="text-sm font-bold">{saju.yearBranch}</div>
              <div className="text-xs text-muted-foreground">{saju.yearBranchHanja}</div>
            </div>
          </div>

          {/* Sibseong for branches - increased height */}
          <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {timeUnknown ? "" : saju.hourBranchSibseong}
            </div>
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {saju.dayBranchSibseong}
            </div>
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {saju.monthBranchSibseong}
            </div>
            <div className="bg-muted rounded px-1 py-2 h-8 flex items-center justify-center">
              {saju.yearBranchSibseong}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Original chat layout with background colors and improved design
  return (
    <div className="space-y-4">
      {/* Profile section */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg shadow-sm">
        <div className="w-16 h-16 rounded-xl bg-red-400 flex items-center justify-center text-white text-2xl font-bold shadow-sm">
          {displayName.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{displayName}의 사주</h2>
            <span className="text-muted-foreground">⭐</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  <InfoIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold">사주란?</p>
                  <p>사주는 태어난 년, 월, 일, 시의 천간과 지지를 나타내는 8개의 글자로 구성됩니다.</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {dayMasterInfo.ilju && (
            <p className="text-red-500 font-medium">
              {dayMasterInfo.ilju}일주 ({dayMasterInfo.elementName}) {dayMasterInfo.colorName}
              {dayMasterInfo.animalName}
            </p>
          )}
        </div>
      </div>

      {/* Birth info */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">생일</span>
          <span>
            {solarYear}. {solarMonth}. {solarDay}(양력)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">생시</span>
          <span>
            오전 {hour}시 {minute}분, {location || "서울특별시"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">성별</span>
          <span>{gender === "male" ? "남성" : gender === "female" ? "여성" : "미상"}</span>
        </div>
      </div>

      {/* Saju chart header */}
      <div className="flex items-center gap-2">
        <h3 className="font-medium">사주팔자 상세</h3>
        <InfoIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* 4-pillar chart with background colors and shadows */}
      <div className="grid grid-cols-4 gap-3">
        {/* Headers */}
        <div className="text-center text-sm text-muted-foreground">시주</div>
        <div className="text-center text-sm text-muted-foreground">일주</div>
        <div className="text-center text-sm text-muted-foreground">월주</div>
        <div className="text-center text-sm text-muted-foreground">년주</div>

        {/* Stems with background colors */}
        <div
          className={`${timeUnknown ? elementColors.unknown : getStemColor(saju.hourStem)} text-white rounded-lg p-4 text-center shadow-md`}
        >
          <div className="text-2xl font-bold">{timeUnknown ? "?" : saju.hourStem}</div>
          <div className="text-sm">{timeUnknown ? "" : saju.hourStemHanja}</div>
        </div>
        <div className={`${getStemColor(saju.dayStem)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.dayStem}</div>
          <div className="text-sm">{saju.dayStemHanja}</div>
        </div>
        <div className={`${getStemColor(saju.monthStem)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.monthStem}</div>
          <div className="text-sm">{saju.monthStemHanja}</div>
        </div>
        <div className={`${getStemColor(saju.yearStem)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.yearStem}</div>
          <div className="text-sm">{saju.yearStemHanja}</div>
        </div>

        {/* Sibseong for stems - increased height */}
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {timeUnknown ? "" : saju.hourStemSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.dayStemSibseong || "본원"}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.monthStemSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.yearStemSibseong}
        </div>

        {/* Branches with background colors */}
        <div
          className={`${timeUnknown ? elementColors.unknown : getBranchColor(saju.hourBranch)} text-white rounded-lg p-4 text-center shadow-md`}
        >
          <div className="text-2xl font-bold">{timeUnknown ? "?" : saju.hourBranch}</div>
          <div className="text-sm">{timeUnknown ? "" : saju.hourBranchHanja}</div>
        </div>
        <div className={`${getBranchColor(saju.dayBranch)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.dayBranch}</div>
          <div className="text-sm">{saju.dayBranchHanja}</div>
        </div>
        <div className={`${getBranchColor(saju.monthBranch)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.monthBranch}</div>
          <div className="text-sm">{saju.monthBranchHanja}</div>
        </div>
        <div className={`${getBranchColor(saju.yearBranch)} text-white rounded-lg p-4 text-center shadow-md`}>
          <div className="text-2xl font-bold">{saju.yearBranch}</div>
          <div className="text-sm">{saju.yearBranchHanja}</div>
        </div>

        {/* Sibseong for branches - increased height */}
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {timeUnknown ? "" : saju.hourBranchSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.dayBranchSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.monthBranchSibseong}
        </div>
        <div className="text-center text-sm text-muted-foreground bg-muted rounded p-3 h-12 flex items-center justify-center shadow-sm">
          {saju.yearBranchSibseong}
        </div>
      </div>
    </div>
  )
}
