import { supabase } from "@/lib/supabase-client"
import { persistTemporaryChatRoom, generateChatRoomTitle } from "./chat-room-service"

export interface Message {
  id?: string
  sessionId: string
  chatRoomId?: string
  role: "user" | "assistant" | "system"
  content: string
  messageOrder?: number
  roomType?: string
  modelUsed?: string
  responseTimeMs?: number
  createdAt?: string
  feedback?: MessageFeedback[]
}

export interface MessageFeedback {
  id: string
  messageId: string
  feedbackType: "like" | "dislike"
  userId?: string
  createdAt: string
}

export interface MessageStats {
  totalMessages: number
  userMessages: number
  assistantMessages: number
  averageResponseTime?: number
  lastMessageAt?: string
}

// Get messages for a session, optionally filtered by chat room
export async function getSessionMessages(sessionId: string, chatRoomId?: string): Promise<Message[]> {
  try {
    // If it's a temporary chat room, return empty array since no messages are saved yet
    if (chatRoomId?.startsWith("temp-")) {
      return []
    }

    const params = new URLSearchParams({ sessionId })
    if (chatRoomId) {
      params.append("chatRoomId", chatRoomId)
    }

    const response = await fetch(`/api/messages?${params}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error fetching messages:", response.status, errorText)

      // Handle rate limit errors specifically
      if (response.status === 429 || errorText.includes("Too Many")) {
        console.warn("Rate limit exceeded, returning empty messages array")
        return []
      }

      throw new Error(`Failed to fetch messages: ${response.status} ${errorText}`)
    }

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse JSON response:", responseText)
      console.error("Parse error:", parseError)
      return []
    }

    return data.messages || []
  } catch (error) {
    console.error("Error fetching session messages:", error)
    return []
  }
}

// Get messages for a specific chat room only
export async function getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
  try {
    // If it's a temporary chat room, return empty array
    if (chatRoomId.startsWith("temp-")) {
      return []
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        session_id,
        chat_room_id,
        role,
        content,
        message_order,
        room_type,
        model_used,
        response_time_ms,
        created_at,
        message_feedback (
          id,
          message_id,
          feedback_type,
          user_id,
          created_at
        )
      `)
      .eq("chat_room_id", chatRoomId)
      .order("message_order", { ascending: true })

    if (error) throw error

    return (
      messages?.map((msg) => ({
        id: msg.id,
        sessionId: msg.session_id,
        chatRoomId: msg.chat_room_id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        messageOrder: msg.message_order,
        roomType: msg.room_type,
        modelUsed: msg.model_used,
        responseTimeMs: msg.response_time_ms,
        createdAt: msg.created_at,
        feedback:
          msg.message_feedback?.map((f: any) => ({
            id: f.id,
            messageId: f.message_id,
            feedbackType: f.feedback_type,
            userId: f.user_id,
            createdAt: f.created_at,
          })) || [],
      })) || []
    )
  } catch (error) {
    console.error("Error fetching chat room messages:", error)
    return []
  }
}

// Save multiple messages with temporary chat room handling
export async function saveMessages(
  sessionId: string,
  messages: Message[],
  roomType = "sajuping",
  chatRoomId?: string,
  temporaryChatRoom?: any,
): Promise<{ savedCount: number; messageIds: string[]; persistedChatRoomId?: string }> {
  try {
    let finalChatRoomId = chatRoomId
    let persistedChatRoomId: string | undefined

    // If we have a temporary chat room and this is the first user message, persist it
    if (temporaryChatRoom?.isTemporary && messages.some((msg) => msg.role === "user")) {
      try {
        // Generate title from first user message
        const firstUserMessage = messages.find((msg) => msg.role === "user")
        const title = firstUserMessage ? generateChatRoomTitle(firstUserMessage.content) : "새로운 대화"

        const persistedRoom = await persistTemporaryChatRoom({
          ...temporaryChatRoom,
          sessionId: sessionId, // Explicitly pass sessionId
          title,
        })

        finalChatRoomId = persistedRoom.id
        persistedChatRoomId = persistedRoom.id
      } catch (error) {
        console.error("❌ Failed to persist temporary chat room:", error)
        // Continue without chat room ID if persistence fails
        finalChatRoomId = undefined
      }
    }

    // Don't save messages if we still have a temporary chat room ID
    if (finalChatRoomId?.startsWith("temp-")) {
      return {
        savedCount: 0,
        messageIds: [],
        persistedChatRoomId,
      }
    }

    // Get the current highest message order to ensure proper sequencing
    let lastMessageOrder = 0
    if (finalChatRoomId) {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("message_order")
        .eq("chat_room_id", finalChatRoomId)
        .order("message_order", { ascending: false })
        .limit(1)

      lastMessageOrder = lastMessage?.[0]?.message_order || 0
    } else {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select("message_order")
        .eq("session_id", sessionId)
        .order("message_order", { ascending: false })
        .limit(1)

      lastMessageOrder = lastMessage?.[0]?.message_order || 0
    }

    // Assign sequential message orders if not already set
    const messagesWithOrder = messages.map((msg, index) => ({
      ...msg,
      messageOrder: msg.messageOrder !== undefined ? msg.messageOrder : lastMessageOrder + index + 1,
    }))

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        messages: messagesWithOrder,
        roomType,
        chatRoomId: finalChatRoomId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error saving messages:", response.status, errorText)

      if (response.status === 429 || errorText.includes("Too Many")) {
        console.warn("Rate limit exceeded while saving messages")
        return { savedCount: 0, messageIds: [] }
      }

      throw new Error(`Failed to save messages: ${response.status} ${errorText}`)
    }

    const responseText = await response.text()
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse save response:", responseText)
      return { savedCount: 0, messageIds: [] }
    }

    return {
      savedCount: data.savedCount || 0,
      messageIds: data.messageIds || [],
      persistedChatRoomId,
    }
  } catch (error) {
    console.error("Error saving messages:", error)
    return { savedCount: 0, messageIds: [] }
  }
}

// Save a single message with temporary chat room handling
export async function saveSingleMessage(
  sessionId: string,
  message: Message,
  roomType = "sajuping",
  messageOrder?: number,
  chatRoomId?: string,
  temporaryChatRoom?: any,
): Promise<{ messageId: string | null; persistedChatRoomId?: string }> {
  try {
    let finalMessageOrder = messageOrder

    // messageOrder가 제공되지 않은 경우, 자동으로 순서 번호 생성
    if (!finalMessageOrder) {
      if (chatRoomId && !chatRoomId.startsWith("temp-")) {
        // 채팅룸별 메시지 순서 계산 (temporary room이 아닌 경우만)
        const { data: existingMessages, error } = await supabase
          .from("messages")
          .select("message_order")
          .eq("chat_room_id", chatRoomId)
          .order("message_order", { ascending: false })
          .limit(1)

        if (error) {
          console.error("Error fetching existing messages:", error)
          finalMessageOrder = 1
        } else {
          const lastOrder = existingMessages?.[0]?.message_order || 0
          finalMessageOrder = lastOrder + 1
        }
      } else {
        // 세션별 메시지 순서 계산 또는 temporary room인 경우
        finalMessageOrder = 1
      }
    }

    const messageToSave = {
      ...message,
      messageOrder: finalMessageOrder,
      chatRoomId,
    }

    const result = await saveMessages(sessionId, [messageToSave], roomType, chatRoomId, temporaryChatRoom)
    return {
      messageId: result.messageIds[0] || null,
      persistedChatRoomId: result.persistedChatRoomId,
    }
  } catch (error) {
    console.error("Error saving single message:", error)
    return { messageId: null }
  }
}

// Delete messages from a chat room
export async function deleteChatRoomMessages(chatRoomId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/messages?chatRoomId=${chatRoomId}`, {
      method: "DELETE",
    })

    return response.ok
  } catch (error) {
    console.error("Error deleting chat room messages:", error)
    return false
  }
}

// Update message's chat room (for migration purposes)
export async function updateMessageChatRoom(messageId: string, chatRoomId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("messages").update({ chat_room_id: chatRoomId }).eq("id", messageId)

    return !error
  } catch (error) {
    console.error("Error updating message chat room:", error)
    return false
  }
}

// Get recent messages for a session (across all chat rooms)
export async function getRecentSessionMessages(sessionId: string, limit = 10): Promise<Message[]> {
  try {
    const { data: messages, error } = await supabase
      .from("messages")
      .select(`
        id,
        session_id,
        chat_room_id,
        role,
        content,
        message_order,
        room_type,
        created_at
      `)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return (
      messages?.map((msg) => ({
        id: msg.id,
        sessionId: msg.session_id,
        chatRoomId: msg.chat_room_id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        messageOrder: msg.message_order,
        roomType: msg.room_type,
        createdAt: msg.created_at,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching recent session messages:", error)
    return []
  }
}

// Save message feedback
export async function saveMessageFeedback(
  messageId: string,
  feedbackType: "like" | "dislike",
  userId?: string,
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
        userId,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error saving message feedback:", error)
    return false
  }
}

// Get message feedback
export async function getMessageFeedback(messageId: string): Promise<MessageFeedback[]> {
  try {
    const { data: feedback, error } = await supabase
      .from("message_feedback")
      .select("*")
      .eq("message_id", messageId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (
      feedback?.map((f) => ({
        id: f.id,
        messageId: f.message_id,
        feedbackType: f.feedback_type,
        userId: f.user_id,
        createdAt: f.created_at,
      })) || []
    )
  } catch (error) {
    console.error("Error fetching message feedback:", error)
    return []
  }
}

// Get message statistics
export async function getMessageStats(sessionId?: string, chatRoomId?: string): Promise<MessageStats> {
  try {
    let query = supabase.from("messages").select("role, response_time_ms, created_at")

    if (chatRoomId && !chatRoomId.startsWith("temp-")) {
      query = query.eq("chat_room_id", chatRoomId)
    } else if (sessionId) {
      query = query.eq("session_id", sessionId)
    } else {
      throw new Error("Either sessionId or chatRoomId must be provided")
    }

    const { data: messages, error } = await query

    if (error) throw error

    const totalMessages = messages?.length || 0
    const userMessages = messages?.filter((m) => m.role === "user").length || 0
    const assistantMessages = messages?.filter((m) => m.role === "assistant").length || 0

    const responseTimes = messages?.filter((m) => m.response_time_ms).map((m) => m.response_time_ms) || []
    const averageResponseTime =
      responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : undefined

    const lastMessageAt = messages?.length > 0 ? messages[messages.length - 1].created_at : undefined

    return {
      totalMessages,
      userMessages,
      assistantMessages,
      averageResponseTime,
      lastMessageAt,
    }
  } catch (error) {
    console.error("Error getting message stats:", error)
    return {
      totalMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
    }
  }
}
