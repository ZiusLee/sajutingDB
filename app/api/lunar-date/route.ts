import { type NextRequest, NextResponse } from "next/server"
import { solarToLunar } from "@/lib/lunar-calendar"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const month = searchParams.get("month")
    const day = searchParams.get("day")

    if (!year || !month || !day) {
      return NextResponse.json({ error: "Missing required parameters: year, month, day" }, { status: 400 })
    }

    const yearNum = Number.parseInt(year, 10)
    const monthNum = Number.parseInt(month, 10)
    const dayNum = Number.parseInt(day, 10)

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 })
    }

    // Validate date ranges
    if (yearNum < 1900 || yearNum > 2100) {
      return NextResponse.json({ error: "Year must be between 1900 and 2100" }, { status: 400 })
    }

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12" }, { status: 400 })
    }

    if (dayNum < 1 || dayNum > 31) {
      return NextResponse.json({ error: "Day must be between 1 and 31" }, { status: 400 })
    }

    console.log(`Calculating lunar date for: ${year}-${month}-${day}`)

    // Calculate lunar date using existing solarToLunar function
    const lunarDate = solarToLunar(yearNum, monthNum, dayNum)

    console.log("Lunar calculation result:", lunarDate)

    const result = {
      year: lunarDate.year.toString(),
      month: lunarDate.month.toString().padStart(2, "0"),
      day: lunarDate.day.toString().padStart(2, "0"),
      isLeapMonth: lunarDate.isLeapMonth,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Error calculating lunar date:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, day } = body

    if (!year || !month || !day) {
      return NextResponse.json({ error: "Missing required parameters: year, month, day" }, { status: 400 })
    }

    const yearNum = Number.parseInt(year, 10)
    const monthNum = Number.parseInt(month, 10)
    const dayNum = Number.parseInt(day, 10)

    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
      return NextResponse.json({ error: "Invalid date parameters" }, { status: 400 })
    }

    // Validate date ranges
    if (yearNum < 1900 || yearNum > 2100) {
      return NextResponse.json({ error: "Year must be between 1900 and 2100" }, { status: 400 })
    }

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12" }, { status: 400 })
    }

    if (dayNum < 1 || dayNum > 31) {
      return NextResponse.json({ error: "Day must be between 1 and 31" }, { status: 400 })
    }

    console.log(`Calculating lunar date for: ${year}-${month}-${day}`)

    // Calculate lunar date using existing solarToLunar function
    const lunarDate = solarToLunar(yearNum, monthNum, dayNum)

    console.log("Lunar calculation result:", lunarDate)

    const result = {
      year: lunarDate.year.toString(),
      month: lunarDate.month.toString().padStart(2, "0"),
      day: lunarDate.day.toString().padStart(2, "0"),
      isLeapMonth: lunarDate.isLeapMonth,
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Error calculating lunar date:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
