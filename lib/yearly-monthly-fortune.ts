// 천간(天干)과 지지(地支) 배열
const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

// 한글 천간과 지지 배열
const KR_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const KR_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]

// 오행 매핑
const STEM_ELEMENTS = {
  갑: "목",
  을: "목",
  병: "화",
  정: "화",
  무: "토",
  기: "토",
  경: "금",
  신: "금",
  임: "수",
  계: "수",
  甲: "목",
  乙: "목",
  丙: "화",
  丁: "화",
  戊: "토",
  己: "토",
  庚: "금",
  辛: "금",
  壬: "수",
  癸: "수",
}

const BRANCH_ELEMENTS = {
  자: "수",
  축: "토",
  인: "목",
  묘: "목",
  진: "토",
  사: "화",
  오: "화",
  미: "토",
  신: "금",
  유: "금",
  술: "토",
  해: "수",
  子: "수",
  丑: "토",
  寅: "목",
  卯: "목",
  辰: "토",
  巳: "화",
  午: "화",
  未: "토",
  申: "금",
  酉: "금",
  戌: "토",
  亥: "수",
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

// 연도의 천간 계산
export function getYearStem(year: number): string {
  // 갑자년은 1984, 1994, 2004, 2014, 2024...
  return STEMS[(year - 4) % 10]
}

// 연도의 지지 계산
export function getYearBranch(year: number): string {
  // 갑자년은 1984, 1994, 2004, 2014, 2024...
  return BRANCHES[(year - 4) % 12]
}

// 월의 천간 계산 (연도의 천간에 따라 달라짐)
export function getMonthStem(yearStem: string, month: number): string {
  const yearStemIndex = getStemIndex(yearStem)
  if (yearStemIndex === -1) return STEMS[0] // 기본값

  // 월의 천간 계산 (정통 명리학 규칙)
  // 갑·기 → 병
  // 을·경 → 정
  // 병·신 → 무
  // 정·임 → 기
  // 무·계 → 경
  const baseIndex = (yearStemIndex % 5) * 2
  return STEMS[(baseIndex + (month - 1)) % 10]
}

// 월의 지지 계산
export function getMonthBranch(month: number): string {
  // 1월은 인(寅)월, 2월은 묘(卯)월, ...
  return BRANCHES[(month + 1) % 12]
}

// 세운(年運) 계산
export function calculateYearlyFortune(
  startYear: number,
  endYear: number,
): Array<{
  year: number
  stem: string
  branch: string
  stemKorean: string
  branchKorean: string
  stemElement: string
  branchElement: string
}> {
  const yearlyFortunes = []

  for (let year = startYear; year <= endYear; year++) {
    const stem = getYearStem(year)
    const branch = getYearBranch(year)
    const stemIndex = getStemIndex(stem)
    const branchIndex = getBranchIndex(branch)

    yearlyFortunes.push({
      year,
      stem,
      branch,
      stemKorean: KR_STEMS[stemIndex],
      branchKorean: KR_BRANCHES[branchIndex],
      stemElement: STEM_ELEMENTS[stem] || "",
      branchElement: BRANCH_ELEMENTS[branch] || "",
    })
  }

  return yearlyFortunes
}

// 월운(月運) 계산
export function calculateMonthlyFortune(year: number): Array<{
  year: number
  month: number
  stem: string
  branch: string
  stemKorean: string
  branchKorean: string
  stemElement: string
  branchElement: string
}> {
  const monthlyFortunes = []
  const yearStem = getYearStem(year)

  for (let month = 1; month <= 12; month++) {
    const stem = getMonthStem(yearStem, month)
    const branch = getMonthBranch(month)
    const stemIndex = getStemIndex(stem)
    const branchIndex = getBranchIndex(branch)

    monthlyFortunes.push({
      year,
      month,
      stem,
      branch,
      stemKorean: KR_STEMS[stemIndex],
      branchKorean: KR_BRANCHES[branchIndex],
      stemElement: STEM_ELEMENTS[stem] || "",
      branchElement: BRANCH_ELEMENTS[branch] || "",
    })
  }

  return monthlyFortunes
}

// 오행 관계 분석
export function analyzeElementRelation(element1: string, element2: string): string {
  // 오행 상생 관계: 목생화, 화생토, 토생금, 금생수, 수생목
  // 오행 상극 관계: 목극토, 토극수, 수극화, 화극금, 금극목

  if (element1 === element2) return "비견(比肩)"

  if (
    (element1 === "목" && element2 === "화") ||
    (element1 === "화" && element2 === "토") ||
    (element1 === "토" && element2 === "금") ||
    (element1 === "금" && element2 === "수") ||
    (element1 === "수" && element2 === "목")
  ) {
    return "생(生)"
  }

  if (
    (element1 === "목" && element2 === "토") ||
    (element1 === "토" && element2 === "수") ||
    (element1 === "수" && element2 === "화") ||
    (element1 === "화" && element2 === "금") ||
    (element1 === "금" && element2 === "목")
  ) {
    return "극(剋)"
  }

  if (
    (element2 === "목" && element1 === "화") ||
    (element2 === "화" && element1 === "토") ||
    (element2 === "토" && element1 === "금") ||
    (element2 === "금" && element1 === "수") ||
    (element2 === "수" && element1 === "목")
  ) {
    return "식(食)"
  }

  if (
    (element2 === "목" && element1 === "토") ||
    (element2 === "토" && element1 === "수") ||
    (element2 === "수" && element1 === "화") ||
    (element2 === "화" && element1 === "금") ||
    (element2 === "금" && element1 === "목")
  ) {
    return "피극(被剋)"
  }

  return "관계 없음"
}

// 오행 색상 매핑
export const elementColors = {
  목: "bg-green-100 border-green-500 text-green-800 dark:bg-green-950 dark:border-green-400 dark:text-green-300",
  화: "bg-red-100 border-red-500 text-red-800 dark:bg-red-950 dark:border-red-400 dark:text-red-300",
  토: "bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-300",
  금: "bg-gray-100 border-gray-500 text-gray-800 dark:bg-gray-800 dark:border-gray-400 dark:text-gray-300",
  수: "bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-300",
}

// 간의 오행 색상 가져오기
export function getStemElementColor(stem: string): string {
  const element = STEM_ELEMENTS[stem] || "토"
  return elementColors[element]
}

// 지의 오행 색상 가져오기
export function getBranchElementColor(branch: string): string {
  const element = BRANCH_ELEMENTS[branch] || "토"
  return elementColors[element]
}

// 현재 연도 가져오기
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

// 현재 월 가져오기
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1 // JavaScript의 월은 0부터 시작
}
