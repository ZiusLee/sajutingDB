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
    const lunarDate = await getLunarDate(year, month, day)

    if (!lunarDate) {
      console.warn("API failed, using local calculation")
      const localLunarDate = solarToLunar(Number.parseInt(year), Number.parseInt(month), Number.parseInt(day))

      return NextResponse.json({
        year: localLunarDate.year.toString(),
        month: localLunarDate.month.toString().padStart(2, "0"),
        day: localLunarDate.day.toString().padStart(2, "0"),
        isLeapMonth: localLunarDate.isLeapMonth,
      })
    }

    console.log("Lunar date result:", lunarDate)
    return NextResponse.json(lunarDate)
  } catch (error: any) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      {
        error: "Failed to calculate lunar date: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}
