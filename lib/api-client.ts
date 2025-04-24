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

export async function getSajuInterpretation(saju: any) {
  try {
    console.log("Requesting saju interpretation")

    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ saju }),
    })

    if (!response.ok) {
      throw new Error("Failed to get saju interpretation")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching saju interpretation:", error)
    throw error
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
