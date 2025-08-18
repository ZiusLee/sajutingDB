-- 사주 세션 데이터 정리 스크립트
-- saju나 daeun이 null이거나 비어있는 세션들을 찾아서 기본 구조 설정

-- 1. 현재 상태 확인
SELECT 
    id,
    user_id,
    name,
    CASE 
        WHEN saju IS NULL THEN 'NULL'
        WHEN saju::text = '{}' THEN 'EMPTY'
        ELSE 'HAS_DATA'
    END as saju_status,
    CASE 
        WHEN daeun IS NULL THEN 'NULL'
        WHEN daeun::text = '{}' THEN 'EMPTY'
        ELSE 'HAS_DATA'
    END as daeun_status,
    created_at
FROM saju_sessions 
WHERE saju IS NULL OR saju::text = '{}' OR daeun IS NULL OR daeun::text = '{}'
ORDER BY created_at DESC;

-- 2. saju가 null이거나 비어있는 세션들에 기본 구조 설정
UPDATE saju_sessions 
SET saju = jsonb_build_object(
    'year', jsonb_build_object('stem', '', 'branch', ''),
    'month', jsonb_build_object('stem', '', 'branch', ''),
    'day', jsonb_build_object('stem', '', 'branch', ''),
    'hour', jsonb_build_object('stem', '', 'branch', ''),
    'elements', jsonb_build_object(
        'wood', 0,
        'fire', 0,
        'earth', 0,
        'metal', 0,
        'water', 0
    ),
    'sibseong', jsonb_build_object(
        'yearStem', '',
        'monthStem', '',
        'dayStem', '',
        'hourStem', ''
    ),
    'birthInfo', jsonb_build_object(
        'year', 0,
        'month', 0,
        'day', 0,
        'hour', 0,
        'isLeapMonth', false,
        'gender', 'male'
    ),
    'needsRecalculation', true
)
WHERE saju IS NULL OR saju::text = '{}';

-- 3. daeun이 null이거나 비어있는 세션들에 기본 구조 설정
UPDATE saju_sessions 
SET daeun = jsonb_build_object(
    'daeunList', '[]'::jsonb,
    'currentDaeun', jsonb_build_object(
        'stem', '',
        'branch', '',
        'startAge', 0,
        'endAge', 0
    ),
    'needsRecalculation', true
)
WHERE daeun IS NULL OR daeun::text = '{}';

-- 4. 첫 번째 세션을 기본 세션으로 설정 (is_default가 없는 사용자들)
WITH first_sessions AS (
    SELECT DISTINCT ON (user_id) 
        id, user_id
    FROM saju_sessions 
    WHERE user_id IN (
        SELECT user_id 
        FROM saju_sessions 
        GROUP BY user_id 
        HAVING COUNT(*) > 0 AND SUM(CASE WHEN is_default = true THEN 1 ELSE 0 END) = 0
    )
    ORDER BY user_id, created_at ASC
)
UPDATE saju_sessions 
SET is_default = true 
WHERE id IN (SELECT id FROM first_sessions);

-- 5. 업데이트 결과 확인
SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN saju IS NOT NULL AND saju::text != '{}' THEN 1 END) as sessions_with_saju,
    COUNT(CASE WHEN daeun IS NOT NULL AND daeun::text != '{}' THEN 1 END) as sessions_with_daeun,
    COUNT(CASE WHEN is_default = true THEN 1 END) as default_sessions
FROM saju_sessions;

-- 6. 재계산이 필요한 세션들 표시
SELECT 
    id,
    user_id,
    name,
    CASE 
        WHEN saju->>'needsRecalculation' = 'true' THEN 'NEEDS_SAJU_CALC'
        ELSE 'SAJU_OK'
    END as saju_calc_status,
    CASE 
        WHEN daeun->>'needsRecalculation' = 'true' THEN 'NEEDS_DAEUN_CALC'
        ELSE 'DAEUN_OK'
    END as daeun_calc_status
FROM saju_sessions 
WHERE saju->>'needsRecalculation' = 'true' OR daeun->>'needsRecalculation' = 'true'
ORDER BY created_at DESC;
