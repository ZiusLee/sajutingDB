import { query, withTransaction } from "./db"

export interface ChatRoom {
  id: number
  user_id: number
  saju_profile_id: number | null
  room_type: string
  title: string | null
  created_at: Date
  updated_at: Date
}

export interface Message {
  id: number
  chat_room_id: number
  role: string
  content: string
  created_at: Date
}

export interface ChatRoomInput {
  user_id: number
  saju_profile_id?: number
  room_type: string
  title?: string
}

export interface MessageInput {
  chat_room_id: number
  role: string
  content: string
}

// 채팅방 생성
export async function createChatRoom(roomData: ChatRoomInput): Promise<ChatRoom> {
  const { user_id, saju_profile_id, room_type, title } = roomData

  const result = await query(
    "INSERT INTO chat_rooms (user_id, saju_profile_id, room_type, title) VALUES ($1, $2, $3, $4) RETURNING *",
    [user_id, saju_profile_id || null, room_type, title || null],
  )

  return result.rows[0]
}

// 사용자 ID로 채팅방 목록 조회
export async function getChatRoomsByUserId(userId: number): Promise<ChatRoom[]> {
  const result = await query("SELECT * FROM chat_rooms WHERE user_id = $1 ORDER BY updated_at DESC", [userId])

  return result.rows
}

// ID로 채팅방 조회
export async function getChatRoomById(id: number): Promise<ChatRoom | null> {
  const result = await query("SELECT * FROM chat_rooms WHERE id = $1", [id])

  return result.rows.length > 0 ? result.rows[0] : null
}

// 채팅방 업데이트
export async function updateChatRoom(id: number, roomData: Partial<ChatRoomInput>): Promise<ChatRoom | null> {
  const updates = []
  const values = []

  Object.entries(roomData).forEach(([key, value], index) => {
    if (value !== undefined) {
      updates.push(`${key} = $${index + 1}`)
      values.push(value)
    }
  })

  if (updates.length === 0) {
    return getChatRoomById(id)
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`)

  const result = await query(
    `UPDATE chat_rooms SET ${updates.join(", ")} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id],
  )

  return result.rows.length > 0 ? result.rows[0] : null
}

// 채팅방 삭제
export async function deleteChatRoom(id: number): Promise<boolean> {
  const result = await query("DELETE FROM chat_rooms WHERE id = $1 RETURNING id", [id])

  return result.rows.length > 0
}

// 메시지 생성
export async function createMessage(messageData: MessageInput): Promise<Message> {
  const { chat_room_id, role, content } = messageData

  const result = await query("INSERT INTO messages (chat_room_id, role, content) VALUES ($1, $2, $3) RETURNING *", [
    chat_room_id,
    role,
    content,
  ])

  // 채팅방의 updated_at 업데이트
  await query("UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [chat_room_id])

  return result.rows[0]
}

// 채팅방 ID로 메시지 목록 조회
export async function getMessagesByChatRoomId(chatRoomId: number): Promise<Message[]> {
  const result = await query("SELECT * FROM messages WHERE chat_room_id = $1 ORDER BY created_at ASC", [chatRoomId])

  return result.rows
}

// 채팅방 및 메시지 함께 조회
export async function getChatRoomWithMessages(
  chatRoomId: number,
): Promise<{ chatRoom: ChatRoom | null; messages: Message[] }> {
  const chatRoom = await getChatRoomById(chatRoomId)
  const messages = chatRoom ? await getMessagesByChatRoomId(chatRoomId) : []

  return { chatRoom, messages }
}

// 채팅방에 여러 메시지 한 번에 저장 (트랜잭션 사용)
export async function createMultipleMessages(
  chatRoomId: number,
  messages: Omit<MessageInput, "chat_room_id">[],
): Promise<Message[]> {
  return withTransaction(async (client) => {
    const createdMessages = []

    for (const message of messages) {
      const result = await client.query(
        "INSERT INTO messages (chat_room_id, role, content) VALUES ($1, $2, $3) RETURNING *",
        [chatRoomId, message.role, message.content],
      )

      createdMessages.push(result.rows[0])
    }

    // 채팅방의 updated_at 업데이트
    await client.query("UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [chatRoomId])

    return createdMessages
  })
}
