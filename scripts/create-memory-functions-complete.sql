-- pgvector 확장 활성화 (이미 있다면 무시됨)
CREATE EXTENSION IF NOT EXISTS vector;

-- smart_contexts 테이블 생성 (이미 있다면 무시됨)
CREATE TABLE IF NOT EXISTS smart_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  source_context TEXT,
  importance_score FLOAT DEFAULT 0.5,
  reference_count INTEGER DEFAULT 1,
  is_pinned BOOLEAN DEFAULT FALSE,
  first_mentioned TIMESTAMPTZ DEFAULT NOW(),
  last_referenced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  relevance_embedding vector(1536)
);

-- conversation_memory_links 테이블 생성 (이미 있다면 무시됨)
CREATE TABLE IF NOT EXISTS conversation_memory_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  memory_id UUID NOT NULL REFERENCES smart_contexts(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL DEFAULT 'referenced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_type ON smart_contexts (user_id, type);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_importance ON smart_contexts (importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_updated ON smart_contexts (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_links_conversation ON conversation_memory_links (conversation_id);

-- 벡터 유사도 검색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_smart_contexts_embedding ON smart_contexts 
USING ivfflat (relevance_embedding vector_cosine_ops) WITH (lists = 100);

-- 유사한 메모리 찾기 함수
CREATE OR REPLACE FUNCTION find_similar_memory(
  user_id TEXT,
  content_embedding vector(1536),
  memory_type TEXT,
  similarity_threshold FLOAT DEFAULT 0.85
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  type TEXT,
  importance_score FLOAT,
  reference_count INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.content,
    sc.type,
    sc.importance_score,
    sc.reference_count,
    (1 - (sc.relevance_embedding <=> content_embedding)) as similarity
  FROM smart_contexts sc
  WHERE sc.user_id = find_similar_memory.user_id
    AND sc.type = find_similar_memory.memory_type
    AND (1 - (sc.relevance_embedding <=> content_embedding)) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- 관련 메모리 검색 함수
CREATE OR REPLACE FUNCTION search_relevant_memories(
  user_id TEXT,
  query_embedding vector(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  result_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  type TEXT,
  importance_score FLOAT,
  reference_count INTEGER,
  last_referenced TIMESTAMPTZ,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.content,
    sc.type,
    sc.importance_score,
    sc.reference_count,
    sc.last_referenced,
    (1 - (sc.relevance_embedding <=> query_embedding)) as similarity
  FROM smart_contexts sc
  WHERE sc.user_id = search_relevant_memories.user_id
    AND (1 - (sc.relevance_embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY 
    similarity DESC,
    sc.importance_score DESC,
    sc.reference_count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS 정책 설정
ALTER TABLE smart_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory_links ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 메모리만 접근 가능
CREATE POLICY IF NOT EXISTS "Users can access their own memories" ON smart_contexts
  FOR ALL USING (auth.uid()::text = user_id);

-- 대화-메모리 링크는 해당 메모리의 소유자만 접근 가능
CREATE POLICY IF NOT EXISTS "Users can access their own memory links" ON conversation_memory_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM smart_contexts 
      WHERE smart_contexts.id = conversation_memory_links.memory_id 
      AND smart_contexts.user_id = auth.uid()::text
    )
  );

-- 서비스 역할에 대한 정책 (모든 접근 허용)
CREATE POLICY IF NOT EXISTS "Service role can access all memories" ON smart_contexts
  FOR ALL TO service_role USING (true);

CREATE POLICY IF NOT EXISTS "Service role can access all memory links" ON conversation_memory_links
  FOR ALL TO service_role USING (true);
