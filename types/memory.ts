export type MemoryType = "identity" | "goal" | "emotion" | "relationship" | "interest" | "situation"

export interface Memory {
  id: string
  user_id: string
  session_id: string
  memory_type: MemoryType
  content: string
  keywords: string[]
  confidence: number
  embedding: number[]
  created_at: string
  updated_at: string
  similarity?: number
}

export interface MemoryCandidate {
  type: MemoryType
  content: string
  confidence: number
  keywords: string[]
}

export interface MemoryExtractionResult {
  shouldSave: boolean
  memories: MemoryCandidate[]
}

export interface MemoryStats {
  totalMemories: number
  byType: Record<MemoryType, number>
  averageConfidence: number
}

export interface SmartContext {
  id: string
  user_id: string
  type: string
  content: string
  source_context: string
  keywords: string[]
  importance_score: number
  reference_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string
  last_referenced?: string
  relevance_embedding: number[]
  quality_score?: number
  is_low_quality?: boolean
  semantic_hash?: string
}

export interface MemoryUsage {
  id: string
  memory_id: string
  conversation_id: string
  usage_type: string
  created_at: string
}

export interface MemorySearchResult {
  id: string
  content: string
  type: string
  similarity: number
  importance_score: number
  reference_count: number
  last_referenced?: string
  quality_score?: number
}
