-- Memory Bank 관련 함수들 생성

-- 1. 사용자 메모리 통계 함수
CREATE OR REPLACE FUNCTION get_user_memory_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_entries INTEGER;
    entries_this_month INTEGER;
    most_used_tags TEXT[];
    avg_mood NUMERIC;
BEGIN
    -- 총 엔트리 수
    SELECT COUNT(*) INTO total_entries
    FROM memory_entries 
    WHERE user_id = p_user_id AND is_deleted = false;
    
    -- 이번 달 엔트리 수
    SELECT COUNT(*) INTO entries_this_month
    FROM memory_entries 
    WHERE user_id = p_user_id 
    AND is_deleted = false
    AND entry_date >= DATE_TRUNC('month', CURRENT_DATE);
    
    -- 가장 많이 사용된 태그들 (상위 5개)
    SELECT array_agg(tag) INTO most_used_tags
    FROM (
        SELECT unnest(tags) as tag, COUNT(*) as cnt
        FROM memory_entries 
        WHERE user_id = p_user_id AND is_deleted = false
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
    WHERE user_id = p_user_id AND is_deleted = false;
    
    -- 결과 조합
    SELECT jsonb_build_object(
        'total_entries', COALESCE(total_entries, 0),
        'entries_this_month', COALESCE(entries_this_month, 0),
        'most_used_tags', COALESCE(most_used_tags, ARRAY[]::TEXT[]),
        'avg_mood', COALESCE(avg_mood, 0)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. 게스트 세션 메모리 통계 함수
CREATE OR REPLACE FUNCTION get_session_memory_stats(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_entries INTEGER;
    entries_this_week INTEGER;
    most_used_tags TEXT[];
BEGIN
    -- 총 엔트리 수
    SELECT COUNT(*) INTO total_entries
    FROM memory_entries 
    WHERE session_id = p_session_id AND is_deleted = false;
    
    -- 이번 주 엔트리 수
    SELECT COUNT(*) INTO entries_this_week
    FROM memory_entries 
    WHERE session_id = p_session_id 
    AND is_deleted = false
    AND entry_date >= DATE_TRUNC('week', CURRENT_DATE);
    
    -- 가장 많이 사용된 태그들
    SELECT array_agg(tag) INTO most_used_tags
    FROM (
        SELECT unnest(tags) as tag, COUNT(*) as cnt
        FROM memory_entries 
        WHERE session_id = p_session_id AND is_deleted = false
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
    AND me.is_deleted = false
    AND (p_search_text IS NULL OR me.search_vector @@ websearch_to_tsquery('simple', p_search_text))
    AND (p_tags IS NULL OR me.tags && p_tags)
    AND (p_category IS NULL OR me.category = p_category)
    AND (p_start_date IS NULL OR me.entry_date >= p_start_date)
    AND (p_end_date IS NULL OR me.entry_date <= p_end_date)
    ORDER BY me.entry_date DESC, me.entry_time DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 4. 메모리 분석 데이터 업데이트 함수
CREATE OR REPLACE FUNCTION update_memory_analytics(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    entries_count INTEGER;
    emotional_avg JSONB;
    top_tags TEXT[];
    mood_dist JSONB;
BEGIN
    -- 해당 날짜의 엔트리 수
    SELECT COUNT(*) INTO entries_count
    FROM memory_entries
    WHERE user_id = p_user_id 
    AND entry_date = p_date 
    AND is_deleted = false;
    
    -- 감정 상태 평균
    SELECT jsonb_object_agg(emotion, avg_value) INTO emotional_avg
    FROM (
        SELECT 
            emotion,
            AVG(CASE WHEN value::boolean THEN 1 ELSE 0 END) as avg_value
        FROM memory_entries,
        LATERAL jsonb_each_text(emotional_state) as emotions(emotion, value)
        WHERE user_id = p_user_id 
        AND entry_date = p_date 
        AND is_deleted = false
        GROUP BY emotion
    ) t;
    
    -- 가장 많이 사용된 태그
    SELECT array_agg(tag) INTO top_tags
    FROM (
        SELECT unnest(tags) as tag, COUNT(*) as cnt
        FROM memory_entries
        WHERE user_id = p_user_id 
        AND entry_date = p_date 
        AND is_deleted = false
        GROUP BY tag
        ORDER BY cnt DESC
        LIMIT 5
    ) t;
    
    -- 기존 데이터 업데이트 또는 삽입
    INSERT INTO memory_analytics (
        user_id, date, entries_created, emotional_average, most_used_tags, mood_distribution
    ) VALUES (
        p_user_id, p_date, entries_count, emotional_avg, top_tags, emotional_avg
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        entries_created = EXCLUDED.entries_created,
        emotional_average = EXCLUDED.emotional_average,
        most_used_tags = EXCLUDED.most_used_tags,
        mood_distribution = EXCLUDED.mood_distribution;
END;
$$ LANGUAGE plpgsql;

-- 5. 유니크 제약 조건 추가 (analytics 테이블)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'memory_analytics_user_date_unique'
    ) THEN
        ALTER TABLE memory_analytics 
        ADD CONSTRAINT memory_analytics_user_date_unique 
        UNIQUE (user_id, date);
    END IF;
END $$;
