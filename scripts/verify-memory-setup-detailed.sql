-- 스마트 메모리 시스템 설정 상세 확인 스크립트

-- 1. 테이블 존재 확인
SELECT 
  'Tables Check' as check_type,
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('smart_contexts', 'conversation_memory_links')
ORDER BY table_name;

-- 2. smart_contexts 테이블 구조 확인
SELECT 
  'smart_contexts Structure' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'smart_contexts' 
ORDER BY ordinal_position;

-- 3. conversation_memory_links 테이블 구조 확인
SELECT 
  'conversation_memory_links Structure' as check_type,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conversation_memory_links' 
ORDER BY ordinal_position;

-- 4. 함수 존재 확인
SELECT 
  'Functions Check' as check_type,
  proname as function_name,
  prokind as function_type,
  proargnames as argument_names
FROM pg_proc 
WHERE proname IN ('find_similar_memory', 'search_relevant_memories');

-- 5. 확장 기능 확인 (벡터 검색용)
SELECT 
  'Extensions Check' as check_type,
  extname as extension_name,
  extversion as version
FROM pg_extension 
WHERE extname = 'vector';

-- 6. RLS 정책 확인
SELECT 
  'RLS Policies Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('smart_contexts', 'conversation_memory_links');

-- 7. 테이블 데이터 샘플 확인
SELECT 
  'smart_contexts Sample' as check_type,
  COUNT(*) as total_records,
  COUNT(DISTINCT user_id) as unique_users,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM smart_contexts;

-- 8. 벡터 컬럼 확인
SELECT 
  'Vector Column Check' as check_type,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'smart_contexts' 
AND column_name = 'relevance_embedding';

-- 9. 권한 확인
SELECT 
  'Table Permissions' as check_type,
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('smart_contexts', 'conversation_memory_links')
AND grantee != 'postgres';
