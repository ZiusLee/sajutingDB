"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { smartMemoryClient } from "@/lib/smart-memory-client"

interface SmartMemory {
  id: string
  user_id: string
  content: string
  type: string
  keywords: string[]
  importance_score: number
  reference_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
  first_mentioned?: string
  last_referenced?: string
  source_context?: string
}

export function useSmartMemory(userId?: string) {
  const [memories, setMemories] = useState<SmartMemory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchMemories = async (search?: string, options?: { limit?: number; types?: string[] }) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      if (search) {
        // V2 검색 사용
        const result = await smartMemoryClient.searchMemories(userId, search, {
          limit: options?.limit || 20,
          types: options?.types,
        })
        setMemories(result.data || [])
      } else {
        // 전체 메모리 조회
        const url = new URL("/api/smart-memory", window.location.origin)
        url.searchParams.set("userId", userId)
        if (options?.limit) {
          url.searchParams.set("limit", options.limit.toString())
        }

        const response = await fetch(url.toString())
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch memories")
        }

        setMemories(data.data || [])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      toast({
        title: "오류",
        description: "메모리를 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateMemory = async (id: string, updates: Partial<SmartMemory>) => {
    try {
      const response = await fetch("/api/smart-memory", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updates }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update memory")
      }

      setMemories((prev) => prev.map((memory) => (memory.id === id ? data.data : memory)))

      toast({
        title: "성공",
        description: "메모리가 업데이트되었습니다.",
      })

      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      toast({
        title: "오류",
        description: "메모리 업데이트에 실패했습니다.",
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteMemory = async (id: string) => {
    try {
      await smartMemoryClient.deleteMemory(userId!, id)
      setMemories((prev) => prev.filter((memory) => memory.id !== id))

      toast({
        title: "성공",
        description: "메모리가 삭제되었습니다.",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      toast({
        title: "오류",
        description: "메모리 삭제에 실패했습니다.",
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteAllMemories = async () => {
    try {
      const response = await fetch(`/api/smart-memory?deleteAll=true&userId=${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete all memories")
      }

      setMemories([])

      toast({
        title: "성공",
        description: "모든 메모리가 삭제되었습니다.",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      toast({
        title: "오류",
        description: "메모리 삭제에 실패했습니다.",
        variant: "destructive",
      })
      throw err
    }
  }

  const togglePin = async (id: string, isPinned: boolean) => {
    await updateMemory(id, { is_pinned: isPinned })
  }

  // V2 features
  const saveMemory = async (memory: {
    type: string
    content: string
    importance?: number
    keywords?: string[]
  }) => {
    try {
      const result = await smartMemoryClient.saveMemory(userId!, memory)
      
      // 메모리 목록 새로고침
      await fetchMemories()
      
      toast({
        title: "성공",
        description: "메모리가 저장되었습니다.",
      })
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      toast({
        title: "오류",
        description: "메모리 저장에 실패했습니다.",
        variant: "destructive",
      })
      throw err
    }
  }

  const getMemoryStats = async () => {
    try {
      return await smartMemoryClient.getMemoryStats(userId!)
    } catch (err) {
      console.error("Failed to get memory stats:", err)
      return null
    }
  }

  // 검색 기능 개선
  const searchMemories = async (query: string, options?: { limit?: number; types?: string[] }) => {
    return fetchMemories(query, options)
  }

  useEffect(() => {
    if (userId) {
      fetchMemories()
    }
  }, [userId])

  return {
    memories,
    loading,
    error,
    fetchMemories,
    updateMemory,
    deleteMemory,
    deleteAllMemories,
    togglePin,
    saveMemory,
    searchMemories,
    getMemoryStats,
    refetch: () => fetchMemories(),
  }
}
