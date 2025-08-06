-- 🔥 스마트 메모리 시스템 v2 스키마 업그레이드

-- 1. smart_contexts 테이블에 품질 관리 컬럼 추가
ALTER TABLE smart_contexts 
ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS is_low_quality BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS semantic_hash TEXT,
ADD COLUMN IF NOT EXISTS user_feedback_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS first_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. 품질 기반 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_quality_score ON smart_contexts(user_id, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_low_quality ON smart_contexts(user_id, is_low_quality);
CREATE INDEX IF NOT EXISTS idx_semantic_hash ON smart_contexts(user_id, semantic_hash);
CREATE INDEX IF NOT EXISTS idx_usage_count ON smart_contexts(user_id, usage_count DESC);

-- 3. 메모리 피드백 테이블 생성
CREATE TABLE IF NOT EXISTS memory_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    memory_id UUID REFERENCES smart_contexts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    helpful BOOLEAN NOT NULL,
    feedback_type TEXT DEFAULT 'helpful',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_feedback_user ON memory_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_feedback_memory ON memory_feedback(memory_id);

-- 4. 대화-메모리 연결 테이블 (이미 있다면 스킵)
CREATE TABLE IF NOT EXISTS conversation_memory_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    memory_id UUID REFERENCES smart_contexts(id) ON DELETE CASCADE,
    usage_type TEXT DEFAULT 'created',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_links ON conversation_memory_links(conversation_id);

-- 5. 🔥 품질 기반 메모리 검색 함수
CREATE OR REPLACE FUNCTION find_quality_memories(
    p_user_id UUID,
    p_query_embedding vector(1536),
    p_memory_types TEXT[] DEFAULT NULL,
    p_min_quality_score FLOAT DEFAULT 0.0,
    p_similarity_threshold FLOAT DEFAULT 0.1,
    p_result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    type TEXT,
    quality_score FLOAT,
    importance_score FLOAT,
    usage_count INTEGER,
    relevance_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_referenced TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.content,
        sc.type,
        sc.quality_score,
        sc.importance_score,
        sc.usage_count,
        (sc.relevance_embedding <=> p_query_embedding) * -1 + 1 AS relevance_score,
        sc.created_at,
        sc.updated_at,
        sc.last_referenced
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id
        AND sc.quality_score >= p_min_quality_score
        AND (p_memory_types IS NULL OR sc.type = ANY(p_memory_types))
        AND (sc.relevance_embedding <=> p_query_embedding) <= (1 - p_similarity_threshold)
    ORDER BY 
        -- 품질 점수와 관련성을 결합한 점수로 정렬
        (sc.quality_score * 0.3 + ((sc.relevance_embedding <=> p_query_embedding) * -1 + 1) * 0.7) DESC,
        sc.usage_count DESC,
        sc.updated_at DESC
    LIMIT p_result_limit;
END;
$$;

-- 6. 🔥 향상된 메모리 통계 함수
CREATE OR REPLACE FUNCTION get_enhanced_memory_stats(p_user_id UUID)
RETURNS TABLE (
    total_memories BIGINT,
    high_quality_count BIGINT,
    medium_quality_count BIGINT,
    low_quality_count BIGINT,
    average_quality_score FLOAT,
    total_usage_count BIGINT,
    memories_by_type JSONB,
    quality_distribution JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_memories,
        COUNT(*) FILTER (WHERE quality_score >= 0.7) as high_quality_count,
        COUNT(*) FILTER (WHERE quality_score >= 0.4 AND quality_score < 0.7) as medium_quality_count,
        COUNT(*) FILTER (WHERE quality_score < 0.4) as low_quality_count,
        AVG(quality_score)::FLOAT as average_quality_score,
        SUM(usage_count) as total_usage_count,
        jsonb_object_agg(type, type_count) as memories_by_type,
        jsonb_build_object(
            'high', COUNT(*) FILTER (WHERE quality_score >= 0.7),
            'medium', COUNT(*) FILTER (WHERE quality_score >= 0.4 AND quality_score < 0.7),
            'low', COUNT(*) FILTER (WHERE quality_score < 0.4)
        ) as quality_distribution
    FROM (
        SELECT 
            type,
            quality_score,
            usage_count,
            COUNT(*) OVER (PARTITION BY type) as type_count
        FROM smart_contexts 
        WHERE user_id = p_user_id
    ) stats;
END;
$$;

-- 7. 기존 메모리들의 품질 점수 초기화 (기본값 설정)
UPDATE smart_contexts 
SET 
    quality_score = CASE 
        WHEN LENGTH(content) < 10 THEN 0.3
        WHEN LENGTH(content) < 20 THEN 0.5
        WHEN importance_score > 0.8 THEN 0.8
        ELSE 0.6
    END,
    is_low_quality = CASE 
        WHEN LENGTH(content) < 10 THEN true
        WHEN importance_score < 0.3 THEN true
        ELSE false
    END,
    usage_count = COALESCE(reference_count, 1),
    first_mentioned = COALESCE(created_at, NOW())
WHERE quality_score IS NULL;

-- 8. RLS (Row Level Security) 정책 업데이트
ALTER TABLE memory_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own feedback" ON memory_feedback
    FOR ALL USING (auth.uid() = user_id);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '🎉 스마트 메모리 시스템 v2 스키마 업그레이드 완료!';
    RAISE NOTICE '✅ 품질 점수 시스템 활성화';
    RAISE NOTICE '✅ 사용자 피드백 시스템 준비';
    RAISE NOTICE '✅ 향상된 검색 함수 배포';
END $$;
