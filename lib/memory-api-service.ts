import type { MemoryEntry, MemoryType, MemoryContent } from "./memory-types"

const API_BASE_URL = "/api/memories"

// Helper to get headers, including auth
// You'll need to implement how user_id or session_id is passed for authentication
// For example, user_id could come from an auth context, session_id from localStorage
function getAuthHeaders(userId?: string | null, sessionId?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (userId) {
    // This is a placeholder. Your actual auth mechanism (e.g., JWT token) should be used.
    // Or, if your API routes can access server-side session, this might not be needed.
    // For the provided API routes, they expect 'x-user-id'.
    headers["x-user-id"] = userId
  }
  // session_id is often passed in body or query params for anonymous users
  return headers
}

export async function createMemory(
  type: MemoryType,
  content: MemoryContent,
  tags?: string[],
  userId?: string | null,
  sessionId?: string, // sessionId is required if userId is null
): Promise<MemoryEntry | null> {
  if (!userId && !sessionId) {
    console.log("Cannot create memory: Either userId or sessionId must be provided")
    return null
  }

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: getAuthHeaders(userId),
      body: JSON.stringify({ type, content, tags, session_id: userId ? undefined : sessionId }),
    })

    if (!response.ok) {
      console.error(`Create memory API returned ${response.status}: ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating memory:", error)
    return null
  }
}

export async function getMemories(
  userId?: string | null,
  sessionId?: string | null,
  type?: MemoryType,
): Promise<MemoryEntry[]> {
  // If neither userId nor sessionId is provided, return empty array
  if (!userId && !sessionId) {
    console.log("No userId or sessionId provided, returning empty memories array")
    return []
  }

  try {
    const params = new URLSearchParams()
    if (sessionId && !userId) {
      params.append("session_id", sessionId)
    }
    if (type) {
      params.append("type", type)
    }

    const url = `${API_BASE_URL}${params.toString() ? `?${params.toString()}` : ""}`
    console.log("Fetching memories from:", url)

    const response = await fetch(url, {
      headers: getAuthHeaders(userId),
    })

    if (!response.ok) {
      console.error(`Memory API returned ${response.status}: ${response.statusText}`)

      // If it's a 404, the endpoint might not exist, return empty array
      if (response.status === 404) {
        console.log("Memory API endpoint not found, returning empty array")
        return []
      }

      // For other errors, try to get error details
      const errorText = await response.text().catch(() => "Unknown error")
      console.error("Memory API error details:", errorText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error in getMemories:", error)
    // Return empty array instead of throwing to prevent UI crashes
    return []
  }
}

export async function getMemoryById(id: string, userId?: string | null): Promise<MemoryEntry> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    headers: getAuthHeaders(userId),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to fetch memory" }))
    throw new Error(errorData.error || `HTTP error ${response.status}`)
  }
  return response.json()
}

export async function updateMemory(
  id: string,
  userId: string, // Assume updates require authentication
  payload: Partial<Pick<MemoryEntry, "type" | "content" | "tags">>,
): Promise<MemoryEntry> {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(userId),
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to update memory" }))
    throw new Error(errorData.error || `HTTP error ${response.status}`)
  }
  return response.json()
}

export async function deleteMemory(id: string, userId: string): Promise<boolean> {
  if (!userId) {
    console.log("Cannot delete memory: userId is required")
    return false
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(userId),
    })

    if (!response.ok) {
      console.error(`Delete memory API returned ${response.status}: ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting memory:", error)
    return false
  }
}

export async function migrateMemories(sessionId: string, newUserId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/migrate`, {
    method: "POST",
    headers: getAuthHeaders(newUserId), // Authenticate as the new user
    body: JSON.stringify({ session_id: sessionId }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to migrate memories" }))
    throw new Error(errorData.error || `HTTP error ${response.status}`)
  }
  return response.json()
}
