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
 * Save messages to database
 */
export async function saveMessages(sessionId: string, messages: any[], roomType: string): Promise<string[]> {
  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        messages,
        roomType,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save messages: ${response.statusText}`)
    }

    const data = await response.json()
    return data.messageIds || []
  } catch (error) {
    console.error("Error saving messages:", error)
    return []
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
        sessionId, // Use sessionId instead of userId
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
