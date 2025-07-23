-- 스마트 메모리 시스템 상세 검증 스크립트

-- 1. 테이블 존재 확인
SELECT 
  'Tables Check' as check_type,
  json_agg(
    json_build_object(
      'table_name', tablename,
      'exists', true
    )
  ) as result
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('smart_contexts', 'conversation_memory_links');

-- 2. 컬럼 구조 확인
SELECT 
  'Columns Check' as check_type,
  json_agg(
    json_build_object(
      'table_name', table_name,
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable
    )
  ) as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('smart_contexts', 'conversation_memory_links')
ORDER BY table_name, ordinal_position;

-- 3. 인덱스 확인
SELECT 
  'Indexes Check' as check_type,
  json_agg(
    json_build_object(
      'indexname', indexname,
      'tablename', tablename,
      'indexdef', indexdef
    )
  ) as result
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('smart_contexts', 'conversation_memory_links');

-- 4. 함수 존재 확인
SELECT 
  'Functions Check' as check_type,
  json_agg(
    json_build_object(
      'function_name', proname,
      'return_type', pg_get_function_result(oid),
      'arguments', pg_get_function_arguments(oid)
    )
  ) as result
FROM pg_proc 
WHERE proname IN ('find_similar_memory', 'search_relevant_memories')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. 벡터 확장 확인
SELECT 
  'Extensions Check' as check_type,
  json_agg(
    json_build_object(
      'extension_name', extname,
      'version', extversion,
      'installed', true
    )
  ) as result
FROM pg_extension 
WHERE extname = 'vector';

-- 6. RLS 정책 확인
SELECT 
  'RLS Policies Check' as check_type,
  json_agg(
    json_build_object(
      'table_name', tablename,
      'policy_name', policyname,
      'permissive', permissive,
      'roles', roles,
      'cmd', cmd,
      'qual', qual
    )
  ) as result
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('smart_contexts', 'conversation_memory_links');

-- 7. 샘플 데이터 확인
SELECT 
  'Sample Data Check' as check_type,
  json_build_object(
    'smart_contexts_count', (SELECT COUNT(*) FROM smart_contexts),
    'conversation_memory_links_count', (SELECT COUNT(*) FROM conversation_memory_links),
    'sample_user_ids', (
      SELECT json_agg(DISTINCT user_id) 
      FROM smart_contexts 
      LIMIT 5
    )
  ) as result;
