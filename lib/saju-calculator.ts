import type { BirthData, SajuResult, CustomQuestion } from "@/types/saju"

// 환경 변수 확인
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

// 천간 (10개)
const HEAVENLY_STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"]
const HEAVENLY_STEMS_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]

// 지지 (12개)
const EARTHLY_BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"]
const EARTHLY_BRANCHES_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

// 오행 매핑
const STEM_ELEMENTS = ["목", "목", "화", "화", "토", "토", "금", "금", "수", "수"]
const BRANCH_ELEMENTS = ["수", "토", "목", "목", "토", "화", "화", "토", "금", "금", "토", "수"]

// 음양 매핑
const STEM_YIN_YANG = ["양", "음", "양", "음", "양", "음", "양", "음", "양", "음"]

// 24절기 데이터 (간소화된 버전)
const SOLAR_TERMS = {
  1: { start: 6, name: "소한" }, // 1월 6일경 소한
  2: { start: 4, name: "입춘" }, // 2월 4일경 입춘
  3: { start: 6, name: "경칩" }, // 3월 6일경 경칩
  4: { start: 5, name: "청명" }, // 4월 5일경 청명
  5: { start: 6, name: "입하" }, // 5월 6일경 입하
  6: { start: 6, name: "망종" }, // 6월 6일경 망종
  7: { start: 7, name: "소서" }, // 7월 7일경 소서
  8: { start: 8, name: "입추" }, // 8월 8일경 입추
  9: { start: 8, name: "백로" }, // 9월 8일경 백로
  10: { start: 8, name: "한로" }, // 10월 8일경 한로
  11: { start: 8, name: "입동" }, // 11월 8일경 입동
  12: { start: 7, name: "대설" }, // 12월 7일경 대설
}

export async function calculateSaju(birthData: BirthData): Promise<SajuResult> {
  try {
    console.log("사주 계산 시작 (환경:", USE_MOCK_API ? "MOCK" : "REAL", "):", birthData)

    // Date 객체 변환 처리
    const birthDate = typeof birthData.birthDate === "string" ? new Date(birthData.birthDate) : birthData.birthDate

    // 유효한 Date 객체인지 확인
    if (!birthDate || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
      throw new Error("올바르지 않은 생년월일입니다.")
    }

    if (USE_MOCK_API) {
      // 모의 API 사용
      return await calculateSajuMock(birthData, birthDate)
    } else {
      // 실제 라이브러리 사용 (동적 임포트)
      return await calculateSajuReal(birthData, birthDate)
    }
  } catch (error) {
    console.error("사주 계산 오류:", error)
    throw new Error(`사주 계산 중 오류가 발생했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
  }
}

// 실제 라이브러리 사용 (프로덕션 환경)
async function calculateSajuReal(birthData: BirthData, birthDate: Date): Promise<SajuResult> {
  try {
    // 동적 임포트로 라이브러리 로드
    const { SajuCalculator } = await import("@pragcode/saju-calculator")

    console.log("실제 라이브러리 로드 성공")

    // SajuCalculator 빌더 패턴으로 사주 계산
    const calculatorBuilder = new SajuCalculator()
      .setSolarDate(
        birthDate.getFullYear(),
        birthDate.getMonth() + 1,
        birthDate.getDate(),
        birthData.birthTime ? Number.parseInt(birthData.birthTime.split(":")[0]) : undefined,
        birthData.birthTime ? Number.parseInt(birthData.birthTime.split(":")[1]) : undefined,
      )
      .setCity(birthData.birthPlace || "서울")
      .setGender(birthData.gender)

    // 시간 미상인 경우 처리
    if (!birthData.birthTime) {
      calculatorBuilder.setTimeUnknown(true)
    }

    // 옵션 설정
    calculatorBuilder.setOptions({
      useHanja: false,
      includeAnalysis: true,
      includeInterpretation: true,
    })

    // 사주 계산 실행
    const saju = await calculatorBuilder.build()

    console.log("실제 라이브러리 계산 결과:", saju)

    // 라이브러리 결과를 우리 형식으로 변환
    return {
      pillars: {
        year: {
          heavenly: saju.yearStem,
          earthly: saju.yearBranch,
          element: getElementFromStem(saju.yearStemHanja),
          yin_yang: getYinYangFromStem(saju.yearStemHanja),
        },
        month: {
          heavenly: saju.monthStem,
          earthly: saju.monthBranch,
          element: getElementFromStem(saju.monthStemHanja),
          yin_yang: getYinYangFromStem(saju.monthStemHanja),
        },
        day: {
          heavenly: saju.dayStem,
          earthly: saju.dayBranch,
          element: getElementFromStem(saju.dayStemHanja),
          yin_yang: getYinYangFromStem(saju.dayStemHanja),
        },
        hour: saju.hourStem
          ? {
              heavenly: saju.hourStem,
              earthly: saju.hourBranch!,
              element: getElementFromStem(saju.hourStemHanja!),
              yin_yang: getYinYangFromStem(saju.hourStemHanja!),
            }
          : undefined,
      },
      elements: {
        wood: saju.elements.wood,
        fire: saju.elements.fire,
        earth: saju.elements.earth,
        metal: saju.elements.metal,
        water: saju.elements.water,
      },
      dayMaster: saju.dayMaster,
      interpretation: generateInterpretation(saju.dayStem, saju.elements, birthData),
      strengths: generateStrengths(saju.elements),
      challenges: generateChallenges(saju.elements),
      recommendations: generateRecommendations(saju.elements, birthData.interests || []),
    }
  } catch (error) {
    console.error("실제 라이브러리 사용 실패, 모의 계산으로 전환:", error)
    // 실제 라이브러리 실패 시 모의 계산으로 폴백
    return await calculateSajuMock(birthData, birthDate)
  }
}

// 모의 사주 계산 (v0 환경 및 폴백)
async function calculateSajuMock(birthData: BirthData, birthDate: Date): Promise<SajuResult> {
  console.log("모의 사주 계산 시작")

  // 계산 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const year = birthDate.getFullYear()
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()
  const hour = birthData.birthTime ? Number.parseInt(birthData.birthTime.split(":")[0]) : undefined

  // 사주 계산
  const yearPillar = calculateYearPillar(year, month, day)
  const monthPillar = calculateMonthPillar(year, month, day, yearPillar.stemIndex)
  const dayPillar = calculateDayPillar(year, month, day)
  const hourPillar = hour !== undefined ? calculateHourPillar(hour, dayPillar.stemIndex) : undefined

  // 오행 계산
  const elements = calculateElements([yearPillar, monthPillar, dayPillar, hourPillar].filter(Boolean))

  const sajuResult: SajuResult = {
    pillars: {
      year: {
        heavenly: yearPillar.stem,
        earthly: yearPillar.branch,
        element: yearPillar.element,
        yin_yang: yearPillar.yinYang,
      },
      month: {
        heavenly: monthPillar.stem,
        earthly: monthPillar.branch,
        element: monthPillar.element,
        yin_yang: monthPillar.yinYang,
      },
      day: {
        heavenly: dayPillar.stem,
        earthly: dayPillar.branch,
        element: dayPillar.element,
        yin_yang: dayPillar.yinYang,
      },
      hour: hourPillar
        ? {
            heavenly: hourPillar.stem,
            earthly: hourPillar.branch,
            element: hourPillar.element,
            yin_yang: hourPillar.yinYang,
          }
        : undefined,
    },
    elements,
    dayMaster: dayPillar.stem,
    interpretation: generateInterpretation(dayPillar.stem, elements, birthData),
    strengths: generateStrengths(elements),
    challenges: generateChallenges(elements),
    recommendations: generateRecommendations(elements, birthData.interests || []),
  }

  console.log("모의 사주 계산 완료:", sajuResult)
  return sajuResult
}

// 년주 계산 (절기 기준)
function calculateYearPillar(year: number, month: number, day: number) {
  // 입춘 이전이면 전년도로 계산
  let sajuYear = year
  if (month < 2 || (month === 2 && day < SOLAR_TERMS[2].start)) {
    sajuYear = year - 1
  }

  // 갑자년(1984)을 기준으로 계산
  const baseYear = 1984
  const yearDiff = sajuYear - baseYear
  const stemIndex = ((yearDiff % 10) + 10) % 10
  const branchIndex = ((yearDiff % 12) + 12) % 12

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    element: STEM_ELEMENTS[stemIndex],
    yinYang: STEM_YIN_YANG[stemIndex],
    stemIndex,
    branchIndex,
  }
}

// 월주 계산 (절기 기준)
function calculateMonthPillar(year: number, month: number, day: number, yearStemIndex: number) {
  // 절기 확인
  let sajuMonth = month
  const solarTerm = SOLAR_TERMS[month as keyof typeof SOLAR_TERMS]
  if (day < solarTerm.start) {
    sajuMonth = month === 1 ? 12 : month - 1
  }

  // 인월(정월)을 기준으로 계산
  // 갑기년은 병인월, 을경년은 무인월...
  const monthStemBase = yearStemIndex % 5 === 0 || yearStemIndex % 5 === 4 ? 2 : yearStemIndex % 5 === 1 ? 4 : 0
  const monthStemIndex = (monthStemBase + sajuMonth - 1) % 10
  const monthBranchIndex = (sajuMonth + 1) % 12 // 인월부터 시작

  return {
    stem: HEAVENLY_STEMS[monthStemIndex],
    branch: EARTHLY_BRANCHES[monthBranchIndex],
    element: STEM_ELEMENTS[monthStemIndex],
    yinYang: STEM_YIN_YANG[monthStemIndex],
    stemIndex: monthStemIndex,
    branchIndex: monthBranchIndex,
  }
}

// 일주 계산
function calculateDayPillar(year: number, month: number, day: number) {
  // 기준일(1900년 1월 1일 = 갑자일)로부터 경과일 계산
  const baseDate = new Date(1900, 0, 1)
  const targetDate = new Date(year, month - 1, day)
  const daysDiff = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))

  const stemIndex = ((daysDiff % 10) + 10) % 10
  const branchIndex = ((daysDiff % 12) + 12) % 12

  return {
    stem: HEAVENLY_STEMS[stemIndex],
    branch: EARTHLY_BRANCHES[branchIndex],
    element: STEM_ELEMENTS[stemIndex],
    yinYang: STEM_YIN_YANG[stemIndex],
    stemIndex,
    branchIndex,
  }
}

// 시주 계산
function calculateHourPillar(hour: number, dayStemIndex: number) {
  // 시간대별 지지 계산 (23-1시: 자시, 1-3시: 축시...)
  const hourBranchIndex = Math.floor((hour + 1) / 2) % 12

  // 일간에 따른 시간 계산
  // 갑기일은 갑자시, 을경일은 병자시...
  const hourStemBase = dayStemIndex % 5 === 0 || dayStemIndex % 5 === 4 ? 0 : dayStemIndex % 5 === 1 ? 2 : 4
  const hourStemIndex = (hourStemBase + hourBranchIndex) % 10

  return {
    stem: HEAVENLY_STEMS[hourStemIndex],
    branch: EARTHLY_BRANCHES[hourBranchIndex],
    element: STEM_ELEMENTS[hourStemIndex],
    yinYang: STEM_YIN_YANG[hourStemIndex],
    stemIndex: hourStemIndex,
    branchIndex: hourBranchIndex,
  }
}

// 오행 계산
function calculateElements(pillars: any[]) {
  const elements = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

  pillars.forEach((pillar) => {
    if (!pillar) return

    // 천간 오행
    switch (pillar.element) {
      case "목":
        elements.wood++
        break
      case "화":
        elements.fire++
        break
      case "토":
        elements.earth++
        break
      case "금":
        elements.metal++
        break
      case "수":
        elements.water++
        break
    }

    // 지지 오행
    const branchElement = BRANCH_ELEMENTS[pillar.branchIndex]
    switch (branchElement) {
      case "목":
        elements.wood++
        break
      case "화":
        elements.fire++
        break
      case "토":
        elements.earth++
        break
      case "금":
        elements.metal++
        break
      case "수":
        elements.water++
        break
    }
  })

  return elements
}

// 천간에서 오행 추출 (실제 라이브러리용)
function getElementFromStem(stemHanja: string): string {
  const elementMap: { [key: string]: string } = {
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
  return elementMap[stemHanja] || "토"
}

// 천간에서 음양 추출 (실제 라이브러리용)
function getYinYangFromStem(stemHanja: string): string {
  const yinYangMap: { [key: string]: string } = {
    甲: "양",
    乙: "음",
    丙: "양",
    丁: "음",
    戊: "양",
    己: "음",
    庚: "양",
    辛: "음",
    壬: "양",
    癸: "음",
  }
  return yinYangMap[stemHanja] || "양"
}

// AI 해석 생성
function generateInterpretation(dayMaster: string, elements: any, birthData: BirthData): string {
  const dayMasterElement = getElementFromDayMaster(dayMaster)
  const dominantElement = Object.entries(elements).reduce((a, b) =>
    elements[a[0] as keyof typeof elements] > elements[b[0] as keyof typeof elements] ? a : b,
  )[0]

  const elementNames: { [key: string]: string } = {
    wood: "목",
    fire: "화",
    earth: "토",
    metal: "금",
    water: "수",
  }

  return `${birthData.name}님의 일주는 ${dayMaster}로, ${dayMasterElement} 기운이 강한 분입니다. 전체적으로 ${elementNames[dominantElement]} 기운이 두드러지며, 이는 ${birthData.name}님만의 독특한 매력과 능력을 나타냅니다. 타고난 성향과 잠재력이 조화롭게 어우러져 있어, 적절한 방향으로 발전시킨다면 큰 성취를 이룰 수 있을 것입니다.`
}

function getElementFromDayMaster(dayMaster: string): string {
  const elementMap: { [key: string]: string } = {
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
  }
  return elementMap[dayMaster] || "토"
}

// 강점 분석 (오행 균형 기반)
function generateStrengths(elements: any): string[] {
  const strengths = []

  if (elements.wood >= 2) {
    strengths.push("창의적 사고와 성장 지향적인 마인드를 가지고 있습니다")
  }
  if (elements.fire >= 2) {
    strengths.push("열정적이고 적극적인 성격으로 리더십이 뛰어납니다")
  }
  if (elements.earth >= 2) {
    strengths.push("안정적이고 신뢰할 수 있는 성격으로 주변의 믿음을 받습니다")
  }
  if (elements.metal >= 2) {
    strengths.push("논리적이고 체계적인 사고로 문제 해결 능력이 뛰어납니다")
  }
  if (elements.water >= 2) {
    strengths.push("유연하고 적응력이 뛰어나며 지혜로운 판단력을 가지고 있습니다")
  }

  // 기본 강점
  if (strengths.length === 0) {
    strengths.push("균형 잡힌 성격으로 다양한 상황에 잘 적응합니다")
    strengths.push("타인을 배려하는 마음이 깊어 인간관계가 원만합니다")
    strengths.push("꾸준한 노력으로 목표를 달성하는 능력이 있습니다")
  }

  return strengths.slice(0, 3)
}

// 주의사항 분석
function generateChallenges(elements: any): string[] {
  const challenges = []
  const total = Object.values(elements).reduce((sum: number, value: number) => sum + value, 0)

  // 오행 불균형 분석
  Object.entries(elements).forEach(([element, count]) => {
    const ratio = (count as number) / total
    if (ratio > 0.4) {
      const elementNames: { [key: string]: string } = {
        wood: "목",
        fire: "화",
        earth: "토",
        metal: "금",
        water: "수",
      }
      challenges.push(`${elementNames[element]} 기운이 과다하여 균형을 맞추는 것이 중요합니다`)
    }
    if (ratio === 0) {
      const elementNames: { [key: string]: string } = {
        wood: "목",
        fire: "화",
        earth: "토",
        metal: "금",
        water: "수",
      }
      challenges.push(`${elementNames[element]} 기운이 부족하여 보완이 필요합니다`)
    }
  })

  // 기본 주의사항
  if (challenges.length === 0) {
    challenges.push("때로는 우유부단함으로 인해 기회를 놓칠 수 있습니다")
    challenges.push("완벽주의 성향으로 스트레스를 받기 쉽습니다")
  }

  return challenges.slice(0, 2)
}

// 추천사항 생성
function generateRecommendations(elements: any, interests: string[]): string[] {
  const recommendations = []

  // 관심사별 맞춤 추천
  if (interests.includes("career")) {
    recommendations.push("체계적인 커리어 플랜을 세우고 꾸준히 실행해보세요")
  }
  if (interests.includes("love")) {
    recommendations.push("진정성 있는 소통을 통해 깊은 관계를 만들어가세요")
  }
  if (interests.includes("health")) {
    recommendations.push("규칙적인 생활 패턴과 적절한 운동으로 건강을 관리하세요")
  }

  // 기본 추천사항
  while (recommendations.length < 3) {
    const defaultRecommendations = [
      "꾸준한 자기계발을 통해 잠재력을 발휘하세요",
      "인내심을 기르고 장기적인 관점을 가지세요",
      "주변 사람들과의 소통을 늘려보세요",
    ]
    recommendations.push(defaultRecommendations[recommendations.length])
  }

  return recommendations.slice(0, 3)
}

export function generateCustomQuestions(interests: string[], sajuResult: SajuResult): CustomQuestion[] {
  const questionBank: { [key: string]: string[] } = {
    career: [
      "제가 어떤 직업 분야에서 성공할 가능성이 높을까요?",
      "이직을 고려 중인데, 언제가 좋은 타이밍일까요?",
      "승진이나 승급의 기회는 언제쯤 올까요?",
    ],
    love: [
      "제 이상형은 어떤 사주를 가진 사람일까요?",
      "연애운이 좋아지는 시기는 언제인가요?",
      "현재 연인과의 궁합은 어떤가요?",
    ],
    marriage: [
      "결혼 적령기는 언제쯤인가요?",
      "결혼 후 가정운은 어떨까요?",
      "배우자와 만날 가능성이 높은 장소나 상황은?",
    ],
    business: ["창업하기 좋은 시기는 언제인가요?", "어떤 업종이 제게 맞을까요?", "투자 운은 어떤가요?"],
    health: [
      "주의해야 할 건강 부분이 있나요?",
      "체질에 맞는 운동이나 식단이 있을까요?",
      "건강운이 좋지 않은 시기는 언제인가요?",
    ],
    study: ["시험 운은 어떤가요?", "공부에 집중하기 좋은 시기는 언제인가요?", "어떤 분야의 학습이 제게 유리할까요?"],
  }

  const questions: CustomQuestion[] = []
  let questionId = 1

  interests.forEach((interest) => {
    const categoryQuestions = questionBank[interest] || []
    categoryQuestions.slice(0, 1).forEach((question) => {
      questions.push({
        id: `q${questionId++}`,
        question,
        category: interest,
        priority: interests.indexOf(interest) + 1,
      })
    })
  })

  // 관심사가 3개 미만이면 일반적인 질문 추가
  while (questions.length < 3) {
    const generalQuestions = [
      "올해 전반적인 운세는 어떤가요?",
      "제가 가장 주의해야 할 점은 무엇인가요?",
      "행운의 색깔이나 숫자가 있나요?",
    ]

    questions.push({
      id: `q${questionId++}`,
      question: generalQuestions[questions.length],
      category: "general",
      priority: 10,
    })
  }

  return questions.slice(0, 3)
}
