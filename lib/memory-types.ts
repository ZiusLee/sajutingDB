export interface MemoryContentConversation {
  messages: { role: "user" | "assistant"; content: string }[]
  topic?: string
  timestamp: string
}

export interface MemoryContentPreference {
  preferred_reading_style?: string
  interests?: string[]
  language?: string
  [key: string]: any // For other preferences
}

export interface MemoryContentInsight {
  pattern: string
  description?: string
  confidence?: number
  supporting_data_ids?: string[] // IDs of memories supporting this insight
  timestamp: string
}

export interface MemoryContentContext {
  birth_info?: any // Replace 'any' with your actual birth_info structure
  recent_reading_ids?: string[] // IDs of recent Saju readings
  compatibility_history_ids?: string[] // IDs of compatibility readings
  [key: string]: any // For other contextual data
}

export type MemoryContent =
  | MemoryContentConversation
  | MemoryContentPreference
  | MemoryContentInsight
  | MemoryContentContext

export type MemoryType = "conversation" | "preference" | "insight" | "context"

export interface MemoryEntry {
  id: string
  user_id?: string | null
  session_id?: string | null
  type: MemoryType
  content: MemoryContent
  tags?: string[] | null
  created_at: string
  updated_at: string
}
