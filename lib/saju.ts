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

// 지지의 십성 계산을 위한 천간 매핑
const BRANCH_TO_STEM_MAP = {
  자: "계",
  축: "기",
  인: "갑",
  묘: "을",
  진: "무",
  사: "병",
  오: "정",
  미: "기",
  신: "경",
  유: "신",
  술: "무",
  해: "임",
}

// 십성 계산
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
const DAY_TO_HOUR_STEM_MAP: Record<string, number> = {
  갑: 0,
  을: 2,
  병: 4,
  정: 6,
  무: 8,
  기: 0,
  경: 2,
  신: 4,
  임: 6,
  계: 8,
}

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
  elements: { wood: number; fire: number; earth: number; metal: number; water: number }
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

export type TimeStandard = "동경135도" | "동경127.5도" | "서머타임"

function calculateSibseong(dayMaster: string, otherStem: string): string {
  return SIBSEONG[dayMaster as keyof typeof SIBSEONG][otherStem as keyof (typeof SIBSEONG)["갑"]]
}

// 연간지 계산 (입춘 기준)
function getYearPillar(solarYear: number, solarMonth: number, solarDay: number): { stem: string; branch: string } {
  let yearToUse = solarYear

  // 입춘 이전이면 이전 연도 사용
  if (solarMonth < 2 || (solarMonth === 2 && solarDay <= 4)) {
    yearToUse = solarYear - 1
  }

  const stemIndex = (yearToUse + 6) % 10
  const branchIndex = (yearToUse + 8) % 12

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
  }
}

// 일간지 계산
function getDayPillar(solarYear: number, solarMonth: number, solarDay: number): { stem: string; branch: string } {
  const BASE_DATE = new Date(1996, 0, 6) // 1996년 1월 6일 임인일
  const BASE_STEM_INDEX = 8 // 임(壬)
  const BASE_BRANCH_INDEX = 2 // 인(寅)

  const targetDate = new Date(solarYear, solarMonth - 1, solarDay)
  const dayDiff = Math.floor((targetDate.getTime() - BASE_DATE.getTime()) / (1000 * 60 * 60 * 24))

  const stemIndex = (BASE_STEM_INDEX + dayDiff) % 10
  const branchIndex = (BASE_BRANCH_INDEX + dayDiff) % 12

  return {
    stem: HEAVENLY_STEMS[stemIndex >= 0 ? stemIndex : stemIndex + 10],
    branch: EARTHLY_BRANCHES[branchIndex >= 0 ? branchIndex : branchIndex + 12],
  }
}

// 시간 지지 계산
function getHourBranch(hour: number, minute: number): string {
  const totalHours = hour + minute / 60

  if ((totalHours >= 23.5 && totalHours <= 24) || (totalHours >= 0 && totalHours < 1.5)) return "자"
  if (totalHours >= 1.5 && totalHours < 3.5) return "축"
  if (totalHours >= 3.5 && totalHours < 5.5) return "인"
  if (totalHours >= 5.5 && totalHours < 7.5) return "묘"
  if (totalHours >= 7.5 && totalHours < 9.5) return "진"
  if (totalHours >= 9.5 && totalHours < 11.5) return "사"
  if (totalHours >= 11.5 && totalHours < 13.5) return "오"
  if (totalHours >= 13.5 && totalHours < 15.5) return "미"
  if (totalHours >= 15.5 && totalHours < 17.5) return "신"
  if (totalHours >= 17.5 && totalHours < 19.5) return "유"
  if (totalHours >= 19.5 && totalHours < 21.5) return "술"
  if (totalHours >= 21.5 && totalHours < 23.5) return "해"

  return "자"
}

// 시간 천간 계산
function getHourStem(dayStem: string, hour: number, minute: number): string {
  const hourBranch = getHourBranch(hour, minute)
  const startStemIndex = DAY_TO_HOUR_STEM_MAP[dayStem]
  const hourBranchIndex = EARTHLY_BRANCHES.indexOf(hourBranch)
  const stemIndex = (startStemIndex + hourBranchIndex) % 10
  return HEAVENLY_STEMS[stemIndex]
}

import { EXACT_SOLAR_TERMS } from "./solar-terms"

// 절기별 월지 매핑 - 절기 시작부터 해당 월지 적용
const SOLAR_TERM_TO_MONTH_BRANCH = {
  입춘: "인", // 인월 시작
  경칩: "묘", // 묘월 시작
  청명: "진", // 진월 시작
  입하: "사", // 사월 시작
  망종: "오", // 오월 시작
  소서: "미", // 미월 시작
  입추: "신", // 신월 시작
  백로: "유", // 유월 시작
  한로: "술", // 술월 시작
  입동: "해", // 해월 시작
  대설: "자", // 자월 시작
  소한: "축", // 축월 시작
}

// 절기 기반 월지 계산 - 정확한 절기 데이터 기준 (시간까지 고려)
function getMonthBranchFromSolarTerms(year: number, month: number, day: number, hour = 0, minute = 0): string {
  const inputDateTime = new Date(year, month - 1, day, hour, minute)

  console.log(`=== 월지 계산: ${year}-${month}-${day} ${hour}:${minute} ===`)

  // 해당 연도와 전후 연도의 절기 데이터 가져오기
  const prevYearTerms = EXACT_SOLAR_TERMS.filter((term) => term.year === year - 1)
  const currentYearTerms = EXACT_SOLAR_TERMS.filter((term) => term.year === year)
  const nextYearTerms = EXACT_SOLAR_TERMS.filter((term) => term.year === year + 1)

  console.log(
    `절기 데이터: ${year - 1}년 ${prevYearTerms.length}개, ${year}년 ${currentYearTerms.length}개, ${year + 1}년 ${nextYearTerms.length}개`,
  )

  // 모든 절기를 시간순으로 정렬
  const allTerms = [...prevYearTerms, ...currentYearTerms, ...nextYearTerms]
    .map((term) => {
      // timestamp를 Date 객체로 변환 (시간까지 정확히 고려)
      const termDate = new Date(term.timestamp)
      return {
        ...term,
        date: termDate,
      }
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  // 월지 변경 절기들만 필터링 (입춘, 경칩, 청명, 입하, 망종, 소서, 입추, 백로, 한로, 입동, 대설, 소한)
  const monthChangingTerms = allTerms.filter((term) => Object.keys(SOLAR_TERM_TO_MONTH_BRANCH).includes(term.solarTerm))

  console.log(
    `월지 변경 절기들:`,
    monthChangingTerms.map((t) => {
      const d = new Date(t.timestamp)
      return `${t.solarTerm}(${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()})`
    }),
  )

  // 입력 날짜/시간 이전의 가장 최근 월지 변경 절기 찾기
  let currentMonthTerm = null
  for (let i = monthChangingTerms.length - 1; i >= 0; i--) {
    if (inputDateTime >= monthChangingTerms[i].date) {
      currentMonthTerm = monthChangingTerms[i]
      break
    }
  }

  if (currentMonthTerm) {
    const monthBranch =
      SOLAR_TERM_TO_MONTH_BRANCH[currentMonthTerm.solarTerm as keyof typeof SOLAR_TERM_TO_MONTH_BRANCH]
    const termDate = new Date(currentMonthTerm.timestamp)
    console.log(
      `결과: ${currentMonthTerm.solarTerm}(${termDate.getFullYear()}-${
        termDate.getMonth() + 1
      }-${termDate.getDate()} ${termDate.getHours()}:${termDate.getMinutes()}) 이후 → ${monthBranch}월`,
    )
    return monthBranch
  }

  // 절기 데이터가 없는 경우 대체 로직
  console.log(`절기 데이터 없음, 대체 로직 사용`)

  // 간단한 월별 매핑 (대략적)
  const monthToBranch = {
    1: "축",
    2: "인",
    3: "묘",
    4: "진",
    5: "사",
    6: "오",
    7: "미",
    8: "신",
    9: "유",
    10: "술",
    11: "해",
    12: "자",
  }

  return monthToBranch[month as keyof typeof monthToBranch] || "자"
}

// 월간 계산
function getMonthStem(yearStem: string, monthBranch: string): string {
  const monthBranchOrder = ["인", "묘", "진", "사", "오", "미", "신", "유", "술", "해", "자", "축"]
  const monthBranchIndex = monthBranchOrder.indexOf(monthBranch)

  const yearStemToFirstMonthStem: Record<string, number> = {
    갑: 2, // 갑년 인월은 병(丙)
    을: 4, // 을년 인월은 무(戊)
    병: 6, // 병년 인월은 경(庚)
    정: 8, // 정년 인월은 임(壬)
    무: 0, // 무년 인월은 갑(甲)
    기: 2, // 기년 인월은 병(丙)
    경: 4, // 경년 인월은 무(戊)
    신: 6, // 신년 인월은 경(庚)
    임: 8, // 임년 인월은 임(壬)
    계: 0, // 계년 인월은 갑(甲)
  }

  const firstMonthStemIndex = yearStemToFirstMonthStem[yearStem] || 0
  const stemIndex = (firstMonthStemIndex + monthBranchIndex) % 10

  console.log(`월간 계산: ${yearStem}년 ${monthBranch}월 → ${HEAVENLY_STEMS[stemIndex]}${monthBranch}`)

  return HEAVENLY_STEMS[stemIndex]
}

// 월주 계산
function getMonthPillar(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  yearStem: string,
  hour = 0,
  minute = 0,
): { stem: string; branch: string } {
  const monthBranch = getMonthBranchFromSolarTerms(solarYear, solarMonth, solarDay, hour, minute)
  const monthStem = getMonthStem(yearStem, monthBranch)
  return { stem: monthStem, branch: monthBranch }
}

// 오행 계산
function countElements(
  yearStem: string,
  yearBranch: string,
  monthStem: string,
  monthBranch: string,
  dayStem: string,
  dayBranch: string,
  hourStem: string | null,
  hourBranch: string | null,
): Record<string, number> {
  const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

  elements[STEM_ELEMENTS[yearStem as keyof typeof STEM_ELEMENTS]]++
  elements[STEM_ELEMENTS[monthStem as keyof typeof STEM_ELEMENTS]]++
  elements[STEM_ELEMENTS[dayStem as keyof typeof STEM_ELEMENTS]]++

  elements[BRANCH_ELEMENTS[yearBranch as keyof typeof BRANCH_ELEMENTS]]++
  elements[BRANCH_ELEMENTS[monthBranch as keyof typeof BRANCH_ELEMENTS]]++
  elements[BRANCH_ELEMENTS[dayBranch as keyof typeof BRANCH_ELEMENTS]]++

  if (hourStem && hourStem !== "?" && hourBranch && hourBranch !== "?") {
    elements[STEM_ELEMENTS[hourStem as keyof typeof STEM_ELEMENTS]]++
    elements[BRANCH_ELEMENTS[hourBranch as keyof typeof BRANCH_ELEMENTS]]++
  }

  return elements
}

// 사주 해석 생성
function generateInterpretation(
  elements: Record<string, number>,
  dayStem: string,
  dayBranch: string,
  timeUnknown = false,
): string {
  const timeNote = timeUnknown
    ? "시간을 모르는 경우 시주(時柱)를 제외한 분석이므로, 완전한 해석에는 한계가 있습니다. "
    : ""
  return (
    timeNote +
    `일주(日柱)는 ${dayStem}${dayBranch}입니다. 사주는 단순한 참고 자료일 뿐, 개인의 노력과 선택이 더 중요합니다.`
  )
}

// 메인 사주 계산 함수
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
): Saju {
  console.log(`\n=== 사주 계산 시작: ${solarYear}-${solarMonth}-${solarDay} ===`)

  // 시간을 모르는 경우 낮 12시로 설정
  const calculationHour = timeUnknown ? 12 : hour
  const calculationMinute = timeUnknown ? 0 : minute

  // 연주 계산
  const yearPillar = getYearPillar(solarYear, solarMonth, solarDay)
  const { stem: yearStem, branch: yearBranch } = yearPillar
  console.log(`연주: ${yearStem}${yearBranch}`)

  // 월주 계산 - 시간까지 고려
  const monthPillar = getMonthPillar(solarYear, solarMonth, solarDay, yearStem, calculationHour, calculationMinute)
  const { stem: monthStem, branch: monthBranch } = monthPillar
  console.log(`월주: ${monthStem}${monthBranch}`)

  // 일주 계산
  const dayPillar = getDayPillar(solarYear, solarMonth, solarDay)
  const { stem: dayStem, branch: dayBranch } = dayPillar
  console.log(`일주: ${dayStem}${dayBranch}`)

  // 시주 계산
  let hourStem, hourBranch
  if (timeUnknown) {
    hourStem = "?"
    hourBranch = "?"
    console.log(`시주: 시간 미상`)
  } else {
    hourBranch = getHourBranch(hour, minute)
    hourStem = getHourStem(dayStem, hour, minute)
    console.log(`시주: ${hourStem}${hourBranch}`)
  }

  // 오행 계산
  const elements = countElements(yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch)

  // 해석 생성
  const interpretation = generateInterpretation(elements, dayStem, dayBranch, timeUnknown)

  // 인덱스 계산
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearStem)
  const yearBranchIndex = EARTHLY_BRANCHES.indexOf(yearBranch)
  const monthStemIndex = HEAVENLY_STEMS.indexOf(monthStem)
  const monthBranchIndex = EARTHLY_BRANCHES.indexOf(monthBranch)
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayStem)
  const dayBranchIndex = EARTHLY_BRANCHES.indexOf(dayBranch)
  const hourStemIndex = hourStem !== "?" ? HEAVENLY_STEMS.indexOf(hourStem) : -1
  const hourBranchIndex = hourBranch !== "?" ? EARTHLY_BRANCHES.indexOf(hourBranch) : -1

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
    hourStemHanja: hourStemIndex !== -1 ? HEAVENLY_STEMS_HANJA[hourStemIndex] : "",
    hourBranchHanja: hourBranchIndex !== -1 ? EARTHLY_BRANCHES_HANJA[hourBranchIndex] : "",
    elements,
    interpretation,
    yearAnimal: ZODIAC_ANIMALS[yearBranch as keyof typeof ZODIAC_ANIMALS],
    dayMaster: dayStem,
    dayMasterHanja: HEAVENLY_STEMS_HANJA[dayStemIndex],
    gender,
    name,
    timeUnknown,
    yearStemSibseong: calculateSibseong(dayStem, yearStem),
    monthStemSibseong: calculateSibseong(dayStem, monthStem),
    dayStemSibseong: calculateSibseong(dayStem, dayStem),
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
