-- 개선된 Memory Bank Tables for Theraping AI

-- 1. Memory Entries Table (수정됨)
CREATE TABLE IF NOT EXISTS memory_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- guest 허용을 위해 NULL 가능
    session_id UUID REFERENCES saju_sessions(id) ON DELETE SET NULL,
    
    -- Entry content
    title VARCHAR(255),
    content TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    
    -- Emotional state tracking
    emotional_state JSONB DEFAULT '{}',
    
    -- Entry metadata
    entry_type VARCHAR(50) DEFAULT 'manual',
    context_data JSONB DEFAULT '{}',
    
    -- Tagging and categorization
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    
    -- Privacy and visibility
    is_private BOOLEAN DEFAULT true,
    visibility VARCHAR(20) DEFAULT 'private',
    
    -- AI processing
    ai_processed BOOLEAN DEFAULT false,
    ai_insights JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 개선된 검색 벡터 (다국어 지원)
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content, ''))
    ) STORED,
    
    -- 제약 조건 추가
    CONSTRAINT check_entry_type CHECK (entry_type IN ('manual', 'ai_generated', 'session_summary', 'insight_summary')),
    CONSTRAINT check_visibility CHECK (visibility IN ('private', 'shared', 'public')),
    CONSTRAINT check_user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- 2. Memory-Saju Links Table (수정됨)
CREATE TABLE IF NOT EXISTS memory_saju_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID REFERENCES memory_entries(id) ON DELETE CASCADE,
    saju_session_id UUID REFERENCES saju_sessions(id) ON DELETE CASCADE,
    
    -- 개선된 점수 시스템
    relevance_score REAL DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    link_type VARCHAR(50) DEFAULT 'related',
    context_notes TEXT,
    
    -- AI confidence
    ai_confidence REAL DEFAULT 0.5 CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(memory_id, saju_session_id),
    CONSTRAINT check_link_type CHECK (link_type IN ('related', 'triggered_by', 'resulted_in', 'referenced'))
);

-- 3. Memory Insights Table (수정됨)
CREATE TABLE IF NOT EXISTS memory_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Insight content
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Pattern data
    pattern_data JSONB NOT NULL DEFAULT '{}',
    
    -- Contributing memories
    source_memory_ids UUID[] DEFAULT '{}',
    date_range_start DATE,
    date_range_end DATE,
    
    -- AI metadata
    confidence_score REAL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    model_used VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User interaction
    user_acknowledged BOOLEAN DEFAULT false,
    user_feedback JSONB DEFAULT '{}',
    
    -- Validity and lifecycle
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 제약 조건
    CONSTRAINT check_insight_type CHECK (insight_type IN ('pattern', 'trend', 'recommendation', 'warning', 'milestone', 'achievement')),
    CONSTRAINT check_date_range CHECK (date_range_start <= date_range_end)
);

-- 4. 게스트 사용자 지원을 위한 뷰
CREATE OR REPLACE VIEW user_memories AS
SELECT 
    me.*,
    CASE 
        WHEN me.user_id IS NOT NULL THEN 'authenticated'
        ELSE 'guest'
    END as user_type,
    ss.name as session_name,
    ss.gender as session_gender
FROM memory_entries me
LEFT JOIN saju_sessions ss ON me.session_id = ss.id;

-- 5. 개선된 정리 함수
CREATE OR REPLACE FUNCTION cleanup_guest_memories()
RETURNS void AS $$
BEGIN
    -- 30일 이상 된 게스트 메모리 삭제
    DELETE FROM memory_entries 
    WHERE user_id IS NULL 
    AND session_id IN (
        SELECT id FROM saju_sessions 
        WHERE auth_user_id IS NULL 
        AND created_at < NOW() - INTERVAL '30 days'
    );
    
    -- 고아 인사이트 삭제
    DELETE FROM memory_insights 
    WHERE user_id NOT IN (SELECT id FROM auth.users)
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- 고아 링크 삭제
    DELETE FROM memory_saju_links 
    WHERE memory_id NOT IN (SELECT id FROM memory_entries);
END;
$$ LANGUAGE plpgsql;

-- 6. 유용한 함수들
CREATE OR REPLACE FUNCTION get_user_memory_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_entries', COUNT(*),
        'entries_this_month', COUNT(*) FILTER (WHERE entry_date >= DATE_TRUNC('month', CURRENT_DATE)),
        'most_used_tags', (
            SELECT array_agg(tag) FROM (
                SELECT unnest(tags) as tag, COUNT(*) as cnt
                FROM memory_entries 
                WHERE user_id = p_user_id
                GROUP BY tag
                ORDER BY cnt DESC
                LIMIT 5
            ) t
        ),
        'avg_emotional_state', AVG((emotional_state->>'mood')::numeric) FILTER (WHERE emotional_state ? 'mood')
    ) INTO result
    FROM memory_entries
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
