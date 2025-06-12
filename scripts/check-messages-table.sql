-- messages 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- messages 테이블의 샘플 데이터 확인 (최근 5개)
SELECT * FROM messages 
ORDER BY created_at DESC 
LIMIT 5;
