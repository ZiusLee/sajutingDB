export async function fetchLunarDate(year: string, month: string, day: string) {
  try {
    const response = await fetch("/api/lunar-date", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ year, month, day }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching lunar date:", error)
    throw error
  }
}

export async function getSajuInterpretation(sajuData: {
  name: string
  gender: string
  yearStem: string
  yearBranch: string
  monthStem: string
  monthBranch: string
  dayStem: string
  dayBranch: string
  hourStem: string
  hourBranch: string
  dayMaster: string
  elements: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }
}) {
  try {
    const response = await fetch("/api/saju-interpretation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sajuData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting saju interpretation:", error)
    throw error
  }
}

export async function saveUserData(userData: any) {
  try {
    const response = await fetch("/api/save-user-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error saving user data:", error)
    throw error
  }
}

export async function getCompatibilityAnalysis(userSaju: any, partnerSaju: any) {
  try {
    const response = await fetch("/api/compatibility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userSaju,
        partnerSaju,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting compatibility analysis:", error)
    throw error
  }
}
