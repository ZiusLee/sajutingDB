import type { SmartContext, MemorySearchResult, MemoryStats } from "@/types/memory"

export class SmartMemoryClient {
  private baseUrl = "/api/smart-memory"

  async getAllMemories(options?: {
    limit?: number
    sortBy?: string
    sortOrder?: "asc" | "desc"
    type?: string
  }): Promise<SmartContext[]> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append("limit", options.limit.toString())
      if (options?.sortBy) params.append("sortBy", options.sortBy)
      if (options?.sortOrder) params.append("sortOrder", options.sortOrder)
      if (options?.type) params.append("type", options.type)

      const response = await fetch(`${this.baseUrl}?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch memories: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error("Failed to get all memories:", error)
      throw error
    }
  }

  async searchMemories(
    query: string,
    options?: {
      limit?: number
      types?: string[]
      minQuality?: number
    },
  ): Promise<MemorySearchResult[]> {
    try {
      const params = new URLSearchParams()
      params.append("search", query)
      if (options?.limit) params.append("limit", options.limit.toString())
      if (options?.types) params.append("types", options.types.join(","))
      if (options?.minQuality) params.append("minQuality", options.minQuality.toString())

      const response = await fetch(`${this.baseUrl}?${params}`)
      if (!response.ok) {
        throw new Error(`Failed to search memories: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error("Failed to search memories:", error)
      throw error
    }
  }

  async getMemoryStats(): Promise<MemoryStats> {
    try {
      const response = await fetch(`${this.baseUrl}?stats=true`)
      if (!response.ok) {
        throw new Error(`Failed to get memory stats: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data || {}
    } catch (error) {
      console.error("Failed to get memory stats:", error)
      throw error
    }
  }

  async saveMemory(
    content: string,
    type: string,
    options?: {
      importance?: number
      keywords?: string[]
    },
  ): Promise<boolean> {
    try {
      const typeImportanceMap = {
        identity: 0.8,
        goal: 0.7,
        relationship: 0.7,
        preference: 0.6,
        emotion: 0.5,
        interest: 0.5,
        situation: 0.4,
        schedule: 0.3,
      } as const

      const defaultImportance = typeImportanceMap[type as keyof typeof typeImportanceMap] || 0.5

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memory: {
            content,
            type,
            importance: options?.importance || defaultImportance, // 타입별 기본값 사용
            keywords: options?.keywords || [],
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save memory: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Failed to save memory:", error)
      throw error
    }
  }

  async updateMemory(id: string, updates: Partial<SmartContext>): Promise<SmartContext> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update memory: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error("Failed to update memory:", error)
      throw error
    }
  }

  async deleteMemory(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete memory: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Failed to delete memory:", error)
      throw error
    }
  }

  async deleteAllMemories(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?deleteAll=true`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete all memories: ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Failed to delete all memories:", error)
      throw error
    }
  }

  async deleteLowQualityMemories(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}?deleteLowQuality=true`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete low quality memories: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Failed to delete low quality memories:", error)
      throw error
    }
  }

  async provideFeedback(memoryId: string, helpful: boolean, feedbackType?: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${memoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          helpful,
          feedbackType,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to provide feedback: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error("Failed to provide feedback:", error)
      throw error
    }
  }

  async processConversation(userMessage: string, assistantResponse: string, conversationId?: string): Promise<any> {
    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage,
          assistantResponse,
          conversationId: conversationId || "unknown",
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to process conversation: ${response.statusText}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      console.error("Failed to process conversation:", error)
      throw error
    }
  }
}

export const smartMemoryClient = new SmartMemoryClient()
