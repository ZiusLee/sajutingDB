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

export async function fetchLunarDate(year: string, month: string, day: string) {
  try {
    console.log("Requesting lunar date")

    const response = await fetch(`/api/lunar-date?year=${year}&month=${month}&day=${day}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get lunar date")
    }

    const data = await response.json()
    return data
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
    // Add model information to the UI
    if (data.model) {
      console.log(`Interpretation generated using ${data.model} model in ${data.responseTime || "unknown"} time`)
    }
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
