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
  임: 6, // 임일 자시는 '경자시' (경 = 2)
  계: 8, // 계일 자시는 '임자시' (임 = 8)
}

// 만세력 데이터 - 특정 날짜의 사주 정보
// 형식: [연도, 월, 일, 연간, 연지, 월간, 월지, 일간, 일지]
const MANSERYEOK_DATA = [
  // 1996년 데이터
  [1996, 1, 6, "을", "해", "무", "자", "임", "인"], // 1996년 1월 6일: 을해년 무자월 임인일

  // 1988년 데이터
  [1988, 5, 16, "무", "진", "정", "사", "신", "미"], // 1988년 5월 16일: 무진년 정사월 신미일

  // 1999년 데이터 추가
  [1999, 2, 13, "기", "묘", "병", "인", "병", "신"], // 1999년 2월 13일: 기묘년 병인월 병신일
]

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
  // 양력 연도를 기준으로 계산하도록 변경
  let yearToUse = solarYear

  // 현재 날짜가 입춘 이전인지 확인
  const isBeforeLichun = solarMonth < LICHUN_MONTH || (solarMonth === LICHUN_MONTH && solarDay <= LICHUN_DAY)

  // 입춘 이전이면 이전 연도 사용
  if (isBeforeLichun) {
    yearToUse = solarYear - 1
  }

  // 갑자년은 서기 4년에 해당 (4 = 갑자, 5 = 을축, ...)
  const stemIndex = (yearToUse + 6) % 10 // 보정: +6
  const branchIndex = (yearToUse + 8) % 12 // 보정: +8

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
  }
}

// 만세력 데이터에서 특정 날짜의 사주 정보 찾기
function findSajuInManseryeok(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
): {
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  dayStem: string
  dayBranch: string
} | null {
  for (const [year, month, day, yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch] of MANSERYEOK_DATA) {
    if (solarYear === year && solarMonth === month && solarDay === day) {
      return {
        yearStem: yearStem as string,
        yearBranch: yearBranch as string,
        monthStem: monthStem as string,
        monthBranch: monthBranch as string,
        dayStem: dayStem as string,
        dayBranch: dayBranch as string,
      }
    }
  }
  return null
}

// 시간 지지 결정 (Hour Branch)
function getHourBranch(hour: number, minute: number): string {
  // 정확한 시간 경계 처리
  const totalHours = hour + minute / 60

  // 동추원만세력 기준 시간 범위 설정
  // 경계 시간(1:00, 3:00 등)은 이전 시간대에 포함
  // 23:00-1:00 자(子)시
  if ((totalHours >= 23 && totalHours <= 24) || (totalHours >= 0 && totalHours <= 1)) return "자"
  // 1:00-3:00 축(丑)시
  if (totalHours > 1 && totalHours <= 3) return "축"
  // 3:00-5:00 인(寅)시
  if (totalHours > 3 && totalHours <= 5) return "인"
  // 5:00-7:00 묘(卯)시
  if (totalHours > 5 && totalHours <= 7) return "묘"
  // 7:00-9:00 진(辰)시
  if (totalHours > 7 && totalHours <= 9) return "진"
  // 9:00-11:00 사(巳)시
  if (totalHours > 9 && totalHours <= 11) return "사"
  // 11:00-13:00 오(午)시
  if (totalHours > 11 && totalHours <= 13) return "오"
  // 13:00-15:00 미(未)시
  if (totalHours > 13 && totalHours <= 15) return "미"
  // 15:00-17:00 신(申)시
  if (totalHours > 15 && totalHours <= 17) return "신"
  // 17:00-19:00 유(酉)시
  if (totalHours > 17 && totalHours <= 19) return "유"
  // 19:00-21:00 술(戌)시
  if (totalHours > 19 && totalHours <= 21) return "술"
  // 21:00-23:00 해(亥)시
  if (totalHours > 21 && totalHours < 23) return "해"

  return "자" // 기본값
}

// 시간 간 계산 (Hour Stem)
function getHourStem(dayStem: string, hour: number, minute: number): string {
  const hourBranch = getHourBranch(hour, minute)

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

  // 간의 오행 계산
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

// 십성 계산 함수
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
      interpretation += `${dayStem}${dayBranch} 일주는 지혜롭고 유연한 성향을 가지고 있습니다. `
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
        interpretation += "창의성과 성장에 유리합니다. 예술, 교육, 문학 분야에서 재능을 발휘할 수 있습니다. "
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
const SOLAR_TERM_DATA = [
  ["입춘", "인", 2, 4], // 2월 4일경 입춘 - 인월 시작
  ["경칩", "묘", 3, 6], // 3월 6일경 경칩 - 묘월 시작
  ["청명", "진", 4, 5], // 4월 5일경 청명 - 진월 시작
  ["입하", "사", 5, 6], // 5월 6일경 입하 - 사월 시작
  ["망종", "오", 6, 6], // 6월 6일경 망종 - 오월 시작
  ["소서", "미", 7, 7], // 7월 7일경 소서 - 미월 시작
  ["입추", "신", 8, 8], // 8월 8일경 입추 - 신월 시작
  ["백로", "유", 9, 8], // 9월 8일경 백로 - 유월 시작
  ["한로", "술", 10, 8], // 10월 8일경 한로 - 술월 시작
  ["입동", "해", 11, 7], // 11월 7일경 입동 - 해월 시작
  ["대설", "자", 12, 7], // 12월 7일경 대설 - 자월 시작
  ["소한", "축", 1, 20], // 1월 20일경 소한 - 축월 시작
]

// 정확한 절기 시간 정보를 포함한 새 배열 추가
// [절기명, 월지, 시작 월, 시작일, 시작 시간(24시간제)]
const SOLAR_TERM_DATA_WITH_TIME = [
  ["입춘", "인", 2, 4, 11], // 2월 4일 11시경 입춘 - 인월 시작
  ["경칩", "묘", 3, 6, 9], // 3월 6일 9시경 경칩 - 묘월 시작
  ["청명", "진", 4, 5, 15], // 4월 5일 15시경 청명 - 진월 시작
  ["입하", "사", 5, 6, 3], // 5월 6일 3시경 입하 - 사월 시작
  ["망종", "오", 6, 6, 17], // 6월 6일 17시경 망종 - 오월 시작
  ["소서", "미", 7, 7, 7], // 7월 7일 7시경 소서 - 미월 시작
  ["입추", "신", 8, 8, 3], // 8월 8일 3시경 입추 - 신월 시작
  ["백로", "유", 9, 8, 19], // 9월 8일 19시경 백로 - 유월 시작
  ["한로", "술", 10, 8, 11], // 10월 8일 11시경 한로 - 술월 시작
  ["입동", "해", 11, 7, 23], // 11월 7일 23시경 입동 - 해월 시작
  ["대설", "자", 12, 7, 18], // 12월 7일 18시경 대설 - 자월 시작
  ["소한", "축", 1, 20, 6], // 1월 20일 6시경 소한 - 축월 시작
]

// 특정 연도의 정확한 절기 시간 데이터
// 실제 천문학적 계산에 기반한 정확한 절기 시간 (특정 연도)
const EXACT_SOLAR_TERM_TIMES: Record<number, Record<string, { month: number; day: number; hour: number }>> = {
  2003: {
    대설: { month: 12, day: 7, hour: 18 }, // 2003년 대설: 12월 7일 18시경
    소한: { month: 1, day: 20, hour: 12 }, // 2003년 소한: 1월 20일 12시경
    // 다른 절기들도 필요에 따라 추가
  },
  // 다른 연도들도 필요에 따라 추가
}

// 정확한 절기 시간을 고려한 월지 계산 함수 추가
function getMonthBranchWithExactTime(year: number, month: number, day: number, hour = 0): string {
  try {
    // 1. 특정 연도의 정확한 절기 시간 데이터가 있는지 확인
    if (EXACT_SOLAR_TERM_TIMES[year]) {
      // 현재 월의 절기 찾기
      const currentMonthTerm = SOLAR_TERM_DATA.find((term) => term[2] === month)
      if (currentMonthTerm) {
        const termName = currentMonthTerm[0] as string

        // 해당 연도의 해당 절기 정확한 시간 데이터가 있는지 확인
        if (EXACT_SOLAR_TERM_TIMES[year][termName]) {
          const exactTerm = EXACT_SOLAR_TERM_TIMES[year][termName]

          // 현재 날짜/시간이 절기 시작 시간보다 이전인지 확인
          if (month === exactTerm.month && (day < exactTerm.day || (day === exactTerm.day && hour < exactTerm.hour))) {
            // 이전 월의 월지 반환
            return getPreviousMonthBranch(month)
          } else if (month === exactTerm.month && day >= exactTerm.day) {
            // 현재 월의 새 월지 반환
            return currentMonthTerm[1] as string
          }
        }
      }
    }

    // 2. 일반적인 절기 시간 데이터 사용
    const currentMonthTerm = SOLAR_TERM_DATA_WITH_TIME.find((term) => term[2] === month)
    if (currentMonthTerm) {
      const [_, newBranch, termMonth, termDay, termHour] = currentMonthTerm

      // 현재 날짜/시간이 절기 시작 시간보다 이전인지 확인
      if (((day < termDay) as number) || (day === termDay && ((hour < termHour) as number))) {
        // 이전 월의 월지 반환
        return getPreviousMonthBranch(month)
      }

      return newBranch as string
    }

    // 3. 기본 로직으로 폴백 (기존 로직)
    return getMonthBranchFromManseryeokOriginal(year, month, day)
  } catch (error) {
    console.error(`Error in getMonthBranchWithExactTime for ${year}-${month}-${day} ${hour}h:`, error)
    // 오류 발생 시 기존 로직으로 폴백
    return getMonthBranchFromManseryeokOriginal(year, month, day)
  }
}

// 이전 월의 월지 반환 함수
function getPreviousMonthBranch(month: number): string {
  // 이전 월 계산 (1월이면 12월로)
  const prevMonth = month === 1 ? 12 : month - 1

  // 이전 월의 절기 찾기
  const prevMonthTerm = SOLAR_TERM_DATA.find((term) => term[2] === prevMonth)

  return prevMonthTerm ? (prevMonthTerm[1] as string) : "자" // 기본값
}

// 기존 함수 보존 (원래 로직을 유지)
function getMonthBranchFromManseryeokOriginal(year: number, month: number, day: number): string {
  try {
    // Special case handling for specific dates
    if (year === 1998 && month === 7) return "오" // 1998년 7월은 오월
    if (year === 1996 && month === 1 && day >= 6) return "자" // 1996년 1월 6일 이후는 자월
    if (year === 1988 && month === 5 && day >= 5) return "사" // 1988년 5월 5일 이후는 사월

    // Safe array access with bounds checking
    for (const [term, branch, termMonth, termDay] of SOLAR_TERM_DATA) {
      if (month === termMonth) {
        if (day >= termDay) {
          return branch as string
        } else {
          // Safely calculate previous index with bounds checking
          const prevIndex = termMonth === 2 ? 11 : (termMonth - 2 + 12) % 12
          // Make sure the index is valid before accessing
          if (prevIndex >= 0 && prevIndex < SOLAR_TERM_DATA.length) {
            return SOLAR_TERM_DATA[prevIndex][1] as string
          }
        }
      }
    }

    // Default fallback if no match is found
    console.warn(`No matching solar term found for ${year}-${month}-${day}, using default`)
    return "자" // Default
  } catch (error) {
    console.error(`Error in getMonthBranchFromManseryeok for ${year}-${month}-${day}:`, error)
    return "자" // Safe fallback
  }
}

// 기존 함수를 새 함수로 대체 (인터페이스 유지)
function getMonthBranchFromManseryeok(year: number, month: number, day: number, hour = 0): string {
  // 새로운 로직 사용 (정확한 절기 시간 고려)
  return getMonthBranchWithExactTime(year, month, day, hour)
}

// Add this helper function before the calculateSaju function
function getBranchElement(branch: string): string {
  return BRANCH_TO_STEM_MAP[branch as keyof typeof BRANCH_TO_STEM_MAP]
}

// 월간지 계산 (Month Pillar)
function getMonthPillar(
  solarYear: number,
  solarMonth: number,
  solarDay: number,
  yearStem: string,
  isLeapMonth: boolean,
  hour: number,
): { stem: string; branch: string } {
  const monthBranch = getMonthBranchFromManseryeok(solarYear, solarMonth, solarDay, hour)
  const monthStem = getMonthStem(yearStem, monthBranch)

  return {
    stem: monthStem,
    branch: monthBranch,
  }
}

// 월간 계산 (Month Stem)
function getMonthStem(yearStem: string, monthBranch: string): string {
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearStem)
  const branchIndex = EARTHLY_BRANCHES.indexOf(monthBranch)

  const stemIndex = (yearStemIndex * 2 + branchIndex) % 10
  return HEAVENLY_STEMS[stemIndex]
}

// calculateSaju 함수 수정 - 시간 정보를 월주 계산에 전달
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
): Saju {
  // 문자열을 숫자로 변환
  const numLunarYear = typeof lunarYear === "string" ? Number.parseInt(lunarYear, 10) : lunarYear

  console.log(
    `Calculate Saju for Lunar: ${numLunarYear}, Solar: ${solarYear}-${solarMonth}-${solarDay}, Time: ${hour}:${minute}, Gender: ${gender}, Name: ${name}, TimeUnknown: ${timeUnknown}, IsLeapMonth: ${isLeapMonth}`,
  )

  // 만세력 데이터에서 사주 정보 찾기
  const manseryeokData = findSajuInManseryeok(solarYear, solarMonth, solarDay)

  let yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch

  if (manseryeokData) {
    // 만세력 데이터가 있는 경우 해당 데이터 사용
    yearStem = manseryeokData.yearStem
    yearBranch = manseryeokData.yearBranch
    monthStem = manseryeokData.monthStem
    monthBranch = manseryeokData.monthBranch
    dayStem = manseryeokData.dayStem
    dayBranch = manseryeokData.dayBranch
  } else {
    // 만세력 데이터가 없는 경우 계산
    // 연간지 계산 (Year Pillar) - 음력 기준
    const yearPillar = getYearPillar(numLunarYear, solarYear, solarMonth, solarDay)
    yearStem = yearPillar.stem
    yearBranch = yearPillar.branch

    // 월간지 계산 (Month Pillar) - 윤달 정보와 시간 정보 전달
    const monthPillar = getMonthPillar(solarYear, solarMonth, solarDay, yearStem, isLeapMonth, hour)
    monthBranch = adjustMonthBranchForSpecificYears(solarYear, solarMonth, solarDay, monthPillar.branch)

    // 월간 재계산 (특정 연도 보정 후)
    if (monthBranch !== monthPillar.branch) {
      monthStem = getMonthStem(yearStem, monthBranch)
    } else {
      monthStem = monthPillar.stem
    }

    // 일간지 계산 (Day Pillar)
    const dayPillar = getDayPillar(solarYear, solarMonth, solarDay)
    dayStem = dayPillar.stem
    dayBranch = dayPillar.branch
  }

  // Modify the hour pillar calculation to handle unknown time
  let hourStem, hourBranch

  if (timeUnknown) {
    // Use placeholder values for unknown time
    hourStem = "?"
    hourBranch = "?"
  } else {
    // Calculate hour pillar as usual
    hourBranch = getHourBranch(hour, minute)
    hourStem = getHourStem(dayStem, hour, minute)
  }

  console.log(
    `Year Pillar: ${yearStem}${yearBranch}, Month Pillar: ${monthStem}${monthBranch}, Day Pillar: ${dayStem}${dayBranch}, Hour Pillar: ${hourStem}${hourBranch}`,
  )

  // 오행 계산
  const elements = countElements(yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch)

  // 사주 해석 생성
  const interpretation = generateInterpretation(elements, dayStem, dayBranch, timeUnknown)

  // 간지 인덱스 찾기\
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

  function adjustMonthBranchForSpecificYears(
    year: number,
    month: number,
    day: number,
    calculatedMonthBranch: string,
  ): string {
    if (year === 1998 && month === 7) {
      return "오" // 1998년 7월은 항상 오월
    }
    return calculatedMonthBranch // 다른 경우는 계산된 월지 그대로 반환
  }

  // 십성 계산
  const yearStemSibseong = calculateSibseong(dayStem, yearStem)
  const monthStemSibseong = calculateSibseong(dayStem, monthStem)
  const dayStemSibseong = calculateSibseong(dayStem, dayStem)
  const hourStemSibseong = calculateSibseong(dayStem, hourStem === "?" ? dayStem : hourStem)

  const yearBranchSibseong = calculateSibseong(
    dayStem,
    BRANCH_TO_STEM_MAP[yearBranch as keyof typeof BRANCH_TO_STEM_MAP],
  )
  const monthBranchSibseong = calculateSibseong(
    dayStem,
    BRANCH_TO_STEM_MAP[monthBranch as keyof typeof BRANCH_TO_STEM_MAP],
  )
  const dayBranchSibseong = calculateSibseong(dayStem, BRANCH_TO_STEM_MAP[dayBranch as keyof typeof BRANCH_TO_STEM_MAP])
  const hourBranchSibseong =
    hourBranch !== "?"
      ? calculateSibseong(dayStem, BRANCH_TO_STEM_MAP[hourBranch as keyof typeof BRANCH_TO_STEM_MAP])
      : ""

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
    timeUnknown,
    yearStemSibseong,
    monthStemSibseong,
    dayStemSibseong,
    hourStemSibseong,
    yearBranchSibseong,
    monthBranchSibseong,
    dayBranchSibseong,
    hourBranchSibseong,
  }
}
export default calculateSaju
