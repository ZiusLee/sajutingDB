import type { Saju } from "./saju"

// 절입일 데이터 (월별 절입일)
const SOLAR_TERMS = [
  { month: 1, day: 20, name: "대한(大寒)" }, // 대한
  { month: 2, day: 4, name: "입춘(立春)" }, // 입춘
  { month: 3, day: 6, name: "경칩(驚蟄)" }, // 경칩
  { month: 4, day: 5, name: "청명(清明)" }, // 청명
  { month: 5, day: 6, name: "입하(立夏)" }, // 입하
  { month: 6, day: 6, name: "망종(芒種)" }, // 망종
  { month: 7, day: 7, name: "소서(小暑)" }, // 소서
  { month: 8, day: 8, name: "입추(立秋)" }, // 입추
  { month: 9, day: 8, name: "백로(白露)" }, // 백로
  { month: 10, day: 8, name: "한로(寒露)" }, // 한로
  { month: 11, day: 7, name: "입동(立冬)" }, // 입동
  { month: 12, day: 7, name: "대설(大雪)" }, // 대설
]

// 천간(天干)과 지지(地支) 배열
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

// 한글 천간과 지지 배열
const KR_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const KR_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

// 양년 천간 목록
const YANG_STEMS = ["갑", "병", "무", "경", "임", "甲", "丙", "戊", "庚", "壬"]

// 음년 천간 목록
const YIN_STEMS = ["을", "정", "기", "신", "계", "乙", "丁", "己", "辛", "癸"]

// 각 월의 일수
const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// 윤년 체크
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

// 특정 월의 일수 계산
function getDaysInMonth(year: number, month: number): number {
  if (month === 2 && isLeapYear(year)) {
    return 29
  }
  return DAYS_IN_MONTH[month]
}

// 천간 인덱스 찾기 (한자 또는 한글)
function getStemIndex(stem: string): number {
  let index = STEMS.indexOf(stem)
  if (index === -1) {
    index = KR_STEMS.indexOf(stem)
  }
  return index
}

// 지지 인덱스 찾기 (한자 또는 한글)
function getBranchIndex(branch: string): number {
  let index = BRANCHES.indexOf(branch)
  if (index === -1) {
    index = KR_BRANCHES.indexOf(branch)
  }
  return index
}

// 대운 방향 결정 함수
export function getDaeunDirection(yearStem: string, gender: string): "forward" | "reverse" {
  const isYangYear = YANG_STEMS.includes(yearStem)
  const isYinYear = YIN_STEMS.includes(yearStem)

  if (!isYangYear && !isYinYear) {
    console.error(`Invalid year stem: ${yearStem}`)
    return "forward" // 기본값
  }

  // 양년 남자 또는 음년 여자 -> 순행
  if (
    (isYangYear && (gender === "male" || gender === "남성" || gender === "남자")) ||
    (isYinYear && (gender === "female" || gender === "여성" || gender === "여자"))
  ) {
    return "forward"
  }

  // 음년 남자 또는 양년 여자 -> 역행
  return "reverse"
}

// 해당 월의 절입일 가져오기
export function getSolarTerm(month: number): { month: number; day: number; name: string } {
  // 배열 인덱스는 0부터 시작하므로 month - 1
  return SOLAR_TERMS[(month - 1) % 12]
}

// 직전 절입일 가져오기
export function getPreviousSolarTerm(month: number): { month: number; day: number; name: string } {
  // 1월이면 전년도 12월 절입일
  const prevMonth = month === 1 ? 12 : month - 1
  return getSolarTerm(prevMonth)
}

// 두 날짜 사이의 일수 계산
function daysBetween(year1: number, month1: number, day1: number, year2: number, month2: number, day2: number): number {
  const date1 = new Date(year1, month1 - 1, day1)
  const date2 = new Date(year2, month2 - 1, day2)

  // 밀리초 단위 차이를 일 단위로 변환
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// 대운세수 계산 함수 (명리학 규칙 적용)
export function calculateDaeunAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  direction: "forward" | "reverse",
): number {
  // 해당 월의 절입일
  const currentSolarTerm = getSolarTerm(birthMonth)

  // 순행(양남/음녀)인 경우
  if (direction === "forward") {
    // 생일이 절입일보다 빠른 경우 -> 1세 고정
    if (birthDay < currentSolarTerm.day) {
      return 1
    }

    // 생일이 절입일보다 같거나 늦은 경우 -> (생일 - 절입일) ÷ 3 계산
    const dayDiff = daysBetween(birthYear, birthMonth, currentSolarTerm.day, birthYear, birthMonth, birthDay)
    return Math.floor(dayDiff / 3)
  }

  // 역행(양녀/음남)인 경우
  else {
    // 생일이 절입일보다 같거나 늦은 경우 -> 그 해 절입일 사용
    if (birthDay >= currentSolarTerm.day) {
      const dayDiff = daysBetween(birthYear, birthMonth, currentSolarTerm.day, birthYear, birthMonth, birthDay)
      return Math.floor(dayDiff / 3)
    }

    // 생일이 절입일보다 빠른 경우 -> 직전 절입일 사용
    const prevSolarTerm = getPreviousSolarTerm(birthMonth)
    const prevMonth = prevSolarTerm.month
    const prevDay = prevSolarTerm.day
    const prevYear = birthMonth === 1 && prevMonth === 12 ? birthYear - 1 : birthYear

    const dayDiff = daysBetween(prevYear, prevMonth, prevDay, birthYear, birthMonth, birthDay)
    return Math.floor(dayDiff / 3)
  }
}

// 대운 주기 계산 함수
export function calculateDaeunCycles(daeunAge: number, count = 8): number[] {
  const cycles = []
  for (let i = 0; i < count; i++) {
    cycles.push(daeunAge + i * 10)
  }
  return cycles
}

// 대운 간지 계산 함수 (순행/역행 고려)
export function calculateDaeunPillars(
  saju: Saju,
  direction: "forward" | "reverse",
  count = 8,
): Array<{
  stem: string
  branch: string
  stemHanja: string
  branchHanja: string
  stemKorean: string
  branchKorean: string
}> {
  // 월주 인덱스 찾기 (한자 또는 한글 모두 지원)
  const monthStemIndex = getStemIndex(saju.monthStem)
  const monthBranchIndex = getBranchIndex(saju.monthBranch)

  if (monthStemIndex === -1 || monthBranchIndex === -1) {
    console.error(`Invalid month pillar: ${saju.monthStem}${saju.monthBranch}`)
    // 오류 발생 시 기본값 사용 (갑자)
    return Array(count).fill({
      stem: STEMS[0],
      branch: BRANCHES[0],
      stemHanja: STEMS[0],
      branchHanja: BRANCHES[0],
      stemKorean: KR_STEMS[0],
      branchKorean: KR_BRANCHES[0],
    })
  }

  const daeunPillars = []

  for (let i = 0; i < count; i++) {
    let stemIndex, branchIndex

    if (direction === "forward") {
      // 순행: 월주에서 앞으로
      stemIndex = (monthStemIndex + i) % 10
      branchIndex = (monthBranchIndex + i) % 12
    } else {
      // 역행: 월주에서 뒤로
      stemIndex = (monthStemIndex - i + 10) % 10
      branchIndex = (monthBranchIndex - i + 12) % 12
    }

    daeunPillars.push({
      stem: STEMS[stemIndex],
      branch: BRANCHES[branchIndex],
      stemHanja: STEMS[stemIndex],
      branchHanja: BRANCHES[branchIndex],
      stemKorean: KR_STEMS[stemIndex],
      branchKorean: KR_BRANCHES[branchIndex],
    })
  }

  return daeunPillars
}

// 대운 시작 시기 계산 (연, 월, 일)
export function calculateDaeunStartDate(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  daeunAge: number,
  birthHour?: number,
  birthMinute?: number,
): { year: number; month: number; day: number } {
  // 기본 대운 시작 연도
  const startYear = birthYear + daeunAge

  // 출생시간이 없는 경우 대략적인 계산
  if (birthHour === undefined || birthMinute === undefined) {
    return { year: startYear, month: birthMonth, day: birthDay }
  }

  // 출생시간이 있는 경우 더 정밀한 계산
  // 대운세수의 소수점 부분 계산 (일, 시간, 분 단위)
  const dayFraction = (birthHour * 60 + birthMinute) / (24 * 60)
  const totalDays = daeunAge * 365.25 // 대략적인 일수 (윤년 고려)

  // 생일로부터 대운 시작일까지의 일수
  const daysToAdd = Math.floor(totalDays + dayFraction * 365.25)

  // 생일에 일수 추가
  const startDate = new Date(birthYear, birthMonth - 1, birthDay)
  startDate.setDate(startDate.getDate() + daysToAdd)

  return {
    year: startDate.getFullYear(),
    month: startDate.getMonth() + 1,
    day: startDate.getDate(),
  }
}

// 대운 정보 계산 함수
export function calculateDaeunInfo(
  saju: Saju,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender = "male",
  birthHour?: number,
  birthMinute?: number,
): {
  direction: "forward" | "reverse"
  daeunAge: number
  cycles: number[]
  pillars: Array<{
    stem: string
    branch: string
    stemHanja: string
    branchHanja: string
    stemKorean: string
    branchKorean: string
    startAge: number
    endAge: number
    startYear: number
    startMonth?: number
    startDay?: number
  }>
} {
  // 대운 방향 결정
  const direction = getDaeunDirection(saju.yearStem, gender)

  // 대운세수 계산 (방향 고려)
  const daeunAge = calculateDaeunAge(birthYear, birthMonth, birthDay, direction)

  // 대운 주기 계산
  const cycles = calculateDaeunCycles(daeunAge)

  // 대운 간지 계산
  const rawPillars = calculateDaeunPillars(saju, direction)

  // 대운 간지에 나이 정보 추가
  const pillars = rawPillars.map((pillar, index) => {
    const startAge = cycles[index]
    const endAge = index < cycles.length - 1 ? cycles[index + 1] - 1 : startAge + 9
    const startYear = birthYear + startAge

    // 대운 시작 시기 계산 (출생시간이 있는 경우)
    let startMonth, startDay
    if (birthHour !== undefined && birthMinute !== undefined) {
      const startDate = calculateDaeunStartDate(birthYear, birthMonth, birthDay, startAge, birthHour, birthMinute)
      startMonth = startDate.month
      startDay = startDate.day
    }

    return {
      ...pillar,
      startAge,
      endAge,
      startYear,
      startMonth,
      startDay,
    }
  })

  return {
    direction,
    daeunAge,
    cycles,
    pillars,
  }
}

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

// 간의 오행 색상 가져오기
export function getStemColor(stem: string): string {
  return elementColors[stemElements[stem] || "earth"]
}

// 지의 오행 색상 가져오기
export function getBranchColor(branch: string): string {
  return elementColors[branchElements[branch] || "earth"]
}

// 현재 대운 인덱스 계산
export function getCurrentDaeunIndex(
  daeunPillars: Array<{ startAge: number; endAge: number }>,
  currentAge: number,
): number {
  for (let i = 0; i < daeunPillars.length; i++) {
    if (currentAge >= daeunPillars[i].startAge && currentAge <= daeunPillars[i].endAge) {
      return i
    }
  }
  return 0 // 기본값
}

// 현재 나이 계산 (한국식)
export function calculateKoreanAge(birthYear: number): number {
  const currentYear = new Date().getFullYear()
  return currentYear - birthYear + 1
}

// 디버그 함수 - 대운세수 계산 과정 출력
export function debugDaeunCalculation(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  direction: "forward" | "reverse",
): string {
  const currentSolarTerm = getSolarTerm(birthMonth)
  let result = `생일: ${birthYear}년 ${birthMonth}월 ${birthDay}일\n`
  result += `해당 월 절입일: ${birthMonth}월 ${currentSolarTerm.day}일 (${currentSolarTerm.name})\n`
  result += `대운 방향: ${direction === "forward" ? "순행" : "역행"}\n\n`

  if (direction === "forward") {
    if (birthDay < currentSolarTerm.day) {
      result += `순행 + 생일 < 절입일 → 1세 고정 (명리학 규칙)\n`
      result += `대운세수: 1세\n`
    } else {
      const dayDiff = daysBetween(birthYear, birthMonth, currentSolarTerm.day, birthYear, birthMonth, birthDay)
      result += `순행 + 생일 ≥ 절입일 → (생일 - 절입일) ÷ 3 계산\n`
      result += `일수 차이: ${dayDiff}일\n`
      result += `대운세수 계산: ${dayDiff} ÷ 3 = ${Math.floor(dayDiff / 3)}세\n`
    }
  } else {
    if (birthDay >= currentSolarTerm.day) {
      const dayDiff = daysBetween(birthYear, birthMonth, currentSolarTerm.day, birthYear, birthMonth, birthDay)
      result += `역행 + 생일 ≥ 절입일 → 그 해 절입일 사용\n`
      result += `일수 차이: ${dayDiff}일\n`
      result += `대운세수 계산: ${dayDiff} ÷ 3 = ${Math.floor(dayDiff / 3)}세\n`
    } else {
      const prevSolarTerm = getPreviousSolarTerm(birthMonth)
      const prevMonth = prevSolarTerm.month
      const prevDay = prevSolarTerm.day
      const prevYear = birthMonth === 1 && prevMonth === 12 ? birthYear - 1 : birthYear

      result += `역행 + 생일 < 절입일 → 직전 절입일 사용\n`
      result += `직전 절입일: ${prevMonth}월 ${prevDay}일 (${prevSolarTerm.name})\n`
      const dayDiff = daysBetween(prevYear, prevMonth, prevDay, birthYear, birthMonth, birthDay)
      result += `일수 차이: ${dayDiff}일\n`
      result += `대운세수 계산: ${dayDiff} ÷ 3 = ${Math.floor(dayDiff / 3)}세\n`
    }
  }

  return result
}
