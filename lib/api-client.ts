export async function fetchLunarDate(year: string, month: string, day: string) {
  try {
    const response = await fetch(`/api/lunar-date?year=${year}&month=${month}&day=${day}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error("Non-JSON response received:", text.substring(0, 200))
      throw new Error("Server returned non-JSON response")
    }

    const data = await response.json()

    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format")
    }

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

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response")
    }

    return await response.json()
  } catch (error) {
    console.error("Error saving saju data:", error)
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

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching saju interpretation:", error)
    throw error
  }
}

interface ApiResponse<T = any> {
  data?: T
  error?: string
  success: boolean
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(endpoint, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON")
      }

      const data = await response.json()

      return {
        data,
        success: true,
      }
    } catch (error) {
      console.error("API request failed:", error)
      return {
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false,
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient()
