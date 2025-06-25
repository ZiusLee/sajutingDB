// 천간 (Heavenly Stems)
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const HEAVENLY_STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

// 지지 (Earthly Branches)
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
const EARTHLY_BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

// 오행 (Five Elements)
const STEM_ELEMENTS = {
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

const BRANCH_ELEMENTS = {
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

// 지지의 십성 계산을 위한 정확한 천간 매핑
// 각 지지는 특정 천간의 기운을 가지고 있음
const BRANCH_TO_STEM_MAP = {
  자: "계", // 자(鼠)는 계(癸)의 기운
  축: "기", // 축(牛)는 기(己)의 기운
  인: "갑", // 인(虎)는 갑(甲)의 기운
  묘: "을", // 묘(兎)는 을(乙)의 기운
  진: "무", // 진(龍)는 무(戊)의 기운
  사: "병", // 사(蛇)는 병(丙)의 기운
  오: "정", // 오(馬)는 정(丁)의 기운
  미: "기", // 미(羊)는 기(己)의 기운
  신: "경", // 신(猴)는 경(庚)의 기운
  유: "신", // 유(鷄)는 신(辛)의 기운
  술: "무", // 술(狗)는 무(戊)의 기운
  해: "임", // 해(豬)는 임(壬)의 기운, changed from "계" to "임"
}

// 오행 한글 이름
const ELEMENT_NAMES = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
}

// 십성 계산 함수 - KEEPING THIS FROM THE ORIGINAL FILE
const SIBSEONG = {
  갑: {
    갑: "비견",
    을: "겁재",
    병: "식신",
    정: "상관",
    무: "편재",
    기: "정재",
    경: "편관",
    신: "정관",
    임: "편인",
    계: "정인",
  },
  을: {
    갑: "겁재",
    을: "비견",
    병: "상관",
    정: "식신",
    무: "정재",
    기: "편재",
    경: "정관",
    신: "편관",
    임: "정인",
    계: "편인",
  },
  병: {
    갑: "편인",
    을: "정인",
    병: "비견",
    정: "겁재",
    무: "식신",
    기: "상관",
    경: "편재",
    신: "정재",
    임: "편관",
    계: "정관",
  },
  정: {
    갑: "정인",
    을: "편인",
    병: "겁재",
    정: "비견",
    무: "상관",
    기: "식신",
    경: "정재",
    신: "편재",
    임: "정관",
    계: "편관",
  },
  무: {
    갑: "편관",
    을: "정관",
    병: "편인",
    정: "정인",
    무: "비견",
    기: "겁재",
    경: "식신",
    신: "상관",
    임: "편재",
    계: "정재",
  },
  기: {
    갑: "정관",
    을: "편관",
    병: "정인",
    정: "편인",
    무: "겁재",
    기: "비견",
    경: "상관",
    신: "식신",
    임: "정재",
    계: "편재",
  },
  경: {
    갑: "편재",
    을: "정재",
    병: "편관",
    정: "정관",
    무: "편인",
    기: "정인",
    경: "비견",
    신: "겁재",
    임: "식신",
    계: "상관",
  },
  신: {
    갑: "정재",
    을: "편재",
    병: "정관",
    정: "편관",
    무: "정인",
    기: "편인",
    경: "겁재",
    신: "비견",
    임: "상관",
    계: "식신",
  },
  임: {
    갑: "식신",
    을: "상관",
    병: "편재",
    정: "정재",
    무: "편관",
    기: "정관",
    경: "편인",
    신: "정인",
    임: "비견",
    계: "겁재",
  },
  계: {
    갑: "상관",
    을: "식신",
    병: "정재",
    정: "편재",
    무: "정관",
    기: "편관",
    경: "정인",
    신: "편인",
    임: "겁재",
    계: "비견",
  },
}

function calculateSibseong(dayMaster: string, otherStem: string): string {
  return SIBSEONG[dayMaster as keyof typeof SIBSEONG][otherStem as keyof (typeof SIBSEONG)["갑"]]
}

// 십이지지 동물
const ZODIAC_ANIMALS = {
  자: "쥐(鼠)",
  축: "소(牛)",
  인: "호랑이(虎)",
  묘: "토끼(兎)",
  진: "용(龍)",
  사: "뱀(蛇)",
  오: "말(馬)",
  미: "양(羊)",
  신: "원숭이(猴)",
  유: "닭(鷄)",
  술: "개(狗)",
  해: "돼지(豬)",
}

// 일간에 따른 시간 천간 시작 매핑
// 각 일간별 자시(子時)의 천간
const DAY_TO_HOUR_STEM_MAP: Record<string, number> = {
  갑: 0, // 갑일 자시는 '갑자시' (갑 = 0)
  을: 2, // 을일 자시는 '병자시' (병 = 2)
  병: 4, // 병일 자시는 '무자시' (무 = 4)
  정: 6, // 정일 자시는 '경자시' (경 = 6)
  무: 8, // 무일 자시는 '임자시' (임 = 8)
  기: 0, // 기일 자시는 '갑자시' (갑 = 0)
  경: 2, // 경일 자시는 '병자시' (병 = 2)
  신: 4, // 신일 자시는 '무자시' (무 = 4)
  임: 6, // 임일 자시는 '경자시' (경 = 6)
  계: 8, // 계일 자시는 '임자시' (임 = 8)
}

// Update the Saju interface to ensure all properties are properly typed
export interface Saju {
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  dayStem: string
  dayBranch: string
  hourStem: string
  hourBranch: string
  yearStemHanja: string
  yearBranchHanja: string
  monthStemHanja: string
  monthBranchHanja: string
  dayStemHanja: string
  dayBranchHanja: string
  hourStemHanja: string
  hourBranchHanja: string
  elements: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }
  interpretation: string
  yearAnimal: string
  dayMaster: string
  dayMasterHanja: string
  gender?: string
  name?: string
  timeUnknown?: boolean
  yearStemSibseong: string
  monthStemSibseong: string
  dayStemSibseong: string
  hourStemSibseong: string
  yearBranchSibseong: string
  monthBranchSibseong: string
  dayBranchSibseong: string
  hourBranchSibseong: string
}

// 입춘 날짜 (평균적으로 2월 4일경)
const LICHUN_DAY = 4
const LICHUN_MONTH = 2

// 연간지 계산 (Year Pillar) - 입춘 기준
function getYearPillar(
  lunarYear: number,
  solarYear: number,
  solarMonth: number,
  solarDay: number,
): { stem: string; branch: string } {
  let yearToUse = solarYear

  // 현재 날짜가 입춘 이전인지 확인 (2월 4일 이전)
  const isBeforeLichun = solarMonth < 2 || (solarMonth === 2 && solarDay < 4)

  // 입춘 이전이면 이전 연도 사용
  if (isBeforeLichun) {
    yearToUse = solarYear - 1
  }

  console.log(`Year calculation: ${solarYear}-${solarMonth}-${solarDay}, using year ${yearToUse}`)

  // 갑자년은 서기 4년에 해당 (4 = 갑자, 5 = 을축, ...)
  const stemIndex = (yearToUse + 6) % 10 // 보정: +6
  const branchIndex = (yearToUse + 8) % 12 // 보정: +8

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
  }
}

// 시간 기준 타입 정의
export type TimeStandard = "동경135도" | "동경127.5도" | "서머타임"

// 시간 지지 결정 (Hour Branch)
function getHourBranch(hour: number, minute: number, timeStandard: TimeStandard = "동경135도"): string {
  // 정확한 시간 경계 처리
  const totalHours = hour + minute / 60

  // 시간 기준에 따른 시간 범위 설정
  if (timeStandard === "동경135도") {
    // 동경 135도 표준시 (한국 표준시, UTC+9)
    // 23:30-01:30 자(子)시
    if ((totalHours >= 23.5 && totalHours <= 24) || (totalHours >= 0 && totalHours < 1.5)) return "자"
    // 01:30-03:30 축(丑)시
    if (totalHours >= 1.5 && totalHours < 3.5) return "축"
    // 03:30-05:30 인(寅)시
    if (totalHours >= 3.5 && totalHours < 5.5) return "인"
    // 05:30-07:30 묘(卯)시
    if (totalHours >= 5.5 && totalHours < 7.5) return "묘"
    // 07:30-09:30 진(辰)시
    if (totalHours >= 7.5 && totalHours < 9.5) return "진"
    // 09:30-11:30 사(巳)시
    if (totalHours >= 9.5 && totalHours < 11.5) return "사"
    // 11:30-13:30 오(午)시
    if (totalHours >= 11.5 && totalHours < 13.5) return "오"
    // 13:30-15:30 미(未)시
    if (totalHours >= 13.5 && totalHours < 15.5) return "미"
    // 15:30-17:30 신(申)시
    if (totalHours >= 15.5 && totalHours < 17.5) return "신"
    // 17:30-19:30 유(酉)시
    if (totalHours >= 17.5 && totalHours < 19.5) return "유"
    // 19:30-21:30 술(戌)시
    if (totalHours >= 19.5 && totalHours < 21.5) return "술"
    // 21:30-23:30 해(亥)시
    if (totalHours >= 21.5 && totalHours < 23.5) return "해"
  } else if (timeStandard === "동경127.5도") {
    // 동경 127.5도 표준시
    // 23:00-01:00 자(子)시
    if ((totalHours >= 23 && totalHours <= 24) || (totalHours >= 0 && totalHours < 1)) return "자"
    // 01:00-03:00 축(丑)시
    if (totalHours >= 1 && totalHours < 3) return "축"
    // 03:00-05:00 인(寅)시
    if (totalHours >= 3 && totalHours < 5) return "인"
    // 05:00-07:00 묘(卯)시
    if (totalHours >= 5 && totalHours < 7) return "묘"
    // 07:00-09:00 진(辰)시
    if (totalHours >= 7 && totalHours < 9) return "진"
    // 09:00-11:00 사(巳)시
    if (totalHours >= 9 && totalHours < 11) return "사"
    // 11:00-13:00 오(午)시
    if (totalHours >= 11 && totalHours < 13) return "오"
    // 13:00-15:00 미(未)시
    if (totalHours >= 13 && totalHours < 15) return "미"
    // 15:00-17:00 신(申)시
    if (totalHours >= 15 && totalHours < 17) return "신"
    // 17:00-19:00 유(酉)시
    if (totalHours >= 17 && totalHours < 19) return "유"
    // 19:00-21:00 술(戌)시
    if (totalHours >= 19 && totalHours < 21) return "술"
    // 21:00-23:00 해(亥)시
    if (totalHours >= 21 && totalHours < 23) return "해"
  } else if (timeStandard === "서머타임") {
    // 서머타임 적용 시간 (동경 135도 + 서머타임)
    // 00:30-02:30 자(子)시
    if (totalHours >= 0.5 && totalHours < 2.5) return "자"
    // 02:30-04:30 축(丑)시
    if (totalHours >= 2.5 && totalHours < 4.5) return "���"
    // 04:30-06:30 인(寅)시
    if (totalHours >= 4.5 && totalHours < 6.5) return "인"
    // 06:30-08:30 묘(卯)시
    if (totalHours >= 6.5 && totalHours < 8.5) return "묘"
    // 08:30-10:30 진(辰)시
    if (totalHours >= 8.5 && totalHours < 10.5) return "진"
    // 10:30-12:30 사(巳)시
    if (totalHours >= 10.5 && totalHours < 12.5) return "사"
    // 12:30-14:30 오(午)시
    if (totalHours >= 12.5 && totalHours < 14.5) return "오"
    // 14:30-16:30 미(未)시
    if (totalHours >= 14.5 && totalHours < 16.5) return "미"
    // 16:30-18:30 신(申)시
    if (totalHours >= 16.5 && totalHours < 18.5) return "신"
    // 18:30-20:30 유(酉)시
    if (totalHours >= 18.5 && totalHours < 20.5) return "유"
    // 20:30-22:30 술(戌)시
    if (totalHours >= 20.5 && totalHours < 22.5) return "술"
    // 22:30-00:30 해(亥)시
    if ((totalHours >= 22.5 && totalHours <= 24) || (totalHours >= 0 && totalHours < 0.5)) return "해"
  }

  // 기본값 (동경 135도 표준시 기준)
  console.warn(`시간 범위를 벗어났습니다: ${hour}:${minute}, 기본값 '자'를 반환합니다.`)
  return "자"
}

// 시간 간 계산 (Hour Stem)
function getHourStem(dayStem: string, hour: number, minute: number, timeStandard: TimeStandard = "동경135도"): string {
  const hourBranch = getHourBranch(hour, minute, timeStandard)

  // 일간(日干)에 따른 자시(子時) 시작 천간
  const startStemIndex = DAY_TO_HOUR_STEM_MAP[dayStem]

  // 지지의 인덱스 찾기
  const hourBranchIndex = EARTHLY_BRANCHES.indexOf(hourBranch)

  // 시간 천간 계산 (자시부터 2시간마다 천간이 변함)
  const stemIndex = (startStemIndex + hourBranchIndex) % 10

  return HEAVENLY_STEMS[stemIndex]
}

// 오행 계산
function countElements(
  yearStem: string,
  yearBranch: string,
  monthStem: string,
  monthBranch: string,
  dayStem: string,
  dayBranch: string,
  hourStem: string | null = null,
  hourBranch: string | null = null,
): Record<string, number> {
  const elements = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  }

  // 간의 오행 계
  elements[STEM_ELEMENTS[yearStem as keyof typeof STEM_ELEMENTS]]++
  elements[STEM_ELEMENTS[monthStem as keyof typeof STEM_ELEMENTS]]++
  elements[STEM_ELEMENTS[dayStem as keyof typeof STEM_ELEMENTS]]++

  // 시간 정보가 있는 경우에만 시주 오행 계산
  if (hourStem && hourStem !== "?" && hourBranch && hourBranch !== "?") {
    elements[STEM_ELEMENTS[hourStem as keyof typeof STEM_ELEMENTS]]++
    elements[BRANCH_ELEMENTS[hourBranch as keyof typeof BRANCH_ELEMENTS]]++
  }

  // 지의 오행 계산
  elements[BRANCH_ELEMENTS[yearBranch as keyof typeof BRANCH_ELEMENTS]]++
  elements[BRANCH_ELEMENTS[monthBranch as keyof typeof BRANCH_ELEMENTS]]++
  elements[BRANCH_ELEMENTS[dayBranch as keyof typeof BRANCH_ELEMENTS]]++

  return elements
}

// 사주 해석 생성
function generateInterpretation(
  elements: Record<string, number>,
  dayStem: string,
  dayBranch: string,
  timeUnknown = false,
): string {
  // Add a note about unknown time if applicable
  const timeNote = timeUnknown
    ? "시간을 모르는 경우 시주(時柱)를 제외한 분석이므로, 완전한 해석에는 한계가 있습니다. 정확한 시간을 알게 되면 다시 계산해보는 것이 좋습니다. "
    : ""

  // Add the time note to the interpretation
  let interpretation = timeNote

  // Add the rest of the interpretation
  interpretation += `일주(日柱)는 ${dayStem}${dayBranch}로, `

  switch (STEM_ELEMENTS[dayStem as keyof typeof STEM_ELEMENTS]) {
    case "wood":
      interpretation += `${dayStem}${dayBranch} 일주는 창의적이고 성장을 추구하는 성향을 가지고 있습니다. `
      break
    case "fire":
      interpretation += `${dayStem}${dayBranch} 일주는 열정적이고 활동적인 성향을 가지고 있습니다. `
      break
    case "earth":
      interpretation += `${dayStem}${dayBranch} 일주는 안정적이고 신뢰할 수 있는 성향을 가지고 있습니다. `
      break
    case "metal":
      interpretation += `${dayStem}${dayBranch} 일주는 결단력이 있고 정확한 성향을 가지고 있습니다. `
      break
    case "water":
      interpretation += `${dayStem}${dayBranch} 일주는 지혜롭고 유연 성향을 가지고 있습니다. `
      break
  }

  // Find the strongest and weakest elements
  const sortedElements = Object.entries(elements).sort(([, a], [, b]) => b - a)
  const strongest = sortedElements[0][0]
  const weakest = sortedElements[sortedElements.length - 1][0]

  // 강한 오행에 대한 해석
  if (elements[strongest] > 0) {
    const element = strongest
    interpretation += `${ELEMENT_NAMES[element as keyof typeof ELEMENT_NAMES]}이(가) 가장 강하여, `

    switch (element) {
      case "wood":
        interpretation += "창의성과 성장에 유리합니다. 예술, 교육, 문학 분야에서 재을 발휘할 수 있습니다. "
        break
      case "fire":
        interpretation += "열정과 리더십이 뛰어납니다. 연예, 마케팅, 영업 분야에서 두각을 나타낼 수 있습니다. "
        break
      case "earth":
        interpretation += "안정성과 신뢰성이 높습니다. 부동산, 농업, 요식업 분야에서 성공할 가능성이 있습니다. "
        break
      case "metal":
        interpretation += "결단력과 정확성이 뛰어납니다. 금융, IT, 법률 분야에서 능력을 발휘할 수 있습니다. "
        break
      case "water":
        interpretation += "지혜와 적응력이 뛰어납니다. 철학, 과학, 무역 분야에서 재능을 발휘할 수 있습니다. "
        break
    }
  }

  // 약한 오행에 대한 해석
  if (elements[weakest] > 0) {
    const element = weakest
    interpretation += `반면 ${ELEMENT_NAMES[element as keyof typeof ELEMENT_NAMES]}이(가) 부족하여, `

    switch (element) {
      case "wood":
        interpretation += "창의성과 성장에 어려움을 겪을 수 있습니다. "
        break
      case "fire":
        interpretation += "열정과 자신감을 키우는 것이 좋습니다. "
        break
      case "earth":
        interpretation += "안정성과 인내심을 기르는 것이 좋습니다. "
        break
      case "metal":
        interpretation += "결단력과 집중력을 향상시키는 것이 좋습니다. "
        break
      case "water":
        interpretation += "지혜와 유연성을 기르는 것이 좋습니다. "
        break
    }
  }

  interpretation += "사주는 단순한 참고 자료일 뿐, 개인의 노력과 선택이 더 중요합니다."

  return interpretation
}

// 일간지 계산 (Day Pillar) - 양력 기준
function getDayPillar(solarYear: number, solarMonth: number, solarDay: number): { stem: string; branch: string } {
  // 1996년 1월 6일 임인일 기준으로 계산
  const BASE_DATE = new Date(1996, 0, 6) // 1996년 1월 6일
  const BASE_STEM_INDEX = 8 // 임(壬)
  const BASE_BRANCH_INDEX = 2 // 인(寅)

  // 기준일로부터의 일수 차이 계산
  const targetDate = new Date(solarYear, solarMonth - 1, solarDay)

  // 밀리초 단위 차이를 일 단위로 변환
  const dayDiff = Math.floor((targetDate.getTime() - BASE_DATE.getTime()) / (1000 * 60 * 60 * 24))

  // 천간 및 지지 계산 (60일 주기로 순환)
  const stemIndex = (BASE_STEM_INDEX + dayDiff) % 10
  const branchIndex = (BASE_BRANCH_INDEX + dayDiff) % 12

  return {
    stem: HEAVENLY_STEMS[stemIndex >= 0 ? stemIndex : stemIndex + 10],
    branch: EARTHLY_BRANCHES[branchIndex >= 0 ? branchIndex : branchIndex + 12],
  }
}

// 동추원만세력 기반 절기 데이터
// 각 절기의 시작일을 기준으로 월지를 결정
// 형식: [절기명, 월지, 시작 월, 평균 시작일]

// 정확한 절기 시간 정보를 포함한 새 배열 추가
// [절기명, 월지, 시작 월, 시작일, 시작 시간(24시간제)]

import { EXACT_SOLAR_TERMS } from "./solar-terms"

// Simplify the getMonthBranchFromSolarTerms function to make it more efficient and accurate
// Replace the current implementation with this improved version:

function getMonthBranchFromSolarTerms(year: number, month: number, day: number, hour = 0): string {
  try {
    const currentDate = new Date(year, month - 1, day, hour)
    console.log(`=== Calculating month branch for ${year}-${month}-${day} ${hour}h ===`)

    // EXACT_SOLAR_TERMS 데이터가 제대로 로드되었는지 확인
    console.log(`Total solar terms available: ${EXACT_SOLAR_TERMS.length}`)
    if (EXACT_SOLAR_TERMS.length === 0) {
      console.error("EXACT_SOLAR_TERMS is empty!")
      return "자"
    }

    // Define the mapping of solar terms to month branches
    const solarTermToMonthBranch: Record<string, string> = {
      대설: "자", // 12월 대설부터 자월 시작
      소한: "축", // 1월 소한부터 축월 시작
      입춘: "인", // 2월 입춘부터 인월 시작
      경칩: "묘", // 3월 경칩부터 묘월 시작
      청명: "진", // 4월 청명부터 진월 시작
      입하: "사", // 5월 입하부터 사월 시작
      망종: "오", // 6월 망종부터 오월 시작
      소서: "미", // 7월 소서부터 미월 시작
      입추: "신", // 8월 입추부터 신월 시작
      백로: "유", // 9월 백로부터 유월 시작
      한로: "술", // 10월 한로부터 술월 시작
      입동: "해", // 11월 입동부터 해월 시작
    }

    // Get all relevant solar terms from current and previous year
    const currentYearTerms = EXACT_SOLAR_TERMS.filter((term) => term.year === year)
    const prevYearTerms = EXACT_SOLAR_TERMS.filter((term) => term.year === year - 1)

    console.log(`Current year (${year}) terms found: ${currentYearTerms.length}`)
    console.log(`Previous year (${year - 1}) terms found: ${prevYearTerms.length}`)

    // 1993년 청명 절기 확인
    const qingming1993 = currentYearTerms.find((term) => term.solarTerm === "청명")
    if (qingming1993) {
      console.log(`Found 청명 for ${year}: ${qingming1993.timestamp}`)
    } else {
      console.log(`청명 not found for ${year}`)
    }

    // Combine and sort all terms by timestamp in descending order
    const allRelevantTerms = [...currentYearTerms, ...prevYearTerms]
      .filter((term) => solarTermToMonthBranch[term.solarTerm]) // Only include terms that affect month branch
      .map((term) => ({
        ...term,
        date: new Date(term.timestamp),
        monthBranch: solarTermToMonthBranch[term.solarTerm],
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort in descending order

    console.log(`Total relevant terms: ${allRelevantTerms.length}`)
    console.log(`Current date: ${currentDate.toISOString()}`)

    // Find the most recent solar term that has passed
    for (const term of allRelevantTerms) {
      console.log(`Checking term: ${term.solarTerm} (${term.timestamp}) -> ${term.monthBranch}`)
      console.log(`Term date: ${term.date.toISOString()}`)
      console.log(`Current >= Term: ${currentDate >= term.date}`)

      if (currentDate >= term.date) {
        console.log(
          `✓ ${year}-${month}-${day} ${hour}h falls after ${term.solarTerm} (${term.timestamp}), so month branch is ${term.monthBranch}`,
        )
        return term.monthBranch
      }
    }

    // If no matching term is found (unlikely but possible for very old dates)
    console.warn(`Could not determine month branch for ${year}-${month}-${day}, using default 자`)
    return "자"
  } catch (error) {
    console.error(`Error in getMonthBranchFromSolarTerms for ${year}-${month}-${day}:`, error)
    return "자" // Safe default
  }
}

// Simplify the getMonthPillar function to make it clearer
function getMonthPillar(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  yearStem: string,
  isLeapMonth = false,
  hour = 0,
  apiMonthStem?: string,
  apiMonthBranch?: string,
): { stem: string; branch: string } {
  console.log(`=== getMonthPillar called with: ${solarYear}-${solarMonth}-${solarDay}, yearStem: ${yearStem} ===`)

  // API 제공 값을 무시하고 항상 우리 자체 절기 계산을 사용
  // API 데이터가 부정확할 수 있으므로 신뢰할 수 있는 절기 계산을 우선 사용

  try {
    // Get the month branch based on solar terms
    console.log(`Calling getMonthBranchFromSolarTerms...`)
    const monthBranch = getMonthBranchFromSolarTerms(solarYear, solarMonth, solarDay, hour)
    console.log(`Month branch from solar terms: ${monthBranch}`)

    // Calculate the month stem based on year stem and month branch
    console.log(`Calling getMonthStem with yearStem: ${yearStem}, monthBranch: ${monthBranch}`)
    const monthStem = getMonthStem(yearStem, monthBranch)
    console.log(`Month stem calculated: ${monthStem}`)

    console.log(`Final month pillar: ${monthStem}${monthBranch}`)
    return { stem: monthStem, branch: monthBranch }
  } catch (error) {
    console.error(`Error calculating month pillar for ${solarYear}-${solarMonth}-${solarDay}:`, error)
    // Fallback to a safe default
    return { stem: "무", branch: "자" }
  }
}

// Simplify the getMonthStem function for clarity
function getMonthStem(yearStem: string, monthBranch: string): string {
  // Month branch order starting from 인월
  const monthBranchOrder = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"]
  const monthBranchIndex = monthBranchOrder.indexOf(monthBranch)

  if (monthBranchIndex === -1) {
    console.error(`Invalid month branch: ${monthBranch}`)
    return "무" // Default value
  }

  // Year stem to first month stem mapping (for 인월)
  const yearStemToFirstMonthStem: Record<string, number> = {
    갑: 2, // 갑년 인월은 병(丙)으로 시작
    을: 4, // 을년 인월은 무(戊)로 시작
    병: 6, // 병년 인월은 경(庚)으로 시작
    정: 8, // 정년 인월은 임(壬)으로 시작
    무: 0, // 무년 인월은 갑(甲)으로 시작
    기: 2, // 기년 인월은 병(丙)으로 시작
    경: 4, // 경년 인월은 무(戊)로 시작
    신: 6, // 신년 인월은 경(庚)으로 시작
    임: 8, // 임년 인월은 임(壬)으로 시작
    계: 0, // 계년 인월은 갑(甲)으로 시작
  }

  const firstMonthStemIndex = yearStemToFirstMonthStem[yearStem]

  if (firstMonthStemIndex === undefined) {
    console.error(`Invalid year stem: ${yearStem}`)
    return "무" // Default value
  }

  // Calculate the stem index and return the corresponding stem
  const stemIndex = (firstMonthStemIndex + monthBranchIndex) % 10

  // 디버깅 로그 추가
  console.log(
    `Year stem: ${yearStem}, Month branch: ${monthBranch}, First month stem index: ${firstMonthStemIndex}, Month branch index: ${monthBranchIndex}, Calculated stem index: ${stemIndex}, Result: ${HEAVENLY_STEMS[stemIndex]}`,
  )

  return HEAVENLY_STEMS[stemIndex]
}

export function calculateSaju(
  lunarYear: string | number,
  lunarMonth: string | number,
  lunarDay: string | number,
  hour: number,
  minute: number,
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  gender = "male",
  name = "",
  timeUnknown = false,
  isLeapMonth = false,
  apiMonthStem?: string,
  apiMonthBranch?: string,
  timeStandard: TimeStandard = "동경135도",
): any {
  const numLunarYear = typeof lunarYear === "string" ? Number.parseInt(lunarYear, 10) : lunarYear

  console.log(
    `Calculate Saju for Lunar: ${numLunarYear}, Solar: ${solarYear}-${solarMonth}-${solarDay}, Time: ${hour}:${minute}, Gender: ${gender}, Name: ${name}, TimeUnknown: ${timeUnknown}, IsLeapMonth: ${isLeapMonth}, TimeStandard: ${timeStandard}`,
  )

  // 연간지 계산 (Year Pillar)
  const yearPillar = getYearPillar(numLunarYear, solarYear, solarMonth, solarDay)
  const yearStem = yearPillar.stem
  const yearBranch = yearPillar.branch

  console.log(`Year Pillar calculated: ${yearStem}${yearBranch}`)

  // 월간지 계산 (Month Pillar)
  const monthPillar = getMonthPillar(
    solarYear,
    solarMonth,
    solarDay,
    yearStem,
    isLeapMonth,
    hour,
    apiMonthStem,
    apiMonthBranch,
  )
  const monthStem = monthPillar.stem
  const monthBranch = monthPillar.branch

  console.log(`Month Pillar calculated: ${monthStem}${monthBranch}`)

  // 일간지 계산 (Day Pillar)
  const dayPillar = getDayPillar(solarYear, solarMonth, solarDay)
  const dayStem = dayPillar.stem
  const dayBranch = dayPillar.branch

  console.log(`Day Pillar calculated: ${dayStem}${dayBranch}`)

  // 시간 간지 계산
  let hourStem, hourBranch

  if (timeUnknown) {
    hourStem = "?"
    hourBranch = "?"
  } else {
    hourBranch = getHourBranch(hour, minute, timeStandard)
    hourStem = getHourStem(dayStem, hour, minute, timeStandard)
  }

  console.log(
    `Final pillars - Year: ${yearStem}${yearBranch}, Month: ${monthStem}${monthBranch}, Day: ${dayStem}${dayBranch}, Hour: ${hourStem}${hourBranch}`,
  )

  // 오행 계산
  const elements = countElements(yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch)

  // 사주 해석 생성
  const interpretation = generateInterpretation(elements, dayStem, dayBranch, timeUnknown)

  // 간지 인덱스 찾기
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearStem)
  const yearBranchIndex = EARTHLY_BRANCHES.indexOf(yearBranch)
  const monthStemIndex = HEAVENLY_STEMS.indexOf(monthStem)
  const monthBranchIndex = EARTHLY_BRANCHES.indexOf(monthBranch)
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem)
  const dayBranchIndex = EARTHLY_BRANCHES.indexOf(dayBranch)

  // 시간 간지 인덱스 (시간을 모르는 경우 -1)
  const hourStemIndex = hourStem !== "?" ? HEAVENLY_STEMS.indexOf(hourStem) : -1
  const hourBranchIndex = hourBranch !== "?" ? EARTHLY_BRANCHES.indexOf(hourBranch) : -1

  // 시간 간지 한자 (시간을 모르는 경우 빈 문자열)
  const hourStemHanja = hourStemIndex !== -1 ? HEAVENLY_STEMS_HANJA[hourStemIndex] : ""
  const hourBranchHanja = hourBranchIndex !== -1 ? EARTHLY_BRANCHES_HANJA[hourBranchIndex] : ""

  return {
    yearStem,
    yearBranch,
    monthStem,
    monthBranch,
    dayStem,
    dayBranch,
    hourStem,
    hourBranch,
    yearStemHanja: HEAVENLY_STEMS_HANJA[yearStemIndex],
    yearBranchHanja: EARTHLY_BRANCHES_HANJA[yearBranchIndex],
    monthStemHanja: HEAVENLY_STEMS_HANJA[monthStemIndex],
    monthBranchHanja: EARTHLY_BRANCHES_HANJA[monthBranchIndex],
    dayStemHanja: HEAVENLY_STEMS_HANJA[dayStemIndex],
    dayBranchHanja: EARTHLY_BRANCHES_HANJA[dayBranchIndex],
    hourStemHanja,
    hourBranchHanja,
    elements,
    interpretation,
    yearAnimal: ZODIAC_ANIMALS[yearBranch as keyof typeof ZODIAC_ANIMALS],
    dayMaster: dayStem,
    dayMasterHanja: HEAVENLY_STEMS_HANJA[dayStemIndex],
    gender,
    name,
    timeUnknown,
    timeStandard,
    yearStemSibseong: calculateSibseong(dayStem, yearStem),
    monthStemSibseong: calculateSibseong(dayStem, monthStem),
    dayStemSibseong: "본원",
    hourStemSibseong: hourStem !== "?" ? calculateSibseong(dayStem, hourStem) : "",
    yearBranchSibseong: calculateSibseong(dayStem, BRANCH_TO_STEM_MAP[yearBranch as keyof typeof BRANCH_TO_STEM_MAP]),
    monthBranchSibseong: calculateSibseong(dayStem, BRANCH_TO_STEM_MAP[monthBranch as keyof typeof BRANCH_TO_STEM_MAP]),
    dayBranchSibseong: calculateSibseong(dayStem, BRANCH_TO_STEM_MAP[dayBranch as keyof typeof BRANCH_TO_STEM_MAP]),
    hourBranchSibseong:
      hourBranch !== "?"
        ? calculateSibseong(dayStem, BRANCH_TO_STEM_MAP[hourBranch as keyof typeof BRANCH_TO_STEM_MAP])
        : "",
  }
}

// 시간 기준에 따른 시간 범위 정보 반환 함수 추가
export function getTimeRangeInfo(timeStandard: TimeStandard = "동경135도"): {
  name: string
  description: string
  ranges: { branch: string; start: string; end: string }[]
} {
  if (timeStandard === "동경135도") {
    return {
      name: "동경 135도 표준시",
      description: "한국 표준시(UTC+9)에 해당하는 시간 기준입니다.",
      ranges: [
        { branch: "자", start: "23:30", end: "01:30" },
        { branch: "축", start: "01:30", end: "03:30" },
        { branch: "인", start: "03:30", end: "05:30" },
        { branch: "묘", start: "05:30", end: "07:30" },
        { branch: "진", start: "07:30", end: "09:30" },
        { branch: "사", start: "09:30", end: "11:30" },
        { branch: "오", start: "11:30", end: "13:30" },
        { branch: "미", start: "13:30", end: "15:30" },
        { branch: "신", start: "15:30", end: "17:30" },
        { branch: "유", start: "17:30", end: "19:30" },
        { branch: "술", start: "19:30", end: "21:30" },
        { branch: "해", start: "21:30", end: "23:30" },
      ],
    }
  } else if (timeStandard === "동경127.5도") {
    return {
      name: "동경 127.5도 표준시",
      description: "중국 동부 지역에 해당하는 시간 기준입니다.",
      ranges: [
        { branch: "자", start: "23:00", end: "01:00" },
        { branch: "축", start: "01:00", end: "03:00" },
        { branch: "인", start: "03:00", end: "05:00" },
        { branch: "묘", start: "05:00", end: "07:00" },
        { branch: "진", start: "07:00", end: "09:00" },
        { branch: "사", start: "09:00", end: "11:00" },
        { branch: "오", start: "11:00", end: "13:00" },
        { branch: "미", start: "13:00", end: "15:00" },
        { branch: "신", start: "15:00", end: "17:00" },
        { branch: "유", start: "17:00", end: "19:00" },
        { branch: "술", start: "19:00", end: "21:00" },
        { branch: "해", start: "21:00", end: "23:00" },
      ],
    }
  } else {
    return {
      name: "서머타임 적용",
      description: "서머타임이 적용된 지역의 시간 기준입니다.",
      ranges: [
        { branch: "자", start: "00:30", end: "02:30" },
        { branch: "축", start: "02:30", end: "04:30" },
        { branch: "인", start: "04:30", end: "06:30" },
        { branch: "묘", start: "06:30", end: "08:30" },
        { branch: "진", start: "08:30", end: "10:30" },
        { branch: "사", start: "10:30", end: "12:30" },
        { branch: "오", start: "12:30", end: "14:30" },
        { branch: "미", start: "14:30", end: "16:30" },
        { branch: "신", start: "16:30", end: "18:30" },
        { branch: "유", start: "18:30", end: "20:30" },
        { branch: "술", start: "20:30", end: "22:30" },
        { branch: "해", start: "22:30", end: "00:30" },
      ],
    }
  }
}
