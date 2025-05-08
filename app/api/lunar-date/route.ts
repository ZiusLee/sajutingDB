import { type NextRequest, NextResponse } from "next/server"
import { getLunarDate } from "@/lib/api"
import { solarToLunar } from "@/lib/lunar-calendar"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const day = searchParams.get("day")

    if (!year || !month || !day) {
      console.error("Missing required parameters in API route")
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`Fetching lunar date for ${year}-${month}-${day}`)

    // First try to get lunar date from the external API
    const lunarDate = await getLunarDate(year, month, day)

    if (!lunarDate) {
      console.warn("External API failed, using local calculation")
      const localLunarDate = solarToLunar(Number.parseInt(year), Number.parseInt(month), Number.parseInt(day))

      return NextResponse.json({
        year: localLunarDate.year.toString(),
        month: localLunarDate.month.toString().padStart(2, "0"),
        day: localLunarDate.day.toString().padStart(2, "0"),
        isLeapMonth: localLunarDate.isLeapMonth,
        monthStem: localLunarDate.monthStem,
        monthBranch: localLunarDate.monthBranch,
      })
    }

    console.log("Lunar date result from API:", lunarDate)
    return NextResponse.json(lunarDate)
  } catch (error: any) {
    console.error("Error in API route:", error)

    // Fallback to local calculation if API fails
    try {
      console.warn("API error, falling back to local calculation")
      const year = request.nextUrl.searchParams.get("year") || ""
      const month = request.nextUrl.searchParams.get("month") || ""
      const day = request.nextUrl.searchParams.get("day") || ""

      const localLunarDate = solarToLunar(Number.parseInt(year), Number.parseInt(month), Number.parseInt(day))

      return NextResponse.json({
        year: localLunarDate.year.toString(),
        month: localLunarDate.month.toString().padStart(2, "0"),
        day: localLunarDate.day.toString().padStart(2, "0"),
        isLeapMonth: localLunarDate.isLeapMonth,
        monthStem: localLunarDate.monthStem,
        monthBranch: localLunarDate.monthBranch,
      })
    } catch (fallbackError) {
      console.error("Fallback calculation also failed:", fallbackError)
      return NextResponse.json(
        {
          error: "Failed to calculate lunar date: " + (error instanceof Error ? error.message : "Unknown error"),
        },
        { status: 500 },
      )
    }
  }
}
