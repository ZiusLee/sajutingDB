import type { Saju } from "@/lib/saju"
import SajuResultClient from "./saju-result-client"

interface SajuResultProps {
  saju: Saju
  timeUnknown?: boolean
  solarYear?: string
  solarMonth?: string
  solarDay?: string
  hour?: string
  minute?: string
  lunarYear?: string
  lunarMonth?: string
  lunarDay?: string
}

export default function SajuResult({
  saju,
  timeUnknown = false,
  solarYear = "",
  solarMonth = "",
  solarDay = "",
  hour = "",
  minute = "",
  lunarYear = "",
  lunarMonth = "",
  lunarDay = "",
}: SajuResultProps) {
  return (
    <SajuResultClient
      saju={saju}
      timeUnknown={timeUnknown}
      solarYear={solarYear}
      solarMonth={solarMonth}
      solarDay={solarDay}
      hour={hour}
      minute={minute}
      lunarYear={lunarYear}
      lunarMonth={lunarMonth}
      lunarDay={lunarDay}
    />
  )
}
