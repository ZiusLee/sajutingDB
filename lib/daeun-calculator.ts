import type { Saju } from "./saju"
import { EXACT_SOLAR_TERMS } from "./solar-terms" // Using precise solar terms

// 천간(天干)과 지지(地支) 배열
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
const KR_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const KR_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

// 양년 천간 목록 (한자 및 한글)
const YANG_STEMS = ["甲", "丙", "戊", "庚", "壬", "갑", "병", "무", "경", "임"]
// 음년 천간 목록 (한자 및 한글)
const YIN_STEMS = ["乙", "丁", "己", "辛", "癸", "을", "정", "기", "신", "계"]

// Helper to parse EXACT_SOLAR_TERMS timestamps
const getParsedSolarTerms = () => {
  return EXACT_SOLAR_TERMS.map((term) => ({
    ...term,
    dateTime: new Date(term.timestamp.replace(/-/g, "/")), // Ensure cross-browser compatibility for parsing
  })).sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
}
const PARSED_SOLAR_TERMS = getParsedSolarTerms()

// 1. 대운 방향 결정 함수
export function getDaeunDirection(yearStem: string, gender: string): "forward" | "reverse" {
  const normalizedGender = gender.toLowerCase()
  const isYangYear = YANG_STEMS.includes(yearStem)
  const isYinYear = YIN_STEMS.includes(yearStem)

  console.log(`대운 방향 계산 - 연간: ${yearStem}, 성별: ${gender}, 양년: ${isYangYear}, 음년: ${isYinYear}`)

  if (!isYangYear && !isYinYear) {
    console.error(`Invalid year stem for Daeun direction: ${yearStem}`)
    return "forward" // Default or throw error
  }

  const direction =
    (isYangYear && (normalizedGender === "male" || normalizedGender === "남성" || normalizedGender === "남자")) ||
    (isYinYear && (normalizedGender === "female" || normalizedGender === "여성" || normalizedGender === "여자"))
      ? "forward"
      : "reverse"

  console.log(`대운 방향 결정: ${direction}`)
  return direction
}

// 2. 관련 절기 찾기 함수 (정밀 데이터 사용)
function findRelevantSolarTerm(
  birthDateTime: Date,
  direction: "forward" | "reverse",
): { name: string; dateTime: Date; year: number; month: number; day: number } | null {
  if (direction === "forward") {
    for (const term of PARSED_SOLAR_TERMS) {
      if (term.dateTime.getTime() > birthDateTime.getTime()) {
        return {
          name: term.solarTerm,
          dateTime: term.dateTime, // 정확한 시간 정보 포함
          year: term.year,
          month: term.month,
          day: Number.parseInt(term.timestamp.split(" ")[0].split("-")[2]),
        }
      }
    }
  } else {
    for (let i = PARSED_SOLAR_TERMS.length - 1; i >= 0; i--) {
      const term = PARSED_SOLAR_TERMS[i]
      if (term.dateTime.getTime() < birthDateTime.getTime()) {
        return {
          name: term.solarTerm,
          dateTime: term.dateTime, // 정확한 시간 정보 포함
          year: term.year,
          month: term.month,
          day: Number.parseInt(term.timestamp.split(" ")[0].split("-")[2]),
        }
      }
    }
  }
  return null
}

// 절기까지의 일수 계산 (시간 포함)
function calculateDaysToTerm(birthDateTime: Date, termDateTime: Date): number {
  const diffMillis = Math.abs(termDateTime.getTime() - birthDateTime.getTime())
  // 밀리초를 일수로 변환 (시간까지 정확히 계산)
  const days = diffMillis / (1000 * 60 * 60 * 24)
  console.log(
    `시간 차이 계산 - 출생: ${birthDateTime.toISOString()}, 절기: ${termDateTime.toISOString()}, 일수: ${days}`,
  )
  return days
}

// 3. 대운수 계산 함수
function calculateDaeunStartingAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number,
  birthMinute: number,
  timeUnknown: boolean,
  direction: "forward" | "reverse",
): number {
  const actualBirthHour = timeUnknown ? 12 : birthHour
  const actualBirthMinute = timeUnknown ? 0 : birthMinute
  const birthDateTime = new Date(birthYear, birthMonth - 1, birthDay, actualBirthHour, actualBirthMinute)

  const relevantTerm = findRelevantSolarTerm(birthDateTime, direction)
  if (!relevantTerm) {
    console.error("Could not find relevant solar term for Daeun calculation.")
    return 1
  }

  // 시간까지 정확히 계산
  const D = calculateDaysToTerm(birthDateTime, relevantTerm.dateTime)

  console.log(`대운 계산 디버그 - 출생: ${birthDateTime}, 절기: ${relevantTerm.dateTime}, 일수차이: ${D}`)

  const q = Math.floor(D / 3)
  const r = Math.floor(D) % 3
  let age = r === 2 ? q + 1 : q

  console.log(`대운 계산 - q: ${q}, r: ${r}, 초기 age: ${age}`)

  // 0이 나오면 10세로 설정 (0과 10이 같음)
  if (age === 0) {
    age = 10
    console.log("대운세수 0 → 10으로 보정")
  }

  // 1~10 범위로 제한
  age = Math.max(1, Math.min(10, age))
  console.log(`최종 대운세수: ${age}`)
  return age
}

// 천간/지지 인덱스 찾기
function getStemIndex(stem: string): number {
  let index = STEMS.indexOf(stem)
  if (index === -1) index = KR_STEMS.indexOf(stem)
  return index
}

function getBranchIndex(branch: string): number {
  let index = BRANCHES.indexOf(branch)
  if (index === -1) index = KR_BRANCHES.indexOf(branch)
  return index
}

// 대운 간지 및 관련 정보 계산
function generateDaeunPillars(
  saju: Saju,
  direction: "forward" | "reverse",
  firstDaeunAge: number,
  birthYear: number,
  birthMonth: number, // 1-indexed
  birthDay: number, // 1-indexed
  count = 8,
): Array<{
  period: string
  ages: string
  start: string
  stem: string
  branch: string
  stemHanja: string
  branchHanja: string
  startAge: number
  endAge: number
}> {
  const monthStemIdx = getStemIndex(saju.monthStem)
  const monthBranchIdx = getBranchIndex(saju.monthBranch)

  if (monthStemIdx === -1 || monthBranchIdx === -1) {
    console.error(`Invalid month pillar for Daeun: ${saju.monthStem}${saju.monthBranch}`)
    return [] // Or default pillars
  }

  const pillars = []
  for (let i = 0; i < count; i++) {
    let currentStemIndex, currentBranchIndex
    if (direction === "forward") {
      currentStemIndex = (monthStemIdx + i + 1) % 10
      currentBranchIndex = (monthBranchIdx + i + 1) % 12
    } else {
      // reverse
      currentStemIndex = (monthStemIdx - (i + 1) + 100) % 10 // Ensure positive before modulo
      currentBranchIndex = (monthBranchIdx - (i + 1) + 120) % 12 // Ensure positive
    }

    const pillarStartAge = firstDaeunAge + i * 10
    const pillarEndAge = pillarStartAge + 9

    const pillarStartYear = birthYear + pillarStartAge
    // Start date is birth month and day of the pillarStartYear
    const pillarStartDateFormatted = `${pillarStartYear}.${birthMonth}.${birthDay}`

    pillars.push({
      period: KR_STEMS[currentStemIndex] + KR_BRANCHES[currentBranchIndex],
      ages: `${pillarStartAge}-${pillarEndAge}`,
      start: pillarStartDateFormatted,
      stem: KR_STEMS[currentStemIndex],
      branch: KR_BRANCHES[currentBranchIndex],
      stemHanja: STEMS[currentStemIndex],
      branchHanja: BRANCHES[currentBranchIndex],
      startAge: pillarStartAge,
      endAge: pillarEndAge,
    })
  }
  return pillars
}

// 메인 대운 정보 계산 함수
export function calculateDaeunInfo(
  saju: Pick<Saju, "yearStem" | "monthStem" | "monthBranch">, // Only require necessary parts of Saju
  birthYear: number, // Solar
  birthMonth: number, // Solar, 1-indexed
  birthDay: number, // Solar
  gender: string,
  birthHour?: number, // Solar, 0-23
  birthMinute?: number, // Solar, 0-59
  timeUnknown = false,
): {
  cycles: number[]
  pillars: Array<{
    period: string
    ages: string
    start: string
    stem: string
    branch: string
    stemHanja: string
    branchHanja: string
    startAge: number
    endAge: number
  }>
  direction: "forward" | "reverse"
  // Optional debug fields
  // daeunAgeRawD?: number;
  // daeunAgeCalc?: number;
  // firstDaeunAge?: number;
} {
  console.log(`대운 계산 시작 - 사주 연간: ${saju.yearStem}, 성별: ${gender}`)
  const direction = getDaeunDirection(saju.yearStem, gender)

  const actualBirthHour = timeUnknown || birthHour === undefined ? 12 : birthHour
  const actualBirthMinute = timeUnknown || birthMinute === undefined ? 0 : birthMinute

  const firstDaeunStartAge = calculateDaeunStartingAge(
    birthYear,
    birthMonth,
    birthDay,
    actualBirthHour,
    actualBirthMinute,
    timeUnknown,
    direction,
  )

  const cycles = Array.from({ length: 8 }, (_, i) => firstDaeunStartAge + i * 10)

  const pillars = generateDaeunPillars(
    saju as Saju, // Cast as Saju for generateDaeunPillars which expects more fields potentially
    direction,
    firstDaeunStartAge,
    birthYear,
    birthMonth,
    birthDay,
  )

  return {
    cycles,
    pillars,
    direction,
    // firstDaeunAge: firstDaeunStartAge, // Could be useful for debugging
  }
}

// --- Existing functions that might be used elsewhere or for display ---
// 오행 색상 매핑
export const elementColors = {
  wood: "bg-green-100 border-green-500 text-green-800 dark:bg-green-950 dark:border-green-400 dark:text-green-300",
  fire: "bg-red-100 border-red-500 text-red-800 dark:bg-red-950 dark:border-red-400 dark:text-red-300",
  earth:
    "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-300",
  metal: "bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-800 dark:border-gray-400 dark:text-gray-300",
  water: "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-300",
}

// 간의 오행 매핑
export const stemElements: Record<string, string> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water",
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
export const branchElements: Record<string, string> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
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

export function getStemColor(stem: string): string {
  return elementColors[stemElements[stem] || "earth"]
}

export function getBranchColor(branch: string): string {
  return elementColors[branchElements[branch] || "earth"]
}

export function getCurrentDaeunIndex(
  daeunPillars: Array<{ startAge: number; endAge: number }>,
  currentAge: number,
): number {
  if (!daeunPillars || !Array.isArray(daeunPillars)) return 0
  for (let i = 0; i < daeunPillars.length; i++) {
    if (currentAge >= daeunPillars[i].startAge && currentAge <= daeunPillars[i].endAge) {
      return i
    }
  }
  return 0
}

export function calculateKoreanAge(birthYear: number, birthMonth: number, birthDay: number): number {
  const today = new Date()
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay)
  let age = today.getFullYear() - birthDate.getFullYear()
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age--
  }
  return age
}
