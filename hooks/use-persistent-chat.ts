"use client"

import { useChat as useAIChat } from "ai/react"
import { useEffect, useRef, useState } from "react"
import { saveMessages, saveSingleMessage } from "@/lib/message-service"

interface UsePersistentChatProps {
  api: string
  id: string
  initialMessages: any[]
  body: any
  roomType: string
  onError?: (error: Error) => void
}

export function usePersistentChat({ api, id, initialMessages, body, roomType, onError }: UsePersistentChatProps) {
  const [lastSavedIndex, setLastSavedIndex] = useState(initialMessages.length)
  const savingRef = useRef(false)

  const chatHook = useAIChat({
    api,
    id,
    initialMessages,
    body,
    onError,
    onFinish: async (message) => {
      // Save the assistant's response immediately after it's complete
      if (!savingRef.current) {
        savingRef.current = true
        try {
          await saveSingleMessage(id, message, roomType, Date.now())
          console.log("Saved assistant message:", message.id)
        } catch (error) {
          console.error("Error saving assistant message:", error)
        } finally {
          savingRef.current = false
        }
      }
    },
  })

  // Save user messages when they're added
  useEffect(() => {
    const saveNewMessages = async () => {
      if (savingRef.current || chatHook.messages.length <= lastSavedIndex) {
        return
      }

      const newMessages = chatHook.messages.slice(lastSavedIndex)
      const userMessages = newMessages.filter((msg) => msg.role === "user")

      if (userMessages.length > 0) {
        savingRef.current = true
        try {
          await saveMessages(id, userMessages, roomType)
          setLastSavedIndex(chatHook.messages.length)
          console.log("Saved user messages:", userMessages.length)
        } catch (error) {
          console.error("Error saving user messages:", error)
        } finally {
          savingRef.current = false
        }
      }
    }

    saveNewMessages()
  }, [chatHook.messages.length, lastSavedIndex, id, roomType])

  // Update saved index when initial messages change
  useEffect(() => {
    setLastSavedIndex(initialMessages.length)
  }, [initialMessages.length])

  return chatHook
}
