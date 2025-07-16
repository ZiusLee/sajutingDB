// API client functions for making requests to the backend

export async function fetchLunarDate(year: string, month: string, day: string) {
  try {
    const response = await fetch(`/api/lunar-date?year=${year}&month=${month}&day=${day}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Response is not JSON")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching lunar date:", error)
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
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error saving saju data:", error)
    throw error
  }
}

export async function getUserProfiles(authUserId: string) {
  try {
    const response = await fetch(`/api/users?authUserId=${authUserId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching user profiles:", error)
    throw error
  }
}

export async function fetchSajuInterpretation(sajuData: any) {
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
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error getting saju interpretation:", error)
    throw error
  }
}
