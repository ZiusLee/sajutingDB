-- Create the smart_contexts table
CREATE TABLE IF NOT EXISTS smart_contexts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('identity', 'goal', 'emotion', 'relationship', 'interest', 'schedule', 'preference', 'situation')),
    content TEXT NOT NULL,
    source_context TEXT,
    relevance_embedding VECTOR(1536),
    keywords TEXT[],
    importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0.0 AND importance_score <= 1.0),
    reference_count INTEGER DEFAULT 1,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the conversation_memory_links table
CREATE TABLE IF NOT EXISTS conversation_memory_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    memory_id UUID NOT NULL REFERENCES smart_contexts(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL CHECK (usage_type IN ('created', 'referenced', 'updated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_smart_contexts_user_id ON smart_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_type ON smart_contexts(type);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_importance ON smart_contexts(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_smart_contexts_embedding ON smart_contexts USING ivfflat (relevance_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_links_conversation ON conversation_memory_links(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_links_memory ON conversation_memory_links(memory_id);

-- RPC function to search relevant memories using hybrid approach
CREATE OR REPLACE FUNCTION search_relevant_memories(
    user_id UUID,
    query_embedding VECTOR(1536),
    query_keywords TEXT[],
    memory_types TEXT[] DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.3,
    result_limit INTEGER DEFAULT 10
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
        -- Vector similarity score
        (1 - (sc.relevance_embedding <=> query_embedding)) AS relevance_score,
        -- Keyword matching score
        CASE 
            WHEN query_keywords IS NULL OR array_length(query_keywords, 1) IS NULL THEN 0.0
            ELSE (
                SELECT COUNT(*)::FLOAT / GREATEST(array_length(query_keywords, 1), 1)
                FROM unnest(query_keywords) AS qk
                WHERE qk = ANY(sc.keywords)
            )
        END AS keyword_score
    FROM smart_contexts sc
    WHERE 
        sc.user_id = search_relevant_memories.user_id
        AND (memory_types IS NULL OR sc.type = ANY(memory_types))
        AND (1 - (sc.relevance_embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY 
        (1 - (sc.relevance_embedding <=> query_embedding)) DESC,
        sc.importance_score DESC,
        sc.reference_count DESC
    LIMIT result_limit;
END;
$$;

-- RPC function to find similar memory for duplicate detection
CREATE OR REPLACE FUNCTION find_similar_memory(
    user_id UUID,
    query_embedding VECTOR(1536),
    memory_type TEXT,
    similarity_threshold FLOAT DEFAULT 0.85
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
        (1 - (sc.relevance_embedding <=> query_embedding)) AS similarity_score
    FROM smart_contexts sc
    WHERE 
        sc.user_id = find_similar_memory.user_id
        AND sc.type = memory_type
        AND (1 - (sc.relevance_embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY 
        (1 - (sc.relevance_embedding <=> query_embedding)) DESC
    LIMIT 1;
END;
$$;

-- RPC function to track memory usage
CREATE OR REPLACE FUNCTION track_memory_usage(
    memory_id UUID,
    conversation_id TEXT,
    usage_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert usage record
    INSERT INTO conversation_memory_links (memory_id, conversation_id, usage_type)
    VALUES (memory_id, conversation_id, usage_type);
    
    -- Update reference count if this is a reference (not creation)
    IF usage_type IN ('referenced', 'updated') THEN
        UPDATE smart_contexts 
        SET 
            reference_count = reference_count + 1,
            updated_at = NOW()
        WHERE id = memory_id;
    END IF;
END;
$$;

-- Function to get memory statistics
CREATE OR REPLACE FUNCTION get_memory_stats(user_id UUID)
RETURNS TABLE (
    total_memories BIGINT,
    memories_by_type JSONB,
    average_importance FLOAT,
    total_references BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    type_counts JSONB;
BEGIN
    -- Get type distribution
    SELECT jsonb_object_agg(type, count)
    INTO type_counts
    FROM (
        SELECT type, COUNT(*) as count
        FROM smart_contexts
        WHERE smart_contexts.user_id = get_memory_stats.user_id
        GROUP BY type
    ) t;

    RETURN QUERY
    SELECT 
        COUNT(*) as total_memories,
        COALESCE(type_counts, '{}'::jsonb) as memories_by_type,
        COALESCE(AVG(importance_score), 0.0)::FLOAT as average_importance,
        COALESCE(SUM(reference_count), 0)::BIGINT as total_references
    FROM smart_contexts
    WHERE smart_contexts.user_id = get_memory_stats.user_id;
END;
$$;
