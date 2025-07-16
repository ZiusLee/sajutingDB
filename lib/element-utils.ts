// 오행 관련 유틸리티 함수

// 오행 타입 정의
export type Element = "wood" | "fire" | "earth" | "metal" | "water"

// 오행 이모지 매핑
export const elementEmojis: Record<Element, string> = {
  wood: "🌳", // 나무(목/木)
  fire: "🔥", // 불(화/火)
  earth: "🌍", // 땅(토/土)
  metal: "🪙", // 금속(금/金)
  water: "💧", // 물(수/水)
}

// 오행 한글 이름 매핑
export const elementNames: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
}

// 오행 색상 매핑 (Tailwind 클래스)
export const elementColors: Record<Element, string> = {
  wood: "bg-green-500",
  fire: "bg-red-500",
  earth: "bg-yellow-600",
  metal: "bg-gray-400",
  water: "bg-blue-500",
}

// 오행 텍스트 색상 매�� (Tailwind 클래스)
export const elementTextColors: Record<Element, string> = {
  wood: "text-green-500",
  fire: "text-red-500",
  earth: "text-yellow-600",
  metal: "text-gray-400",
  water: "text-blue-500",
}

// 천간(Stem)에 해당하는 오행 매핑
export const stemToElement: Record<string, Element> = {
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

// 지지(Branch)에 해당하는 오행 매핑
export const branchToElement: Record<string, Element> = {
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

// 사주 문자열에서 오행 카운트 계산
export function calculateElementsFromSaju(
  yearStem: string,
  yearBranch: string,
  monthStem: string,
  monthBranch: string,
  dayStem: string,
  dayBranch: string,
  hourStem: string,
  hourBranch: string,
): Record<Element, number> {
  const elements: Record<Element, number> = {
    wood: 0,
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
  }

  // 천간(Stem)의 오행 계산
  const stems = [yearStem, monthStem, dayStem, hourStem]
  stems.forEach((stem) => {
    const element = stemToElement[stem]
    if (element) {
      elements[element]++
    }
  })

  // 지지(Branch)의 오행 계산
  const branches = [yearBranch, monthBranch, dayBranch, hourBranch]
  branches.forEach((branch) => {
    const element = branchToElement[branch]
    if (element) {
      elements[element]++
    }
  })

  return elements
}

// 오행 배열을 생성 (이모지 표시용)
export function generateElementArray(elements: Record<Element, number>): Element[] {
  const result: Element[] = []

  Object.entries(elements).forEach(([element, count]) => {
    for (let i = 0; i < count; i++) {
      result.push(element as Element)
    }
  })

  return result
}

// 오행 슬롯 생성 (빈 슬롯 포함)
export function generateElementSlots(elements: Record<Element, number>, totalSlots = 12): (Element | null)[] {
  const elementArray = generateElementArray(elements)
  const result: (Element | null)[] = [...elementArray]

  // 빈 슬롯 추가
  while (result.length < totalSlots) {
    result.push(null)
  }

  return result.slice(0, totalSlots)
}
