// Client-safe version of smart memory service
// This can be used in browser environments

export class SmartMemoryClient {
  private requestTimeout = 30000 // 30초 타임아웃
  private maxRetries = 2
  
  // Generate embedding using server-side API
  async generateEmbedding(text: string): Promise<number[]> {
    return this.withRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)

      try {
        const response = await fetch("/api/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: text.slice(0, 8000) }), // 토큰 제한
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(`Embedding generation failed: ${error.error}`)
        }

        const data = await response.json()
        if (!data.embedding || !Array.isArray(data.embedding)) {
          throw new Error("Invalid embedding response format")
        }
        
        return data.embedding
      } finally {
        clearTimeout(timeoutId)
      }
    })
  }

  // Retry wrapper for network requests
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`Attempt ${attempt + 1} failed:`, error)
        
        if (attempt < this.maxRetries) {
          // 지수 백오프: 1초, 2초, 4초...
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError || new Error("Max retries exceeded")
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
    return this.withRetry(async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)

      try {
        // 입력 검증
        if (!query || query.trim().length === 0) {
          throw new Error("Query cannot be empty")
        }

        const params = new URLSearchParams({
          search: query.trim(),
          ...(options?.limit && { limit: options.limit.toString() }),
          ...(options?.types && options.types.length > 0 && { types: options.types.join(",") }),
        })

        console.log("🔍 클라이언트 검색 요청:", { query: query.trim(), options })
        
        const response = await fetch(`/api/smart-memory?${params}`, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }))
          console.error("🔍 검색 실패:", errorData)
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        
        // 응답 검증
        if (!result || typeof result !== 'object') {
          throw new Error("Invalid response format")
        }

        console.log("🔍 검색 결과:", { 
          success: true, 
          count: result.data?.length || 0,
          hasData: !!result.data 
        })
        
        return {
          data: result.data || [],
          error: null
        }
      } finally {
        clearTimeout(timeoutId)
      }
    })
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
