// API 클라이언트 함수들
export async function fetchLunarDate(year: string, month: string, day: string) {
  try {
    const response = await fetch(`/api/lunar-date?year=${year}&month=${month}&day=${day}`)
    if (!response.ok) {
      throw new Error("음력 날짜 조회 실패")
    }
    return await response.json()
  } catch (error) {
    console.error("음력 날짜 API 호출 오류:", error)
    throw error
  }
}

export async function saveSajuData(sajuData: any) {
  try {
    const response = await fetch("/api/save-saju-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sajuData),
    })

    if (!response.ok) {
      throw new Error("사주 데이터 저장 실패")
    }

    return await response.json()
  } catch (error) {
    console.error("사주 데이터 저장 오류:", error)
    throw error
  }
}

export async function fetchUserSajuData(userId: string) {
  try {
    const response = await fetch(`/api/user-saju-data?userId=${userId}`)
    if (!response.ok) {
      throw new Error("사용자 사주 데이터 조회 실패")
    }
    return await response.json()
  } catch (error) {
    console.error("사용자 사주 데이터 조회 오류:", error)
    throw error
  }
}

export async function getSajuInterpretation(sajuData: any) {
  try {
    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sajuData),
    })

    if (!response.ok) {
      throw new Error("사주 해석 조회 실패")
    }

    return await response.json()
  } catch (error) {
    console.error("사주 해석 API 호출 오류:", error)
    throw error
  }
}
