// API client functions for making requests to the backend

export async function fetchLunarDate(year: string, month: string, day: string) {
  const response = await fetch("/api/lunar-date", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ year, month, day }),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch lunar date")
  }

  return response.json()
}

export async function fetchSajuInterpretation(sajuData: any) {
  const response = await fetch("/api/saju-interpretation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sajuData),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch saju interpretation")
  }

  return response.json()
}

// Export with alternative name for compatibility
export const getSajuInterpretation = fetchSajuInterpretation

export async function saveSajuData(sajuData: any) {
  const response = await fetch("/api/save-saju-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sajuData),
  })

  if (!response.ok) {
    throw new Error("Failed to save saju data")
  }

  return response.json()
}

export async function fetchCompatibility(userData1: any, userData2: any) {
  const response = await fetch("/api/compatibility", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userData1, userData2 }),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch compatibility")
  }

  return response.json()
}
