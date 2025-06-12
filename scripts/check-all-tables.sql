-- 현재 데이터베이스의 모든 테이블 목록
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 각 테이블의 행 수 확인
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "총 삽입된 행",
    n_tup_upd as "업데이트된 행",
    n_tup_del as "삭제된 행"
FROM pg_stat_user_tables
ORDER BY tablename;
