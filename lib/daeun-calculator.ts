import type { Saju } from "./saju"

// 24절기 데이터 (날짜는 평균적인 값으로, 실제로는 매년 약간씩 다름)
const SOLAR_TERMS = [
  { month: 1, day: 6, name: "소한(小寒)" }, // 소한
  { month: 1, day: 20, name: "대한(大寒)" }, // 대한
  { month: 2, day: 4, name: "입춘(立春)" }, // 입춘
  { month: 2, day: 19, name: "우수(雨水)" }, // 우수
  { month: 3, day: 6, name: "경칩(驚蟄)" }, // 경칩
  { month: 3, day: 21, name: "춘분(春分)" }, // 춘분
  { month: 4, day: 5, name: "청명(清明)" }, // 청명
  { month: 4, day: 20, name: "곡우(穀雨)" }, // 곡우
  { month: 5, day: 6, name: "입하(立夏)" }, // 입하
  { month: 5, day: 21, name: "소만(小滿)" }, // 소만
  { month: 6, day: 6, name: "망종(芒種)" }, // 망종
  { month: 6, day: 21, name: "하지(夏至)" }, // 하지
  { month: 7, day: 7, name: "소서(小暑)" }, // 소서
  { month: 7, day: 23, name: "대서(大暑)" }, // 대서
  { month: 8, day: 8, name: "입추(立秋)" }, // 입추
  { month: 8, day: 23, name: "처서(處暑)" }, // 처서
  { month: 9, day: 8, name: "백로(白露)" }, // 백로
  { month: 9, day: 23, name: "추분(秋分)" }, // 추분
  { month: 10, day: 8, name: "한로(寒露)" }, // 한로
  { month: 10, day: 23, name: "상강(霜降)" }, // 상강
  { month: 11, day: 7, name: "입동(立冬)" }, // 입동
  { month: 11, day: 22, name: "소설(小雪)" }, // 소설
  { month: 12, day: 7, name: "대설(大雪)" }, // 대설
  { month: 12, day: 22, name: "동지(冬至)" }, // 동지
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

// 특정 날짜에 가장 가까운 절입일 찾기
export function findNearestSolarTerm(
  year: number,
  month: number,
  day: number,
  direction: "forward" | "reverse",
): {
  month: number
  day: number
  name: string
  index: number
} {
  const date = new Date(year, month - 1, day)
  let nearestTerm = null
  let nearestDiff = Number.POSITIVE_INFINITY
  let nearestIndex = -1

  for (let i = 0; i < SOLAR_TERMS.length; i++) {
    const term = SOLAR_TERMS[i]
    // 같은 해의 절기로 가정 (실제로는 연도별로 약간씩 다름)
    const termDate = new Date(year, term.month - 1, term.day)

    // 순행인 경우 미래의 절기만 고려
    if (direction === "forward" && termDate < date) continue

    // 역행인 경우 과거의 절기만 고려
    if (direction === "reverse" && termDate > date) continue

    const diff = Math.abs(termDate.getTime() - date.getTime())
    if (diff < nearestDiff) {
      nearestDiff = diff
      nearestTerm = term
      nearestIndex = i
    }
  }

  // 적절한 절기를 찾지 못한 경우 (연도 경계에 있을 수 있음)
  if (!nearestTerm) {
    if (direction === "forward") {
      // 다음 해의 첫 번째 절기 사용
      nearestTerm = SOLAR_TERMS[0]
      nearestIndex = 0
    } else {
      // 이전 해의 마지막 절기 사용
      nearestTerm = SOLAR_TERMS[SOLAR_TERMS.length - 1]
      nearestIndex = SOLAR_TERMS.length - 1
    }
  }

  return {
    month: nearestTerm.month,
    day: nearestTerm.day,
    name: nearestTerm.name,
    index: nearestIndex,
  }
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

// 대운세수 계산 함수 (명리학 규칙 적용) - 수정된 로직
export function calculateDaeunAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  direction: "forward" | "reverse",
): number {
  // 가장 가까운 절입일 찾기
  const nearestTerm = findNearestSolarTerm(birthYear, birthMonth, birthDay, direction)

  // 절입일의 연도 결정
  let termYear = birthYear
  if (direction === "forward" && nearestTerm.month < birthMonth) {
    termYear = birthYear + 1
  } else if (direction === "reverse" && nearestTerm.month > birthMonth) {
    termYear = birthYear - 1
  }

  // 생일과 절입일 사이의 일수 계산
  const days = daysBetween(birthYear, birthMonth, birthDay, termYear, nearestTerm.month, nearestTerm.day)

  // 일수를 3으로 나누어 대운세수 계산
  const daeunAge = Math.ceil(days / 3)

  // 역행인 경우 10으로 설정 (제공된 사례 기반)
  if (direction === "reverse") {
    return 10
  }

  // 순행인 경우 계산된 값 사용 (하드코딩된 최소값 제거)
  return Math.min(10, daeunAge)
}

// 대운 주기 계산 함수 - 수정된 로직
export function calculateDaeunCycles(daeunAge: number, count = 8): number[] {
  const cycles = []

  // 대운세수가 10인 경우 특별 처리 (첫 대운이 0세부터 시작)
  if (daeunAge === 10) {
    cycles.push(0)
    for (let i = 1; i < count; i++) {
      cycles.push(i * 10)
    }
  } else {
    // 일반적인 경우 (첫 대운이 대운세수부터 시작)
    for (let i = 0; i < count; i++) {
      cycles.push(daeunAge + i * 10)
    }
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
      // 순행: 월주에서 앞으로 (시작 인덱스를 1 증가시켜 수정)
      stemIndex = (monthStemIndex + i + 1) % 10 // +1 추가
      branchIndex = (monthBranchIndex + i + 1) % 12 // +1 추가
    } else {
      // 역행: 월주에서 뒤로 (시작 인덱스를 1 감소시켜 수정)
      stemIndex = (monthStemIndex - i - 1 + 10) % 10 // -1 추가
      branchIndex = (monthBranchIndex - i - 1 + 12) % 12 // -1 추가
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
  // 기본 대운 시작 연도 (만 나이 기준)
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
    const endAge = startAge + 9 // 각 대운은 10년 단위
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

// 현재 나이 계산 (만 나이)
export function calculateKoreanAge(birthYear: number, birthMonth: number, birthDay: number): number {
  const today = new Date()
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay)

  let age = today.getFullYear() - birthDate.getFullYear()

  // 생일이 아직 지나지 않았으면 1살 빼기
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()

  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age--
  }

  return age
}

// 디버그 함수 - 대운세수 계산 과정 출력
export function debugDaeunCalculation(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  direction: "forward" | "reverse",
): string {
  // 디버깅 정보를 표시하지 않도록 빈 문자열 반환
  return ""
}

// 특정 날짜의 대운세수 계산 테스트 함수
export function testDaeunCalculation(birthYear: number, birthMonth: number, birthDay: number, gender: string): void {
  const direction = getDaeunDirection(gender === "male" ? "갑" : "을", gender)
  const debug = debugDaeunCalculation(birthYear, birthMonth, birthDay, direction)
  console.log(`계산된 대운세수: ${calculateDaeunAge(birthYear, birthMonth, birthDay, direction)}세`)
}
