export interface MemoryEntry {
  id: string
  user_id?: string
  session_id?: string
  type: string
  content: any
  summary?: string
  relevance_score?: number
  tags?: string[]
  timestamp: string
  created_at: string
  updated_at?: string
}

export async function getMemories(
  userId?: string | null,
  sessionId?: string | null,
  type?: string,
): Promise<MemoryEntry[]> {
  try {
    const params = new URLSearchParams()

    if (userId) {
      params.append("userId", userId)
    } else if (sessionId) {
      params.append("sessionId", sessionId)
    }

    if (type) {
      params.append("type", type)
    }

    console.log("Fetching memories with params:", params.toString())

    const response = await fetch(`/api/memories?${params.toString()}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Memory API error:", response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    // 응답이 배열인지 확인
    if (Array.isArray(data)) {
      return data
    } else if (data.memories && Array.isArray(data.memories)) {
      return data.memories
    } else {
      console.warn("Unexpected memory API response format:", data)
      return []
    }
  } catch (error) {
    console.error("Error fetching memories:", error)
    return []
  }
}

export async function createMemory(
  userId: string | null,
  sessionId: string | null,
  type: string,
  content: any,
  summary?: string,
  tags?: string[],
): Promise<MemoryEntry | null> {
  try {
    const response = await fetch("/api/memories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        sessionId,
        type,
        content,
        summary,
        tags,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Memory creation error:", response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating memory:", error)
    return null
  }
}

export async function deleteMemory(memoryId: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/memories/${memoryId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
    })

    return response.ok
  } catch (error) {
    console.error("Error deleting memory:", error)
    return false
  }
}
