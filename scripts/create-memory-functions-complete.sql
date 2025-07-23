-- 스마트 메모리 시스템을 위한 완전한 데이터베이스 설정

-- 1. 벡터 확장 설치 (이미 설치되어 있다면 무시됨)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. smart_contexts 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS smart_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('identity', 'goal', 'emotion', 'relationship', 'interest', 'schedule', 'preference', 'situation')),
  content TEXT NOT NULL,
  source_context TEXT,
  importance_score FLOAT NOT NULL DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  relevance_embedding vector(1536),
  first_mentioned TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_referenced TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. conversation_memory_links 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS conversation_memory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  memory_id UUID NOT NULL REFERENCES smart_contexts(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('created', 'referenced', 'updated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_type ON smart_contexts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_importance ON smart_contexts(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_updated ON smart_contexts(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_embedding ON smart_contexts USING ivfflat (relevance_embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_links_conversation ON conversation_memory_links(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_links_memory ON conversation_memory_links(memory_id);

-- 5. find_similar_memory 함수 생성
CREATE OR REPLACE FUNCTION find_similar_memory(
  user_id TEXT,
  content_embedding vector(1536),
  memory_type TEXT,
  similarity_threshold FLOAT DEFAULT 0.8
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  content TEXT,
  importance_score FLOAT,
  reference_count INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.type,
    sc.content,
    sc.importance_score,
    sc.reference_count,
    1 - (sc.relevance_embedding <=> content_embedding) AS similarity
  FROM smart_contexts sc
  WHERE sc.user_id = find_similar_memory.user_id
    AND sc.type = memory_type
    AND 1 - (sc.relevance_embedding <=> content_embedding) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- 6. search_relevant_memories 함수 생성
CREATE OR REPLACE FUNCTION search_relevant_memories(
  user_id TEXT,
  query_embedding vector(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  content TEXT,
  importance_score FLOAT,
  reference_count INTEGER,
  similarity FLOAT,
  first_mentioned TIMESTAMPTZ,
  last_referenced TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.type,
    sc.content,
    sc.importance_score,
    sc.reference_count,
    1 - (sc.relevance_embedding <=> query_embedding) AS similarity,
    sc.first_mentioned,
    sc.last_referenced
  FROM smart_contexts sc
  WHERE sc.user_id = search_relevant_memories.user_id
    AND 1 - (sc.relevance_embedding <=> query_embedding) >= similarity_threshold
  ORDER BY 
    similarity DESC,
    sc.importance_score DESC,
    sc.last_referenced DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS 정책 설정 (필요한 경우)
ALTER TABLE smart_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory_links ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 메모리만 접근 가능
CREATE POLICY IF NOT EXISTS "Users can access their own memories" ON smart_contexts
  FOR ALL USING (auth.uid()::text = user_id);

-- 대화 링크는 관련 메모리에 접근 권한이 있는 사용자만
CREATE POLICY IF NOT EXISTS "Users can access their memory links" ON conversation_memory_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM smart_contexts 
      WHERE smart_contexts.id = conversation_memory_links.memory_id 
      AND smart_contexts.user_id = auth.uid()::text
    )
  );

-- 8. 권한 부여
GRANT ALL ON smart_contexts TO authenticated;
GRANT ALL ON conversation_memory_links TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_memory TO authenticated;
GRANT EXECUTE ON FUNCTION search_relevant_memories TO authenticated;

-- 9. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 트리거 생성
DROP TRIGGER IF EXISTS update_smart_contexts_updated_at ON smart_contexts;
CREATE TRIGGER update_smart_contexts_updated_at
  BEFORE UPDATE ON smart_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT 'Smart memory system setup completed successfully!' as result;
