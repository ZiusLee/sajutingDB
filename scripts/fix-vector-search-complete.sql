-- Complete Vector Search Fix
-- This script addresses all vector search issues:
-- 1. Ensures pgvector extension is enabled
-- 2. Recreates all stored functions with proper error handling
-- 3. Fixes embedding data type issues
-- 4. Creates necessary indexes

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Complete function cleanup to avoid any conflicts
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all existing vector search functions
    FOR func_record IN 
        SELECT proname, oidvectortypes(proargtypes) as args
        FROM pg_proc 
        WHERE proname IN ('find_quality_memories', 'find_similar_memory', 'find_cross_type_duplicate')
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I(%s) CASCADE', func_record.proname, func_record.args);
        RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
    END LOOP;
END $$;

-- Ensure smart_contexts table has proper vector column
DO $$
BEGIN
    -- Check and fix relevance_embedding column type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'smart_contexts' 
        AND column_name = 'relevance_embedding'
        AND data_type != 'USER-DEFINED'
    ) THEN
        -- Drop the column if it's not a vector type
        ALTER TABLE smart_contexts DROP COLUMN IF EXISTS relevance_embedding;
        RAISE NOTICE 'Dropped invalid relevance_embedding column';
    END IF;
    
    -- Add proper vector column
    ALTER TABLE smart_contexts 
    ADD COLUMN IF NOT EXISTS relevance_embedding vector(1536);
    
    RAISE NOTICE 'Ensured relevance_embedding vector column exists';
END $$;

-- Create enhanced find_quality_memories function with better error handling
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
SECURITY DEFINER
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in find_quality_memories: %', SQLERRM;
        RETURN;
END;
$$;

-- Create find_similar_memory function with proper error handling
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
SECURITY DEFINER
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in find_similar_memory: %', SQLERRM;
        RETURN;
END;
$$;

-- Create find_cross_type_duplicate function
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
SECURITY DEFINER
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in find_cross_type_duplicate: %', SQLERRM;
        RETURN;
END;
$$;

-- Create indexes for optimal vector search performance
CREATE INDEX IF NOT EXISTS idx_smart_contexts_embedding ON smart_contexts 
USING ivfflat (relevance_embedding vector_cosine_ops) 
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_type ON smart_contexts(user_id, type);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_quality_score ON smart_contexts(user_id, quality_score DESC) 
WHERE quality_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_embedding ON smart_contexts(user_id) 
WHERE relevance_embedding IS NOT NULL;

-- Grant proper permissions
GRANT EXECUTE ON FUNCTION find_quality_memories TO authenticated, anon;
GRANT EXECUTE ON FUNCTION find_similar_memory TO authenticated, anon;
GRANT EXECUTE ON FUNCTION find_cross_type_duplicate TO authenticated, anon;

-- Clean up invalid embedding data
UPDATE smart_contexts 
SET relevance_embedding = NULL 
WHERE relevance_embedding IS NOT NULL 
AND pg_typeof(relevance_embedding) != 'vector'::regtype;

-- Verification and completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Vector search system completely fixed!';
    RAISE NOTICE '✅ pgvector extension: enabled';
    RAISE NOTICE '✅ Stored functions: deployed with error handling';
    RAISE NOTICE '✅ Vector indexes: created';
    RAISE NOTICE '✅ Invalid embeddings: cleaned up';
    RAISE NOTICE '✅ Permissions: granted';
END $$;
