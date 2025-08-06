-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS find_quality_memories(text, vector, text[], numeric, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS find_similar_memory(text, vector, text, numeric) CASCADE;
DROP FUNCTION IF EXISTS find_cross_type_duplicate(text, vector, text[], text[], numeric) CASCADE;
DROP FUNCTION IF EXISTS get_enhanced_memory_stats(text) CASCADE;

-- Create enhanced memory search function with quality scoring
CREATE OR REPLACE FUNCTION find_quality_memories(
    p_user_id text,
    p_query_embedding vector(1536),
    p_memory_types text[] DEFAULT NULL,
    p_min_quality_score numeric DEFAULT 0.0,
    p_similarity_threshold numeric DEFAULT 0.1,
    p_result_limit integer DEFAULT 20
)
RETURNS TABLE (
    id text,
    user_id text,
    type text,
    content text,
    source_context text,
    keywords text[],
    importance_score numeric,
    quality_score numeric,
    usage_count integer,
    reference_count integer,
    is_pinned boolean,
    created_at timestamptz,
    updated_at timestamptz,
    last_referenced timestamptz,
    relevance_score numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.user_id,
        sc.type,
        sc.content,
        sc.source_context,
        sc.keywords,
        sc.importance_score,
        COALESCE(sc.quality_score, 0.5) as quality_score,
        COALESCE(sc.usage_count, 0) as usage_count,
        sc.reference_count,
        COALESCE(sc.is_pinned, false) as is_pinned,
        sc.created_at,
        sc.updated_at,
        sc.last_referenced,
        (1 - (sc.relevance_embedding <=> p_query_embedding)) as relevance_score
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id
        AND (p_memory_types IS NULL OR sc.type = ANY(p_memory_types))
        AND COALESCE(sc.quality_score, 0.5) >= p_min_quality_score
        AND (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY 
        (1 - (sc.relevance_embedding <=> p_query_embedding)) * 0.5 + 
        COALESCE(sc.quality_score, 0.5) * 0.3 + 
        sc.importance_score * 0.2 DESC
    LIMIT p_result_limit;
END;
$$;

-- Create function to find similar memories within same type
CREATE OR REPLACE FUNCTION find_similar_memory(
    p_user_id text,
    p_query_embedding vector(1536),
    p_memory_type text,
    p_similarity_threshold numeric DEFAULT 0.85
)
RETURNS TABLE (
    id text,
    content text,
    type text,
    quality_score numeric,
    similarity numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.content,
        sc.type,
        COALESCE(sc.quality_score, 0.5) as quality_score,
        (1 - (sc.relevance_embedding <=> p_query_embedding)) as similarity
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id
        AND sc.type = p_memory_type
        AND (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY (1 - (sc.relevance_embedding <=> p_query_embedding)) DESC
    LIMIT 1;
END;
$$;

-- Create function to find cross-type contradictions
CREATE OR REPLACE FUNCTION find_cross_type_duplicate(
    p_user_id text,
    p_query_embedding vector(1536),
    p_exclude_types text[],
    p_target_types text[],
    p_similarity_threshold numeric DEFAULT 0.88
)
RETURNS TABLE (
    id text,
    content text,
    type text,
    quality_score numeric,
    similarity numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.content,
        sc.type,
        COALESCE(sc.quality_score, 0.5) as quality_score,
        (1 - (sc.relevance_embedding <=> p_query_embedding)) as similarity
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id
        AND NOT (sc.type = ANY(p_exclude_types))
        AND sc.type = ANY(p_target_types)
        AND (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY (1 - (sc.relevance_embedding <=> p_query_embedding)) DESC
    LIMIT 1;
END;
$$;

-- Create enhanced memory statistics function
CREATE OR REPLACE FUNCTION get_enhanced_memory_stats(p_user_id text)
RETURNS TABLE (
    total_memories bigint,
    high_quality_count bigint,
    medium_quality_count bigint,
    low_quality_count bigint,
    average_quality_score numeric,
    total_usage_count bigint,
    memories_by_type jsonb,
    quality_distribution jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    type_distribution jsonb;
    quality_dist jsonb;
BEGIN
    -- Get type distribution
    SELECT jsonb_object_agg(type, count)
    INTO type_distribution
    FROM (
        SELECT type, COUNT(*) as count
        FROM smart_contexts
        WHERE user_id = p_user_id
        GROUP BY type
    ) t;

    -- Get quality distribution
    SELECT jsonb_build_object(
        'high', COUNT(*) FILTER (WHERE COALESCE(quality_score, 0.5) >= 0.7),
        'medium', COUNT(*) FILTER (WHERE COALESCE(quality_score, 0.5) >= 0.4 AND COALESCE(quality_score, 0.5) < 0.7),
        'low', COUNT(*) FILTER (WHERE COALESCE(quality_score, 0.5) < 0.4)
    )
    INTO quality_dist
    FROM smart_contexts
    WHERE user_id = p_user_id;

    RETURN QUERY
    SELECT 
        COUNT(*) as total_memories,
        COUNT(*) FILTER (WHERE COALESCE(sc.quality_score, 0.5) >= 0.7) as high_quality_count,
        COUNT(*) FILTER (WHERE COALESCE(sc.quality_score, 0.5) >= 0.4 AND COALESCE(sc.quality_score, 0.5) < 0.7) as medium_quality_count,
        COUNT(*) FILTER (WHERE COALESCE(sc.quality_score, 0.5) < 0.4) as low_quality_count,
        COALESCE(AVG(sc.quality_score), 0.5) as average_quality_score,
        COALESCE(SUM(sc.usage_count), 0) as total_usage_count,
        COALESCE(type_distribution, '{}'::jsonb) as memories_by_type,
        COALESCE(quality_dist, '{}'::jsonb) as quality_distribution
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_smart_contexts_quality_score ON smart_contexts(user_id, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_type_quality ON smart_contexts(user_id, type, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_usage_count ON smart_contexts(user_id, usage_count DESC);
