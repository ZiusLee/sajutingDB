"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface ChatSession {
  saju: any
  name: string
  gender: string
  interpretation: string
  roomType: string
  messages: any[]
  lastMessageTime: string
}

interface ChatContextType {
  activeChatSession: ChatSession | null
  setActiveChatSession: (session: ChatSession | null) => void
  saveChatSession: (key: string, session: ChatSession) => void
  getChatSession: (key: string) => ChatSession | null
  clearChatSession: (key: string) => void
  getAllChatSessions: () => Record<string, ChatSession>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({})

  // Load chat sessions from localStorage on mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem("saju_chat_sessions")
      if (savedSessions) {
        setChatSessions(JSON.parse(savedSessions))
      }
    } catch (error) {
      console.error("Error loading chat sessions:", error)
    }
  }, [])

  // Save chat session
  const saveChatSession = (key: string, session: ChatSession) => {
    setChatSessions((prev) => {
      const updated = { ...prev, [key]: session }
      // Save to localStorage
      try {
        localStorage.setItem("saju_chat_sessions", JSON.stringify(updated))
      } catch (error) {
        console.error("Error saving chat sessions:", error)
      }
      return updated
    })
  }

  // Get chat session
  const getChatSession = (key: string): ChatSession | null => {
    return chatSessions[key] || null
  }

  // Clear chat session
  const clearChatSession = (key: string) => {
    setChatSessions((prev) => {
      const updated = { ...prev }
      delete updated[key]
      // Save to localStorage
      try {
        localStorage.setItem("saju_chat_sessions", JSON.stringify(updated))
      } catch (error) {
        console.error("Error saving chat sessions:", error)
      }
      return updated
    })
  }

  // Get all chat sessions
  const getAllChatSessions = (): Record<string, ChatSession> => {
    return chatSessions
  }

  return (
    <ChatContext.Provider
      value={{
        activeChatSession,
        setActiveChatSession,
        saveChatSession,
        getChatSession,
        clearChatSession,
        getAllChatSessions,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
