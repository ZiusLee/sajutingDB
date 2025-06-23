import { XMLParser } from "fast-xml-parser"
import { solarToLunar } from "./lunar-calendar"

const API_KEY = "/zYdSp0WAxD407AEJ320go1rcigjn9oriOuIWFEJjkk6+yRSpXkCeA56CR9GuQQVTwVY7NqNQ02XFslNKWS7Lg=="
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
    const url = `${BASE_URL}/getLunCalInfo?serviceKey=${ENCODED_API_KEY}&solYear=${solYear}&solMonth=${solMonth}&solDay=${solDay}`

    console.log("Fetching lunar date from:", url)
    const response = await fetch(url, { next: { revalidate: 86400 } }) // Cache for 1 day

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`)
      throw new Error(`API request failed with status ${response.status}`)
    }

    const xmlData = await response.text()
    console.log("API response:", xmlData.substring(0, 500)) // Log first 500 chars for debugging

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    })
    const result = parser.parse(xmlData)

    // Check for error response
    if (result.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg === "SERVICE ERROR") {
      console.error("API service error:", result.OpenAPI_ServiceResponse.cmmMsgHeader)
      console.log("Falling back to local calculation...")

      // Fallback to our own calculation
      return fallbackLunarCalculation(solYear, solMonth, solDay)
    }

    // Check if we have items in the response
    if (result.response?.body?.items?.item) {
      const item = result.response.body.items.item
      console.log("Parsed lunar data:", item)

      // Extract lunar stem and branch information if available (lunSecha field)
      let monthStem, monthBranch
      if (item.lunSecha) {
        // lunSecha format is typically "STEM_BRANCH" in Korean, e.g., "계축"
        const lunSecha = item.lunSecha
        // Extract first character as stem and second as branch
        if (lunSecha.length >= 2) {
          monthStem = lunSecha.charAt(0)
          monthBranch = lunSecha.charAt(1)
        }
      }

      return {
        year: item.lunYear,
        month: item.lunMonth,
        day: item.lunDay,
        isLeapMonth: item.lunLeapmonth === "1",
        monthStem,
        monthBranch,
      }
    } else if (result.OpenAPI_ServiceResponse?.body?.items?.item) {
      // Alternative response format
      const item = result.OpenAPI_ServiceResponse.body.items.item
      console.log("Parsed lunar data (alt format):", item)

      // Extract lunar stem and branch information if available
      let monthStem, monthBranch
      if (item.lunSecha) {
        const lunSecha = item.lunSecha
        if (lunSecha.length >= 2) {
          monthStem = lunSecha.charAt(0)
          monthBranch = lunSecha.charAt(1)
        }
      }

      return {
        year: item.lunYear,
        month: item.lunMonth,
        day: item.lunDay,
        isLeapMonth: item.lunLeapmonth === "1",
        monthStem,
        monthBranch,
      }
    } else {
      console.error("Unexpected API response structure:", JSON.stringify(result, null, 2))
      console.log("Falling back to local calculation...")

      // Fallback to our own calculation
      return fallbackLunarCalculation(solYear, solMonth, solDay)
    }
  } catch (error) {
    console.error("Error fetching lunar date:", error)
    console.log("Falling back to local calculation...")

    // Fallback to our own calculation
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
