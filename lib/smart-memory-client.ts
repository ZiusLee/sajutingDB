// Client-safe version of smart memory service
// This can be used in browser environments

export class SmartMemoryClient {
  // Generate embedding using server-side API
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch("/api/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Embedding generation failed: ${error.error}`)
      }

      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error("Failed to generate embedding:", error)
      throw error
    }
  }

  // Search memories
  async searchMemories(
    userId: string,
    query: string,
    options?: {
      limit?: number
      types?: string[]
    }
  ) {
    try {
      const params = new URLSearchParams({
        search: query,
        ...(options?.limit && { limit: options.limit.toString() }),
        ...(options?.types && { types: options.types.join(",") }),
      })

      console.log("🔍 클라이언트 검색 요청:", { query, options })
      const response = await fetch(`/api/smart-memory?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error("🔍 검색 실패:", errorData)
        throw new Error("Failed to search memories")
      }

      const result = await response.json()
      console.log("🔍 검색 결과:", result)
      return result
    } catch (error) {
      console.error("Memory search failed:", error)
      throw error
    }
  }

  // Create or update memory
  async saveMemory(
    userId: string,
    memory: {
      type: string
      content: string
      importance?: number
      keywords?: string[]
    }
  ) {
    try {
      const response = await fetch("/api/smart-memory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          memory,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save memory")
      }

      return await response.json()
    } catch (error) {
      console.error("Memory save failed:", error)
      throw error
    }
  }

  // Delete memory
  async deleteMemory(userId: string, memoryId: string) {
    try {
      const response = await fetch(`/api/smart-memory?id=${memoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete memory")
      }

      return await response.json()
    } catch (error) {
      console.error("Memory deletion failed:", error)
      throw error
    }
  }

  // Get memory statistics
  async getMemoryStats(userId: string) {
    try {
      const response = await fetch(`/api/smart-memory?stats=true`)
      
      if (!response.ok) {
        throw new Error("Failed to get memory stats")
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to get memory stats:", error)
      throw error
    }
  }
}

export const smartMemoryClient = new SmartMemoryClient()
