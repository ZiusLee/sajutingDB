"use client"

export async function getAdditionalInterpretation(
  saju: any,
  name: string,
  gender: string,
  questionCategory: string,
  relationshipStatus: string,
) {
  try {
    console.log("Requesting additional interpretation")

    const response = await fetch("/api/saju-additional", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ saju, name, gender, questionCategory, relationshipStatus }),
    })

    if (!response.ok) {
      throw new Error("Failed to get additional interpretation")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching additional interpretation:", error)
    throw error
  }
}

export async function getCompatibilityAnalysis(userInfo: any, partnerInfo: any, relationshipStatus: string) {
  try {
    console.log("Requesting compatibility analysis")

    const response = await fetch("/api/saju-compatibility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userInfo, partnerInfo, relationshipStatus }),
    })

    if (!response.ok) {
      throw new Error("Failed to get compatibility analysis")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching compatibility analysis:", error)
    throw error
  }
}

// Function to fetch lunar date information
export async function fetchLunarDate(year: string, month: string, day: string) {
  try {
    console.log(`Fetching lunar date for ${year}-${month}-${day}`)
    const response = await fetch(`/api/lunar-date?year=${year}&month=${month}&day=${day}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch lunar date: ${response.statusText}`)
    }

    const lunarData = await response.json()
    console.log("Lunar data response:", lunarData)
    return lunarData
  } catch (error) {
    console.error("Error fetching lunar date:", error)
    throw error
  }
}

export async function getDetailedInterpretation(
  saju: any,
  name: string,
  gender: string,
  questionSet: string,
  relationshipStatus: string,
) {
  try {
    console.log("Requesting detailed interpretation")

    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ saju, name, gender, questionSet, relationshipStatus }),
    })

    if (!response.ok) {
      throw new Error("Failed to get detailed interpretation")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching detailed interpretation:", error)
    throw error
  }
}

// getSajuInterpretation 함수를 개선합니다

// 기존 함수를 찾아 다음과 같이 수정합니다:
export async function getSajuInterpretation(
  saju: any,
  name?: string,
  gender?: string,
  relationshipStatus?: string,
  questionSet?: string | null,
): Promise<any> {
  try {
    console.log("Requesting saju interpretation")
    // 타임아웃 설정 추가 (30초)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        saju,
        name,
        gender,
        relationshipStatus,
        questionSet,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 504) {
        throw new Error("사주 해석 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
      }
      throw new Error(`Failed to get saju interpretation: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching saju interpretation:", error)
    if (error.name === "AbortError") {
      throw new Error("사주 해석 요청 시간이 초과되었습니다.")
    }
    throw new Error("Failed to get saju interpretation")
  }
}

// 연애운 상세 분석을 위한 API 호출 함수 추가
export async function getLoveDetailedAnalysis(saju: any, name: string, gender: string, relationshipStatus: string) {
  try {
    console.log("Requesting love detailed analysis")

    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        saju,
        name,
        gender,
        questionSet: "love-detailed",
        relationshipStatus,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to get love detailed analysis")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching love detailed analysis:", error)
    throw error
  }
}
