-- 메모리 뱅크 테이블 존재 확인
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'memory_bank'
) as table_exists;

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'memory_bank'
ORDER BY ordinal_position;

-- 샘플 데이터 확인
SELECT COUNT(*) as total_memories FROM memory_bank;
