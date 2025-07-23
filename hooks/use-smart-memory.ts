"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface SmartMemory {
  id: string
  user_id: string
  content: string
  type: string
  keywords: string
  importance: number
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export function useSmartMemory(userId?: string) {
  const [memories, setMemories] = useState<SmartMemory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchMemories = async (search?: string) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const url = new URL("/api/smart-memory", window.location.origin)
      if (search) {
        url.searchParams.set("search", search)
      }

      const response = await fetch(url.toString(), {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch memories")
      }

      setMemories(data.memories || [])
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
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...updates }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update memory")
      }

      setMemories((prev) => prev.map((memory) => (memory.id === id ? data.memory : memory)))

      toast({
        title: "성공",
        description: "메모리가 업데이트되었습니다.",
      })

      return data.memory
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
      const response = await fetch(`/api/smart-memory?id=${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete memory")
      }

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
      const response = await fetch("/api/smart-memory?deleteAll=true", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
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
    refetch: () => fetchMemories(),
  }
}
