import { solarToLunar } from "./lunar-calendar"

const API_KEY = "/zYdSp0WAxD407AEJ320go1rcigjn9oriOuIWFEJjkk6+yRSpXkCeA56CR9GuQQVTwVY7NqNQ02XFslNKWS7Lg=="
const ENCODED_API_KEY = encodeURIComponent(API_KEY)
const BASE_URL = "https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService"

// 환경 변수를 확인하여 로컬 계산 사용 여부 결정
const USE_LOCAL_CALCULATION = process.env.USE_LOCAL_LUNAR_CALCULATION === "true"

// Update the LunarDateResponse interface to include lunar stem and branch information
interface LunarDateResponse {
  year: string
  month: string
  day: string
  isLeapMonth: boolean
  monthStem?: string
  monthBranch?: string
}

// Update the getLunarDate function to extract lunSecha from the API response
export async function getLunarDate(
  solYear: string,
  solMonth: string,
  solDay: string,
): Promise<LunarDateResponse | null> {
  // 로컬 계산만 사용
  console.log("Using local lunar calculation")
  return fallbackLunarCalculation(solYear, solMonth, solDay)

  // 외부 API 호출 코드는 모두 제거
}

// Fallback function to calculate lunar date locally
function fallbackLunarCalculation(solYear: string, solMonth: string, solDay: string): LunarDateResponse {
  const year = Number.parseInt(solYear, 10)
  const month = Number.parseInt(solMonth, 10)
  const day = Number.parseInt(solDay, 10)

  // Use our local implementation
  const lunarDate = solarToLunar(year, month, day)

  return {
    year: lunarDate.year.toString(),
    month: lunarDate.month.toString().padStart(2, "0"),
    day: lunarDate.day.toString().padStart(2, "0"),
    isLeapMonth: lunarDate.isLeapMonth,
    monthStem: lunarDate.monthStem,
    monthBranch: lunarDate.monthBranch,
  }
}
