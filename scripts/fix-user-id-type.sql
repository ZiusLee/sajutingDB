-- 현재 user_id 컬럼 타입 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'smart_contexts' AND column_name = 'user_id';

-- user_id를 TEXT 타입으로 변경 (필요한 경우)
ALTER TABLE smart_contexts ALTER COLUMN user_id TYPE TEXT;

-- 함수들도 TEXT 타입으로 수정
DROP FUNCTION IF EXISTS find_similar_memory(TEXT, vector, TEXT, FLOAT);
DROP FUNCTION IF EXISTS search_relevant_memories(TEXT, vector, FLOAT, INTEGER);

-- find_similar_memory 함수 재생성 (TEXT 타입)
CREATE OR REPLACE FUNCTION find_similar_memory(
  user_id TEXT,
  content_embedding vector(1536),
  memory_type TEXT,
  similarity_threshold FLOAT
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  content TEXT,
  importance_score FLOAT,
  reference_count INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.type,
    sc.content,
    sc.importance_score,
    sc.reference_count,
    (sc.relevance_embedding <=> content_embedding) * -1 + 1 as similarity
  FROM smart_contexts sc
  WHERE sc.user_id = find_similar_memory.user_id
    AND sc.type = find_similar_memory.memory_type
    AND (sc.relevance_embedding <=> content_embedding) * -1 + 1 >= similarity_threshold
  ORDER BY sc.relevance_embedding <=> content_embedding
  LIMIT 1;
END;
$$;

-- search_relevant_memories 함수 재생성 (TEXT 타입)
CREATE OR REPLACE FUNCTION search_relevant_memories(
  user_id TEXT,
  query_embedding vector(1536),
  similarity_threshold FLOAT,
  result_limit INTEGER
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  content TEXT,
  importance_score FLOAT,
  reference_count INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.type,
    sc.content,
    sc.importance_score,
    sc.reference_count,
    (sc.relevance_embedding <=> query_embedding) * -1 + 1 as similarity
  FROM smart_contexts sc
  WHERE sc.user_id = search_relevant_memories.user_id
    AND (sc.relevance_embedding <=> query_embedding) * -1 + 1 >= similarity_threshold
  ORDER BY sc.relevance_embedding <=> query_embedding
  LIMIT result_limit;
END;
$$;
