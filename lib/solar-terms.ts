// 24절기 계산 함수
// 각 절기의 양력 날짜를 계산

// 절기 이름 (순서대로)
export const SOLAR_TERM_NAMES = [
  "소한",
  "대한",
  "입춘",
  "우수",
  "경칩",
  "춘분",
  "청명",
  "곡우",
  "입하",
  "소만",
  "망종",
  "하지",
  "소서",
  "대서",
  "입추",
  "처서",
  "백로",
  "추분",
  "한로",
  "상강",
  "입동",
  "소설",
  "대설",
  "동지",
]

// 각 절기의 황경 (태양의 위치, 도 단위)
const SOLAR_TERM_LONGITUDES = [
  285, 300, 315, 330, 345, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270,
]

// KASI API를 사용하여 절기 날짜를 가져오는 함수
async function getSolarTermDateFromKASI(year: number, termIndex: number): Promise<Date | null> {
  const KASI_API_KEY = process.env.KASI_API_KEY
  if (!KASI_API_KEY) {
    console.warn("KASI_API_KEY is not defined in environment variables")
    return null
  }

  const apiUrl = `https://apis.data.go.kr/B090041/openapi/service/EphemerisService/getDateInfo?solYear=${year}&serviceKey=${KASI_API_KEY}`

  try {
    const response = await fetch(apiUrl)
    if (!response.ok) {
      console.error(`KASI API request failed with status ${response.status}`)
      return null
    }

    const data = await response.json()
    // API 응답 구조에 따라 적절히 파싱
    // 예: data.response.body.items.item[termIndex].locdate
    // 실제 API 응답 구조를 확인하고 수정해야 함
    // const termDate = new Date(data.response.body.items.item[termIndex].locdate);
    // return termDate;
    return null // 임시로 null 반환
  } catch (error) {
    console.error("Error fetching solar term date from KASI API:", error)
    return null
  }
}

// 특정 연도의 절기 날짜 계산
export async function calculateSolarTerms(year: number): Promise<Record<string, Date>> {
  const terms: Record<string, Date> = {}
  const useLocalCalculation = process.env.USE_LOCAL_LUNAR_CALCULATION === "true"

  for (let i = 0; i < 24; i++) {
    let date: Date | null = null

    // If not using local calculation, try KASI API
    if (!useLocalCalculation) {
      try {
        date = await getSolarTermDateFromKASI(year, i)
      } catch (e) {
        console.error("KASI API 호출 실패, 로컬 계산으로 대체:", e)
      }
    }

    // If KASI API failed or we're using local calculation, use local calculation
    if (!date) {
      date = getSolarTermDateLocal(year, i)
    }

    terms[SOLAR_TERM_NAMES[i]] = date
  }

  return terms
}

// 특정 연도와 절기 인덱스에 대한 날짜 계산 (로컬)
function getSolarTermDateLocal(year: number, termIndex: number): Date {
  // More accurate calculation for solar term dates
  // These are the approximate Julian days for each solar term at J2000
  const termJulianDays = [
    19.6, 34.5, 49.4, 64.3, 79.3, 94.2, 109.1, 124.0, 139.0, 153.9, 168.8, 183.7, 198.6, 213.5, 228.5, 243.4, 258.3,
    273.2, 288.1, 303.0, 318.0, 332.9, 347.8, 362.7,
  ]

  // Calculate days since J2000 (January 1, 2000)
  const daysPerYear = 365.2422
  const yearsSinceJ2000 = year - 2000
  const daysSinceJ2000 = yearsSinceJ2000 * daysPerYear

  // Calculate the Julian day for this solar term
  const julianDay = daysSinceJ2000 + termJulianDays[termIndex]

  // Convert Julian day to date
  // J2000 (January 1, 2000) is Julian day 2451545
  const j2000 = new Date(2000, 0, 1)
  const date = new Date(j2000.getTime() + julianDay * 24 * 60 * 60 * 1000)

  return date
}

// 특정 날짜가 어떤 절기에 속하는지 확인
export function getSolarTermForDate(date: Date): string {
  const year = date.getFullYear()
  const terms = calculateSolarTerms(year)

  // 이전 연도의 동지 (마지막 절기) 확인
  const prevWinterSolstice = calculateSolarTerms(year - 1)["동지"]

  // 현재 날짜가 이전 연도의 동지 이후인지 확인
  if (date >= prevWinterSolstice) {
    // 각 절기 확인
    for (let i = 0; i < SOLAR_TERM_NAMES.length; i++) {
      const termName = SOLAR_TERM_NAMES[i]
      const termDate = terms[termName]

      // 다음 절기 확인
      const nextIndex = (i + 1) % SOLAR_TERM_NAMES.length
      const nextTermName = SOLAR_TERM_NAMES[nextIndex]
      const nextTermDate = nextIndex === 0 ? calculateSolarTerms(year + 1)["소한"] : terms[nextTermName]

      // 현재 날짜가 해당 절기와 다음 절기 사이에 있는지 확인
      if (date >= termDate && date < nextTermDate) {
        return termName
      }
    }
  }

  // 기본값 (오류 방지)
  return "알 수 없음"
}
