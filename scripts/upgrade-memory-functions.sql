-- Upgrade script for improved memory functions
-- This fixes parameter naming issues and improves search functionality

-- Drop existing functions first
DROP FUNCTION IF EXISTS search_relevant_memories CASCADE;
DROP FUNCTION IF EXISTS find_similar_memory CASCADE;

-- Create improved search function with fixed parameter names
CREATE OR REPLACE FUNCTION search_relevant_memories(
    p_user_id UUID,
    p_query_embedding VECTOR(1536),
    p_query_keywords TEXT[] DEFAULT NULL,
    p_memory_types TEXT[] DEFAULT NULL,
    p_similarity_threshold FLOAT DEFAULT 0.6,
    p_result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    content TEXT,
    source_context TEXT,
    keywords TEXT[],
    importance_score FLOAT,
    reference_count INTEGER,
    is_pinned BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    relevance_score FLOAT,
    keyword_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH keyword_matches AS (
        SELECT 
            sc.id,
            CASE 
                WHEN p_query_keywords IS NULL OR array_length(p_query_keywords, 1) IS NULL THEN 0.0
                ELSE (
                    SELECT COUNT(DISTINCT qk)::FLOAT / GREATEST(array_length(p_query_keywords, 1), 1)
                    FROM unnest(p_query_keywords) AS qk
                    WHERE EXISTS (
                        SELECT 1 FROM unnest(sc.keywords) AS k
                        WHERE lower(k) LIKE '%' || lower(qk) || '%'
                    ) OR lower(sc.content) LIKE '%' || lower(qk) || '%'
                )
            END AS keyword_match_score
        FROM smart_contexts sc
        WHERE sc.user_id = p_user_id
    )
    SELECT 
        sc.id,
        sc.type,
        sc.content,
        sc.source_context,
        sc.keywords,
        sc.importance_score,
        sc.reference_count,
        sc.is_pinned,
        sc.created_at,
        sc.updated_at,
        -- Cosine similarity (1 - distance)
        (1 - (sc.relevance_embedding <=> p_query_embedding)) AS relevance_score,
        km.keyword_match_score AS keyword_score
    FROM smart_contexts sc
    JOIN keyword_matches km ON km.id = sc.id
    WHERE 
        sc.user_id = p_user_id
        AND (p_memory_types IS NULL OR sc.type = ANY(p_memory_types))
        AND (
            -- Include if vector similarity is above threshold
            (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
            OR 
            -- OR if keyword match is significant
            km.keyword_match_score >= 0.5
            OR
            -- OR if it's pinned
            sc.is_pinned = true
        )
    ORDER BY 
        -- Prioritize pinned memories
        sc.is_pinned DESC,
        -- Combined score: vector similarity + keyword match + importance
        (
            (1 - (sc.relevance_embedding <=> p_query_embedding)) * 0.6 +
            km.keyword_match_score * 0.2 +
            sc.importance_score * 0.2
        ) DESC,
        sc.reference_count DESC
    LIMIT p_result_limit;
END;
$$;

-- Create improved duplicate detection function
CREATE OR REPLACE FUNCTION find_similar_memory(
    p_user_id UUID,
    p_query_embedding VECTOR(1536),
    p_memory_type TEXT,
    p_similarity_threshold FLOAT DEFAULT 0.85
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    content TEXT,
    source_context TEXT,
    keywords TEXT[],
    importance_score FLOAT,
    reference_count INTEGER,
    is_pinned BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    similarity_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.type,
        sc.content,
        sc.source_context,
        sc.keywords,
        sc.importance_score,
        sc.reference_count,
        sc.is_pinned,
        sc.created_at,
        sc.updated_at,
        (1 - (sc.relevance_embedding <=> p_query_embedding)) AS similarity_score
    FROM smart_contexts sc
    WHERE 
        sc.user_id = p_user_id
        AND sc.type = p_memory_type
        AND (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY 
        (1 - (sc.relevance_embedding <=> p_query_embedding)) DESC
    LIMIT 1;
END;
$$;

-- Add new columns if they don't exist
DO $$
BEGIN
    -- Add first_mentioned column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contexts' 
        AND column_name = 'first_mentioned'
    ) THEN
        ALTER TABLE smart_contexts 
        ADD COLUMN first_mentioned TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add last_referenced column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contexts' 
        AND column_name = 'last_referenced'
    ) THEN
        ALTER TABLE smart_contexts 
        ADD COLUMN last_referenced TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create a function for cross-type duplicate search
CREATE OR REPLACE FUNCTION find_cross_type_duplicate(
    p_user_id UUID,
    p_query_embedding VECTOR(1536),
    p_similarity_threshold FLOAT DEFAULT 0.85
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    content TEXT,
    similarity_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.type,
        sc.content,
        (1 - (sc.relevance_embedding <=> p_query_embedding)) AS similarity_score
    FROM smart_contexts sc
    WHERE 
        sc.user_id = p_user_id
        AND (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY 
        (1 - (sc.relevance_embedding <=> p_query_embedding)) DESC
    LIMIT 5;
END;
$$;

-- Create index for keyword search if not exists
CREATE INDEX IF NOT EXISTS idx_smart_contexts_keywords ON smart_contexts USING GIN(keywords);

-- Create composite index for user_id and type
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_type ON smart_contexts(user_id, type);

-- Analyze tables for query optimization
ANALYZE smart_contexts;
ANALYZE conversation_memory_links;
