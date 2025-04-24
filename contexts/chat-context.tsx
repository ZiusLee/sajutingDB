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
  saveChatSession: (key: string, session: ChatSession) => boolean
  getChatSession: (key: string) => ChatSession | null
  clearChatSession: (key: string) => void
  getAllChatSessions: () => Record<string, ChatSession>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null)
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({})
  const [state, setState] = useState({ chatSessions: {} })

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
    try {
      // 기존 세션 가져오기
      const existingSessions = JSON.parse(localStorage.getItem("saju_chat_sessions") || "{}")

      // 새 세션 추가 또는 업데이트
      existingSessions[key] = {
        ...session,
        lastUpdated: new Date().toISOString(),
      }

      // 로컬 스토리지에 저장
      localStorage.setItem("saju_chat_sessions", JSON.stringify(existingSessions))

      // 상태 업데이트
      setState((prev) => ({
        ...prev,
        chatSessions: existingSessions,
      }))

      return true
    } catch (error) {
      console.error("채팅 세션 저장 중 오류:", error)
      return false
    }
  }

  // Get chat session
  const getChatSession = (key: string) => {
    try {
      if (!key) return null

      const sessions = JSON.parse(localStorage.getItem("saju_chat_sessions") || "{}")
      return sessions[key] || null
    } catch (error) {
      console.error("채팅 세션 가져오기 중 오류:", error)
      return null
    }
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
