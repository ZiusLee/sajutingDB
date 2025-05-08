export interface LunarDateInfo {
  year: string
  month: string
  day: string
  isLeapMonth: boolean
  monthStem: string
  monthBranch: string
}

export interface SajuElementsInfo {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

export interface SajuData {
  name?: string
  gender?: string
  relationshipStatus?: string
  year: number
  month: number
  day: number
  hour: number
  minute: number
  timeUnknown: boolean
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  dayStem: string
  dayBranch: string
  hourStem: string
  hourBranch: string
  elements: SajuElementsInfo
  interpretation?: string
  yearStemSibseong?: string
  monthStemSibseong?: string
  dayStemSibseong?: string
  hourStemSibseong?: string
  userId?: string
}

export interface SajuInterpretationResponse {
  interpretation?: string
  fallbackInterpretation?: string
  error?: string
}
