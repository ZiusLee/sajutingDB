import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface Message {
  id: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  messageOrder: number
  roomType?: string
  modelUsed?: string
  responseTimeMs?: number
  createdAt: string
  feedback?: MessageFeedback[]
}

export interface MessageFeedback {
  id: string
  messageId: string
  feedbackType: "like" | "dislike" | "retry" | "copy"
  userId?: string
  createdAt: string
}

/**
 * Get all messages for a session
 */
export async function getSessionMessages(sessionId: string): Promise<Message[]> {
  try {
    const response = await fetch(`/api/messages?sessionId=${sessionId}`)

    if (!response.ok) {
      if (response.status === 404) {
        // No messages found for this session, return empty array
        return []
      }
      throw new Error(`Failed to fetch messages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.messages || []
  } catch (error) {
    console.error("Error fetching session messages:", error)
    return []
  }
}

/**
 * Save messages to database - don't include ID to let database generate UUIDs
 */
export async function saveMessages(sessionId: string, messages: any[], roomType: string): Promise<string[]> {
  try {
    // Filter out messages that don't have content or are invalid
    const validMessages = messages.filter(
      (msg) => msg && msg.content && msg.content.trim() !== "" && (msg.role === "user" || msg.role === "assistant"),
    )

    if (validMessages.length === 0) {
      console.log("No valid messages to save")
      return []
    }

    // Remove any ID field to let database generate UUIDs
    const messagesToSave = validMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt || new Date().toISOString(),
      messageOrder: msg.messageOrder || 0,
    }))

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        messages: messagesToSave,
        roomType,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to save messages: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`Successfully saved ${data.savedCount} messages for session ${sessionId}`)
    return data.messageIds || []
  } catch (error) {
    console.error("Error saving messages:", error)
    return []
  }
}

/**
 * Save a single message immediately
 */
export async function saveSingleMessage(
  sessionId: string,
  message: any,
  roomType: string,
  messageOrder?: number,
): Promise<string | null> {
  try {
    if (!message || !message.content || message.content.trim() === "") {
      return null
    }

    const messageToSave = {
      role: message.role,
      content: message.content,
      createdAt: message.createdAt || new Date().toISOString(),
      messageOrder: messageOrder ?? Date.now(),
    }

    const messageIds = await saveMessages(sessionId, [messageToSave], roomType)
    return messageIds[0] || null
  } catch (error) {
    console.error("Error saving single message:", error)
    return null
  }
}

/**
 * Save message feedback
 */
export async function saveMessageFeedback(
  messageId: string,
  feedbackType: "like" | "dislike" | "retry" | "copy",
  sessionId?: string,
): Promise<boolean> {
  try {
    const response = await fetch("/api/message-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messageId,
        feedbackType,
        sessionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save feedback: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Error saving message feedback:", error)
    return false
  }
}

/**
 * Get feedback for a message
 */
export async function getMessageFeedback(messageId: string): Promise<MessageFeedback[]> {
  try {
    const response = await fetch(`/api/message-feedback?messageId=${messageId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch feedback: ${response.statusText}`)
    }

    const data = await response.json()
    return data.feedback || []
  } catch (error) {
    console.error("Error fetching message feedback:", error)
    return []
  }
}

/**
 * Get message statistics for analytics
 */
export async function getMessageStats(sessionId?: string) {
  try {
    const supabase = createClientComponentClient()

    let query = supabase.from("messages").select(`
        id,
        role,
        room_type,
        created_at,
        message_feedback (
          feedback_type
        )
      `)

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    const { data: messages, error } = await query

    if (error) {
      throw error
    }

    // Calculate statistics
    const stats = {
      totalMessages: messages?.length || 0,
      userMessages: messages?.filter((m) => m.role === "user").length || 0,
      assistantMessages: messages?.filter((m) => m.role === "assistant").length || 0,
      feedbackStats: {
        likes: 0,
        dislikes: 0,
        copies: 0,
        retries: 0,
      },
      roomTypeStats: {} as Record<string, number>,
    }

    messages?.forEach((message) => {
      // Count room types
      if (message.room_type) {
        stats.roomTypeStats[message.room_type] = (stats.roomTypeStats[message.room_type] || 0) + 1
      }

      // Count feedback
      message.message_feedback?.forEach((feedback: any) => {
        switch (feedback.feedback_type) {
          case "like":
            stats.feedbackStats.likes++
            break
          case "dislike":
            stats.feedbackStats.dislikes++
            break
          case "copy":
            stats.feedbackStats.copies++
            break
          case "retry":
            stats.feedbackStats.retries++
            break
        }
      })
    })

    return stats
  } catch (error) {
    console.error("Error getting message stats:", error)
    return null
  }
}
