"use client"

import { useChat as useAIChat } from "ai/react"

interface UsePersistentChatProps {
  api: string
  id: string
  initialMessages: any[]
  body: any
  roomType: string
  onError?: (error: Error) => void
}

export function usePersistentChat({ api, id, initialMessages, body, roomType, onError }: UsePersistentChatProps) {
  const chatHook = useAIChat({
    api,
    id,
    initialMessages,
    body,
    onError,
  })

  return chatHook
}
