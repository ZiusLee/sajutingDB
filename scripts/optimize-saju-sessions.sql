-- 사주 세션 테이블에 사주/대운 정보가 저장되어 있는지 확인하고 인덱스 최적화

-- 사주 정보가 저장된 세션 확인
SELECT 
  id,
  name,
  CASE 
    WHEN saju IS NOT NULL THEN '사주 저장됨'
    ELSE '사주 없음'
  END as saju_status,
  CASE 
    WHEN daeun IS NOT NULL THEN '대운 저장됨'
    ELSE '대운 없음'
  END as daeun_status,
  created_at
FROM saju_sessions 
WHERE auth_user_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 사주/대운 정보 조회 성능 최적화를 위한 인덱스 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'saju_sessions'
  AND (indexdef LIKE '%auth_user_id%' OR indexdef LIKE '%is_default%');

-- 필요시 인덱스 생성 (이미 있으면 무시됨)
CREATE INDEX IF NOT EXISTS idx_saju_sessions_user_default 
ON saju_sessions(auth_user_id, is_default) 
WHERE auth_user_id IS NOT NULL;

-- 사주/대운 정보가 있는 세션의 통계
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN saju IS NOT NULL THEN 1 END) as sessions_with_saju,
  COUNT(CASE WHEN daeun IS NOT NULL THEN 1 END) as sessions_with_daeun,
  ROUND(
    COUNT(CASE WHEN saju IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2
  ) as saju_coverage_percent
FROM saju_sessions 
WHERE auth_user_id IS NOT NULL;
