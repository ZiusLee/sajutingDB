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
  // 🔥 새로운 품질 관리 필드
  quality_score: number
  is_low_quality: boolean
  semantic_hash?: string
  user_feedback_score?: number
  usage_count: number
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
  quality_score: number
  effective_score: number
}

// 🔥 새로운 중복 체크 결과 타입
export interface DuplicateCheckResult {
  isDuplicate: boolean
  similarity: number
  strategy: 'exact_text' | 'same_type_semantic' | 'cross_type_contradiction'
  existingMemory?: SmartContext
  confidence: number
}

// 🔥 품질 평가 결과 타입
export interface QualityAssessment {
  score: number
  factors: {
    length: number
    specificity: number
    uniqueness: number
    aiGenerated: number
    generic: number
  }
  reasoning: string
}

// 🔥 사용자 피드백 타입
export interface MemoryFeedback {
  memory_id: string
  user_id: string
  helpful: boolean
  feedback_type: 'helpful' | 'not_helpful' | 'incorrect' | 'outdated'
  created_at: string
}
