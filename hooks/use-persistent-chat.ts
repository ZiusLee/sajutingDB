"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "ai/react"

interface UsePersistentChatProps {
  api: string
  id: string
  initialMessages?: any[]
  body?: any
  onFinish?: (message: any) => void
  onError?: (error: any) => void
}

export function usePersistentChat({
  api,
  id,
  initialMessages = [],
  body = {},
  onFinish,
  onError,
}: UsePersistentChatProps) {
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [sessionStatus, setSessionStatus] = useState<{
    exists: boolean
    isStreaming: boolean
    messageCount: number
    lastActivity?: number
  } | null>(null)

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const statusCheckIntervalRef = useRef<NodeJS.Timeout>()

  // Use the standard useChat hook
  const chatHook = useChat({
    api,
    id,
    initialMessages,
    body,
    onFinish: (message) => {
      setIsReconnecting(false)
      onFinish?.(message)
    },
    onError: (error) => {
      console.error("Chat error:", error)
      setIsReconnecting(false)
      onError?.(error)
    },
  })

  // Check session status periodically
  const checkSessionStatus = async () => {
    try {
      const response = await fetch(`${api}?sessionId=${id}`)
      if (response.ok) {
        const status = await response.json()
        setSessionStatus(status)

        // If session is streaming but we're not connected, try to reconnect
        if (status.isStreaming && !chatHook.isLoading && !isReconnecting) {
          console.log("Detected ongoing stream, attempting to reconnect...")
          setIsReconnecting(true)
          // You might want to implement reconnection logic here
        }
      }
    } catch (error) {
      console.error("Error checking session status:", error)
    }
  }

  // Set up periodic status checking
  useEffect(() => {
    // Check immediately
    checkSessionStatus()

    // Then check every 5 seconds
    statusCheckIntervalRef.current = setInterval(checkSessionStatus, 5000)

    return () => {
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
      }
    }
  }, [id])

  // Handle page visibility changes to reconnect when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the page, check session status
        checkSessionStatus()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // Handle beforeunload to save state
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current chat state to localStorage for recovery
      if (chatHook.messages.length > 0) {
        localStorage.setItem(
          `chat-state-${id}`,
          JSON.stringify({
            messages: chatHook.messages,
            timestamp: Date.now(),
          }),
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [chatHook.messages, id])

  // Try to recover state on mount
  useEffect(() => {
    const savedState = localStorage.getItem(`chat-state-${id}`)
    if (savedState) {
      try {
        const { messages, timestamp } = JSON.parse(savedState)
        // Only recover if it's recent (within 1 hour)
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          // You might want to merge with initialMessages here
          console.log("Recovered chat state from localStorage")
        }
      } catch (error) {
        console.error("Error recovering chat state:", error)
      }
    }
  }, [id])

  // Cleanup
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current)
      }
    }
  }, [])

  return {
    ...chatHook,
    isReconnecting,
    sessionStatus,
    checkSessionStatus,
  }
}
