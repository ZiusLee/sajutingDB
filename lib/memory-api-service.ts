import type { MemoryEntry, MemoryType, MemoryContent } from "./memory-types"

const API_BASE_URL = "/api/memories"

// Helper to get headers, including auth
// You'll need to implement how user_id or session_id is passed for authentication
// For example, user_id could come from an auth context, session_id from localStorage
function getAuthHeaders(userId?: string | null, sessionId?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" }
  // Remove the x-user-id header as it's not being used in the API route
  return headers
}

export async function createMemory(
  type: MemoryType,
  content: MemoryContent,
  tags?: string[],
  userId?: string | null,
  sessionId?: string, // sessionId is required if userId is null
): Promise<MemoryEntry> {
  if (!userId && !sessionId) {
    throw new Error("Either userId or sessionId must be provided to create a memory.")
  }
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: getAuthHeaders(userId),
    body: JSON.stringify({ type, content, tags, session_id: userId ? undefined : sessionId }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create memory" }))
    throw new Error(errorData.error || `HTTP error ${response.status}`)
  }
  return response.json()
}

export async function getMemories(
  userId?: string | null,
  sessionId?: string | null,
  type?: MemoryType,
): Promise<MemoryEntry[]> {
  try {
    const params = new URLSearchParams()
    if (sessionId && !userId) {
      params.append("session_id", sessionId)
    }
    if (type) {
      params.append("type", type)
    }

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
      headers: getAuthHeaders(userId),
    })

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`)
      const errorData = await response.json().catch(() => ({ error: "Failed to fetch memories" }))
      throw new Error(errorData.error || `HTTP error ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error in getMemories:", error)
    throw error
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

export async function deleteMemory(id: string, userId: string): Promise<{ message: string }> {
  // Assume deletes require authentication
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(userId),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete memory" }))
    throw new Error(errorData.error || `HTTP error ${response.status}`)
  }
  return response.json()
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
