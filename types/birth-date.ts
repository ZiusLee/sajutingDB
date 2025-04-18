export interface BirthDateInfo {
  solarYear: number
  solarMonth: number
  solarDay: number
  solarHour: number | null
  solarMinute: number | null
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
  timeUnknown: boolean
}
