-- user_id 컬럼을 TEXT 타입으로 변경 (UUID에서 TEXT로)
-- 기존 데이터가 있다면 백업 후 진행하세요

-- 1. smart_contexts 테이블의 user_id를 TEXT로 변경
ALTER TABLE smart_contexts 
ALTER COLUMN user_id TYPE TEXT;

-- 2. conversation_memory_links 테이블도 확인 (필요시)
-- ALTER TABLE conversation_memory_links 
-- ALTER COLUMN conversation_id TYPE TEXT;

-- 3. 인덱스 재생성 (필요시)
DROP INDEX IF EXISTS idx_smart_contexts_user_type;
CREATE INDEX idx_smart_contexts_user_type ON smart_contexts(user_id, type);

DROP INDEX IF EXISTS idx_smart_contexts_user_updated;
CREATE INDEX idx_smart_contexts_user_updated ON smart_contexts(user_id, updated_at DESC);

-- 4. 함수들도 TEXT 타입으로 수정
DROP FUNCTION IF EXISTS find_similar_memory(TEXT, vector, TEXT, FLOAT);
DROP FUNCTION IF EXISTS search_relevant_memories(TEXT, vector, FLOAT, INTEGER);

-- find_similar_memory 함수 재생성 (TEXT 타입으로)
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
    (sc.relevance_embedding <=> content_embedding) * -1 + 1 AS similarity
  FROM smart_contexts sc
  WHERE sc.user_id = find_similar_memory.user_id
    AND sc.type = memory_type
    AND (sc.relevance_embedding <=> content_embedding) * -1 + 1 >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- search_relevant_memories 함수 재생성 (TEXT 타입으로)
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
    (sc.relevance_embedding <=> query_embedding) * -1 + 1 AS similarity,
    sc.first_mentioned,
    sc.last_referenced
  FROM smart_contexts sc
  WHERE sc.user_id = search_relevant_memories.user_id
    AND (sc.relevance_embedding <=> query_embedding) * -1 + 1 >= similarity_threshold
  ORDER BY 
    similarity DESC,
    sc.importance_score DESC,
    sc.last_referenced DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 권한 설정
GRANT EXECUTE ON FUNCTION find_similar_memory TO authenticated;
GRANT EXECUTE ON FUNCTION search_relevant_memories TO authenticated;

SELECT 'User ID type fixed to TEXT and functions updated' as result;
