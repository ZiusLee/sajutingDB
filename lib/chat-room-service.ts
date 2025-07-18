import { supabase } from "@/lib/supabase-client"

export interface ChatRoom {
  id: string
  sessionId: string
  title: string
  roomType: string
  createdAt: string
  updatedAt?: string
  messageCount?: number
  lastMessage?: {
    content: string
    role: string
    createdAt: string
  } | null
}

export interface CreateChatRoomRequest {
  sessionId: string
  title?: string
  roomType?: string
}

export interface UpdateChatRoomRequest {
  title: string
}

export interface ChatRoomWithSession extends ChatRoom {
  session?: {
    id: string
    userId: string
    name: string
    birthDate: string
    birthTime?: string
    gender: string
    birthLocation?: string
    compressedSaju?: any
  }
}

// Create a new chat room
export async function createChatRoom(data: CreateChatRoomRequest): Promise<ChatRoom> {
  const response = await fetch("/api/chat-rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create chat room")
  }

  const result = await response.json()
  return result.chatRoom
}

// Get all chat rooms for a session
export async function getChatRooms(sessionId: string): Promise<ChatRoom[]> {
  const response = await fetch(`/api/chat-rooms?sessionId=${sessionId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch chat rooms")
  }

  const result = await response.json()
  return result.chatRooms
}

// Get a specific chat room with session info
export async function getChatRoom(chatRoomId: string): Promise<ChatRoomWithSession> {
  const response = await fetch(`/api/chat-rooms/${chatRoomId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch chat room")
  }

  const result = await response.json()
  return result.chatRoom
}

// Update chat room title
export async function updateChatRoom(chatRoomId: string, data: UpdateChatRoomRequest): Promise<ChatRoom> {
  const response = await fetch(`/api/chat-rooms/${chatRoomId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update chat room")
  }

  const result = await response.json()
  return result.chatRoom
}

// Delete a chat room and all its messages
export async function deleteChatRoom(chatRoomId: string): Promise<void> {
  const response = await fetch(`/api/chat-rooms/${chatRoomId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete chat room")
  }
}

// Generate smart title based on first message
export function generateChatRoomTitle(firstMessage: string): string {
  if (!firstMessage || firstMessage.trim().length === 0) {
    return "새로운 대화"
  }

  // Remove common prefixes and clean up
  let title = firstMessage
    .replace(/^(안녕하세요|안녕|여보세요|질문이|궁금한|물어보고|상담|문의)/i, "")
    .replace(/[?!.。]+$/, "")
    .trim()

  // Limit length
  if (title.length > 30) {
    title = title.substring(0, 27) + "..."
  }

  // Fallback if empty after cleaning
  if (title.length === 0) {
    return "새로운 대화"
  }

  return title
}

// Get chat room statistics
export async function getChatRoomStats(sessionId: string): Promise<{
  totalRooms: number
  totalMessages: number
  lastActivity: string | null
}> {
  try {
    const { data: rooms, error } = await supabase
      .from("chat_rooms")
      .select(`
        id,
        updated_at,
        messages (count)
      `)
      .eq("session_id", sessionId)

    if (error) throw error

    const totalRooms = rooms?.length || 0
    const totalMessages = rooms?.reduce((sum, room) => sum + (room.messages?.[0]?.count || 0), 0) || 0
    const lastActivity = rooms?.length > 0 ? rooms[0].updated_at : null

    return {
      totalRooms,
      totalMessages,
      lastActivity,
    }
  } catch (error) {
    console.error("Error getting chat room stats:", error)
    return {
      totalRooms: 0,
      totalMessages: 0,
      lastActivity: null,
    }
  }
}
