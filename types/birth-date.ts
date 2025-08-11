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

export interface BirthInfo {
  id?: string
  user_id: string
  solar_year: number
  solar_month: number
  solar_day: number
  solar_hour: number | null
  solar_minute: number | null
  lunar_year: number
  lunar_month: number
  lunar_day: number
  is_leap_month: boolean
  time_unknown: boolean
}
