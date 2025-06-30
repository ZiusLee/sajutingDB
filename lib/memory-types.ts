// 메모리 타입 정의
export type MemoryType =
  | "conversation" // 대화 내용
  | "preference" // 사용자 선호도
  | "insight" // 인사이트
  | "context" // 컨텍스트
  | "compatibility" // 궁합 정보
  | "career" // 직업 정보
  | "location" // 거주지 정보
  | "emotion" // 감정 상태
  | "personal" // 개인 정보

// 메모리 콘텐츠 타입
export type MemoryContent = string | object

// 메모리 엔트리 인터페이스
export interface MemoryEntry {
  id: string
  user_id?: string
  session_id?: string
  type: MemoryType
  content: MemoryContent
  tags?: string[]
  metadata?: {
    name?: string
    birth?: string
    gender?: string
    relationship?: string
    compressedSaju?: any
    [key: string]: any
  }
  created_at?: string
  updated_at?: string
  timestamp: string
}
