"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"

interface Memory {
  id: string
  text: string
  createdAt: string
}

interface MemoryBankProps {
  userId?: string
  sessionId?: string
}

const MemoryBank: React.FC<MemoryBankProps> = ({ userId, sessionId }) => {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const loadMemories = useCallback(async () => {
    if (!userId && !sessionId) {
      console.log("메모리 뱅크: userId와 sessionId가 모두 없음")
      setMemories([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (userId) {
        params.append("userId", userId)
      } else if (sessionId) {
        params.append("sessionId", sessionId)
      }

      console.log("메모리 뱅크 로드 시도:", params.toString())

      const response = await fetch(`/api/memories?${params.toString()}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("메모리 API 응답 오류:", response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("메모리 뱅크 로드 성공:", data.count, "개 항목")

      setMemories(Array.isArray(data.memories) ? data.memories : [])
    } catch (error) {
      console.error("메모리 뱅크 로드 오류:", error)
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다")
      setMemories([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, sessionId])

  useEffect(() => {
    loadMemories()
  }, [loadMemories])

  return (
    <div>
      {isLoading && <p>Loading memories...</p>}
      {error && <p>Error: {error}</p>}
      {memories.length === 0 && !isLoading && !error && <p>No memories found.</p>}
      <ul>
        {memories.map((memory) => (
          <li key={memory.id}>
            {memory.text} - {memory.createdAt}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MemoryBank
