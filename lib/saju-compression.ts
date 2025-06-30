import type { Saju } from "./saju"
import { getCurrentDaeunIndex, calculateKoreanAge } from "./daeun-calculator"

export interface CompressedSaju {
  name: string
  birth: string
  gender: string
  sajuPalja: {
    year: { stem: string; branch: string }
    month: { stem: string; branch: string }
    day: { stem: string; branch: string }
    hour: { stem: string; branch: string }
  }
  dayMaster: string
  sibseong: {
    yearStem: string
    yearBranch: string
    monthStem: string
    monthBranch: string
    dayStem: string
    dayBranch: string
    hourStem: string
    hourBranch: string
  }
  elements: {
    목: number
    화: number
    토: number
    금: number
    수: number
  }
  summary: string
  // 압축된 대운 정보 추가
  daeun?: string
  currentAge?: number
}

// 대운 정보 압축 함수
function compressDaeunInfo(daeunData: any, birthYear: number, birthMonth: number, birthDay: number): string {
  if (!daeunData || !daeunData.pillars || !Array.isArray(daeunData.pillars)) {
    return ""
  }

  const currentAge = calculateKoreanAge(birthYear, birthMonth, birthDay)
  const currentDaeunIndex = getCurrentDaeunIndex(daeunData.pillars, currentAge)
  const currentDaeun = daeunData.pillars[currentDaeunIndex]
  const nextDaeun = daeunData.pillars[currentDaeunIndex + 1]

  if (!currentDaeun) {
    return ""
  }

  // 현재 대운에서 남은 년수 계산
  const remainingYears = currentDaeun.endAge - currentAge
  const remainingText = remainingYears > 0 ? `${remainingYears}년남음` : "마지막해"

  // 다음 대운 정보
  const nextDaeunText = nextDaeun
    ? `다음:${nextDaeun.period}(${nextDaeun.ages}세,${nextDaeun.start}시작)`
    : "마지막대운"

  // 방향 정보
  const directionText = daeunData.direction === "forward" ? "순행" : "역행"

  return `현재:${currentDaeun.period}(${currentDaeun.ages}세,${remainingText}) ${nextDaeunText} ${directionText}`
}

export function compressSaju(
  saju: Saju,
  solarYear?: string,
  solarMonth?: string,
  solarDay?: string,
  solarHour?: string,
  solarMinute?: string,
  timeUnknown?: boolean,
): CompressedSaju {
  // 기본 사주 압축
  const compressed: CompressedSaju = {
    name: saju.name || "사용자",
    birth: `${solarYear || saju.year}.${solarMonth || saju.month}.${solarDay || saju.day}${
      timeUnknown ? " (시간미상)" : solarHour && solarMinute ? ` ${solarHour}:${solarMinute}` : ""
    }`,
    gender: saju.gender || "male",
    sajuPalja: {
      year: { stem: saju.yearStem, branch: saju.yearBranch },
      month: { stem: saju.monthStem, branch: saju.monthBranch },
      day: { stem: saju.dayStem, branch: saju.dayBranch },
      hour: { stem: saju.hourStem, branch: saju.hourBranch },
    },
    dayMaster: saju.dayMaster || saju.dayStem,
    sibseong: {
      yearStem: saju.yearStemSibseong || "",
      yearBranch: saju.yearBranchSibseong || "",
      monthStem: saju.monthStemSibseong || "",
      monthBranch: saju.monthBranchSibseong || "",
      dayStem: saju.dayStemSibseong || "",
      dayBranch: saju.dayBranchSibseong || "",
      hourStem: saju.hourStemSibseong || "",
      hourBranch: saju.hourBranchSibseong || "",
    },
    elements: {
      목: saju.elements?.wood || 0,
      화: saju.elements?.fire || 0,
      토: saju.elements?.earth || 0,
      금: saju.elements?.metal || 0,
      수: saju.elements?.water || 0,
    },
    summary: saju.summary || "",
  }

  // 대운 정보가 있으면 압축해서 추가
  if (saju.daeun && solarYear && solarMonth && solarDay) {
    compressed.daeun = compressDaeunInfo(
      saju.daeun,
      Number.parseInt(solarYear),
      Number.parseInt(solarMonth),
      Number.parseInt(solarDay),
    )
    compressed.currentAge = calculateKoreanAge(
      Number.parseInt(solarYear),
      Number.parseInt(solarMonth),
      Number.parseInt(solarDay),
    )
  }

  return compressed
}

// 상세 대운 정보가 필요할 때 사용하는 함수
export function getDetailedDaeunInfo(saju: Saju): any {
  return saju.daeun || null
}
