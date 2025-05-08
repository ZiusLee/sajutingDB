import SajuResultClient from "./saju-result-client"
import type { Saju } from "@/lib/saju"

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
  name?: string
  gender?: string
  model?: string
  relationshipStatus?: string
  location?: string
  sajuId?: string // 추가: sajuId 속성
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
  name = "",
  gender = "",
  model = "",
  relationshipStatus = "",
  location = "서울특별시",
  sajuId, // 추가: sajuId 속성
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
      name={name}
      gender={gender}
      model={model}
      relationshipStatus={relationshipStatus}
      location={location}
      sajuId={sajuId} // 추가: sajuId 속성 전달
    />
  )
}
