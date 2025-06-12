-- Memory Bank Tables for Theraping AI

-- 1. Memory Entries Table (Main diary entries)
CREATE TABLE IF NOT EXISTS memory_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES saju_sessions(id) ON DELETE SET NULL,
    
    -- Entry content
    title VARCHAR(255),
    content TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_time TIME DEFAULT CURRENT_TIME,
    
    -- Emotional state tracking (JSONB for flexibility)
    emotional_state JSONB DEFAULT '{}',
    -- Example: {"mood": "anxious", "energy": 3, "stress": 7, "tags": ["work", "relationship"]}
    
    -- Entry metadata
    entry_type VARCHAR(50) DEFAULT 'manual', -- manual, ai_generated, session_summary
    context_data JSONB DEFAULT '{}', -- Flexible storage for different contexts
    
    -- Tagging and categorization
    tags TEXT[] DEFAULT '{}',
    category VARCHAR(100),
    
    -- Privacy and visibility
    is_private BOOLEAN DEFAULT true,
    visibility VARCHAR(20) DEFAULT 'private', -- private, shared, public
    
    -- AI processing
    ai_processed BOOLEAN DEFAULT false,
    ai_insights JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('korean', COALESCE(title, '') || ' ' || COALESCE(content, ''))
    ) STORED
);

-- 2. Memory-Saju Links Table
CREATE TABLE IF NOT EXISTS memory_saju_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_id UUID REFERENCES memory_entries(id) ON DELETE CASCADE,
    saju_session_id UUID REFERENCES saju_sessions(id) ON DELETE CASCADE,
    
    -- Relevance and context
    relevance_score DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
    link_type VARCHAR(50) DEFAULT 'related', -- related, triggered_by, resulted_in
    context_notes TEXT,
    
    -- AI confidence in the link
    ai_confidence DECIMAL(3,2) DEFAULT 0.5,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(memory_id, saju_session_id)
);

-- 3. Memory Insights Table (AI-generated patterns)
CREATE TABLE IF NOT EXISTS memory_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Insight content
    insight_type VARCHAR(100) NOT NULL, -- pattern, trend, recommendation, warning
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Pattern data
    pattern_data JSONB NOT NULL DEFAULT '{}',
    -- Example: {"emotional_trend": "improving", "trigger_patterns": ["work_stress"], "frequency": "weekly"}
    
    -- Contributing memories
    source_memory_ids UUID[] DEFAULT '{}',
    date_range_start DATE,
    date_range_end DATE,
    
    -- AI metadata
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    model_used VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User interaction
    user_acknowledged BOOLEAN DEFAULT false,
    user_feedback JSONB DEFAULT '{}',
    
    -- Validity and lifecycle
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Memory Tags Table (for better tag management)
CREATE TABLE IF NOT EXISTS memory_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, tag_name)
);

-- 5. Memory Analytics Table (for usage patterns)
CREATE TABLE IF NOT EXISTS memory_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Analytics data
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    entries_created INTEGER DEFAULT 0,
    emotional_average JSONB DEFAULT '{}',
    most_used_tags TEXT[] DEFAULT '{}',
    insights_generated INTEGER DEFAULT 0,
    
    -- Aggregated emotional data
    mood_distribution JSONB DEFAULT '{}',
    stress_levels JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_entries_user_date ON memory_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_memory_entries_tags ON memory_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_memory_entries_emotional_state ON memory_entries USING GIN(emotional_state);
CREATE INDEX IF NOT EXISTS idx_memory_entries_search ON memory_entries USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_memory_entries_session ON memory_entries(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memory_saju_links_memory ON memory_saju_links(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_saju_links_session ON memory_saju_links(saju_session_id);
CREATE INDEX IF NOT EXISTS idx_memory_saju_links_relevance ON memory_saju_links(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_memory_insights_user_type ON memory_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_memory_insights_date_range ON memory_insights(date_range_start, date_range_end);
CREATE INDEX IF NOT EXISTS idx_memory_insights_active ON memory_insights(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_memory_tags_user ON memory_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_tags_usage ON memory_tags(usage_count DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_memory_entries_updated_at BEFORE UPDATE ON memory_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_insights_updated_at BEFORE UPDATE ON memory_insights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up guest sessions (30-day retention)
CREATE OR REPLACE FUNCTION cleanup_guest_memories()
RETURNS void AS $$
BEGIN
    -- Delete memory entries from sessions without auth_user_id older than 30 days
    DELETE FROM memory_entries 
    WHERE session_id IN (
        SELECT id FROM saju_sessions 
        WHERE auth_user_id IS NULL 
        AND created_at < NOW() - INTERVAL '30 days'
    );
    
    -- Delete orphaned insights
    DELETE FROM memory_insights 
    WHERE user_id IS NULL 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-guest-memories', '0 2 * * *', 'SELECT cleanup_guest_memories();');
