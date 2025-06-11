export interface CompressedSaju {
  name: string
  birth: string // yyyy-mm-dd hh:mm
  gender: "male" | "female"
  // 사주팔자 전체 정보
  sajuPalja: {
    year: { stem: string; branch: string }
    month: { stem: string; branch: string }
    day: { stem: string; branch: string }
    hour: { stem: string; branch: string }
  }
  dayMaster: string // 일간
  elements: { [key: string]: number } // 오행 분포
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
  summary: string // 핵심 요약
  timeUnknown: boolean
}

export interface FullSajuType {
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  dayStem: string
  dayBranch: string
  hourStem: string
  hourBranch: string
  elements: { wood: number; fire: number; earth: number; metal: number; water: number }
  dayMaster: string
  yearAnimal: string
  gender: string
  name: string
  yearStemSibseong?: string
  monthStemSibseong?: string
  dayStemSibseong?: string
  hourStemSibseong?: string
  yearBranchSibseong?: string
  monthBranchSibseong?: string
  dayBranchSibseong?: string
  hourBranchSibseong?: string
}

// 일주별 성격 특성 매핑
const dayPillarCharacteristics: Record<string, string> = {
  갑자: "창의적이고 독립적. 리더십 강함",
  갑인: "창의적이며 성장 욕구 강함. 도전 정신 발달",
  갑진: "안정적이면서 창의적. 실용성과 이상 조화",
  갑오: "열정적이고 활동적. 표현력 뛰어남",
  갑신: "논리적이고 체계적. 완벽주의 성향",
  갑술: "신중하고 책임감 강함. 보수적 성향",
  을축: "섬세하고 감수성 풍부. 예술적 재능",
  을묘: "유연하고 적응력 강함. 소통 능력 발달",
  을사: "지적이고 분석적. 학문적 성향",
  을미: "온화하고 배려심 깊음. 조화 추구",
  을유: "정확하고 꼼꼼함. 전문성 발달",
  을해: "지혜롭고 직관적. 통찰력 뛰어남",
  병자: "열정적이고 카리스마 있음. 영향력 강함",
  병인: "활동적이고 진취적. 개척 정신",
  병진: "안정적이면서 열정적. 지속력 강함",
  병오: "밝고 긍정적. 사교성 뛰어남",
  병신: "체계적이고 계획적. 조직력 발달",
  병술: "신중하고 책임감 강함. 신뢰성 높음",
  정축: "섬세하고 예술적. 감정 표현 풍부",
  정묘: "온화하고 친화적. 인간관계 원만",
  정사: "지적이고 창의적. 아이디어 풍부",
  정미: "배려심 깊고 봉사 정신. 화합 추구",
  정유: "정확하고 신중함. 품질 중시",
  정해: "지혜롭고 포용력 있음. 깊이 있는 사고",
  무자: "실용적이고 현실적. 안정 추구",
  무인: "성장 지향적이고 발전적. 확장 욕구",
  무진: "안정적이고 지속적. 기반 구축 능력",
  무오: "활동적이고 적극적. 추진력 강함",
  무신: "체계적이고 효율적. 관리 능력 발달",
  무술: "신중하고 보수적. 전통 중시",
  기축: "섬세하고 배려심 깊음. 조화 추구",
  기묘: "유연하고 적응적. 변화 대응 능력",
  기사: "지적이고 분석적. 연구 성향",
  기미: "온화하고 포용적. 평화 추구",
  기유: "정확하고 완벽주의. 품질 중시",
  기해: "지혜롭고 직관적. 통찰력 발달",
  경자: "논리적이고 체계적. 원칙 중시",
  경인: "진취적이고 개척적. 도전 정신",
  경진: "안정적이고 지속적. 기반 중시",
  경오: "활동적이고 열정적. 추진력 강함",
  경신: "체계적이고 완벽주의. 전문성 발달",
  경술: "신중하고 보수적. 안정 추구",
  신축: "섬세하고 정교함. 기술적 재능",
  신묘: "유연하고 창의적. 예술적 감각",
  신사: "지적이고 분석적. 논리적 사고",
  신미: "온화하고 배려심 깊음. 서비스 정신",
  신유: "정확하고 전문적. 기술력 뛰어남",
  신해: "지혜롭고 직관적. 깊이 있는 판단",
  임자: "지혜롭고 적응적. 유연한 사고",
  임인: "지혜롭고 유연함. 성장 지향적",
  임진: "안정적이고 지속적. 깊이 있는 사고",
  임오: "활동적이고 열정적. 표현력 뛰어남",
  임신: "체계적이고 논리적. 분석력 발달",
  임술: "신중하고 깊이 있음. 통찰력 강함",
  계축: "섬세하고 감수성 풍부. 예술적 재능",
  계묘: "유연하고 적응적. 소통 능력 발달",
  계사: "지적이고 창의적. 아이디어 풍부",
  계미: "온화하고 포용적. 화합 추구",
  계유: "정확하고 꼼꼼함. 완성도 높음",
  계해: "지혜롭고 직관적. 깊이 있는 통찰",
}

// 오행 강약 분석
function analyzeElements(elements: {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}): string {
  const total = Object.values(elements).reduce((sum, val) => sum + val, 0)
  const strongest = Object.entries(elements).reduce((max, [key, val]) => (val > max.val ? { key, val } : max), {
    key: "",
    val: 0,
  })
  const weakest = Object.entries(elements).reduce((min, [key, val]) => (val < min.val ? { key, val } : min), {
    key: "",
    val: 8,
  })

  const elementNames: Record<string, string> = {
    wood: "목",
    fire: "화",
    earth: "토",
    metal: "금",
    water: "수",
  }

  let analysis = `${elementNames[strongest.key]}기 강함`
  if (weakest.val === 0) {
    analysis += `, ${elementNames[weakest.key]} 없음`
  } else if (weakest.val <= 1) {
    analysis += `, ${elementNames[weakest.key]} 약함`
  }

  return analysis
}

// 십성 구조 분석
function analyzeSibseong(sibseong: {
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  dayStem: string
  dayBranch: string
  hourStem: string
  hourBranch: string
}): string {
  const { yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch } = sibseong

  // 주요 십성 패턴 분석
  const sibseongList = [yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch].filter(
    (s) => s && s !== "",
  )
  const sibseongCount: Record<string, number> = {}

  sibseongList.forEach((s) => {
    sibseongCount[s] = (sibseongCount[s] || 0) + 1
  })

  // 가장 많이 나타나는 십성
  const dominantSibseong = Object.entries(sibseongCount).reduce(
    (max, [key, val]) => (val > max.val ? { key, val } : max),
    { key: "", val: 0 },
  )

  if (dominantSibseong.val >= 2) {
    return `${dominantSibseong.key} 구조`
  }

  // 특별한 조합 패턴
  if (sibseongList.includes("정인") && sibseongList.includes("편인")) {
    return "인성 발달"
  }
  if (sibseongList.includes("정관") && sibseongList.includes("편관")) {
    return "관성 구조"
  }
  if (sibseongList.includes("정재") && sibseongList.includes("편재")) {
    return "재성 구조"
  }
  if (sibseongList.includes("식신") && sibseongList.includes("상관")) {
    return "식상 발달"
  }

  return `${yearStem}-${monthStem} 구조`
}

export function compressSaju(
  saju: FullSajuType,
  birthYear?: string,
  birthMonth?: string,
  birthDay?: string,
  birthHour?: string,
  birthMinute?: string,
  timeUnknown?: boolean,
): CompressedSaju {
  const dayPillar = `${saju.dayStem}${saju.dayBranch}`
  const characteristic = dayPillarCharacteristics[dayPillar] || "독특한 성향"
  const elementAnalysis = analyzeElements(saju.elements)

  const sibseong = {
    yearStem: saju.yearStemSibseong || "",
    yearBranch: saju.yearBranchSibseong || "",
    monthStem: saju.monthStemSibseong || "",
    monthBranch: saju.monthBranchSibseong || "",
    dayStem: saju.dayStemSibseong || "",
    dayBranch: saju.dayBranchSibseong || "",
    hourStem: saju.hourStemSibseong || "",
    hourBranch: saju.hourBranchSibseong || "",
  }

  const sibseongAnalysis = analyzeSibseong(sibseong)

  // 생년월일시 포맷팅 (시간 정보 포함) - 더 정확한 처리
  let birth = ""
  if (birthYear && birthMonth && birthDay) {
    birth = `${birthYear}-${birthMonth.padStart(2, "0")}-${birthDay.padStart(2, "0")}`
    if (!timeUnknown && birthHour && birthMinute) {
      birth += ` ${birthHour.padStart(2, "0")}:${birthMinute.padStart(2, "0")}`
    } else if (timeUnknown) {
      birth += " (시간미상)"
    }
  }

  const summary = `${dayPillar} 일주. ${characteristic}. ${elementAnalysis}. ${sibseongAnalysis}.`

  return {
    name: saju.name || "이름없음",
    birth,
    gender: saju.gender === "male" || saju.gender === "female" ? saju.gender : "male",
    sajuPalja: {
      year: { stem: saju.yearStem || "", branch: saju.yearBranch || "" },
      month: { stem: saju.monthStem || "", branch: saju.monthBranch || "" },
      day: { stem: saju.dayStem || "", branch: saju.dayBranch || "" },
      hour: { stem: saju.hourStem || "", branch: saju.hourBranch || "" },
    },
    dayMaster: saju.dayMaster || "",
    elements: {
      목: saju.elements?.wood || 0,
      화: saju.elements?.fire || 0,
      토: saju.elements?.earth || 0,
      금: saju.elements?.metal || 0,
      수: saju.elements?.water || 0,
    },
    sibseong,
    summary,
    timeUnknown: timeUnknown || false,
  }
}

export function formatCompressedSajuForGPT(mainPerson: CompressedSaju, partners: CompressedSaju[]): string {
  let prompt = `🔮 **정확한 사주 계산 결과 (시스템 계산 완료)**\n\n`

  prompt += `**대표 사주: ${mainPerson.name}**\n`
  prompt += `- 생년월일시: ${mainPerson.birth}\n`
  prompt += `- 성별: ${mainPerson.gender === "male" ? "남성" : "여성"}\n`
  prompt += `- 사주팔자: ${mainPerson.sajuPalja.year.stem}${mainPerson.sajuPalja.year.branch}년 ${mainPerson.sajuPalja.month.stem}${mainPerson.sajuPalja.month.branch}월 ${mainPerson.sajuPalja.day.stem}${mainPerson.sajuPalja.day.branch}일 ${mainPerson.sajuPalja.hour.stem}${mainPerson.sajuPalja.hour.branch}시\n`
  prompt += `- 일간: ${mainPerson.dayMaster}\n`
  prompt += `- 십성: 년간(${mainPerson.sibseong.yearStem}) 년지(${mainPerson.sibseong.yearBranch}) 월간(${mainPerson.sibseong.monthStem}) 월지(${mainPerson.sibseong.monthBranch}) 일간(${mainPerson.sibseong.dayStem}) 일지(${mainPerson.sibseong.dayBranch}) 시간(${mainPerson.sibseong.hourStem}) 시지(${mainPerson.sibseong.hourBranch})\n`
  prompt += `- 오행분포: 목${mainPerson.elements.목} 화${mainPerson.elements.화} 토${mainPerson.elements.토} 금${mainPerson.elements.금} 수${mainPerson.elements.수}\n`
  prompt += `- 특징: ${mainPerson.summary}\n\n`

  prompt += `**궁합 대상들:**\n`

  partners.forEach((partner, index) => {
    prompt += `${index + 1}. **${partner.name}**\n`
    prompt += `   - 생년월일시: ${partner.birth}\n`
    prompt += `   - 성별: ${partner.gender === "male" ? "남성" : "여성"}\n`
    prompt += `   - 사주팔자: ${partner.sajuPalja.year.stem}${partner.sajuPalja.year.branch}년 ${partner.sajuPalja.month.stem}${partner.sajuPalja.month.branch}월 ${partner.sajuPalja.day.stem}${partner.sajuPalja.day.branch}일 ${partner.sajuPalja.hour.stem}${partner.sajuPalja.hour.branch}시\n`
    prompt += `   - 일간: ${partner.dayMaster}\n`
    prompt += `   - 십성: 년간(${partner.sibseong.yearStem}) 년지(${partner.sibseong.yearBranch}) 월간(${partner.sibseong.monthStem}) 월지(${partner.sibseong.monthBranch}) 일간(${partner.sibseong.dayStem}) 일지(${partner.sibseong.dayBranch}) 시간(${partner.sibseong.hourStem}) 시지(${partner.sibseong.hourBranch})\n`
    prompt += `   - 오행분포: 목${partner.elements.목} 화${partner.elements.화} 토${partner.elements.토} 금${partner.elements.금} 수${partner.elements.수}\n`
    prompt += `   - 특징: ${partner.summary}\n\n`
  })

  return prompt
}
