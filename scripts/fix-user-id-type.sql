-- user_id 컬럼을 TEXT 타입으로 변경
ALTER TABLE smart_contexts ALTER COLUMN user_id TYPE TEXT;

-- 함수들을 TEXT 타입으로 다시 생성
DROP FUNCTION IF EXISTS find_similar_memory(TEXT, vector(1536), TEXT, FLOAT);
DROP FUNCTION IF EXISTS search_relevant_memories(TEXT, vector(1536), FLOAT, INTEGER);

-- 유사한 메모리 찾기 함수 (TEXT 타입으로)
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

-- 관련 메모리 검색 함수 (TEXT 타입으로)
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
