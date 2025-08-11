interface PersistentChatSession {
  id: string
  messages: any[]
  isStreaming: boolean
  streamController?: ReadableStreamDefaultController
  lastActivity: number
}

class PersistentChatService {
  private sessions = new Map<string, PersistentChatSession>()
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

  constructor() {
    // Clean up expired sessions every 5 minutes
    setInterval(
      () => {
        this.cleanupExpiredSessions()
      },
      5 * 60 * 1000,
    )
  }

  createSession(sessionId: string, initialMessages: any[] = []): PersistentChatSession {
    const session: PersistentChatSession = {
      id: sessionId,
      messages: [...initialMessages],
      isStreaming: false,
      lastActivity: Date.now(),
    }

    this.sessions.set(sessionId, session)
    return session
  }

  getSession(sessionId: string): PersistentChatSession | null {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = Date.now()
      return session
    }
    return null
  }

  updateSession(sessionId: string, messages: any[], isStreaming = false) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.messages = [...messages]
      session.isStreaming = isStreaming
      session.lastActivity = Date.now()
    }
  }

  setStreamController(sessionId: string, controller: ReadableStreamDefaultController) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.streamController = controller
      session.isStreaming = true
      session.lastActivity = Date.now()
    }
  }

  finishStreaming(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.isStreaming = false
      session.streamController = undefined
      session.lastActivity = Date.now()
    }
  }

  isSessionStreaming(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    return session?.isStreaming || false
  }

  private cleanupExpiredSessions() {
    const now = Date.now()
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        // Clean up any active streams
        if (session.streamController) {
          try {
            session.streamController.close()
          } catch (error) {
            console.error("Error closing stream controller:", error)
          }
        }
        this.sessions.delete(sessionId)
        console.log(`Cleaned up expired session: ${sessionId}`)
      }
    }
  }

  getAllActiveSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  deleteSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (session?.streamController) {
      try {
        session.streamController.close()
      } catch (error) {
        console.error("Error closing stream controller:", error)
      }
    }
    this.sessions.delete(sessionId)
  }
}

// Global singleton instance
export const persistentChatService = new PersistentChatService()
