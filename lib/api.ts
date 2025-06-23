import { solarToLunar } from "./lunar-calendar"

const API_KEY =
  process.env.KOREAN_ASTRONOMY_API_KEY ||
  "/zYdSp0WAxD407AEJ320go1rcigjn9oriOuIWFEJjkk6+yRSpXkCeA56CR9GuQQVTwVY7NqNQ02XFslNKWS7Lg=="
const ENCODED_API_KEY = encodeURIComponent(API_KEY)
const BASE_URL = "https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService"

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
  try {
    console.log(`Using local lunar calculation for ${solYear}-${solMonth}-${solDay}`)

    // 직접 로컬 계산 사용 (API 호출 제거)
    return fallbackLunarCalculation(solYear, solMonth, solDay)
  } catch (error) {
    console.error("Error in local lunar calculation:", error)
    return fallbackLunarCalculation(solYear, solMonth, solDay)
  }
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
  }
}
