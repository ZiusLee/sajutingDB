-- Memory Bank 관련 함수들 생성 (v2 - 에러 처리 개선)

-- 1. 사용자 메모리 통계 함수
CREATE OR REPLACE FUNCTION get_user_memory_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_entries INTEGER := 0;
    entries_this_month INTEGER := 0;
    most_used_tags TEXT[] := ARRAY[]::TEXT[];
    avg_mood NUMERIC := 0;
BEGIN
    -- 총 엔트리 수
    SELECT COUNT(*) INTO total_entries
    FROM memory_entries 
    WHERE user_id = p_user_id AND (is_deleted = false OR is_deleted IS NULL);
    
    -- 이번 달 엔트리 수
    SELECT COUNT(*) INTO entries_this_month
    FROM memory_entries 
    WHERE user_id = p_user_id 
    AND (is_deleted = false OR is_deleted IS NULL)
    AND entry_date >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- 가장 많이 사용된 태그들 (상위 5개)
    SELECT array_agg(tag) INTO most_used_tags
    FROM (
        SELECT unnest(tags) as tag, COUNT(*) as cnt
        FROM memory_entries 
        WHERE user_id = p_user_id AND (is_deleted = false OR is_deleted IS NULL)
        AND tags IS NOT NULL AND array_length(tags, 1) > 0
        GROUP BY tag
        ORDER BY cnt DESC
        LIMIT 5
    ) t;
    
    -- 평균 감정 상태 (happiness 기준)
    SELECT AVG(CASE 
        WHEN emotional_state ? 'happiness' AND (emotional_state->>'happiness')::boolean = true THEN 1
        ELSE 0 
    END) INTO avg_mood
    FROM memory_entries
    WHERE user_id = p_user_id AND (is_deleted = false OR is_deleted IS NULL)
    AND emotional_state IS NOT NULL;
    
    -- 결과 조합
    SELECT jsonb_build_object(
        'total_entries', COALESCE(total_entries, 0),
        'entries_this_month', COALESCE(entries_this_month, 0),
        'most_used_tags', COALESCE(most_used_tags, ARRAY[]::TEXT[]),
        'avg_mood', COALESCE(avg_mood, 0)
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- 에러 발생 시 기본값 반환
        RETURN jsonb_build_object(
            'total_entries', 0,
            'entries_this_month', 0,
            'most_used_tags', ARRAY[]::TEXT[],
            'avg_mood', 0,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 2. 게스트 세션 메모리 통계 함수
CREATE OR REPLACE FUNCTION get_session_memory_stats(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_entries INTEGER := 0;
    entries_this_week INTEGER := 0;
    most_used_tags TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- 총 엔트리 수
    SELECT COUNT(*) INTO total_entries
    FROM memory_entries 
    WHERE session_id = p_session_id AND (is_deleted = false OR is_deleted IS NULL);
    
    -- 이번 주 엔트리 수
    SELECT COUNT(*) INTO entries_this_week
    FROM memory_entries 
    WHERE session_id = p_session_id 
    AND (is_deleted = false OR is_deleted IS NULL)
    AND entry_date >= DATE_TRUNC('week', CURRENT_DATE);
    
    -- 가장 많이 사용된 태그들
    SELECT array_agg(tag) INTO most_used_tags
    FROM (
        SELECT unnest(tags) as tag, COUNT(*) as cnt
        FROM memory_entries 
        WHERE session_id = p_session_id AND (is_deleted = false OR is_deleted IS NULL)
        AND tags IS NOT NULL AND array_length(tags, 1) > 0
        GROUP BY tag
        ORDER BY cnt DESC
        LIMIT 3
    ) t;
    
    SELECT jsonb_build_object(
        'total_entries', COALESCE(total_entries, 0),
        'entries_this_week', COALESCE(entries_this_week, 0),
        'most_used_tags', COALESCE(most_used_tags, ARRAY[]::TEXT[])
    ) INTO result;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'total_entries', 0,
            'entries_this_week', 0,
            'most_used_tags', ARRAY[]::TEXT[],
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;

-- 3. 메모리 엔트리 검색 함수 (사용자별)
CREATE OR REPLACE FUNCTION search_user_memories(
    p_user_id UUID,
    p_search_text TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    entry_date DATE,
    entry_time TIME,
    emotional_state JSONB,
    tags TEXT[],
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.id,
        me.title,
        me.content,
        me.entry_date,
        me.entry_time,
        me.emotional_state,
        me.tags,
        me.category,
        me.created_at
    FROM memory_entries me
    WHERE me.user_id = p_user_id 
    AND (me.is_deleted = false OR me.is_deleted IS NULL)
    AND (p_search_text IS NULL OR me.content ILIKE '%' || p_search_text || '%')
    AND (p_tags IS NULL OR me.tags && p_tags)
    AND (p_category IS NULL OR me.category = p_category)
    AND (p_start_date IS NULL OR me.entry_date >= p_start_date)
    AND (p_end_date IS NULL OR me.entry_date <= p_end_date)
    ORDER BY me.entry_date DESC, me.entry_time DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$ LANGUAGE plpgsql;

-- 권한 설정
GRANT EXECUTE ON FUNCTION get_user_memory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_memory_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_memories(UUID, TEXT, TEXT[], TEXT, DATE, DATE, INTEGER, INTEGER) TO authenticated;
