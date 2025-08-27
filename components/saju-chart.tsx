"use client"

import { useTheme } from "next-themes"

interface SajuChartProps {
  saju: any
  timeUnknown?: boolean
  variant?: "chat" | "sidebar" | "card"
}

export default function SajuChart({ saju, timeUnknown = false, variant = "chat" }: SajuChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const elementColors = {
    wood: isDark ? "bg-green-600" : "bg-green-500",
    fire: isDark ? "bg-orange-600" : "bg-red-500",
    earth: isDark ? "bg-amber-700" : "bg-yellow-500",
    metal: isDark ? "bg-slate-500" : "bg-gray-400",
    water: isDark ? "bg-blue-600" : "bg-blue-500",
    unknown: isDark ? "bg-gray-600" : "bg-gray-300",
  }

  const elementTextColors = {
    wood: isDark ? "text-green-400" : "text-green-600",
    fire: isDark ? "text-orange-400" : "text-red-600",
    earth: isDark ? "text-amber-400" : "text-yellow-600",
    metal: isDark ? "text-slate-400" : "text-gray-600",
    water: isDark ? "text-blue-400" : "text-blue-600",
    unknown: isDark ? "text-gray-400" : "text-gray-400",
  }

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

  if (variant === "sidebar") {
    return (
      <div className="space-y-1">
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
            className={`${timeUnknown ? "text-muted-foreground" : getStemColor(saju.hourStem, true)} bg-muted rounded p-1 text-center font-bold border`}
          >
            <div className="text-xs font-bold">{timeUnknown ? "?" : saju.hourStem}</div>
            <div className="text-xs text-muted-foreground">{timeUnknown ? "" : saju.hourStemHanja}</div>
          </div>
          <div className={`${getStemColor(saju.dayStem, true)} bg-muted rounded p-1 text-center font-bold border`}>
            <div className="text-xs font-bold">{saju.dayStem}</div>
            <div className="text-xs text-muted-foreground">{saju.dayStemHanja}</div>
          </div>
          <div className={`${getStemColor(saju.monthStem, true)} bg-muted rounded p-1 text-center font-bold border`}>
            <div className="text-xs font-bold">{saju.monthStem}</div>
            <div className="text-xs text-muted-foreground">{saju.monthStemHanja}</div>
          </div>
          <div className={`${getStemColor(saju.yearStem, true)} bg-muted rounded p-1 text-center font-bold border`}>
            <div className="text-xs font-bold">{saju.yearStem}</div>
            <div className="text-xs text-muted-foreground">{saju.yearStemHanja}</div>
          </div>
        </div>

        {/* Sibseong for stems */}
        <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {timeUnknown ? "" : saju.hourStemSibseong}
          </div>
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {saju.dayStemSibseong || "본원"}
          </div>
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {saju.monthStemSibseong}
          </div>
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {saju.yearStemSibseong}
          </div>
        </div>

        {/* Branches with text colors */}
        <div className="grid grid-cols-4 gap-1">
          <div
            className={`${timeUnknown ? "text-muted-foreground" : getBranchColor(saju.hourBranch, true)} bg-muted rounded p-1 text-center font-bold border`}
          >
            <div className="text-xs font-bold">{timeUnknown ? "?" : saju.hourBranch}</div>
            <div className="text-xs text-muted-foreground">{timeUnknown ? "" : saju.hourBranchHanja}</div>
          </div>
          <div className={`${getBranchColor(saju.dayBranch, true)} bg-muted rounded p-1 text-center font-bold border`}>
            <div className="text-xs font-bold">{saju.dayBranch}</div>
            <div className="text-xs text-muted-foreground">{saju.dayBranchHanja}</div>
          </div>
          <div
            className={`${getBranchColor(saju.monthBranch, true)} bg-muted rounded p-1 text-center font-bold border`}
          >
            <div className="text-xs font-bold">{saju.monthBranch}</div>
            <div className="text-xs text-muted-foreground">{saju.monthBranchHanja}</div>
          </div>
          <div className={`${getBranchColor(saju.yearBranch, true)} bg-muted rounded p-1 text-center font-bold border`}>
            <div className="text-xs font-bold">{saju.yearBranch}</div>
            <div className="text-xs text-muted-foreground">{saju.yearBranchHanja}</div>
          </div>
        </div>

        {/* Sibseong for branches */}
        <div className="grid grid-cols-4 gap-1 text-center text-xs text-muted-foreground">
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {timeUnknown ? "" : saju.hourBranchSibseong}
          </div>
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {saju.dayBranchSibseong}
          </div>
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {saju.monthBranchSibseong}
          </div>
          <div className="bg-muted rounded px-1 py-1 h-6 flex items-center justify-center shadow-sm">
            {saju.yearBranchSibseong}
          </div>
        </div>
      </div>
    )
  }

  return (
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

      {/* Sibseong for stems */}
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

      {/* Sibseong for branches */}
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
  )
}
