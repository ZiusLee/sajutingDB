// A utility function to clean up old chat sessions
export function cleanupOldChatSessions(maxAgeDays = 30) {
  if (typeof window === "undefined") return

  try {
    const chatSessionsStr = localStorage.getItem("saju_chat_sessions")
    if (!chatSessionsStr) return

    const chatSessions = JSON.parse(chatSessionsStr)
    const now = Date.now()
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000 // Convert days to milliseconds

    // Filter out sessions older than maxAgeDays
    const filteredSessions = Object.entries(chatSessions).reduce(
      (acc, [key, session]) => {
        const lastMessageTime = new Date((session as any).lastMessageTime).getTime()
        if (now - lastMessageTime < maxAgeMs) {
          acc[key] = session
        }
        return acc
      },
      {} as Record<string, any>,
    )

    // Save the filtered sessions back to localStorage
    localStorage.setItem("saju_chat_sessions", JSON.stringify(filteredSessions))
  } catch (error) {
    console.error("Error cleaning up old chat sessions:", error)
  }
}
