// lib/chat-utils.ts

// Function to get the initial message based on room type
export const getInitialMessageByRoomType = (roomType: string): string => {
  // Basic implementation - replace with actual logic
  return `Welcome to the ${roomType} chat!`
}

// Function to generate a chat session key
export const generateChatSessionKey = (userId: string, roomType: string): string => {
  // Basic implementation - replace with actual logic
  return `chat_${userId}_${roomType}`
}

// Function to get the room title based on room type
export const getRoomTitle = (roomType: string): string => {
  // Basic implementation - replace with actual logic
  return `Chat Room: ${roomType}`
}

// Initial suggested questions by type
export const initialSuggestedQuestionsByType = (roomType: string): string[] => {
  // Basic implementation - replace with actual logic
  return ["Tell me more about this chat."]
}
