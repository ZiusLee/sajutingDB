import { useState, useCallback, useEffect } from 'react'
import { smartMemoryClient } from '@/lib/smart-memory-client'
import { toast } from '@/hooks/use-toast'
import type { SmartContext, MemorySearchResult, MemoryStats } from '@/types/memory'

interface UseSmartMemoryReturn {
  memories: SmartContext[]
  searchResults: MemorySearchResult[]
  stats: MemoryStats | null
  loading: boolean
  error: string | null
  
  // Actions
  loadUserMemories: (options?: {
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    type?: string
  }) => Promise<void>
  
  searchMemories: (query: string, options?: {
    limit?: number
    types?: string[]
    minQuality?: number
  }) => Promise<void>
  
  loadStats: () => Promise<void>
  
  saveMemory: (content: string, type: string, options?: {
    importance?: number
    keywords?: string[]
  }) => Promise<boolean>
  
  updateMemory: (id: string, updates: Partial<SmartContext>) => Promise<void>
  
  deleteMemory: (id: string) => Promise<void>
  
  deleteAllMemories: () => Promise<void>
  
  deleteLowQualityMemories: () => Promise<{ success: boolean; deletedCount: number; message: string }>
  
  provideFeedback: (memoryId: string, helpful: boolean, feedbackType?: string) => Promise<void>
  
  processConversation: (
    userMessage: string,
    assistantResponse: string,
    conversationId?: string
  ) => Promise<any>
  
  updateMemoryQuality: (memoryId: string, newScore: number) => Promise<void>
}

export function useSmartMemory(): UseSmartMemoryReturn {
  const [memories, setMemories] = useState<SmartContext[]>([])
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([])
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((error: any, message: string) => {
    console.error(message, error)
    setError(error.message || message)
    toast({
      title: "오류",
      description: error.message || message,
      variant: "destructive",
    })
  }, [])

  const loadUserMemories = useCallback(async (options?: {
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    type?: string
  }) => {
    try {
      setLoading(true)
      setError(null)
      const data = await smartMemoryClient.getAllMemories(options)
      setMemories(data)
    } catch (error) {
      handleError(error, "메모리를 불러오는데 실패했습니다")
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const searchMemories = useCallback(async (query: string, options?: {
    limit?: number
    types?: string[]
    minQuality?: number
  }) => {
    try {
      setLoading(true)
      setError(null)
      const data = await smartMemoryClient.searchMemories(query, options)
      setSearchResults(data)
    } catch (error) {
      handleError(error, "메모리 검색��� 실패했습니다")
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const loadStats = useCallback(async () => {
    try {
      setError(null)
      const data = await smartMemoryClient.getMemoryStats()
      setStats(data)
    } catch (error) {
      handleError(error, "통계를 불러오는데 실패했습니다")
    }
  }, [handleError])

  const saveMemory = useCallback(async (content: string, type: string, options?: {
    importance?: number
    keywords?: string[]
  }): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      const success = await smartMemoryClient.saveMemory(content, type, options)
      if (success) {
        toast({
          title: "성공",
          description: "메모리가 저장되었습니다",
        })
        // Refresh memories
        await loadUserMemories()
        await loadStats()
      }
      return success
    } catch (error) {
      handleError(error, "메모리 저장에 실패했습니다")
      return false
    } finally {
      setLoading(false)
    }
  }, [handleError, loadUserMemories, loadStats])

  const updateMemory = useCallback(async (id: string, updates: Partial<SmartContext>) => {
    try {
      setLoading(true)
      setError(null)
      await smartMemoryClient.updateMemory(id, updates)
      toast({
        title: "성공",
        description: "메모리가 업데이트되었습니다",
      })
      // Refresh memories
      await loadUserMemories()
      await loadStats()
    } catch (error) {
      handleError(error, "메모리 업데이트에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }, [handleError, loadUserMemories, loadStats])

  const deleteMemory = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)
      await smartMemoryClient.deleteMemory(id)
      toast({
        title: "성공",
        description: "메모리가 삭제되었습니다",
      })
      // Remove from local state
      setMemories(prev => prev.filter(m => m.id !== id))
      setSearchResults(prev => prev.filter(m => m.id !== id))
      await loadStats()
    } catch (error) {
      handleError(error, "메모리 삭제에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }, [handleError, loadStats])

  const deleteAllMemories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      await smartMemoryClient.deleteAllMemories()
      toast({
        title: "성공",
        description: "모든 메모리가 삭제되었습니다",
      })
      setMemories([])
      setSearchResults([])
      await loadStats()
    } catch (error) {
      handleError(error, "메모리 삭제에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }, [handleError, loadStats])

  const deleteLowQualityMemories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await smartMemoryClient.deleteLowQualityMemories()
      toast({
        title: "정리 완료",
        description: result.message,
      })
      await loadUserMemories()
      await loadStats()
      return result
    } catch (error) {
      handleError(error, "저품질 메모리 삭제에 실패했습니다")
      return { success: false, deletedCount: 0, message: "삭제 실패" }
    } finally {
      setLoading(false)
    }
  }, [handleError, loadUserMemories, loadStats])

  const provideFeedback = useCallback(async (memoryId: string, helpful: boolean, feedbackType?: string) => {
    try {
      setError(null)
      await smartMemoryClient.provideFeedback(memoryId, helpful, feedbackType)
      
      // Update local state
      const updateMemoryScore = (memories: any[]) => 
        memories.map(memory => 
          memory.id === memoryId 
            ? { 
                ...memory, 
                quality_score: helpful 
                  ? Math.min(0.95, (memory.quality_score || 0.5) + 0.1)
                  : Math.max(0.1, (memory.quality_score || 0.5) - 0.15),
                user_feedback_score: helpful ? 1 : -1
              }
            : memory
        )

      setMemories(updateMemoryScore)
      setSearchResults(updateMemoryScore)
      
      toast({
        title: "피드백 완료",
        description: helpful ? "메모리 품질이 향상되었습니다" : "메모리 품질이 조정되었습니다",
      })
      
      await loadStats()
    } catch (error) {
      handleError(error, "피드백 처리에 실패했습니다")
    }
  }, [handleError, loadStats])

  const processConversation = useCallback(async (
    userMessage: string,
    assistantResponse: string,
    conversationId?: string
  ) => {
    try {
      setError(null)
      const result = await smartMemoryClient.processConversation(
        userMessage,
        assistantResponse,
        conversationId
      )
      
      if (result.savedMemories && result.savedMemories.length > 0) {
        toast({
          title: "메모리 저장됨",
          description: `${result.savedMemories.length}개의 새로운 정보가 기억되었습니다`,
        })
        await loadUserMemories()
        await loadStats()
      }
      
      return result
    } catch (error) {
      handleError(error, "대화 처리에 실패했습니다")
      return null
    }
  }, [handleError, loadUserMemories, loadStats])

  const updateMemoryQuality = useCallback(async (memoryId: string, newScore: number) => {
    try {
      setError(null)
      await smartMemoryClient.updateMemory(memoryId, { quality_score: newScore })
      
      // Update local state
      const updateScore = (memories: any[]) => 
        memories.map(memory => 
          memory.id === memoryId 
            ? { ...memory, quality_score: newScore }
            : memory
        )

      setMemories(updateScore)
      setSearchResults(updateScore)
      
      toast({
        title: "품질 점수 업데이트",
        description: `메모리 품질 점수가 ${newScore.toFixed(2)}로 변경되었습니다`,
      })
      
      await loadStats()
    } catch (error) {
      handleError(error, "품질 점수 업데이트에 실패했습니다")
    }
  }, [handleError, loadStats])

  return {
    memories,
    searchResults,
    stats,
    loading,
    error,
    loadUserMemories,
    searchMemories,
    loadStats,
    saveMemory,
    updateMemory,
    deleteMemory,
    deleteAllMemories,
    deleteLowQualityMemories,
    provideFeedback,
    processConversation,
    updateMemoryQuality,
  }
}
