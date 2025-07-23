-- 스마트 메모리 시스템 설정 확인 스크립트

-- 1. 테이블 존재 확인
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('smart_contexts', 'conversation_memory_links');

-- 2. smart_contexts 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'smart_contexts' 
ORDER BY ordinal_position;

-- 3. 함수 존재 확인
SELECT 
  proname as function_name,
  prokind as function_type
FROM pg_proc 
WHERE proname IN ('find_similar_memory', 'search_relevant_memories');

-- 4. 확장 기능 확인 (벡터 검색용)
SELECT 
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname = 'vector';

-- 5. RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('smart_contexts', 'conversation_memory_links');

-- 6. 인덱스 확인
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('smart_contexts', 'conversation_memory_links');
