// 율리우스 일자 계산 함수
export function getSolarToJulianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  )
}

// 율리우스 일자에서 양력 날짜 계산
export function getJulianDayToSolar(julianDay: number): { year: number; month: number; day: number } {
  const a = julianDay + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)

  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const m = Math.floor((5 * e + 2) / 153)

  const day = e - Math.floor((153 * m + 2) / 5) + 1
  const month = m + 3 - 12 * Math.floor(m / 10)
  const year = 100 * b + d - 4800 + Math.floor(m / 10)

  return { year, month, day }
}

// 음력 데이터 (1900-2050)
const LUNAR_DATA = [
  0x4bd8,
  0x4ae0,
  0xa570,
  0x54d5,
  0xd260,
  0xd950,
  0x5554,
  0x56af,
  0x96c0,
  0xd4a0, // 1900-1909
  0xd0b0,
  0x55b0,
  0x4ba0,
  0xa5b0,
  0x52da,
  0xa954,
  0x6d49,
  0x6aa6,
  0x56a0,
  0xaad5, // 1910-1919
  0x4b60,
  0xa4e0,
  0xd260,
  0xea65,
  0xd530,
  0x5aa0,
  0x76a3,
  0x96d0,
  0x4afb,
  0x4ad0, // 1920-1929
  0xa4d0,
  0xd0b6,
  0xd25f,
  0xd520,
  0xdd45,
  0x5b52,
  0x56a0,
  0xa6d0,
  0x55d4,
  0x52d0, // 1930-1939
  0xa9b8,
  0xa950,
  0xb4a0,
  0xb6a6,
  0xad50,
  0x55a0,
  0xaba4,
  0xa5b0,
  0x52b0,
  0xb273, // 1940-1949
  0x6930,
  0x7337,
  0x6aa0,
  0xad50,
  0x4b55,
  0x4b6f,
  0xa570,
  0x54e4,
  0xd260,
  0xe968, // 1950-1959
  0xd520,
  0xdaa0,
  0x6aa6,
  0x56df,
  0x4ae0,
  0xa9d4,
  0xa4d0,
  0xd150,
  0xf252,
  0xd520, // 1960-1969
  0xd6a0,
  0xada2,
  0x95b0,
  0x4977,
  0x497f,
  0xa4b0,
  0xb4b5,
  0x6a50,
  0x6d40,
  0xab54, // 1970-1979
  0x2b6f,
  0x9570,
  0x52f2,
  0xd2b0,
  0xd950,
  0x6566,
  0xd4a0,
  0xda50,
  0x5aa8,
  0x56a0, // 1980-1989
  0xaad8,
  0x25d0,
  0x92d0,
  0xd2b0,
  0xa950,
  0xb557,
  0x6ca0,
  0xb550,
  0x5355,
  0x4daa, // 1990-1999
  0xa5b0,
  0x52b0,
  0xa9a8,
  0xe950,
  0x6aa0,
  0xaea6,
  0xab50,
  0x4b60,
  0xaae4,
  0xa570, // 2000-2009
  0x5260,
  0xf263,
  0xd950,
  0x5b57,
  0x56a0,
  0x96d0,
  0x4dd5,
  0x4ad0,
  0xa4d0,
  0xd4d4, // 2010-2019
  0xd250,
  0xd558,
  0xb540,
  0xb6a0,
  0x95a6,
  0x95bf,
  0x49b0,
  0xa974,
  0xa4b0,
  0xb27a, // 2020-2029
  0x6a50,
  0x6d40,
  0xaf46,
  0xab60,
  0x9570,
  0x4af5,
  0x4970,
  0x64b0,
  0x74a3,
  0xea50, // 2030-2039
  0x6b58,
  0x5ac0,
  0xab60,
  0x96d5,
  0x92e0,
  0xc960,
  0xd954,
  0xd4a0,
  0xda50,
  0x7552, // 2040-2049
  0x56a0,
  0xabb7,
  0x25d0,
  0x92d0,
  0xcab5, // 2050-2054
]

// 음력 1900년 1월 1일의 율리우스 일자
const LUNAR_EPOCH = 2415021

// 양력 날짜를 음력으로 변환
export function solarToLunar(
  year: number,
  month: number,
  day: number,
): {
  year: number
  month: number
  day: number
  isLeapMonth: boolean
} {
  // 유효한 날짜 범위 확인 (1900-2050)
  if (year < 1900 || year > 2050) {
    throw new Error("Year must be between 1900 and 2050")
  }

  // 양력 날짜의 율리우스 일자 계산
  const julianDay = getSolarToJulianDay(year, month, day)

  // 음력 1900년 1월 1일부터의 일수 계산
  let dayOffset = julianDay - LUNAR_EPOCH + 1

  // 음력 날짜 계산
  let lunarYear = 1900
  let lunarMonth = 1
  let lunarDay = 1
  let isLeapMonth = false

  // 해당 연도 찾기
  while (dayOffset > 0) {
    // 해당 연도의 총 일수 계산
    const yearDays = getLunarYearDays(lunarYear)

    if (dayOffset <= yearDays) {
      break
    }

    dayOffset -= yearDays
    lunarYear++
  }

  // 해당 월 찾기
  const monthInfo = getLunarMonthInfo(lunarYear)
  const leapMonth = monthInfo.leapMonth

  for (let i = 1; i <= 13; i++) {
    // 윤달이 있는 경우 처리
    let monthDays

    if (i === leapMonth + 1 && leapMonth > 0) {
      // 윤달
      monthDays = getLunarLeapMonthDays(lunarYear)
      isLeapMonth = true
    } else {
      // 평달
      let m = i
      if (leapMonth > 0 && i > leapMonth) {
        m = i - 1
      }
      monthDays = getLunarMonthDays(lunarYear, m)
      isLeapMonth = false
    }

    if (dayOffset <= monthDays) {
      lunarMonth = i
      lunarDay = dayOffset

      // 윤달 조정
      if (leapMonth > 0 && lunarMonth > leapMonth) {
        lunarMonth--
        if (lunarMonth === leapMonth) {
          isLeapMonth = true
        }
      }

      break
    }

    dayOffset -= monthDays
  }

  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    isLeapMonth,
  }
}

// 해당 음력 연도의 총 일수 계산
function getLunarYearDays(year: number): number {
  let totalDays = 0
  const monthInfo = getLunarMonthInfo(year)
  const leapMonth = monthInfo.leapMonth

  // 각 달의 일수 합산
  for (let i = 1; i <= 12; i++) {
    totalDays += getLunarMonthDays(year, i)
  }

  // 윤달이 있으면 윤달의 일수도 합산
  if (leapMonth > 0) {
    totalDays += getLunarLeapMonthDays(year)
  }

  return totalDays
}

// 해당 음력 연도의 윤달 정보 및 각 달의 일수 정보 계산
function getLunarMonthInfo(year: number): {
  leapMonth: number
  monthDays: number[]
} {
  const yearCode = LUNAR_DATA[year - 1900]
  const leapMonth = yearCode & 0xf // 하위 4비트가 윤달 정보
  const monthDays: number[] = []

  for (let i = 1; i <= 12; i++) {
    // 각 달이 29일인지 30일인지 확인
    monthDays[i] = (yearCode >> (i + 4)) & 0x1 ? 30 : 29
  }

  return { leapMonth, monthDays }
}

// 해당 음력 연도와 월의 일수 계산
function getLunarMonthDays(year: number, month: number): number {
  const yearCode = LUNAR_DATA[year - 1900]
  return (yearCode >> (month + 4)) & 0x1 ? 30 : 29
}

// 해당 음력 연도의 윤달 일수 계산
function getLunarLeapMonthDays(year: number): number {
  const yearCode = LUNAR_DATA[year - 1900]
  return (yearCode >> 16) & 0x1 ? 30 : 29
}
