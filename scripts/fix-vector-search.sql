-- Fix Vector Search Issues
-- This script addresses the vector search problems by:
-- 1. Enabling pgvector extension
-- 2. Ensuring stored functions are properly deployed
-- 3. Creating necessary indexes

-- Enable pgvector extension (required for vector operations)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify the smart_contexts table has the correct vector column
-- If the table exists but doesn't have the vector column, add it
DO $$
BEGIN
    -- Check if relevance_embedding column exists and has correct type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contexts' 
        AND column_name = 'relevance_embedding'
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Add or modify the vector column
        ALTER TABLE smart_contexts 
        ADD COLUMN IF NOT EXISTS relevance_embedding vector(1536);
        
        RAISE NOTICE 'Added relevance_embedding vector column to smart_contexts table';
    END IF;
END $$;

-- Drop existing functions with exact signatures to avoid conflicts
DROP FUNCTION IF EXISTS find_quality_memories(uuid, vector, text[], double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS find_quality_memories(text, vector, text[], numeric, numeric, integer) CASCADE;
DROP FUNCTION IF EXISTS find_similar_memory(uuid, vector, text, double precision) CASCADE;
DROP FUNCTION IF EXISTS find_similar_memory(text, vector, text, numeric) CASCADE;
DROP FUNCTION IF EXISTS find_cross_type_duplicate(uuid, vector, text[], text[], double precision) CASCADE;
DROP FUNCTION IF EXISTS find_cross_type_duplicate(text, vector, text[], text[], numeric) CASCADE;

-- Create enhanced memory search function with quality scoring
CREATE OR REPLACE FUNCTION find_quality_memories(
    p_user_id uuid,
    p_query_embedding vector(1536),
    p_memory_types text[] DEFAULT NULL,
    p_min_quality_score double precision DEFAULT 0.0,
    p_similarity_threshold double precision DEFAULT 0.1,
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
    relevance_score double precision
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id::text,
        sc.user_id::text,
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
        (1 - (sc.relevance_embedding <=> p_query_embedding))::double precision as relevance_score
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id
        AND sc.relevance_embedding IS NOT NULL
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
    p_user_id uuid,
    p_query_embedding vector(1536),
    p_memory_type text,
    p_similarity_threshold double precision DEFAULT 0.85
)
RETURNS TABLE (
    id text,
    content text,
    type text,
    quality_score numeric,
    similarity double precision,
    reference_count integer,
    usage_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id::text,
        sc.content,
        sc.type,
        COALESCE(sc.quality_score, 0.5) as quality_score,
        (1 - (sc.relevance_embedding <=> p_query_embedding))::double precision as similarity,
        sc.reference_count,
        COALESCE(sc.usage_count, 0) as usage_count
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id
        AND sc.type = p_memory_type
        AND sc.relevance_embedding IS NOT NULL
        AND (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY (1 - (sc.relevance_embedding <=> p_query_embedding)) DESC
    LIMIT 1;
END;
$$;

-- Create function to find cross-type contradictions
CREATE OR REPLACE FUNCTION find_cross_type_duplicate(
    p_user_id uuid,
    p_query_embedding vector(1536),
    p_exclude_types text[],
    p_target_types text[],
    p_similarity_threshold double precision DEFAULT 0.88
)
RETURNS TABLE (
    id text,
    content text,
    type text,
    quality_score numeric,
    similarity double precision,
    reference_count integer,
    usage_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id::text,
        sc.content,
        sc.type,
        COALESCE(sc.quality_score, 0.5) as quality_score,
        (1 - (sc.relevance_embedding <=> p_query_embedding))::double precision as similarity,
        sc.reference_count,
        COALESCE(sc.usage_count, 0) as usage_count
    FROM smart_contexts sc
    WHERE sc.user_id = p_user_id
        AND NOT (sc.type = ANY(p_exclude_types))
        AND sc.type = ANY(p_target_types)
        AND sc.relevance_embedding IS NOT NULL
        AND (1 - (sc.relevance_embedding <=> p_query_embedding)) >= p_similarity_threshold
    ORDER BY (1 - (sc.relevance_embedding <=> p_query_embedding)) DESC
    LIMIT 1;
END;
$$;

-- Create essential indexes for vector operations and performance
CREATE INDEX IF NOT EXISTS idx_smart_contexts_embedding ON smart_contexts 
USING ivfflat (relevance_embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_type ON smart_contexts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_quality_score ON smart_contexts(user_id, quality_score DESC) 
WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_embedding ON smart_contexts(user_id) 
WHERE relevance_embedding IS NOT NULL;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION find_quality_memories TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_memory TO authenticated;
GRANT EXECUTE ON FUNCTION find_cross_type_duplicate TO authenticated;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Vector search setup completed successfully!';
    RAISE NOTICE 'pgvector extension: enabled';
    RAISE NOTICE 'Stored functions: deployed';
    RAISE NOTICE 'Vector indexes: created';
END $$;
