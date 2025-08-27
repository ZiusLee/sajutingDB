// 사주 계산 결과 캐싱을 위한 유틸리티
interface CachedTodaySaju {
  date: string
  saju: any
  dateInfo: any
}

interface CachedDaeunInfo {
  key: string
  daeun: any
  timestamp: number
}

// 오늘의 사주 캐싱 (하루 단위)
export function getCachedTodaySaju(): CachedTodaySaju | null {
  if (typeof window === "undefined") return null

  try {
    const cached = localStorage.getItem("today_saju_cache")
    if (!cached) return null

    const data = JSON.parse(cached)
    const today = new Date().toDateString()

    if (data.date === today) {
      return data
    } else {
      // 날짜가 다르면 캐시 삭제
      localStorage.removeItem("today_saju_cache")
      return null
    }
  } catch (error) {
    console.error("Error reading today saju cache:", error)
    return null
  }
}

export function setCachedTodaySaju(saju: any, dateInfo: any): void {
  if (typeof window === "undefined") return

  try {
    const cacheData: CachedTodaySaju = {
      date: new Date().toDateString(),
      saju,
      dateInfo,
    }
    localStorage.setItem("today_saju_cache", JSON.stringify(cacheData))
  } catch (error) {
    console.error("Error caching today saju:", error)
  }
}

// 대운 정보 캐싱 (사주별로 캐싱, 1시간 유효)
export function getCachedDaeunInfo(sajuKey: string): any | null {
  if (typeof window === "undefined") return null

  try {
    const cached = localStorage.getItem(`daeun_cache_${sajuKey}`)
    if (!cached) return null

    const data: CachedDaeunInfo = JSON.parse(cached)
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    if (now - data.timestamp < oneHour) {
      return data.daeun
    } else {
      // 1시간 지나면 캐시 삭제
      localStorage.removeItem(`daeun_cache_${sajuKey}`)
      return null
    }
  } catch (error) {
    console.error("Error reading daeun cache:", error)
    return null
  }
}

export function setCachedDaeunInfo(sajuKey: string, daeun: any): void {
  if (typeof window === "undefined") return

  try {
    const cacheData: CachedDaeunInfo = {
      key: sajuKey,
      daeun,
      timestamp: Date.now(),
    }
    localStorage.setItem(`daeun_cache_${sajuKey}`, JSON.stringify(cacheData))
  } catch (error) {
    console.error("Error caching daeun info:", error)
  }
}

// 사주 키 생성 (캐싱용)
export function generateSajuKey(saju: any, birthInfo: any): string {
  if (!saju || !birthInfo) return ""

  const hour = birthInfo.birthHour || birthInfo.solarHour || 12
  const minute = birthInfo.birthMinute || birthInfo.solarMinute || 0

  return `${birthInfo.solarYear}_${birthInfo.solarMonth}_${birthInfo.solarDay}_${hour}_${minute}`
}
